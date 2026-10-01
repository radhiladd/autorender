import { useEffect, useState, type ReactNode } from 'react'
import type { Render } from '../types'
import { RenderCard } from './RenderCard'
import { RenderListView } from './RenderListView'
import { ViewToggle, type FolderView } from './ViewToggle'

const VIEW_KEY = 'autorender:planImagesView'

function loadView(): FolderView {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

export function RenderGallery({
  renders,
  title = 'Renders',
  empty,
  collectionId,
}: {
  renders: Render[]
  title?: string
  empty: ReactNode
  collectionId?: string
}) {
  const [view, setView] = useState<FolderView>(loadView)

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      /* ignore quota */
    }
  }, [view])

  return (
    <section>
      <div className="mb-2 flex h-7 items-center justify-between gap-3">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.4px] text-ink-3">
          {title} <span className="text-ink-4">({renders.length})</span>
        </h3>
        {renders.length > 0 && <ViewToggle value={view} onChange={setView} label="Render layout" />}
      </div>
      {renders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-inset px-4 py-10 text-center text-[13px] text-ink-3">
          {empty}
        </div>
      ) : view === 'list' ? (
        <RenderListView renders={renders} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {renders.map((render) => (
            <RenderCard
              key={render.id}
              render={render}
              collectionId={
                collectionId && render.collectionIds.includes(collectionId)
                  ? collectionId
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  )
}
