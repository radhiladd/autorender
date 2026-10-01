import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  formatSessionDateTime,
  personName,
  recentSessions,
  rendersForSession,
  renderSrc,
} from '../lib/format'
import { useLibrary } from '../store/library'
import type { Session } from '../types'
import { useSessionView } from './SessionStack'

export function RecentsRail() {
  const { state } = useLibrary()
  const items = recentSessions(state.sessions, state.renders, 8)

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[14px] font-medium text-ink-2">Recent sessions</h2>
        <Link to="/autorender/sessions" className="text-[12px] text-[#1d4ed8] hover:underline">
          View all sessions
        </Link>
      </div>
      <div className="film-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {items.map((session) => (
          <SessionPreviewCard key={session.id} session={session} />
        ))}
      </div>
    </section>
  )
}

function SessionPreviewCard({ session }: { session: Session }) {
  const { state, openLightbox } = useLibrary()
  const photos = rendersForSession(state.renders, session.id)
  const [index, setIndex] = useState(0)
  const current = photos[index] ?? photos[0]
  const plan = state.plans.find((p) => p.id === session.planId)
  const count = photos.length
  const author = personName(session.createdBy)
  const view = useSessionView(session)
  const options =
    view.optionCount === 0
      ? 'Default options'
      : `${view.optionCount} ${view.optionCount === 1 ? 'option' : 'options'}`

  if (!current) return null

  function go(delta: number, e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (count === 0) return
    setIndex((i) => (i + delta + count) % count)
  }

  return (
    <article className="w-[220px] shrink-0">
      <div className="still ha-card group relative aspect-[4/3] overflow-hidden">
        <button
          type="button"
          className="block h-full w-full"
          onClick={() => openLightbox(current.id)}
          aria-label={`Open ${current.name}`}
        >
          <img src={renderSrc(current.image)} alt="" className="h-full w-full object-cover" />
        </button>
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous render"
              className="absolute left-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-2 shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => go(-1, e)}
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <button
              type="button"
              aria-label="Next render"
              className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-2 shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => go(1, e)}
            >
              <CaretRight size={14} weight="bold" />
            </button>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  aria-label={`Render ${i + 1} of ${count}`}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: i === index ? '#ffffff' : 'rgb(255 255 255 / 0.45)' }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIndex(i)
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="mt-2 min-w-0">
        <div className="truncate text-[13px] font-medium text-ink-2">{plan?.name}</div>
        <div className="truncate text-[12px] text-ink-3">
          {options} · {view.styleName}
        </div>
        <div className="truncate text-[12px] text-ink-4">
          {count} {count === 1 ? 'render' : 'renders'} · {author}
        </div>
        <div className="truncate text-[12px] text-ink-4">
          {formatSessionDateTime(session.createdAt)}
        </div>
      </div>
    </article>
  )
}
