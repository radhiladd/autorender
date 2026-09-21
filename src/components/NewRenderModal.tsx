import { useState } from 'react'
import { useLibrary } from '../store/library'
import { Modal } from './Modal'

export function NewRenderModal({
  presetPlanId,
  onClose,
  onCreated,
}: {
  presetPlanId?: string
  onClose: () => void
  onCreated: (planId: string) => void
}) {
  const { state, createSession } = useLibrary()
  const [mode, setMode] = useState<'existing' | 'new'>(presetPlanId ? 'existing' : 'existing')
  const [planId, setPlanId] = useState(presetPlanId ?? state.plans[0]?.id ?? '')
  const [newName, setNewName] = useState('')

  const canSubmit = mode === 'existing' ? Boolean(planId) : newName.trim().length > 0

  return (
    <Modal title="New render" onClose={onClose}>
      <p className="mb-4 -mt-2 text-[13px] text-ink-3">
        Picks a master plan. The first render for a new plan creates its folder.
      </p>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={`h-8 flex-1 rounded-[6px] border px-3 text-[13px] font-medium ${
            mode === 'existing'
              ? 'border-line-strong bg-inset text-ink'
              : 'border-line bg-white text-ink-3'
          }`}
          onClick={() => setMode('existing')}
        >
          Existing plan
        </button>
        <button
          type="button"
          className={`h-8 flex-1 rounded-[6px] border px-3 text-[13px] font-medium ${
            mode === 'new'
              ? 'border-line-strong bg-inset text-ink'
              : 'border-line bg-white text-ink-3'
          }`}
          onClick={() => setMode('new')}
        >
          New master plan
        </button>
      </div>

      {mode === 'existing' ? (
        <label className="block text-[13px] text-ink-2">
          Plan
          <select
            className="mt-1 h-8 w-full rounded-[6px] border border-line-strong bg-white px-3 text-[13px] text-ink"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
          >
            {state.plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="block text-[13px] text-ink-2">
          Master plan name
          <input
            autoFocus
            className="mt-1 h-8 w-full rounded-[6px] border border-line-strong bg-white px-3 text-[13px] text-ink"
            placeholder="The Hanover"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </label>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          className="h-8 px-3 text-[13px] text-ink-3 hover:text-ink"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          className="h-8 rounded-[6px] bg-lawn px-3 text-[12px] font-medium text-white disabled:opacity-40 hover:bg-lawn-hover"
          onClick={() => {
            const id =
              mode === 'existing'
                ? createSession(
                    state.plans.find((p) => p.id === planId)?.name ?? '',
                    planId,
                  )
                : createSession(newName.trim())
            onCreated(id)
          }}
        >
          Generate renders
        </button>
      </div>
    </Modal>
  )
}
