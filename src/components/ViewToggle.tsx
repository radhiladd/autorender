import { List, SquaresFour } from '@phosphor-icons/react'

export type FolderView = 'grid' | 'list'

export function ViewToggle({
  value,
  onChange,
  label = 'Layout',
}: {
  value: FolderView
  onChange: (view: FolderView) => void
  label?: string
}) {
  return (
    <div
      className="flex items-center rounded-[6px] border border-line p-0.5"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        aria-label="Grid view"
        aria-pressed={value === 'grid'}
        onClick={() => onChange('grid')}
        className="flex h-7 w-7 items-center justify-center rounded-[4px] text-ink-3 hover:text-ink-2"
        style={{ background: value === 'grid' ? '#e5e5e5' : 'transparent', color: value === 'grid' ? '#2e2e2e' : undefined }}
      >
        <SquaresFour size={16} className="pointer-events-none" />
      </button>
      <button
        type="button"
        aria-label="List view"
        aria-pressed={value === 'list'}
        onClick={() => onChange('list')}
        className="flex h-7 w-7 items-center justify-center rounded-[4px] text-ink-3 hover:text-ink-2"
        style={{ background: value === 'list' ? '#e5e5e5' : 'transparent', color: value === 'list' ? '#2e2e2e' : undefined }}
      >
        <List size={16} className="pointer-events-none" />
      </button>
    </div>
  )
}
