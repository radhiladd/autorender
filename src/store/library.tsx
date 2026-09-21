import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { PLACEHOLDER_IMAGES, SEED } from '../data/seed'
import { newId, replaceStyleName } from '../lib/format'
import type { LibraryState, Render, Style } from '../types'

const STORAGE_KEY = 'autorender:library'

function cloneSeed(): LibraryState {
  return structuredClone(SEED)
}

function loadState(): LibraryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneSeed()
    const parsed = JSON.parse(raw) as LibraryState
    if (!Array.isArray(parsed.plans) || !Array.isArray(parsed.renders)) return cloneSeed()
    return {
      ...parsed,
      styles: Array.isArray(parsed.styles) && parsed.styles.length > 0 ? parsed.styles : cloneSeed().styles,
      sessions: (parsed.sessions ?? []).map((s) => ({
        ...s,
        createdBy: s.createdBy ?? { firstName: 'Radhi', lastName: 'Ladd' },
      })),
    }
  } catch {
    return cloneSeed()
  }
}

function persist(state: LibraryState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota — in-memory still works */
  }
}

type LibraryContextValue = {
  state: LibraryState
  selectedRenderId: string | null
  openLightbox: (id: string) => void
  closeLightbox: () => void
  selectedRender: Render | null
  renamePlan: (planId: string, name: string) => void
  createFolder: (planId: string, name: string) => string
  renameFolder: (folderId: string, name: string) => void
  deleteFolder: (folderId: string) => boolean
  renameRender: (renderId: string, name: string) => void
  moveRender: (renderId: string, folderId: string | null) => void
  createSession: (planName: string, existingPlanId?: string, folderId?: string | null) => string
  saveStyle: (style: Style) => void
  deleteStyle: (styleId: string) => boolean
  resetDemo: () => void
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LibraryState>(loadState)
  const [selectedRenderId, setSelectedRenderId] = useState<string | null>(null)

  const commit = useCallback((next: LibraryState) => {
    persist(next)
    setState(next)
  }, [])

  const renamePlan = useCallback(
    (planId: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      commit({
        ...state,
        plans: state.plans.map((p) => (p.id === planId ? { ...p, name: trimmed } : p)),
      })
    },
    [commit, state],
  )

  const createFolder = useCallback(
    (planId: string, name: string) => {
      const id = newId('folder')
      commit({
        ...state,
        folders: [...state.folders, { id, planId, name: name.trim() }],
      })
      return id
    },
    [commit, state],
  )

  const renameFolder = useCallback(
    (folderId: string, name: string) => {
      commit({
        ...state,
        folders: state.folders.map((f) => (f.id === folderId ? { ...f, name: name.trim() } : f)),
      })
    },
    [commit, state],
  )

  const deleteFolder = useCallback(
    (folderId: string) => {
      const used = state.renders.some((r) => r.folderId === folderId)
      if (used) return false
      commit({
        ...state,
        folders: state.folders.filter((f) => f.id !== folderId),
      })
      return true
    },
    [commit, state],
  )

  const renameRender = useCallback(
    (renderId: string, name: string) => {
      commit({
        ...state,
        renders: state.renders.map((r) => (r.id === renderId ? { ...r, name: name.trim() } : r)),
      })
    },
    [commit, state],
  )

  const moveRender = useCallback(
    (renderId: string, folderId: string | null) => {
      commit({
        ...state,
        renders: state.renders.map((r) => (r.id === renderId ? { ...r, folderId } : r)),
      })
    },
    [commit, state],
  )

  const createSession = useCallback(
    (planName: string, existingPlanId?: string, folderId?: string | null) => {
      const trimmed = planName.trim()
      let plans = state.plans
      let plan = existingPlanId
        ? plans.find((p) => p.id === existingPlanId)
        : plans.find((p) => p.name.toLowerCase() === trimmed.toLowerCase())

      if (!plan) {
        plan = { id: newId('plan'), name: trimmed }
        plans = [...plans, plan]
      }

      const resolved = plan
      const now = new Date().toISOString()
      const sessionId = newId('ses')
      const offset = state.renders.length
      const newRenders: Render[] = PLACEHOLDER_IMAGES.slice(0, 3).map((image, i) => ({
        id: newId('r'),
        planId: resolved.id,
        sessionId,
        folderId: folderId ?? null,
        name: `${resolved.name} ${i + 1}`,
        image: PLACEHOLDER_IMAGES[(offset + i) % PLACEHOLDER_IMAGES.length] ?? image,
        createdAt: new Date(Date.parse(now) + i * 1000).toISOString(),
        downloadable: i !== 0,
      }))

      commit({
        ...state,
        plans,
        sessions: [
          {
            id: sessionId,
            planId: resolved.id,
            createdAt: now,
            styleLabel: `${state.styles[0]?.name ?? 'Daylight'} · Front`,
            createdBy: { firstName: 'Radhi', lastName: 'Ladd' },
          },
          ...state.sessions,
        ],
        renders: [...newRenders, ...state.renders],
      })
      return resolved.id
    },
    [commit, state],
  )

  const saveStyle = useCallback(
    (style: Style) => {
      const existing = state.styles.find((s) => s.id === style.id)
      if (existing) {
        const oldName = existing.name
        commit({
          ...state,
          styles: state.styles.map((s) => (s.id === style.id ? style : s)),
          sessions: oldName !== style.name
            ? state.sessions.map((session) => ({
                ...session,
                styleLabel: replaceStyleName(session.styleLabel, oldName, style.name),
              }))
            : state.sessions,
        })
      } else {
        commit({
          ...state,
          styles: [...state.styles, style],
        })
      }
    },
    [commit, state],
  )

  const deleteStyle = useCallback(
    (styleId: string) => {
      const current = state.styles.find((s) => s.id === styleId)
      if (!current) return false
      const used = state.sessions.some((session) => session.styleLabel.split('·')[0]?.trim() === current.name)
      if (used) return false
      commit({
        ...state,
        styles: state.styles.filter((s) => s.id !== styleId),
      })
      return true
    },
    [commit, state],
  )

  const resetDemo = useCallback(() => {
    const next = cloneSeed()
    persist(next)
    setState(next)
    setSelectedRenderId(null)
  }, [])

  const selectedRender = useMemo(
    () => state.renders.find((r) => r.id === selectedRenderId) ?? null,
    [state.renders, selectedRenderId],
  )

  const value = useMemo<LibraryContextValue>(
    () => ({
      state,
      selectedRenderId,
      openLightbox: setSelectedRenderId,
      closeLightbox: () => setSelectedRenderId(null),
      selectedRender,
      renamePlan,
      createFolder,
      renameFolder,
      deleteFolder,
      renameRender,
      moveRender,
      createSession,
      saveStyle,
      deleteStyle,
      resetDemo,
    }),
    [
      state,
      selectedRenderId,
      selectedRender,
      renamePlan,
      createFolder,
      renameFolder,
      deleteFolder,
      renameRender,
      moveRender,
      createSession,
      saveStyle,
      deleteStyle,
      resetDemo,
    ],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider')
  return ctx
}
