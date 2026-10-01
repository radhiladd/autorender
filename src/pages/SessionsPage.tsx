import { SessionStack } from '../components/SessionStack'
import { recentSessions } from '../lib/format'
import { useLibrary } from '../store/library'

export function SessionsPage() {
  const { state } = useLibrary()
  const sessions = recentSessions(state.sessions, state.renders, Infinity)

  return (
    <div className="px-6 pt-2 pb-5">
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold tracking-[-0.1px] text-[#111827]">All sessions</h2>
        <p className="mt-1 text-[13px] text-ink-3">
          Every render session across all plans, newest first.
        </p>
      </div>
      <section className="space-y-3">
        {sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong bg-inset px-4 py-10 text-center text-[13px] text-ink-3">
            No sessions yet.
          </div>
        ) : (
          sessions.map((session) => <SessionStack key={session.id} session={session} />)
        )}
      </section>
    </div>
  )
}
