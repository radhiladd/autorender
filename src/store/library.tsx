import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { PLACEHOLDER_IMAGES, SEED } from '../data/seed'
import { newId, replaceStyleName } from '../lib/format'
import type { Collection, LibraryState, Render, SessionSetup, Style } from '../types'

const STORAGE_KEY = 'autorender:library'

function cloneSeed(): LibraryState {
  return structuredClone(SEED)
}

type LegacyFolder = { id: string; planId: string; name: string; parentId?: string | null }
type StoredState = Omit<LibraryState, 'renders' | 'collections'> & {
  collections?: Collection[]
  folders?: LegacyFolder[]
  renders: (Omit<Render, 'collectionIds'> & {
    collectionIds?: string[]
    folderId?: string | null
  })[]
}

function migrateFolders(parsed: StoredState): Pick<LibraryState, 'collections' | 'renders'> {
  if (Array.isArray(parsed.collections)) {
    return {
      collections: parsed.collections,
      renders: parsed.renders.map((r) => ({ ...r, collectionIds: r.collectionIds ?? [] })),
    }
  }
  const folders = parsed.folders ?? []
  const nameCount = new Map<string, number>()
  folders.forEach((f) => nameCount.set(f.name, (nameCount.get(f.name) ?? 0) + 1))
  const topLevel = (folder: LegacyFolder | undefined): string | null => {
    let current = folder
    while (current?.parentId) {
      const parentId: string = current.parentId
      const parent = folders.find((f) => f.id === parentId)
      if (!parent?.parentId) return parentId
      current = parent
    }
    return null
  }
  return {
    collections: folders.map((f) => {
      const plan = parsed.plans.find((p) => p.id === f.planId)
      const name = (nameCount.get(f.name) ?? 0) > 1 && plan ? `${f.name} · ${plan.name}` : f.name
      return { id: f.id, name, parentId: topLevel(f) }
    }),
    renders: parsed.renders.map(({ folderId, ...r }) => ({
      ...r,
      collectionIds: r.collectionIds ?? (folderId ? [folderId] : []),
    })),
  }
}

function loadState(): LibraryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneSeed()
    const stored = JSON.parse(raw) as StoredState
    if (!Array.isArray(stored.plans) || !Array.isArray(stored.renders)) return cloneSeed()
    const { folders: _legacy, ...rest } = stored
    const parsed: LibraryState = { ...rest, ...migrateFolders(stored) }
    return {
      ...parsed,
      styles:
        Array.isArray(parsed.styles) && parsed.styles.length > 0
          ? parsed.styles
          : cloneSeed().styles,
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
  createCollection: (name: string, parentId?: string | null, renderIds?: string[]) => string
  renameCollection: (collectionId: string, name: string) => void
  deleteCollection: (collectionId: string) => void
  renameRender: (renderId: string, name: string) => void
  setRenderInCollection: (renderId: string, collectionId: string, included: boolean) => void
  createSession: (planName: string, existingPlanId?: string, collectionId?: string | null) => string
  saveRenderSession: (input: {
    planName: string
    existingPlanId?: string
    collectionId?: string | null
    styleLabel: string
    setup?: SessionSetup
    renders: { name: string; image: string; prompt?: string; refined?: boolean }[]
  }) => string
  duplicateSession: (sessionId: string) => void
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

  const createCollection = useCallback(
    (name: string, parentId: string | null = null, renderIds: string[] = []) => {
      const id = newId('col')
      const parent = state.collections.find((c) => c.id === parentId)
      commit({
        ...state,
        collections: [
          ...state.collections,
          { id, name: name.trim(), parentId: parent && !parent.parentId ? parent.id : null },
        ],
        renders: renderIds.length
          ? state.renders.map((r) =>
              renderIds.includes(r.id) ? { ...r, collectionIds: [...r.collectionIds, id] } : r,
            )
          : state.renders,
      })
      return id
    },
    [commit, state],
  )

  const renameCollection = useCallback(
    (collectionId: string, name: string) => {
      commit({
        ...state,
        collections: state.collections.map((c) =>
          c.id === collectionId ? { ...c, name: name.trim() } : c,
        ),
      })
    },
    [commit, state],
  )

  const deleteCollection = useCallback(
    (collectionId: string) => {
      commit({
        ...state,
        collections: state.collections
          .filter((c) => c.id !== collectionId)
          .map((c) => (c.parentId === collectionId ? { ...c, parentId: null } : c)),
        renders: state.renders.map((r) =>
          r.collectionIds.includes(collectionId)
            ? { ...r, collectionIds: r.collectionIds.filter((id) => id !== collectionId) }
            : r,
        ),
      })
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

  const setRenderInCollection = useCallback(
    (renderId: string, collectionId: string, included: boolean) => {
      commit({
        ...state,
        renders: state.renders.map((r) => {
          if (r.id !== renderId) return r
          const without = r.collectionIds.filter((id) => id !== collectionId)
          return { ...r, collectionIds: included ? [...without, collectionId] : without }
        }),
      })
    },
    [commit, state],
  )

  const createSession = useCallback(
    (planName: string, existingPlanId?: string, collectionId?: string | null) => {
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
        collectionIds: collectionId ? [collectionId] : [],
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

  const saveRenderSession = useCallback(
    (input: {
      planName: string
      existingPlanId?: string
      collectionId?: string | null
      styleLabel: string
      setup?: SessionSetup
      renders: { name: string; image: string; prompt?: string; refined?: boolean }[]
    }) => {
      const trimmed = input.planName.trim()
      let plans = state.plans
      let plan = input.existingPlanId
        ? plans.find((p) => p.id === input.existingPlanId)
        : plans.find((p) => p.name.toLowerCase() === trimmed.toLowerCase())

      if (!plan) {
        plan = { id: newId('plan'), name: trimmed || 'Untitled plan' }
        plans = [...plans, plan]
      }

      const resolved = plan
      const now = new Date().toISOString()
      const sessionId = newId('ses')
      const newRenders: Render[] = input.renders.map((render, i) => ({
        id: newId('r'),
        planId: resolved.id,
        sessionId,
        collectionIds: input.collectionId ? [input.collectionId] : [],
        name: render.name,
        image: render.image,
        createdAt: new Date(Date.parse(now) + i * 1000).toISOString(),
        downloadable: true,
        prompt: render.prompt,
        refined: render.refined,
      }))

      commit({
        ...state,
        plans,
        sessions: [
          {
            id: sessionId,
            planId: resolved.id,
            createdAt: now,
            styleLabel: input.styleLabel,
            createdBy: { firstName: 'Radhi', lastName: 'Ladd' },
            setup: input.setup,
          },
          ...state.sessions,
        ],
        renders: [...newRenders, ...state.renders],
      })
      return resolved.id
    },
    [commit, state],
  )

  const duplicateSession = useCallback(
    (sessionId: string) => {
      const source = state.sessions.find((s) => s.id === sessionId)
      if (!source) return
      const now = new Date().toISOString()
      const copyId = newId('ses')
      const copies: Render[] = state.renders
        .filter((r) => r.sessionId === sessionId)
        .map((r, i) => ({
          ...r,
          id: newId('r'),
          sessionId: copyId,
          createdAt: new Date(Date.parse(now) + i * 1000).toISOString(),
        }))
      commit({
        ...state,
        sessions: [{ ...source, id: copyId, createdAt: now }, ...state.sessions],
        renders: [...copies, ...state.renders],
      })
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
          sessions:
            oldName !== style.name
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
      const used = state.sessions.some(
        (session) => session.styleLabel.split('·')[0]?.trim() === current.name,
      )
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
      createCollection,
      renameCollection,
      deleteCollection,
      renameRender,
      setRenderInCollection,
      createSession,
      saveRenderSession,
      duplicateSession,
      saveStyle,
      deleteStyle,
      resetDemo,
    }),
    [
      state,
      selectedRenderId,
      selectedRender,
      renamePlan,
      createCollection,
      renameCollection,
      deleteCollection,
      renameRender,
      setRenderInCollection,
      createSession,
      saveRenderSession,
      duplicateSession,
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
