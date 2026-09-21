import { ArrowRight, Copy, DotsThree, DownloadSimple, Trash } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import {
  formatSessionDateTime,
  personName,
  renderSrc,
  styleChips,
  unfiledInSession,
} from '../lib/format'
import { useLibrary } from '../store/library'
import type { Session } from '../types'
import { RenderCard } from './RenderCard'

export function SessionStack({ session }: { session: Session }) {
  const { state } = useLibrary()
  const renders = unfiledInSession(state.renders, session.id)
  if (renders.length === 0) return null

  const plan = state.plans.find((p) => p.id === session.planId)
  const chips = styleChips(session.styleLabel)
  const author = personName(session.createdBy)

  return (
    <section className="contact-sheet flex cursor-pointer items-stretch gap-12 p-4 transition-shadow hover:shadow-md">
      <div className="flex w-[296px] shrink-0 gap-6 border-r border-line pr-12 py-0.5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="truncate text-[13px] font-medium text-ink-2">
            {plan?.name ?? 'Untitled plan'}
          </h3>
          <div className="flex flex-wrap gap-1">
            {chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex h-[18px] items-center rounded-full border border-line bg-inset px-1.5 text-[10px] text-ink-2"
              >
                {chip}
              </span>
            ))}
          </div>
          <div className="pt-0.5 text-[11px] text-ink-4">
            {author} · {formatSessionDateTime(session.createdAt)}
          </div>
        </div>
        <PlanConfig planId={session.planId} />
      </div>
      <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1">
        {renders.map((render) => (
          <RenderCard key={render.id} render={render} compact />
        ))}
      </div>
      <SessionActions session={session} renders={renders} />
    </section>
  )
}

function SessionActions({
  session: _session,
  renders,
}: {
  session: Session
  renders: ReturnType<typeof unfiledInSession>
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const handleDownloadAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    renders
      .filter((r) => r.downloadable)
      .forEach((r) => {
        const a = document.createElement('a')
        a.href = renderSrc(r.image)
        a.download = `${r.name}.jpg`
        a.click()
      })
    setMenuOpen(false)
  }

  return (
    <div className="relative flex shrink-0 items-start pt-0.5" ref={menuRef}>
      <button
        type="button"
        aria-label="Session actions"
        className="rounded-[6px] border border-line bg-white p-1 text-ink-3 shadow-sm hover:bg-inset"
        onClick={(e) => {
          e.stopPropagation()
          setMenuOpen((v) => !v)
        }}
      >
        <DotsThree size={16} weight="bold" />
      </button>
      {menuOpen && (
        <div className="ha-menu absolute right-0 z-30 mt-8 w-44 py-1">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-ink-2 hover:bg-inset"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(false)
            }}
          >
            <ArrowRight size={14} />
            Continue
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-ink-2 hover:bg-inset"
            onClick={handleDownloadAll}
          >
            <DownloadSimple size={14} />
            Download all
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-ink-2 hover:bg-inset"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(false)
            }}
          >
            <Copy size={14} />
            Duplicate
          </button>
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[#dc2626] hover:bg-inset"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(false)
            }}
          >
            <Trash size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

function PlanConfig({ planId }: { planId: string }) {
  const configs: Record<string, { elevation: string; options: number; styles: string[] }> = {
    allison: { elevation: 'Elevation A', options: 12, styles: ['Daylight', 'Twilight'] },
    untitled: { elevation: 'Elevation B', options: 8, styles: ['Overcast'] },
    cedar: { elevation: 'Elevation A', options: 6, styles: ['Golden hour'] },
    millhouse: { elevation: 'Elevation C', options: 10, styles: ['Hoops'] },
  }
  const cfg = configs[planId]
  if (!cfg) return null

  return (
    <div className="shrink-0 space-y-0.5 text-[11px] text-ink-3">
      <div>{cfg.elevation}</div>
      <div>{cfg.options} options selected</div>
      <div>{cfg.styles.join(', ')}</div>
    </div>
  )
}
