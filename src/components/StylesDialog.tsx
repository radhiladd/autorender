import { ArrowLeft, Palette, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { newId } from '../lib/format'
import { styleChips } from '../lib/format'
import { useLibrary } from '../store/library'
import type { Style, StyleParams } from '../types'

const DEFAULT_PARAMS: StyleParams = {
  renderStyle: 'Photorealistic',
  timeOfDay: 'Morning',
  weather: 'Clear Sky',
  scene: 'Country',
  landscaping: 2,
  flowerbedCover: 'Wood Nuggets',
  yardCover: 'Grass',
  staging: 'No',
  windowTreatments: 'Nothing',
  mode: 'high',
}

type OptionDef<V extends string> = { value: V; label: string; desc?: string }

export const RENDER_STYLES: OptionDef<StyleParams['renderStyle']>[] = [
  { value: 'Photorealistic', label: 'Photorealistic', desc: 'photorealistic rendering style' },
  { value: 'Watercolor', label: 'Watercolor', desc: 'artistic watercolor painting style' },
  { value: 'Architectural Sketch', label: 'Sketch', desc: 'hand-drawn architectural sketch' },
]
export const TIMES: OptionDef<StyleParams['timeOfDay']>[] = [
  { value: 'Dawn', label: 'Dawn' },
  { value: 'Morning', label: 'Morning' },
  { value: 'Midday', label: 'Midday' },
  { value: 'Dusk', label: 'Dusk' },
  { value: 'Sunset', label: 'Sunset' },
]
export const WEATHERS: OptionDef<StyleParams['weather']>[] = [
  { value: 'Clear Sky', label: 'Clear Sky' },
  { value: 'Partly Cloudy', label: 'Partly Cloudy' },
  { value: 'After Rain', label: 'After Rain' },
]
export const SCENES: OptionDef<StyleParams['scene']>[] = [
  { value: 'Mountain', label: 'Mountain' },
  { value: 'Country', label: 'Country' },
  { value: 'Desert', label: 'Desert' },
  { value: 'Community', label: 'Community' },
  { value: 'Forest', label: 'Forest' },
]
export const FLOWERBED: OptionDef<StyleParams['flowerbedCover']>[] = [
  { value: 'Wood Nuggets', label: 'Wood Nuggets' },
  { value: 'Pine Straw', label: 'Pine Straw' },
  { value: 'Dark Soil', label: 'Dark Soil' },
]
export const YARD: OptionDef<StyleParams['yardCover']>[] = [
  { value: 'Grass', label: 'Grass' },
  { value: 'Freshly Mowed Grass', label: 'Mowed' },
  { value: 'Rocks', label: 'Rocks' },
  { value: 'Pea Gravel', label: 'Pea Gravel' },
  { value: 'Native Ground Cover', label: 'Native' },
  { value: 'Texture', label: 'Texture' },
]
export const STAGING: OptionDef<StyleParams['staging']>[] = [
  { value: 'Yes', label: 'Staged' },
  { value: 'No', label: 'Empty' },
]
export const WINDOWS: OptionDef<StyleParams['windowTreatments']>[] = [
  { value: 'Nothing', label: 'None' },
  { value: 'Curtains', label: 'Curtains' },
  { value: 'Blinds', label: 'Blinds' },
]
export const MODES: OptionDef<StyleParams['mode']>[] = [
  { value: 'low', label: 'Low (fast)' },
  { value: 'high', label: 'High (pro)' },
]

export function StylesDialog({ onClose }: { onClose: () => void }) {
  const { state, saveStyle, deleteStyle } = useLibrary()
  const [editing, setEditing] = useState<Style | null>(null)

  if (editing) {
    return (
      <StyleEditor
        initial={editing}
        onSave={(style) => {
          saveStyle(style)
          setEditing(null)
        }}
        onBack={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-[#171717]/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="styles-title"
        className="relative flex max-h-[min(640px,90vh)] w-full max-w-2xl flex-col rounded-lg border border-line bg-white shadow-[0_24px_60px_-28px_rgb(0_0_0_/_0.45)]"
      >
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <h2 id="styles-title" className="text-[16px] font-semibold tracking-[-0.1px] text-[#111827]">
              Render Styles
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditing({
                  id: newId('style'),
                  name: '',
                  description: '',
                  params: { ...DEFAULT_PARAMS },
                })
              }
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-[6px] border border-line-strong bg-white px-3 text-[12px] font-medium text-ink-2 hover:bg-inset"
            >
              <Plus size={11} weight="bold" />
              New style
            </button>
          </div>
          <p className="mt-1 text-[13px] text-ink-3">
            Lighting and scene presets applied when generating renders.
          </p>
        </div>

        <div className="ha-scroll min-h-0 flex-1">
          {state.styles.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-ink-3">No styles yet.</p>
          ) : (
            <div className="divide-y divide-line">
              {state.styles.map((style) => {
                const used = state.sessions.filter(
                  (session) => styleChips(session.styleLabel)[0] === style.name,
                ).length
                return (
                  <div
                    key={style.id}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-inset/50"
                  >
                    <div className="w-28 shrink-0">
                      <div className="truncate text-[14px] font-medium text-ink-2">{style.name}</div>
                      <div className="mt-0.5 tabular-nums text-[12px] text-ink-4">
                        {used} {used === 1 ? 'session' : 'sessions'}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <StylePreviewChips params={style.params} />
                      {style.description && (
                        <div className="mt-1 truncate text-[12px] text-ink-3">{style.description}</div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Edit ${style.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-ink-4 hover:bg-inset hover:text-ink-2"
                        onClick={() => setEditing({ ...style, params: { ...style.params } })}
                      >
                        <PencilSimple size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${style.name}`}
                        disabled={used > 0}
                        title={used > 0 ? 'In use by sessions' : 'Delete style'}
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-ink-4 hover:bg-inset hover:text-ink-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                        onClick={() => deleteStyle(style.id)}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StylePreviewChips({ params }: { params: StyleParams }) {
  const tags = [params.timeOfDay, params.weather, params.scene]
  return (
    <div className="flex shrink-0 flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex h-5 items-center rounded-full border border-line bg-inset px-2 text-[10px] font-medium text-ink-2"
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

function StyleEditor({
  initial,
  onSave,
  onBack,
}: {
  initial: Style
  onSave: (style: Style) => void
  onBack: () => void
}) {
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [params, setParams] = useState<StyleParams>({ ...initial.params })

  const set = <K extends keyof StyleParams>(key: K, value: StyleParams[K]) =>
    setParams((p) => ({ ...p, [key]: value }))

  const canSave = name.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-[#171717]/40" onClick={onBack} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[min(720px,92vh)] w-full max-w-xl flex-col rounded-lg border border-line bg-white shadow-[0_24px_60px_-28px_rgb(0_0_0_/_0.45)]"
      >
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] text-ink-3 hover:bg-inset hover:text-ink-2"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-[15px] font-semibold text-[#111827]">
            {initial.name ? 'Edit Style' : 'Create Render Style'}
          </h2>
        </div>

        <div className="ha-scroll min-h-0 flex-1 space-y-5 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 block text-[12px] font-medium text-ink-2">
              Style Name <span className="text-[#dc2626]">*</span>
              <input
                autoFocus
                className="mt-1 h-8 w-full rounded-[6px] border border-line-strong bg-white px-3 text-[13px] text-ink focus:outline-none"
                placeholder="Enter a name for this style"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="col-span-2 block text-[12px] font-medium text-ink-2">
              Description <span className="text-ink-4">(optional)</span>
              <textarea
                className="mt-1 h-16 w-full resize-none rounded-[6px] border border-line-strong bg-white px-3 py-2 text-[13px] text-ink focus:outline-none"
                placeholder="Enter a description for this style"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-[12px] font-medium text-ink-2">Render Style</legend>
            <ChipRow options={RENDER_STYLES} value={params.renderStyle} onChange={(v) => set('renderStyle', v)} />
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[12px] font-medium text-ink-2">Time of Day</legend>
            <ChipRow options={TIMES} value={params.timeOfDay} onChange={(v) => set('timeOfDay', v)} />
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[12px] font-medium text-ink-2">Weather</legend>
            <ChipRow options={WEATHERS} value={params.weather} onChange={(v) => set('weather', v)} />
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[12px] font-medium text-ink-2">Scene</legend>
            <ChipRow options={SCENES} value={params.scene} onChange={(v) => set('scene', v)} />
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[12px] font-medium text-ink-2">
              Landscaping
              <span className="ml-1.5 tabular-nums text-ink-4">{params.landscaping}</span>
            </legend>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={params.landscaping}
              onChange={(e) => set('landscaping', Number(e.target.value))}
              className="w-full accent-[#1d4ed8]"
            />
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[12px] font-medium text-ink-2">Flowerbed Ground Cover</legend>
            <ChipRow options={FLOWERBED} value={params.flowerbedCover} onChange={(v) => set('flowerbedCover', v)} />
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[12px] font-medium text-ink-2">Yard Ground Cover</legend>
            <ChipRow options={YARD} value={params.yardCover} onChange={(v) => set('yardCover', v)} />
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[12px] font-medium text-ink-2">Staging</legend>
            <ChipRow options={STAGING} value={params.staging} onChange={(v) => set('staging', v)} />
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[12px] font-medium text-ink-2">Window Treatments</legend>
            <ChipRow options={WINDOWS} value={params.windowTreatments} onChange={(v) => set('windowTreatments', v)} />
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[12px] font-medium text-ink-2">Mode</legend>
            <ChipRow options={MODES} value={params.mode} onChange={(v) => set('mode', v)} />
          </fieldset>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
          <button
            type="button"
            className="h-8 px-3 text-[13px] text-ink-3 hover:text-ink"
            onClick={onBack}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            className="h-8 rounded-[6px] bg-[#1d4ed8] px-4 text-[12px] font-medium text-white disabled:opacity-40 hover:bg-[#1e40af]"
            onClick={() =>
              onSave({
                id: initial.id,
                name: name.trim(),
                description: description.trim(),
                params,
              })
            }
          >
            Save Style
          </button>
        </div>
      </div>
    </div>
  )
}

function ChipRow<V extends string>({
  options,
  value,
  onChange,
}: {
  options: OptionDef<V>[]
  value: V
  onChange: (v: V) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`inline-flex h-7 items-center rounded-[6px] border px-2.5 text-[12px] font-medium transition ${
            value === opt.value
              ? 'border-[#1d4ed8] bg-[#eff6ff] text-[#1d4ed8]'
              : 'border-line bg-white text-ink-3 hover:border-line-strong hover:text-ink-2'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function StylesButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-line-strong bg-white px-3 text-[12px] font-medium text-ink-2 hover:bg-inset"
    >
      <Palette size={13} />
      Styles
    </button>
  )
}
