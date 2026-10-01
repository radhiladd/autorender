import { DotsThree, PencilSimple } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatRelative, lastActivityIso, latestCover, renderSrc } from '../lib/format'
import { useLibrary } from '../store/library'
import type { Plan } from '../types'
import type { FolderView } from './ViewToggle'
import { NameDialog } from './NameDialog'

export const PLAN_LIST_ROW =
  'grid grid-cols-[minmax(8rem,1fr)_5.5rem_7.5rem_8.5rem] items-center gap-x-4 px-3 pr-11'

export function PlanCard({ plan, layout = 'list' }: { plan: Plan; layout?: FolderView }) {
  const { state, renamePlan } = useLibrary()
  const count = state.renders.filter((r) => r.planId === plan.id).length
  const sessionCount = state.sessions.filter((s) => s.planId === plan.id).length
  const cover = latestCover(state.renders, plan.id)
  const activity = lastActivityIso(state.renders, plan.id)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const meta = [
    `${count} ${count === 1 ? 'render' : 'renders'}`,
    sessionCount > 0 ? `${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'}` : null,
    activity ? formatRelative(activity) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <div className={`group relative ${menuOpen ? 'z-30' : ''}`}>
        {layout === 'list' ? (
          <Link
            to={`/autorender/plans/${plan.id}`}
            className={`${PLAN_LIST_ROW} h-10 text-[13px] hover:bg-inset`}
          >
            <div className="truncate font-medium text-ink-2">{plan.name}</div>
            <div className="tabular-nums text-ink-3">{count}</div>
            <div className="tabular-nums text-ink-3">{sessionCount}</div>
            <div className="truncate text-ink-3">{activity ? formatRelative(activity) : '—'}</div>
          </Link>
        ) : (
          <Link to={`/autorender/plans/${plan.id}`} className="ha-card block">
            <div className="still aspect-[16/10] overflow-hidden">
              {cover ? (
                <img
                  src={renderSrc(cover.image)}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="h-full w-full bg-inset" />
              )}
            </div>
            <div className="flex items-start justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-medium text-ink-2">{plan.name}</div>
                <div className="mt-0.5 text-[12px] text-ink-4">{meta}</div>
              </div>
            </div>
          </Link>
        )}
        <div
          className={
            layout === 'list'
              ? 'absolute top-1/2 right-2 -translate-y-1/2'
              : 'absolute top-2 right-2'
          }
          ref={menuRef}
        >
          <button
            type="button"
            aria-label="Plan actions"
            className="rounded-[6px] border border-line bg-white p-1 text-ink-3 shadow-sm hover:bg-inset"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
          >
            <DotsThree size={16} weight="bold" />
          </button>
          {menuOpen && (
            <div className="ha-menu absolute right-0 z-20 mt-1 w-44 py-1">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-ink-2 hover:bg-inset"
                onClick={() => {
                  setMenuOpen(false)
                  setRenaming(true)
                }}
              >
                <PencilSimple size={14} />
                Rename
              </button>
            </div>
          )}
        </div>
      </div>
      {renaming && (
        <NameDialog
          title="Rename plan"
          label="Plan name"
          initial={plan.name}
          confirmLabel="Save"
          onClose={() => setRenaming(false)}
          onSubmit={(name) => {
            renamePlan(plan.id, name)
            setRenaming(false)
          }}
        />
      )}
    </>
  )
}
