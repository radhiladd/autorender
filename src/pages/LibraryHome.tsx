import { MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@higharc/dcp-hds-staging/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@higharc/dcp-hds-staging/tabs'
import { PLAN_LIST_ROW, PlanCard } from '../components/PlanCard'
import { CollectionTable } from '../components/CollectionTable'
import { NameDialog } from '../components/NameDialog'
import { RecentsRail } from '../components/RecentsRail'
import { RenderCard } from '../components/RenderCard'
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
  const { state, createCollection } = useLibrary()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [creating, setCreating] = useState(false)
  const tab = params.get('tab') === 'collections' ? 'collections' : 'plans'
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

  const collections = state.collections.filter((c) => !c.parentId)

  const planGrid =
    view === 'list' ? (
      <div className="rounded-lg border border-line">
        <div
          className={`${PLAN_LIST_ROW} h-8 border-b border-line bg-inset text-[11px] font-medium uppercase tracking-[0.4px] text-ink-3`}
        >
          <div>Name</div>
          <div>Renders</div>
          <div>Sessions</div>
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
              <h2 className="text-[14px] font-medium text-ink-2">Plans</h2>
              <ViewToggle value={view} onChange={setView} label="Plan layout" />
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
      <Tabs
        value={tab}
        onValueChange={(next) => {
          const nextParams = new URLSearchParams(params)
          if (next === 'collections') nextParams.set('tab', 'collections')
          else nextParams.delete('tab')
          setParams(nextParams, { replace: true })
        }}
        variant="underline"
        size="sm"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="plans">Plans ({plans.length})</TabsTrigger>
            <TabsTrigger value="collections">Collections ({collections.length})</TabsTrigger>
          </TabsList>
          {tab === 'plans' ? (
            <ViewToggle value={view} onChange={setView} label="Plan layout" />
          ) : (
            <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
              New collection
            </Button>
          )}
        </div>
        <TabsContent value="plans" className="pt-0">
          {planGrid}
        </TabsContent>
        <TabsContent value="collections" className="pt-0">
          {collections.length === 0 ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="w-full rounded-lg border border-dashed border-line-strong bg-inset px-4 py-10 text-center text-[13px] text-ink-3 hover:bg-paper"
            >
              No collections yet. Group renders from any plan for a campaign or listing.
            </button>
          ) : (
            <CollectionTable collections={collections} />
          )}
        </TabsContent>
      </Tabs>
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
    </div>
  )
}
