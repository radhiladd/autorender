import { ArrowSquareOut, Copy, DownloadSimple } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { formatSessionDateTime, personName, renderSrc, rendersForSession } from '../lib/format'
import { ASPECTS, CAMERAS, cameraLabel, useRenderFlow, type CameraId } from '../store/renderFlow'
import { useLibrary } from '../store/library'
import type { Session, StyleParams } from '../types'
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
} from './StylesDialog'
import { RenderCard } from './RenderCard'

const OPTION_LIMIT = 3

const DEMO_CONFIGS: Record<string, { elevation: string; options: string[] }> = {
  allison: {
    elevation: 'Elevation A',
    options: [
      'Exterior · Front porch',
      'Exterior · Board and batten siding',
      'Roof · Metal accent roof',
      'Garage · Carriage doors',
      'Kitchen · Island extension',
      'Kitchen · Quartz counters',
      'Primary bath · Freestanding tub',
      'Living · Fireplace',
      'Flooring · Wide-plank oak',
      'Lighting · Exterior sconces',
      'Windows · Black frames',
      'Patio · Covered extension',
    ],
  },
  untitled: {
    elevation: 'Elevation B',
    options: [
      'Exterior · Stone wainscot',
      'Garage · Third bay',
      'Kitchen · Walk-in pantry',
      'Primary bath · Dual vanity',
      'Living · Coffered ceiling',
      'Flooring · Luxury vinyl plank',
      'Windows · Transoms',
      'Patio · Extended slab',
    ],
  },
  cedar: {
    elevation: 'Elevation A',
    options: [
      'Exterior · Cedar shake gables',
      'Roof · Steeper pitch',
      'Kitchen · Farmhouse sink',
      'Living · Built-in shelving',
      'Lighting · Pendant package',
      'Patio · Pergola',
    ],
  },
  millhouse: {
    elevation: 'Elevation C',
    options: [
      'Exterior · Brick front',
      'Garage · Side-load',
      'Kitchen · Double ovens',
      'Primary suite · Sitting area',
      'Flooring · Tile entry',
      'Windows · Grids',
      'Lighting · Recessed package',
      'Laundry · Sink',
      'Patio · Outdoor kitchen',
      'Bonus room · Finished',
    ],
  },
}

type SessionView = {
  planName: string
  elevation: string | null
  options: string[]
  optionCount: number
  styleId: string
  styleName: string
  styleParams: StyleParams | null
  camera: CameraId
  aspect: string
  prompt: string
}

export function useSessionView(session: Session): SessionView {
  const { state } = useLibrary()
  const plan = state.plans.find((p) => p.id === session.planId)
  const [styleName, cameraName] = session.styleLabel.split('·').map((part) => part.trim())
  const style = state.styles.find((item) => item.name === styleName)
  const setup = session.setup
  const demo = DEMO_CONFIGS[session.planId]
  const camera =
    CAMERAS.find((item) => item.id === setup?.camera)?.id ??
    CAMERAS.find((item) => item.label === cameraName)?.id ??
    'front'

  return {
    planName: plan?.name ?? 'Untitled plan',
    elevation: setup ? setup.elevation : (demo?.elevation ?? null),
    options: setup ? setup.options : (demo?.options ?? []),
    optionCount: setup ? setup.optionCount : (demo?.options.length ?? 0),
    styleId: setup?.styleId ?? style?.id ?? state.styles[0]?.id ?? '',
    styleName: setup?.styleName ?? styleName ?? 'Style',
    styleParams: setup?.styleParams ?? style?.params ?? null,
    camera,
    aspect: setup?.aspect ?? '16:9',
    prompt: setup?.prompt ?? '',
  }
}

function labelFor(options: { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value
}

export function inputChips(view: SessionView) {
  const p = view.styleParams
  const chips: { category: string; label: string }[] = []
  if (p) {
    chips.push(
      { category: 'Render style', label: labelFor(RENDER_STYLES, p.renderStyle) },
      { category: 'Time of day', label: labelFor(TIMES, p.timeOfDay) },
      { category: 'Weather', label: labelFor(WEATHERS, p.weather) },
      { category: 'Scene', label: labelFor(SCENES, p.scene) },
      { category: 'Landscaping', label: `Landscaping ${p.landscaping}` },
      { category: 'Flowerbed', label: labelFor(FLOWERBED, p.flowerbedCover) },
      { category: 'Yard', label: labelFor(YARD, p.yardCover) },
      { category: 'Staging', label: labelFor(STAGING, p.staging) },
      { category: 'Windows', label: labelFor(WINDOWS, p.windowTreatments) },
      { category: 'Mode', label: labelFor(MODES, p.mode) },
    )
  }
  chips.push(
    { category: 'Camera', label: cameraLabel(view.camera) },
    { category: 'Aspect ratio', label: view.aspect },
  )
  return chips
}

export function SessionStack({
  session,
  highlighted = false,
}: {
  session: Session
  highlighted?: boolean
}) {
  const navigate = useNavigate()
  const { state, duplicateSession } = useLibrary()
  const { seedFromSession } = useRenderFlow()
  const view = useSessionView(session)
  const renders = rendersForSession(state.renders, session.id)
  if (renders.length === 0) return null

  const author = personName(session.createdBy)
  const shown = view.options.slice(0, OPTION_LIMIT)
  const hidden = view.optionCount - shown.length

  const downloadAll = () => {
    renders
      .filter((r) => r.downloadable)
      .forEach((r) => {
        const a = document.createElement('a')
        a.href = renderSrc(r.image)
        a.download = `${r.name}.jpg`
        a.click()
      })
  }

  const open = () => {
    seedFromSession({
      planId: session.planId,
      planName: view.planName,
      styleId: view.styleId,
      camera: view.camera,
      summary: view.elevation
        ? {
            elevation: view.elevation,
            palette: '',
            garage: '',
            optionCount: view.optionCount,
            options: view.options,
          }
        : null,
      styleParams: view.styleParams,
      aspect: ASPECTS.find((item) => item === view.aspect),
      prompt: view.prompt,
    })
    navigate(`/autorender/render/studio/${session.planId}`)
  }

  const iconButton =
    'flex h-7 w-7 items-center justify-center rounded-[6px] text-ink-3 hover:bg-inset hover:text-ink'

  return (
    <section
      id={`session-${session.id}`}
      className={`contact-sheet flex h-[220px] scroll-mt-4 items-stretch gap-6 p-4 transition-shadow duration-500 ${
        highlighted ? 'shadow-[0_0_0_2px_#1d4ed8]' : ''
      }`}
    >
      <div className="flex w-[220px] shrink-0 flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <h3 className="min-w-0 truncate text-[13px] font-medium text-ink-2">{view.planName}</h3>
          <span className="shrink-0 rounded-full bg-inset px-1.5 text-[10px] font-medium leading-[18px] text-ink-3">
            {renders.length} {renders.length === 1 ? 'render' : 'renders'}
          </span>
        </div>
        {view.elevation && <div className="text-[12px] text-ink-2">{view.elevation}</div>}
        <div className="text-[11px] leading-4 text-ink-3">
          {view.optionCount === 0 ? (
            'Default options'
          ) : (
            <>
              {shown.map((option) => (
                <div key={option} className="truncate">
                  {option}
                </div>
              ))}
              {hidden > 0 && (
                <div className="group relative w-fit">
                  <span className="cursor-help font-medium text-ink-2 underline decoration-dotted">
                    + {hidden} more
                  </span>
                  <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-60 rounded-[8px] border border-line bg-white p-2.5 text-ink-2 shadow-md group-hover:block">
                    {view.options.map((option) => (
                      <div key={option} className="truncate">
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="text-[11px] text-ink-4">
          {author} · {formatSessionDateTime(session.createdAt)}
        </div>
        <div className="mt-auto flex items-center gap-1 pt-1">
          <button
            type="button"
            aria-label="Download all renders"
            title="Download all"
            className={iconButton}
            onClick={downloadAll}
          >
            <DownloadSimple size={14} />
          </button>
          <button
            type="button"
            aria-label="Duplicate session"
            title="Duplicate"
            className={iconButton}
            onClick={() => duplicateSession(session.id)}
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            aria-label="Open in render setup"
            title="Open in render setup"
            className={iconButton}
            onClick={open}
          >
            <ArrowSquareOut size={14} />
          </button>
        </div>
      </div>

      <div className="mr-6 flex w-[240px] shrink-0 flex-col gap-2 overflow-hidden">
        <div className="truncate text-[12px] text-ink-3">
          <span className="text-ink-4">Style:</span> {view.styleName}
        </div>
        <div className="flex flex-wrap gap-1">
          {inputChips(view).map((chip) => (
            <span
              key={chip.category}
              title={`${chip.category}: ${chip.label}`}
              className="inline-flex h-[18px] items-center rounded-full border border-line bg-inset px-1.5 text-[10px] text-ink-2"
            >
              {chip.label}
            </span>
          ))}
        </div>
        {view.prompt && (
          <p className="line-clamp-3 text-[11px] italic leading-4 text-ink-3" title={view.prompt}>
            “{view.prompt}”
          </p>
        )}
      </div>

      <div className="flex min-w-0 flex-1 gap-4 overflow-x-auto">
        {renders.map((render) => (
          <RenderCard key={render.id} render={render} compact />
        ))}
      </div>
    </section>
  )
}
