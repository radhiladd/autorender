import { Plus } from '@phosphor-icons/react'
import { Navigate, useParams } from 'react-router-dom'
import { RenderCard } from '../components/RenderCard'
import { useLibrary } from '../store/library'

export function FolderPage() {
  const { planId, folderId } = useParams()
  const { state, createSession } = useLibrary()
  const plan = state.plans.find((p) => p.id === planId)
  const folder = state.folders.find((f) => f.id === folderId && f.planId === planId)

  if (!plan || !folder) return <Navigate to="/autorender" replace />

  const stills = state.renders
    .filter((r) => r.folderId === folder.id)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="px-6 pt-2 pb-5">
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold tracking-[-0.1px] text-[#111827]">{folder.name}</h2>
        <p className="mt-1 text-[13px] text-ink-3">
          Filed renders from {plan.name}. Move one back to Unfiled to return it to its session stack.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => createSession(plan.name, plan.id, folder.id)}
          className="group text-left"
        >
          <div className="still flex aspect-[4/3] w-full flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-inset text-ink-3 transition group-hover:border-ink-4 group-hover:bg-paper group-hover:text-ink-2">
            <Plus size={22} />
            <span className="mt-2 text-[13px] font-medium">New render</span>
          </div>
          <div className="mt-2 min-w-0">
            <div className="truncate text-[13px] font-medium text-ink-2">Add a render</div>
            <div className="truncate text-[12px] text-ink-4">Generate for {plan.name}</div>
          </div>
        </button>
        {stills.map((render) => (
          <RenderCard key={render.id} render={render} />
        ))}
      </div>
    </div>
  )
}
