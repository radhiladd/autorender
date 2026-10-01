import { useEffect } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@higharc/dcp-hds-staging/tabs'
import { RenderGallery } from '../components/RenderGallery'
import { SessionStack } from '../components/SessionStack'
import { sessionsForPlan } from '../lib/format'
import { useLibrary } from '../store/library'

export function PlanPage() {
  const { planId } = useParams()
  const { state } = useLibrary()
  const [searchParams, setSearchParams] = useSearchParams()
  const plan = state.plans.find((p) => p.id === planId)

  const focusSessionId = searchParams.get('session')
  useEffect(() => {
    if (!focusSessionId) return
    const scroll = window.setTimeout(() => {
      document
        .getElementById(`session-${focusSessionId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
    const timer = window.setTimeout(() => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.delete('session')
          return next
        },
        { replace: true },
      )
    }, 2500)
    return () => {
      window.clearTimeout(scroll)
      window.clearTimeout(timer)
    }
  }, [focusSessionId, setSearchParams])

  if (!planId || !plan) return <Navigate to="/autorender" replace />

  const sessions = sessionsForPlan(state.sessions, plan.id)
  const renders = state.renders
    .filter((r) => r.planId === plan.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const tab = searchParams.get('tab') === 'sessions' ? 'sessions' : 'renders'

  return (
    <div className="px-6 pt-2 pb-5">
      <div className="mb-4">
        <h2 className="text-[18px] font-semibold tracking-[-0.1px] text-[#111827]">{plan.name}</h2>
        <p className="mt-1 text-[13px] text-ink-3">
          Every render generated for this plan. Add renders to folders to group them for a campaign
          or listing.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(next) => {
          const params = new URLSearchParams(searchParams)
          if (next === 'sessions') params.set('tab', 'sessions')
          else params.delete('tab')
          setSearchParams(params, { replace: true })
        }}
        variant="underline"
        size="sm"
      >
        <TabsList className="mb-5">
          <TabsTrigger value="renders">Renders ({renders.length})</TabsTrigger>
          <TabsTrigger value="sessions">Sessions ({sessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="renders" className="pt-0">
          <RenderGallery renders={renders} empty="No renders for this plan yet." />
        </TabsContent>

        <TabsContent value="sessions" className="pt-0">
          <section className="space-y-3">
            {sessions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line-strong bg-inset px-4 py-10 text-center text-[13px] text-ink-3">
                No sessions for this plan yet.
              </div>
            ) : (
              sessions.map((session) => (
                <SessionStack
                  key={session.id}
                  session={session}
                  highlighted={session.id === focusSessionId}
                />
              ))
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
