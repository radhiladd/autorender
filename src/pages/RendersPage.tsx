import { useSearchParams } from 'react-router-dom'
import { RenderGallery } from '../components/RenderGallery'
import { useLibrary } from '../store/library'

export function RendersPage() {
  const { state } = useLibrary()
  const [params] = useSearchParams()
  const uncollected = params.get('filter') === 'uncollected'
  const renders = state.renders
    .filter((r) => !uncollected || r.collectionIds.length === 0)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="px-6 pt-2 pb-5">
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold tracking-[-0.1px] text-[#111827]">
          {uncollected ? 'Not in a collection' : 'All renders'}
        </h2>
        <p className="mt-1 text-[13px] text-ink-3">
          {uncollected
            ? 'Renders that haven’t been added to any collection yet. They’re still in their plan and session.'
            : 'Every render across all plans, newest first.'}
        </p>
      </div>
      <RenderGallery
        renders={renders}
        empty={uncollected ? 'Every render is in at least one collection.' : 'No renders yet.'}
      />
    </div>
  )
}
