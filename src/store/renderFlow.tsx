import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { StyleParams } from '../types'

export const CAMERAS = [
  { id: 'front-left', label: 'Front left' },
  { id: 'front-right', label: 'Front right' },
  { id: 'front', label: 'Front' },
  { id: 'aerial', label: 'Aerial 3/4' },
  { id: 'custom', label: 'Custom' },
] as const

export type CameraId = (typeof CAMERAS)[number]['id']

export const ASPECTS = ['1:1', '4:3', '16:9'] as const
export type AspectId = (typeof ASPECTS)[number]

export type ShowroomSummary = {
  elevation: string
  palette: string
  garage: string
  optionCount: number
  options: string[]
}

export type RenderCandidate = {
  id: string
  image: string
  prompt: string
  styleId: string
  styleName: string
  camera: CameraId
  aspect: AspectId
  status: 'kept' | 'discarded'
  createdAt: string
  refinedFrom?: string
}

export type RenderDraft = {
  planId: string | null
  planName: string
  collectionId: string | null
  summary: ShowroomSummary | null
  styleId: string
  styleParams: StyleParams | null
  camera: CameraId
  aspect: AspectId
  prompt: string
  count: 1 | 2 | 3
  results: RenderCandidate[]
  focusedId: string | null
}

type PlanChoice = {
  planId: string | null
  planName: string
  collectionId?: string | null
}

type SessionSeed = {
  planId: string
  planName: string
  styleId: string
  camera: CameraId
  summary?: ShowroomSummary | null
  styleParams?: StyleParams | null
  aspect?: AspectId
  prompt?: string
}

type RenderFlowContextValue = {
  draft: RenderDraft
  resetDraft: () => void
  choosePlan: (choice: PlanChoice) => void
  switchPlan: (choice: { planId: string; planName: string }) => void
  changePlan: (choice: { planId: string; planName: string }) => void
  clearResults: () => void
  setSummary: (summary: ShowroomSummary) => void
  setStyleId: (styleId: string) => void
  setStyleParams: (styleParams: StyleParams) => void
  setCamera: (camera: CameraId) => void
  setAspect: (aspect: AspectId) => void
  setPrompt: (prompt: string) => void
  setCount: (count: 1 | 2 | 3) => void
  appendResults: (items: RenderCandidate[]) => void
  setCandidateStatus: (id: string, status: RenderCandidate['status']) => void
  focusCandidate: (id: string | null) => void
  seedFromSession: (seed: SessionSeed) => void
}

const RenderFlowContext = createContext<RenderFlowContextValue | null>(null)

function emptyDraft(): RenderDraft {
  return {
    planId: null,
    planName: '',
    collectionId: null,
    summary: null,
    styleId: '',
    styleParams: null,
    camera: 'front',
    aspect: '16:9',
    prompt: '',
    count: 1,
    results: [],
    focusedId: null,
  }
}

export function cameraLabel(id: CameraId) {
  return CAMERAS.find((camera) => camera.id === id)?.label ?? 'Front'
}

export function isShowroomSummary(value: unknown): value is ShowroomSummary {
  if (!value || typeof value !== 'object') return false
  const summary = value as ShowroomSummary
  return (
    typeof summary.elevation === 'string' &&
    typeof summary.palette === 'string' &&
    typeof summary.garage === 'string' &&
    typeof summary.optionCount === 'number' &&
    (summary.options === undefined || Array.isArray(summary.options))
  )
}

const DRAFT_KEY = 'autorender:render-draft'

function loadDraft(): RenderDraft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return emptyDraft()
    const parsed = JSON.parse(raw) as Partial<RenderDraft>
    return {
      ...emptyDraft(),
      ...parsed,
      summary: parsed.summary ? { ...parsed.summary, options: parsed.summary.options ?? [] } : null,
    }
  } catch {
    return emptyDraft()
  }
}

export function RenderFlowProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<RenderDraft>(loadDraft)

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      /* session storage can be unavailable */
    }
  }, [draft])

  const resetDraft = useCallback(() => setDraft(emptyDraft()), [])

  const choosePlan = useCallback((choice: PlanChoice) => {
    setDraft((current) => ({
      ...emptyDraft(),
      styleId: current.styleId,
      styleParams: current.styleParams,
      camera: current.camera,
      aspect: current.aspect,
      planId: choice.planId,
      planName: choice.planName,
      collectionId: choice.collectionId ?? null,
    }))
  }, [])

  const switchPlan = useCallback((choice: { planId: string; planName: string }) => {
    setDraft((current) => ({
      ...current,
      planId: choice.planId,
      planName: choice.planName,
    }))
  }, [])

  const changePlan = useCallback((choice: { planId: string; planName: string }) => {
    setDraft((current) => ({
      ...current,
      planId: choice.planId,
      planName: choice.planName,
      summary: null,
      results: [],
      focusedId: null,
    }))
  }, [])

  const clearResults = useCallback(() => {
    setDraft((current) => ({ ...current, results: [], focusedId: null }))
  }, [])

  const setSummary = useCallback((summary: ShowroomSummary) => {
    setDraft((current) => ({
      ...current,
      summary: { ...summary, options: summary.options ?? [] },
    }))
  }, [])

  const setStyleId = useCallback((styleId: string) => {
    setDraft((current) => ({ ...current, styleId }))
  }, [])

  const setStyleParams = useCallback((styleParams: StyleParams) => {
    setDraft((current) => ({ ...current, styleParams }))
  }, [])

  const setCamera = useCallback((camera: CameraId) => {
    setDraft((current) => ({ ...current, camera }))
  }, [])

  const setAspect = useCallback((aspect: AspectId) => {
    setDraft((current) => ({ ...current, aspect }))
  }, [])

  const setPrompt = useCallback((prompt: string) => {
    setDraft((current) => ({ ...current, prompt }))
  }, [])

  const setCount = useCallback((count: 1 | 2 | 3) => {
    setDraft((current) => ({ ...current, count }))
  }, [])

  const appendResults = useCallback((items: RenderCandidate[]) => {
    setDraft((current) => ({
      ...current,
      results: [...current.results, ...items],
    }))
  }, [])

  const setCandidateStatus = useCallback((id: string, status: RenderCandidate['status']) => {
    setDraft((current) => ({
      ...current,
      results: current.results.map((item) => (item.id === id ? { ...item, status } : item)),
    }))
  }, [])

  const focusCandidate = useCallback((id: string | null) => {
    setDraft((current) => ({ ...current, focusedId: id }))
  }, [])

  const seedFromSession = useCallback((seed: SessionSeed) => {
    setDraft({
      ...emptyDraft(),
      planId: seed.planId,
      planName: seed.planName,
      styleId: seed.styleId,
      camera: seed.camera,
      summary: seed.summary ?? null,
      styleParams: seed.styleParams ?? null,
      aspect: seed.aspect ?? '16:9',
      prompt: seed.prompt ?? '',
    })
  }, [])

  const value = useMemo<RenderFlowContextValue>(
    () => ({
      draft,
      resetDraft,
      choosePlan,
      switchPlan,
      changePlan,
      clearResults,
      setSummary,
      setStyleId,
      setStyleParams,
      setCamera,
      setAspect,
      setPrompt,
      setCount,
      appendResults,
      setCandidateStatus,
      focusCandidate,
      seedFromSession,
    }),
    [
      draft,
      resetDraft,
      choosePlan,
      switchPlan,
      changePlan,
      clearResults,
      setSummary,
      setStyleId,
      setStyleParams,
      setCamera,
      setAspect,
      setPrompt,
      setCount,
      appendResults,
      setCandidateStatus,
      focusCandidate,
      seedFromSession,
    ],
  )

  return <RenderFlowContext.Provider value={value}>{children}</RenderFlowContext.Provider>
}

export function useRenderFlow() {
  const ctx = useContext(RenderFlowContext)
  if (!ctx) throw new Error('useRenderFlow must be used within RenderFlowProvider')
  return ctx
}
