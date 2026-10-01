import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
  type TextareaHTMLAttributes,
} from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowCounterClockwise,
  CaretDown,
  Check,
  Info,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react'
import { Button, ButtonGroup } from '@higharc/dcp-hds-staging/button'
import { Select } from '@higharc/dcp-hds-staging/select'
import { ToggleGroup, ToggleGroupItem } from '@higharc/dcp-hds-staging/togglegroup'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@higharc/dcp-hds-staging/tabs'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from '@higharc/dcp-hds-staging/dialog'
import { ElevationPreview } from '../components/ElevationPreview'
import { newId, renderSrc } from '../lib/format'
import {
  FLOWERBED,
  MODES,
  RENDER_STYLES,
  SCENES,
  STAGING,
  TIMES,
  WEATHERS,
  WINDOWS,
  YARD,
} from '../components/StylesDialog'
import {
  ASPECTS,
  CAMERAS,
  cameraLabel,
  type RenderCandidate,
  type ShowroomSummary,
  useRenderFlow,
} from '../store/renderFlow'
import { useLibrary } from '../store/library'
import type { StyleParams } from '../types'

const promptBox =
  'rounded-[8px] border border-[#ededed] bg-[#f7f7f7] focus-within:border-line-strong'
const promptInput =
  'block max-h-40 w-full resize-none overflow-y-auto bg-transparent px-3 pt-2.5 pb-1 text-[13px] leading-5 text-ink focus:outline-none'

function RenderCountPicker({
  id,
  value,
  onChange,
}: {
  id: string
  value: 1 | 2 | 3
  onChange: (count: 1 | 2 | 3) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span id={id} className="pl-1 text-[12px] text-ink-3">
        # of renders
      </span>
      <ButtonGroup aria-labelledby={id}>
        {([1, 2, 3] as const).map((count) => (
          <Button
            key={count}
            size="sm"
            variant={value === count ? 'shaded-blue' : 'outline'}
            aria-pressed={value === count}
            onClick={() => onChange(count)}
          >
            {count}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  )
}

function AutoTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [props.value])
  return <textarea ref={ref} rows={1} {...props} />
}

const RENDER_FILES = Array.from({ length: 18 }, (_, i) => `${String(i + 1).padStart(2, '0')}.jpg`)

function showroomSrc(file: string) {
  return new URL(`showroom/${file}`, window.location.href).toString()
}

function exteriorSrc() {
  return showroomSrc('viewer-assets/exterior/composite.png')
}

export function useSaveRender() {
  const navigate = useNavigate()
  const { state, saveRenderSession } = useLibrary()
  const { draft } = useRenderFlow()
  const style = state.styles.find((item) => item.id === draft.styleId) ?? state.styles[0]
  const kept = draft.results.filter((item) => item.status === 'kept')
  const canSave = Boolean(style) && kept.length > 0

  const persist = () => {
    if (!style || kept.length === 0) return null
    const label = `${style.name} · ${cameraLabel(draft.camera)}`
    const planId = saveRenderSession({
      planName: draft.planName,
      existingPlanId: draft.planId ?? undefined,
      collectionId: draft.collectionId,
      styleLabel: label,
      setup: {
        elevation: draft.summary?.elevation ?? null,
        optionCount: draft.summary?.optionCount ?? 0,
        options: draft.summary?.options ?? [],
        styleId: style.id,
        styleName: style.name,
        styleParams: draft.styleParams,
        camera: draft.camera,
        aspect: draft.aspect,
        prompt: draft.prompt.trim(),
      },
      renders: kept.map((item, i) => ({
        name: `${draft.planName} ${cameraLabel(item.camera)} ${i + 1}`,
        image: item.image,
        prompt: item.prompt,
        refined: Boolean(item.refinedFrom),
      })),
    })
    return planId
  }

  const save = () => {
    const planId = persist()
    if (!planId) return
    const collectionId = draft.collectionId
    navigate(
      collectionId ? `/autorender/collections/${collectionId}` : `/autorender/plans/${planId}`,
    )
  }

  return { save, persist, canSave, keptCount: kept.length }
}

export function RenderStudio() {
  const { state } = useLibrary()
  const {
    draft,
    setStyleId,
    setStyleParams,
    setCamera,
    setAspect,
    setPrompt,
    setCount,
    appendResults,
    setCandidateStatus,
    focusCandidate,
    switchPlan,
  } = useRenderFlow()
  const [generating, setGenerating] = useState(false)
  const [refineDraft, setRefineDraft] = useState<{
    id: string | null
    text: string
  }>({ id: null, text: '' })
  const { planId: routePlanId } = useParams()

  useEffect(() => {
    if (!routePlanId || draft.planId === routePlanId) return
    const plan = state.plans.find((item) => item.id === routePlanId)
    if (plan) switchPlan({ planId: plan.id, planName: plan.name })
  }, [draft.planId, routePlanId, state.plans, switchPlan])

  useEffect(() => {
    if (!draft.styleId && state.styles[0]) {
      setStyleId(state.styles[0].id)
      setStyleParams({ ...state.styles[0].params })
      return
    }
    if (draft.styleId && !draft.styleParams) {
      const match = state.styles.find((item) => item.id === draft.styleId)
      if (match) setStyleParams({ ...match.params })
    }
  }, [draft.styleId, draft.styleParams, setStyleId, setStyleParams, state.styles])

  if (!draft.planId && !draft.planName && !routePlanId) {
    return <Navigate to="/autorender/render" replace />
  }

  const shot = draft.styleParams
  const setField = <K extends keyof StyleParams>(key: K, value: StyleParams[K]) => {
    if (!shot) return
    setStyleParams({ ...shot, [key]: value })
  }
  const pickStyle = (id: string) => {
    const next = state.styles.find((item) => item.id === id)
    setStyleId(id)
    if (next) setStyleParams({ ...next.params })
  }
  const style = state.styles.find((item) => item.id === draft.styleId) ?? state.styles[0]
  const focused = draft.results.find((item) => item.id === draft.focusedId) ?? null

  const generate = () => {
    if (!style || generating) return
    const count = draft.count
    const start = draft.results.length
    setGenerating(true)
    window.setTimeout(() => {
      const now = Date.now()
      const items: RenderCandidate[] = Array.from({ length: count }, (_, i) => ({
        id: newId('cand'),
        image: RENDER_FILES[(start + i) % RENDER_FILES.length] ?? RENDER_FILES[0],
        prompt: draft.prompt.trim(),
        styleId: style.id,
        styleName: style.name,
        camera: draft.camera,
        aspect: draft.aspect,
        status: 'kept',
        createdAt: new Date(now + i * 1000).toISOString(),
      }))
      appendResults(items)
      setGenerating(false)
    }, 700)
  }

  const refining = focused !== null
  const refineText = focused && refineDraft.id === focused.id ? refineDraft.text : ''
  const refine = () => {
    const base = focused
    const text = refineText.trim()
    if (!base || !text || generating) return
    const start = draft.results.length
    setGenerating(true)
    const count = draft.count
    window.setTimeout(() => {
      const now = Date.now()
      const items: RenderCandidate[] = Array.from({ length: count }, (_, i) => ({
        id: newId('cand'),
        image: RENDER_FILES[(start + i) % RENDER_FILES.length] ?? RENDER_FILES[0],
        prompt: text,
        styleId: base.styleId,
        styleName: base.styleName,
        camera: base.camera,
        aspect: base.aspect,
        status: 'kept',
        createdAt: new Date(now + i * 1000).toISOString(),
        refinedFrom: base.id,
      }))
      appendResults(items)
      focusCandidate(items[0].id)
      setGenerating(false)
    }, 700)
  }
  const resultNumber = (id: string) => draft.results.findIndex((item) => item.id === id) + 1

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="ha-scroll flex w-[280px] shrink-0 flex-col gap-6 px-4 pt-2 pb-4">
        {refining && (
          <div className="rounded-[6px] border border-line bg-inset px-3 py-2 text-[12px] leading-4 text-ink-2">
            Style settings don’t apply while you refine a render. Only the prompt changes it.
            <button
              type="button"
              onClick={() => focusCandidate(null)}
              className="mt-1 block font-medium text-[#1d4ed8] hover:underline"
            >
              Create new render
            </button>
          </div>
        )}
        <div
          aria-disabled={refining}
          className={`flex flex-col gap-6 ${refining ? 'pointer-events-none select-none opacity-40' : ''}`}
        >
          <section>
            <h3 className="mb-1.5 text-[13px] font-medium text-ink">Style preset</h3>
            <Select
              size="sm"
              value={draft.styleId || null}
              placeholder="Select a style"
              options={state.styles.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onValueChange={pickStyle}
            />
            {shot && (
              <div className="mt-4 flex flex-col gap-4">
                <ChoiceField
                  label="Render style"
                  value={shot.renderStyle}
                  options={RENDER_STYLES}
                  onChange={(value) => setField('renderStyle', value)}
                />
                <ChoiceField
                  label="Time of day"
                  value={shot.timeOfDay}
                  options={TIMES}
                  onChange={(value) => setField('timeOfDay', value)}
                />
                <ChoiceField
                  label="Weather"
                  value={shot.weather}
                  options={WEATHERS}
                  onChange={(value) => setField('weather', value)}
                />
                <ChoiceField
                  label="Scene"
                  value={shot.scene}
                  options={SCENES}
                  onChange={(value) => setField('scene', value)}
                />
                <StyleField label="Landscaping">
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={1}
                    value={shot.landscaping}
                    onChange={(event) => setField('landscaping', Number(event.target.value))}
                    className="w-full"
                  />
                </StyleField>
                <ChoiceField
                  label="Flowerbed"
                  value={shot.flowerbedCover}
                  options={FLOWERBED}
                  onChange={(value) => setField('flowerbedCover', value)}
                />
                <ChoiceField
                  label="Yard"
                  value={shot.yardCover}
                  options={YARD}
                  onChange={(value) => setField('yardCover', value)}
                />
                <ChoiceField
                  label="Staging"
                  value={shot.staging}
                  options={STAGING}
                  onChange={(value) => setField('staging', value)}
                />
                <ChoiceField
                  label="Windows"
                  value={shot.windowTreatments}
                  options={WINDOWS}
                  onChange={(value) => setField('windowTreatments', value)}
                />
                <ChoiceField
                  label="Mode"
                  value={shot.mode}
                  options={MODES}
                  onChange={(value) => setField('mode', value)}
                />
              </div>
            )}
          </section>

          <section>
            <ChoiceField
              label="Camera"
              value={draft.camera}
              options={CAMERAS.map((camera) => ({
                value: camera.id,
                label: camera.label,
              }))}
              onChange={setCamera}
            />
          </section>

          <section>
            <ChoiceField
              label="Aspect ratio"
              value={draft.aspect}
              options={ASPECTS.map((aspect) => ({
                value: aspect,
                label: aspect,
              }))}
              onChange={setAspect}
            />
          </section>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="relative mx-4 mt-2 min-h-0 flex-1 overflow-hidden rounded-[8px] bg-[#171717]">
          <img
            src={focused ? renderSrc(focused.image) : exteriorSrc()}
            alt={focused ? focused.styleName : `${draft.planName} exterior`}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {focused && (
            <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[12px] font-medium text-white">
              Refining render {resultNumber(focused.id)}
            </div>
          )}
          {generating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-[13px] font-medium text-white">
              {refining ? 'Refining…' : 'Generating…'}
            </div>
          )}
        </div>

        {focused ? (
          <div className="flex shrink-0 flex-col gap-1 px-4 pt-3 pb-5">
            <div>
              <label htmlFor="refine-prompt" className="text-[12px] font-medium text-ink-2">
                Refine this render
              </label>
              <p className="text-[12px] text-ink-4">
                Adds a new version to the render log. The original stays.
              </p>
            </div>
            <div className={promptBox}>
              <AutoTextarea
                id="refine-prompt"
                value={refineText}
                onChange={(e) => setRefineDraft({ id: focused.id, text: e.target.value })}
                placeholder="Describe what to change, e.g. warmer light, a car in the driveway, darker shutters."
                className={promptInput}
              />
              <div className="flex items-end gap-2 px-2 pb-2">
                <RenderCountPicker
                  id="refine-count-label"
                  value={draft.count}
                  onChange={setCount}
                />
                <div className="ml-auto">
                  <Button
                    size="base"
                    iconLeft="sparkle"
                    disabled={!refineText.trim()}
                    loading={generating}
                    onClick={refine}
                  >
                    Refine Render
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex shrink-0 flex-col gap-1 px-4 pt-3 pb-5">
            <div className={promptBox}>
              <AutoTextarea
                id="render-prompt"
                aria-label="Additional prompt"
                value={draft.prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Additional prompt (optional)"
                className={promptInput}
              />
              <div className="flex items-end gap-2 px-2 pb-2">
                <RenderCountPicker
                  id="render-count-label"
                  value={draft.count}
                  onChange={setCount}
                />
                <div className="ml-auto">
                  <Button
                    size="base"
                    iconLeft="sparkle"
                    disabled={!style}
                    loading={generating}
                    onClick={generate}
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <aside className="ha-scroll w-[240px] shrink-0 px-3 pt-2 pb-4">
        <h3 className="px-1 text-[12px] font-medium text-ink-2">Render log</h3>
        {draft.results.length === 0 ? (
          <p className="mt-4 px-1 text-[12px] text-ink-4">No variations yet.</p>
        ) : (
          <>
            <p className="mt-1 px-1 text-[11px] leading-4 text-ink-4">
              Click a render to refine it. Trash the ones you don’t want saved.
            </p>
            <ul className="mt-3 space-y-2">
              {draft.results.map((item) => (
                <li key={item.id} className="relative">
                  <button
                    type="button"
                    onClick={() => focusCandidate(item.id)}
                    className={`w-full rounded-[6px] border p-1.5 text-left ${
                      draft.focusedId === item.id ? 'border-[#1d4ed8]' : 'border-line'
                    } ${item.status === 'discarded' ? 'opacity-50' : ''}`}
                  >
                    <img
                      src={renderSrc(item.image)}
                      alt=""
                      className="aspect-video w-full rounded-[4px] object-cover"
                    />
                    <div className="mt-1 truncate px-0.5 text-[11px] font-medium text-ink-2">
                      {resultNumber(item.id)}. {item.styleName} · {cameraLabel(item.camera)}
                    </div>
                    {item.refinedFrom && (
                      <div className="px-0.5 text-[10px] font-medium text-[#1d4ed8]">
                        Refined from {resultNumber(item.refinedFrom)}
                      </div>
                    )}
                    <div className="px-0.5 text-[10px] text-ink-4">
                      {item.aspect}
                      {item.prompt ? ` · ${item.prompt}` : ''}
                      {item.status === 'discarded' ? ' · Discarded' : ''}
                    </div>
                  </button>
                  {item.status === 'discarded' ? (
                    <button
                      type="button"
                      aria-label={`Restore render ${resultNumber(item.id)}`}
                      title="Restore"
                      onClick={() => setCandidateStatus(item.id, 'kept')}
                      className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center text-ink-4 hover:text-ink"
                    >
                      <ArrowCounterClockwise size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Discard render ${resultNumber(item.id)}`}
                      title="Discard"
                      onClick={() => {
                        setCandidateStatus(item.id, 'discarded')
                        if (draft.focusedId === item.id) focusCandidate(null)
                      }}
                      className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center text-ink-4 hover:text-[#b91c1c]"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </div>
  )
}

const CHOICE_INFO: Record<string, string> = {
  Photorealistic: 'A photographic render with realistic materials, light, and shadows.',
  Watercolor: 'Soft painted washes instead of a photograph.',
  'Architectural Sketch': 'Linework like a hand-drawn elevation.',
  Dawn: 'Low sun just before sunrise, with cool light.',
  Morning: 'Bright, even daylight.',
  Midday: 'Sun overhead, short shadows.',
  Dusk: 'Sun below the horizon, with warm sky and interior glow.',
  Sunset: 'Low warm sun and long shadows.',
  'Clear Sky': 'Blue sky and direct sun.',
  'Partly Cloudy': 'Sun broken by clouds, softer shadows.',
  'After Rain': 'Wet surfaces and a clearing sky.',
  Mountain: 'The home sits against hills or mountains.',
  Country: 'Open land, fields, and a rural horizon.',
  Desert: 'Dry ground, sparse plants, and hard light.',
  Community: 'Neighboring homes and a street setting.',
  Forest: 'Trees close around the home.',
  'Wood Nuggets': 'Brown wood mulch in the planting beds.',
  'Pine Straw': 'Pine needles covering the planting beds.',
  'Dark Soil': 'Bare dark soil in the planting beds.',
  Grass: 'A typical green lawn.',
  'Freshly Mowed Grass': 'A short, even lawn with mowing stripes.',
  Rocks: 'Stone ground cover instead of lawn.',
  'Pea Gravel': 'Small rounded gravel.',
  'Native Ground Cover': 'Low regional plants instead of turf.',
  Texture: 'A patterned ground surface.',
  Yes: 'Furniture and decor are visible inside.',
  No: 'Rooms are empty.',
  Nothing: 'Windows are bare.',
  Curtains: 'Fabric window treatments.',
  Blinds: 'Horizontal blinds in the windows.',
  low: 'A faster render with less detail.',
  high: 'A slower render with more detail.',
  'front-left': 'Camera at the front-left corner of the home.',
  'front-right': 'Camera at the front-right corner of the home.',
  front: 'Camera straight on to the front elevation.',
  aerial: 'A raised three-quarter view looking down at the roof.',
  custom: 'A camera you place yourself.',
  '1:1': 'A square frame.',
  '4:3': 'A standard photo frame.',
  '16:9': 'A wide frame.',
}

type Choice<V extends string> = { value: V; label: string; desc?: string }

function choicePreview(index: number) {
  return renderSrc(RENDER_FILES[index % RENDER_FILES.length] ?? RENDER_FILES[0])
}

function ChoiceField<V extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: V
  options: Choice<V>[]
  onChange: (value: V) => void
}) {
  const [infoOpen, setInfoOpen] = useState(false)
  const [tab, setTab] = useState<string>(value)

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setTab(value)
          setInfoOpen(true)
        }}
        className="mb-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-ink hover:text-ink-2"
      >
        {label}
        <Info size={13} className="text-ink-4" />
      </button>
      <ToggleGroup
        type="single"
        size="sm"
        variant="bare"
        value={value}
        onValueChange={(next) => {
          if (typeof next === 'string') onChange(next as V)
        }}
        className="studio-chips flex flex-wrap"
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogOverlay>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>{label}</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <DialogBody>
              <Tabs value={tab} onValueChange={setTab} variant="underline" size="sm">
                <TabsList>
                  {options.map((option) => (
                    <TabsTrigger key={option.value} value={option.value}>
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {options.map((option, i) => (
                  <TabsContent key={option.value} value={option.value}>
                    <img
                      src={choicePreview(i)}
                      alt={`${option.label} example`}
                      className="mt-3 aspect-video w-full rounded-[6px] object-cover"
                    />
                    <p className="mt-3 text-[13px] leading-5 text-ink-2">
                      {CHOICE_INFO[option.value] ??
                        option.desc ??
                        `${option.label} is one of the choices for this setting.`}
                    </p>
                  </TabsContent>
                ))}
              </Tabs>
            </DialogBody>
          </DialogContent>
        </DialogOverlay>
      </Dialog>
    </div>
  )
}

function StyleField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-medium text-ink">{label}</div>
      {children}
    </div>
  )
}

function useDismiss(open: boolean, ref: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, ref, close])
}

export function PlanChips({
  planId,
  planName,
  summary,
  hasRenders,
  keptCount,
  onSelectPlan,
  onEditConfig,
}: {
  planId: string | null
  planName: string
  summary: ShowroomSummary | null
  hasRenders: boolean
  keptCount: number
  onSelectPlan: (plan: { id: string; name: string }) => void
  onEditConfig: () => void
}) {
  const { state } = useLibrary()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const configRef = useRef<HTMLDivElement>(null)
  const optionCount = summary?.optionCount ?? 0
  const chip =
    'flex h-8 items-center gap-2 rounded-full border border-line bg-white pl-1 pr-0.5 text-[12px] text-ink'

  useDismiss(menuOpen, menuRef, () => setMenuOpen(false))
  useDismiss(configOpen, configRef, () => setConfigOpen(false))

  const pick = (plan: { id: string; name: string }) => {
    setMenuOpen(false)
    if (plan.id === planId) return
    if (
      (summary || hasRenders) &&
      !window.confirm(
        `Switch to ${plan.name}? Its options start from the defaults, and the renders in the log will be cleared. Your style settings and prompt stay.`,
      )
    ) {
      return
    }
    onSelectPlan(plan)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className={`${chip} pr-2.5 hover:bg-inset`}
        >
          <img src={exteriorSrc()} alt="" className="h-6 w-6 rounded-full object-cover" />
          <span className="text-ink-4">Plan</span>
          <span className="max-w-[200px] truncate font-medium">{planName}</span>
          <CaretDown size={12} className="text-ink-3" />
        </button>
        {menuOpen && (
          <ul
            role="listbox"
            aria-label="Plans"
            className="ha-menu ha-scroll absolute left-0 top-full mt-1.5 max-h-80 w-64 py-1"
          >
            {state.plans.map((plan) => (
              <li key={plan.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={plan.id === planId}
                  onClick={() => pick(plan)}
                  className="flex w-full items-center gap-2.5 px-2 py-1.5 text-left hover:bg-inset"
                >
                  <ElevationPreview planId={plan.id} width={40} height={30} />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">
                    {plan.name}
                  </span>
                  {plan.id === planId && <Check size={14} className="shrink-0 text-[#1d4ed8]" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative" ref={configRef}>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={configOpen}
          onClick={() => setConfigOpen((open) => !open)}
          className={`${chip} pl-3 pr-2.5 hover:bg-inset`}
        >
          {summary && (
            <span className="max-w-[160px] truncate font-medium">{summary.elevation}</span>
          )}
          <span className="text-ink-3">
            {optionCount === 0
              ? 'Default options'
              : `${optionCount} ${optionCount === 1 ? 'option' : 'options'} changed`}
          </span>
          <CaretDown size={12} className="text-ink-3" />
        </button>
        {configOpen && (
          <div className="ha-menu absolute left-1/2 top-full mt-1.5 w-72 -translate-x-1/2 py-1">
            <div className="px-3 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-[0.4px] text-ink-4">
              Changed options
            </div>
            <div className="ha-scroll max-h-64 px-3 pb-2 text-[12px] leading-5 text-ink-2">
              {summary?.options?.length ? (
                summary.options.map((option) => (
                  <div key={option} className="truncate">
                    {option}
                  </div>
                ))
              ) : (
                <div className="text-ink-4">No options were changed from the default.</div>
              )}
            </div>
            <div className="border-t border-line px-1 pt-1">
              <button
                type="button"
                onClick={() => {
                  setConfigOpen(false)
                  setConfirmOpen(true)
                }}
                className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] text-ink-2 hover:bg-inset"
              >
                <PencilSimple size={14} className="text-ink-3" />
                Edit options
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogOverlay>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>Edit options?</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <DialogBody>
              <p className="text-[13px] leading-5 text-ink-2">
                Are you sure you want to edit options? This will create a new render session.
                {keptCount > 0 &&
                  ` Your ${keptCount} ${keptCount === 1 ? 'render is' : 'renders are'} saved to this session first.`}
              </p>
            </DialogBody>
            <DialogFooter>
              <Button size="base" variant="ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                size="base"
                onClick={() => {
                  setConfirmOpen(false)
                  onEditConfig()
                }}
              >
                Edit options
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogOverlay>
      </Dialog>
    </div>
  )
}
