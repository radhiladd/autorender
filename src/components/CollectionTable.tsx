import { CaretRight, Cards, CardsThree } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatRelative, renderSrc, rendersInCollection } from '../lib/format'
import { useLibrary } from '../store/library'
import type { Collection } from '../types'

const ROW = 'grid grid-cols-[minmax(10rem,1fr)_5.5rem_5.5rem_8.5rem] items-center gap-x-4 px-3'

function CollectionRow({
  collection,
  nested = false,
  expanded,
  onToggle,
}: {
  collection: Collection
  nested?: boolean
  expanded?: boolean
  onToggle?: () => void
}) {
  const { state } = useLibrary()
  const renders = rendersInCollection(state.renders, state.collections, collection.id)
  const children = state.collections.filter((c) => c.parentId === collection.id)
  const plans = new Set(renders.map((r) => r.planId)).size
  const cover = renders[0]
  const expandable = !nested && children.length > 0

  return (
    <div className={`${ROW} h-11 text-[13px] hover:bg-inset`}>
      <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: nested ? 28 : 0 }}>
        {expandable ? (
          <button
            type="button"
            aria-label={expanded ? `Collapse ${collection.name}` : `Expand ${collection.name}`}
            aria-expanded={expanded}
            onClick={onToggle}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] text-ink-4 hover:bg-white hover:text-ink-2"
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
          to={`/autorender/collections/${collection.id}`}
          className="flex min-w-0 flex-1 items-center gap-2.5"
        >
          <span className="still flex h-7 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-line bg-inset text-ink-4">
            {cover ? (
              <img src={renderSrc(cover.image)} alt="" className="h-full w-full object-cover" />
            ) : children.length > 0 ? (
              <CardsThree size={14} />
            ) : (
              <Cards size={14} />
            )}
          </span>
          <span className="truncate font-medium text-ink-2 hover:underline">{collection.name}</span>
          {expandable && (
            <span className="shrink-0 text-[12px] text-ink-4">
              {children.length} {children.length === 1 ? 'collection' : 'collections'}
            </span>
          )}
        </Link>
      </div>
      <div className="text-ink-3">{renders.length}</div>
      <div className="text-ink-3">{plans}</div>
      <div className="truncate text-ink-3">{cover ? formatRelative(cover.createdAt) : '—'}</div>
    </div>
  )
}

export function CollectionTable({ collections }: { collections: Collection[] }) {
  const { state } = useLibrary()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="rounded-lg border border-line">
      <div
        className={`${ROW} h-8 border-b border-line bg-inset text-[11px] font-medium uppercase tracking-[0.4px] text-ink-3`}
      >
        <div className="pl-7">Name</div>
        <div>Renders</div>
        <div>Plans</div>
        <div>Last added</div>
      </div>
      <div className="divide-y divide-line">
        {collections.map((collection) => {
          const isOpen = expanded.has(collection.id)
          const children = state.collections.filter((c) => c.parentId === collection.id)
          return (
            <div key={collection.id} className="divide-y divide-line">
              <CollectionRow
                collection={collection}
                expanded={isOpen}
                onToggle={() => toggle(collection.id)}
              />
              {isOpen &&
                children.map((child) => <CollectionRow key={child.id} collection={child} nested />)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
