import { MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PlanCard } from '../components/PlanCard'
import { RecentsRail } from '../components/RecentsRail'
import { RenderCard } from '../components/RenderCard'
import { FOLDER_LIST_ROW } from '../components/FolderCard'
import { ViewToggle, type FolderView } from '../components/ViewToggle'
import { matchesQuery, sortPlansByActivity } from '../lib/format'
import { useLibrary } from '../store/library'

const VIEW_KEY = 'autorender:planFoldersView'

function loadView(): FolderView {
  try {
    return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'list'
  } catch {
    return 'list'
  }
}

export function LibraryHome() {
  const { state } = useLibrary()
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const searching = q.trim().length > 0
  const [view, setView] = useState<FolderView>(loadView)

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      /* ignore quota */
    }
  }, [view])

  const plans = sortPlansByActivity(state.plans, state.renders).filter((p) =>
    matchesQuery(q, p.name),
  )
  const renders = state.renders.filter((r) => {
    const plan = state.plans.find((p) => p.id === r.planId)
    const session = state.sessions.find((s) => s.id === r.sessionId)
    return matchesQuery(q, r.name, plan?.name, session?.styleLabel, session?.createdAt)
  })

  const planGrid =
    view === 'list' ? (
      <div className="rounded-lg border border-line">
        <div
          className={`${FOLDER_LIST_ROW} h-8 border-b border-line bg-inset text-[11px] font-medium uppercase tracking-[0.4px] text-ink-3`}
        >
          <div>Name</div>
          <div>Renders</div>
          <div>Subfolders</div>
          <div>Last edited</div>
        </div>
        <div className="divide-y divide-line">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} layout="list" />
          ))}
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} layout="grid" />
        ))}
      </div>
    )

  if (searching) {
    return (
      <div className="px-6 py-5">
        <p className="mb-5 text-[13px] text-ink-3">Results for “{q.trim()}”</p>
        {plans.length === 0 && renders.length === 0 && (
          <div className="rounded-lg border border-dashed border-line-strong bg-inset px-6 py-16 text-center">
            <MagnifyingGlass size={24} className="mx-auto text-ink-4" />
            <p className="mt-3 text-[14px] text-ink-2">Nothing matches that search.</p>
          </div>
        )}
        {plans.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-medium text-ink-2">Plan Folders</h2>
              <ViewToggle value={view} onChange={setView} label="Plan folder layout" />
            </div>
            {planGrid}
          </section>
        )}
        {renders.length > 0 && (
          <section>
            <h2 className="mb-3 text-[14px] font-medium text-ink-2">Renders</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {renders.map((render) => (
                <RenderCard key={render.id} render={render} />
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 px-6 py-5">
      <RecentsRail />
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-medium text-ink-2">Plan Folders</h2>
          <ViewToggle value={view} onChange={setView} label="Plan folder layout" />
        </div>
        {planGrid}
      </section>
    </div>
  )
}
