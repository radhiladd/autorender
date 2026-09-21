import { Plus } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { FolderCard, FOLDER_LIST_ROW } from '../components/FolderCard'
import { NameDialog } from '../components/NameDialog'
import { SessionStack } from '../components/SessionStack'
import { ViewToggle, type FolderView } from '../components/ViewToggle'
import { foldersForPlan, sessionsForPlan, unfiledInSession } from '../lib/format'
import { useLibrary } from '../store/library'

const VIEW_KEY = 'autorender:innerFoldersView'

function loadView(): FolderView {
  try {
    return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'list'
  } catch {
    return 'list'
  }
}

export function PlanPage() {
  const { planId } = useParams()
  const { state, createFolder } = useLibrary()
  const [newFolder, setNewFolder] = useState(false)
  const [view, setView] = useState<FolderView>(loadView)
  const plan = state.plans.find((p) => p.id === planId)

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      /* ignore quota */
    }
  }, [view])

  if (!planId || !plan) return <Navigate to="/autorender" replace />

  const folders = foldersForPlan(state.folders, plan.id)
  const sessions = sessionsForPlan(state.sessions, plan.id)
  const visibleSessions = sessions.filter((s) => unfiledInSession(state.renders, s.id).length > 0)

  return (
    <div className="px-6 pt-2 pb-5">
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold tracking-[-0.1px] text-[#111827]">{plan.name}</h2>
        <p className="mt-1 text-[13px] text-ink-3">
          File renders into folders, or leave them on the session they were generated in.
        </p>
      </div>

      <section className="mb-8">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.4px] text-ink-3">Folders</h3>
          <div className="flex items-center gap-2">
            {folders.length > 0 && (
              <ViewToggle value={view} onChange={setView} label="Folder layout" />
            )}
            <button
              type="button"
              onClick={() => setNewFolder(true)}
              className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-line-strong bg-white px-2.5 text-[11px] font-medium text-ink-2 hover:bg-inset"
            >
              <Plus size={10} weight="bold" />
              New folder
            </button>
          </div>
        </div>
        {folders.length === 0 ? (
          <button
            type="button"
            onClick={() => setNewFolder(true)}
            className="w-full rounded-lg border border-dashed border-line-strong bg-inset px-4 py-8 text-[13px] text-ink-3 hover:bg-paper"
          >
            No folders yet. Create one for a campaign, elevation, or listing set.
          </button>
        ) : view === 'list' ? (
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
              {folders.map((folder) => (
                <FolderCard key={folder.id} folder={folder} planId={plan.id} layout="list" />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <FolderCard key={folder.id} folder={folder} planId={plan.id} layout="grid" />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.4px] text-ink-3">Sessions</h3>
        {visibleSessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong bg-inset px-4 py-10 text-center text-[13px] text-ink-3">
            All renders from this plan are filed in folders.
          </div>
        ) : (
          visibleSessions.map((session) => <SessionStack key={session.id} session={session} />)
        )}
      </section>

      {newFolder && (
        <NameDialog
          title="New folder"
          label="Folder name"
          initial=""
          confirmLabel="Create"
          onClose={() => setNewFolder(false)}
          onSubmit={(name) => {
            createFolder(plan.id, name)
            setNewFolder(false)
          }}
        />
      )}
    </div>
  )
}
