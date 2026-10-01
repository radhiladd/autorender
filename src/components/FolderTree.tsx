import {
  CaretRight,
  Cards,
  CardsThree,
  HouseLine,
  Images,
  Plus,
  SquaresFour,
  Stack,
  TrayArrowDown,
} from '@phosphor-icons/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, matchPath, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { rendersInCollection, sortPlansByActivity } from '../lib/format'
import { useLibrary } from '../store/library'
import { NameDialog } from './NameDialog'

const EXPANDED_KEY = 'autorender:treeExpanded'

function loadExpanded(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(EXPANDED_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function TreeRow({
  to,
  depth,
  icon,
  label,
  count,
  active,
  expandable,
  expanded,
  onToggle,
}: {
  to: string
  depth: number
  icon?: ReactNode
  label: string
  count?: number
  active: boolean
  expandable?: boolean
  expanded?: boolean
  onToggle?: () => void
}) {
  return (
    <div
      className={`group flex h-7 items-center rounded-[6px] pr-2 text-[13px] ${
        active ? 'bg-[#eff6ff] text-[#1d4ed8]' : 'text-ink-2 hover:bg-inset'
      }`}
      style={{ paddingLeft: 4 + depth * 14 }}
    >
      {expandable ? (
        <button
          type="button"
          aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
          aria-expanded={expanded}
          onClick={onToggle}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] text-ink-4 hover:text-ink-2"
        >
          <CaretRight
            size={10}
            weight="bold"
            className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </button>
      ) : (
        <span className="w-5 shrink-0" />
      )}
      <Link
        to={to}
        aria-current={active ? 'page' : undefined}
        className="flex min-w-0 flex-1 items-center gap-1.5"
      >
        {icon && (
          <span className={`shrink-0 ${active ? 'text-[#1d4ed8]' : 'text-ink-4'}`}>{icon}</span>
        )}
        <span className={`min-w-0 flex-1 truncate ${active ? 'font-medium' : ''}`} title={label}>
          {label}
        </span>
        {count != null && (
          <span className={`shrink-0 text-[11px] ${active ? 'text-[#1d4ed8]' : 'text-ink-4'}`}>
            {count}
          </span>
        )}
      </Link>
    </div>
  )
}

function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-1 mt-4 flex h-6 items-center justify-between pl-2 pr-1 text-[11px] font-medium uppercase tracking-[0.4px] text-ink-4">
      {children}
      {action}
    </div>
  )
}

function SectionAdd({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-5 w-5 items-center justify-center rounded-[4px] text-ink-4 hover:bg-inset hover:text-ink-2"
    >
      <Plus size={12} weight="bold" />
    </button>
  )
}

export function FolderTree({ onNewRender }: { onNewRender: () => void }) {
  const { state, createCollection } = useLibrary()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<Set<string>>(loadExpanded)
  const [creating, setCreating] = useState(false)

  const planMatch = matchPath('/autorender/plans/:planId', pathname)
  const collectionMatch = matchPath('/autorender/collections/:collectionId', pathname)
  const activePlanId = planMatch?.params.planId ?? null
  const activeCollectionId = collectionMatch?.params.collectionId ?? null
  const onRenders = pathname === '/autorender/renders'
  const uncollected = onRenders && params.get('filter') === 'uncollected'

  const activeParentId =
    state.collections.find((c) => c.id === activeCollectionId)?.parentId ?? null

  useEffect(() => {
    if (!activeParentId) return
    const key = `col:${activeParentId}`
    setExpanded((prev) => (prev.has(key) ? prev : new Set([...prev, key])))
  }, [activeParentId])

  useEffect(() => {
    try {
      localStorage.setItem(EXPANDED_KEY, JSON.stringify([...expanded]))
    } catch {
      /* ignore quota */
    }
  }, [expanded])

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const plans = sortPlansByActivity(state.plans, state.renders)
  const topCollections = state.collections.filter((c) => !c.parentId)
  const uncollectedCount = state.renders.filter((r) => r.collectionIds.length === 0).length
  const collectionCount = (id: string) =>
    rendersInCollection(state.renders, state.collections, id).length

  return (
    <nav
      aria-label="Library"
      className="ha-scroll w-[232px] shrink-0 border-r border-line px-2 py-3"
    >
      <TreeRow
        to="/autorender"
        depth={0}
        icon={<SquaresFour size={14} />}
        label="Overview"
        active={pathname === '/autorender'}
      />
      <TreeRow
        to="/autorender/renders"
        depth={0}
        icon={<Images size={14} />}
        label="All renders"
        count={state.renders.length}
        active={onRenders && !uncollected}
      />
      <TreeRow
        to="/autorender/sessions"
        depth={0}
        icon={<Stack size={14} />}
        label="All sessions"
        count={state.sessions.filter((s) => state.renders.some((r) => r.sessionId === s.id)).length}
        active={pathname === '/autorender/sessions'}
      />
      <TreeRow
        to="/autorender/renders?filter=uncollected"
        depth={0}
        icon={<TrayArrowDown size={14} />}
        label="Not in a collection"
        count={uncollectedCount}
        active={uncollected}
      />

      <SectionLabel action={<SectionAdd label="New render for a plan" onClick={onNewRender} />}>
        Plans
      </SectionLabel>
      <ul>
        {plans.map((plan) => (
          <li key={plan.id}>
            <TreeRow
              to={`/autorender/plans/${plan.id}`}
              depth={0}
              icon={<HouseLine size={14} />}
              label={plan.name}
              count={state.renders.filter((r) => r.planId === plan.id).length}
              active={plan.id === activePlanId}
            />
          </li>
        ))}
      </ul>

      <SectionLabel
        action={<SectionAdd label="New collection" onClick={() => setCreating(true)} />}
      >
        Collections
      </SectionLabel>
      {topCollections.length === 0 ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="w-full rounded-[6px] px-2 py-1.5 text-left text-[12px] text-ink-4 hover:bg-inset hover:text-ink-2"
        >
          Group renders from any plan for a campaign or listing.
        </button>
      ) : (
        <ul>
          {topCollections.map((collection) => {
            const key = `col:${collection.id}`
            const children = state.collections.filter((c) => c.parentId === collection.id)
            const isOpen = expanded.has(key)
            return (
              <li key={collection.id}>
                <TreeRow
                  to={`/autorender/collections/${collection.id}`}
                  depth={0}
                  icon={children.length > 0 ? <CardsThree size={14} /> : <Cards size={14} />}
                  label={collection.name}
                  count={collectionCount(collection.id)}
                  active={collection.id === activeCollectionId}
                  expandable={children.length > 0}
                  expanded={isOpen}
                  onToggle={() => toggle(key)}
                />
                {isOpen && children.length > 0 && (
                  <ul>
                    {children.map((child) => (
                      <li key={child.id}>
                        <TreeRow
                          to={`/autorender/collections/${child.id}`}
                          depth={1}
                          icon={<Cards size={14} />}
                          label={child.name}
                          count={collectionCount(child.id)}
                          active={child.id === activeCollectionId}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {creating && (
        <NameDialog
          title="New collection"
          label="Name"
          initial=""
          confirmLabel="Create"
          onClose={() => setCreating(false)}
          onSubmit={(name) => {
            const id = createCollection(name)
            setCreating(false)
            navigate(`/autorender/collections/${id}`)
          }}
        />
      )}
    </nav>
  )
}
