import { useState } from 'react'
import { Modal } from './Modal'

export function NameDialog({
  title,
  label,
  initial,
  confirmLabel,
  onClose,
  onSubmit,
}: {
  title: string
  label: string
  initial: string
  confirmLabel: string
  onClose: () => void
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState(initial)

  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          onSubmit(name.trim())
        }}
      >
        <label className="block text-[13px] text-ink-2">
          {label}
          <input
            autoFocus
            className="mt-1 h-8 w-full rounded-[6px] border border-line-strong bg-white px-3 text-[13px] text-ink focus:outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="h-8 px-3 text-[13px] text-ink-3 hover:text-ink" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="h-8 rounded-[6px] bg-lawn px-3 text-[12px] font-medium text-white disabled:opacity-40 hover:bg-lawn-hover"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}
