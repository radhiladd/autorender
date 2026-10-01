import { DownloadSimple } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { formatSessionDateTime, personName, renderSrc, sessionNumbers } from '../lib/format'
import { useLibrary } from '../store/library'
import type { Render, Session } from '../types'
import { inputChips, useSessionView } from './SessionStack'

const ROW =
  'grid grid-cols-[minmax(12rem,1.4fr)_5.5rem_6.5rem_minmax(8rem,1fr)_6rem_minmax(10rem,1.6fr)_6.5rem_9rem_1.75rem] items-center gap-x-4 px-3'

function RenderRow({
  render,
  session,
  sessionNumber,
}: {
  render: Render
  session: Session
  sessionNumber: number
}) {
  const { openLightbox } = useLibrary()
  const view = useSessionView(session)
  const inputs = inputChips(view).map((chip) => chip.label)
  const prompt = render.prompt ?? view.prompt

  return (
    <div className={`${ROW} py-2 text-[12px] text-ink-2 hover:bg-inset`}>
      <button
        type="button"
        onClick={() => openLightbox(render.id)}
        className="flex min-w-0 items-center gap-3 text-left"
      >
        <img
          src={renderSrc(render.image)}
          alt=""
          className={`h-10 w-14 shrink-0 rounded-[4px] border border-line object-cover ${render.downloadable ? '' : 'opacity-70'}`}
        />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-ink-2" title={render.name}>
            {render.name}
          </span>
          {!render.downloadable && <span className="block text-[11px] text-ink-4">Generating</span>}
        </span>
      </button>
      <Link
        to={`/autorender/plans/${session.planId}?tab=sessions&session=${session.id}`}
        className="truncate text-[#1d4ed8] hover:underline"
      >
        Session {sessionNumber}
      </Link>
      <div className="truncate">{view.planName}</div>
      <div className="min-w-0" title={view.options.join('\n') || undefined}>
        <div className="truncate">{view.elevation ?? '—'}</div>
        <div className="truncate text-[11px] text-ink-4">
          {view.optionCount === 0
            ? 'Default options'
            : `${view.optionCount} ${view.optionCount === 1 ? 'option' : 'options'} changed`}
        </div>
      </div>
      <div className="truncate">{view.styleName}</div>
      <div className="min-w-0" title={[inputs.join(' · '), prompt].filter(Boolean).join('\n')}>
        <div className="truncate">{inputs.join(' · ')}</div>
        {prompt && <div className="truncate text-[11px] italic text-ink-4">“{prompt}”</div>}
      </div>
      <div className="truncate">{personName(session.createdBy)}</div>
      <div className="truncate text-ink-3">{formatSessionDateTime(render.createdAt)}</div>
      {render.downloadable ? (
        <a
          href={renderSrc(render.image)}
          download={`${render.name}.jpg`}
          aria-label={`Download ${render.name}`}
          title="Download"
          className="flex h-7 w-7 items-center justify-center rounded-[6px] text-ink-3 hover:bg-white hover:text-ink"
        >
          <DownloadSimple size={14} />
        </a>
      ) : (
        <span />
      )}
    </div>
  )
}

export function RenderListView({ renders }: { renders: Render[] }) {
  const { state } = useLibrary()
  const numbers = sessionNumbers(state.sessions)

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <div className="min-w-[1200px]">
        <div
          className={`${ROW} h-8 border-b border-line bg-inset text-[11px] font-medium uppercase tracking-[0.4px] text-ink-3`}
        >
          <div>Render</div>
          <div>Session</div>
          <div>Plan</div>
          <div>Configuration</div>
          <div>Style</div>
          <div>Inputs</div>
          <div>Created by</div>
          <div>Date</div>
          <div />
        </div>
        <div className="divide-y divide-line">
          {renders.map((render) => {
            const session = state.sessions.find((s) => s.id === render.sessionId)
            if (!session) return null
            return (
              <RenderRow
                key={render.id}
                render={render}
                session={session}
                sessionNumber={numbers.get(session.id) ?? 1}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
