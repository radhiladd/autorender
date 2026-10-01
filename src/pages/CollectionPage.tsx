import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@higharc/dcp-hds-staging/button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from '@higharc/dcp-hds-staging/dialog'
import { CollectionTable } from '../components/CollectionTable'
import { NameDialog } from '../components/NameDialog'
import { RenderGallery } from '../components/RenderGallery'
import { rendersInCollection } from '../lib/format'
import { useLibrary } from '../store/library'

export function CollectionPage() {
  const { collectionId } = useParams()
  const navigate = useNavigate()
  const { state, createCollection, renameCollection, deleteCollection } = useLibrary()
  const [dialog, setDialog] = useState<'rename' | 'child' | 'delete' | null>(null)
  const collection = state.collections.find((c) => c.id === collectionId)

  if (!collection) return <Navigate to="/autorender" replace />

  const children = state.collections.filter((c) => c.parentId === collection.id)
  const isGroup = !collection.parentId
  const renders = rendersInCollection(state.renders, state.collections, collection.id)
  const plans = state.plans.filter((p) => renders.some((r) => r.planId === p.id))
  const summary = [
    `${renders.length} ${renders.length === 1 ? 'render' : 'renders'}`,
    plans.length > 0 ? `from ${plans.map((p) => p.name).join(', ')}` : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="px-6 pt-2 pb-5">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold tracking-[-0.1px] text-[#111827]">
            {collection.name}
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">{summary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isGroup && (
            <Button size="sm" variant="outline" onClick={() => setDialog('child')}>
              New collection inside
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setDialog('rename')}>
            Rename
          </Button>
          <Button size="sm" variant="ghost-destructive" onClick={() => setDialog('delete')}>
            Delete
          </Button>
        </div>
      </div>

      {children.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.4px] text-ink-3">
            Collections
          </h3>
          <CollectionTable collections={children} />
        </section>
      )}

      <RenderGallery
        renders={renders}
        collectionId={collection.id}
        title={children.length > 0 ? 'All renders in this group' : 'Renders'}
        empty="No renders yet. Use “Add to collection” on any render to add it here."
      />

      {dialog === 'rename' && (
        <NameDialog
          title="Rename collection"
          label="Name"
          initial={collection.name}
          confirmLabel="Save"
          onClose={() => setDialog(null)}
          onSubmit={(name) => {
            renameCollection(collection.id, name)
            setDialog(null)
          }}
        />
      )}
      {dialog === 'child' && (
        <NameDialog
          title={`New collection in ${collection.name}`}
          label="Name"
          initial=""
          confirmLabel="Create"
          onClose={() => setDialog(null)}
          onSubmit={(name) => {
            const id = createCollection(name, collection.id)
            setDialog(null)
            navigate(`/autorender/collections/${id}`)
          }}
        />
      )}
      <Dialog open={dialog === 'delete'} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogOverlay>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>Delete collection?</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <DialogBody>
              <p className="text-[13px] leading-5 text-ink-2">
                “{collection.name}” will be removed. Its renders stay in their plans and sessions.
                {children.length > 0 &&
                  ` The ${children.length} ${children.length === 1 ? 'collection' : 'collections'} inside will move to the top level.`}
              </p>
            </DialogBody>
            <DialogFooter>
              <Button size="base" variant="ghost" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                size="base"
                variant="destructive"
                onClick={() => {
                  setDialog(null)
                  deleteCollection(collection.id)
                  navigate(
                    collection.parentId
                      ? `/autorender/collections/${collection.parentId}`
                      : '/autorender/renders',
                  )
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogOverlay>
      </Dialog>
    </div>
  )
}
