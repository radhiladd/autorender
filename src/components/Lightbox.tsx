import { DownloadSimple, FolderSimple, X } from '@phosphor-icons/react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatSessionDate, renderSrc } from '../lib/format'
import { useLibrary } from '../store/library'

export function Lightbox() {
  const { state, selectedRender, closeLightbox } = useLibrary()

  useEffect(() => {
    if (!selectedRender) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedRender, closeLightbox])

  if (!selectedRender) return null

  const plan = state.plans.find((p) => p.id === selectedRender.planId)
  const session = state.sessions.find((s) => s.id === selectedRender.sessionId)
  const folder = state.folders.find((f) => f.id === selectedRender.folderId)

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Close render"
        className="absolute inset-0 bg-[#171717]/72"
        onClick={closeLightbox}
      />
      <div className="relative z-10 w-full max-w-4xl">
        <div className="overflow-hidden rounded-lg bg-[#171717] shadow-[0_40px_80px_-24px_rgb(0_0_0_/_0.6)]">
          <img
            src={renderSrc(selectedRender.image)}
            alt={selectedRender.name}
            className="max-h-[72vh] w-full bg-[#171717] object-contain"
          />
        </div>
        <div className="mt-3 flex items-start justify-between gap-4 text-white">
          <div>
            <div className="text-[18px] font-semibold tracking-[-0.1px]">{selectedRender.name}</div>
            <div className="mt-1 text-[13px] text-white/70">
              {plan?.name}
              {session ? ` · ${formatSessionDate(session.createdAt)} · ${session.styleLabel}` : ''}
              {folder ? ` · ${folder.name}` : ''}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {plan && (
              <Link
                to={`/autorender/plans/${plan.id}`}
                onClick={closeLightbox}
                className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-white/12 px-3 text-[13px] hover:bg-white/18"
              >
                <FolderSimple size={16} />
                Open plan
              </Link>
            )}
            {selectedRender.downloadable && (
              <a
                href={renderSrc(selectedRender.image)}
                download={`${selectedRender.name}.jpg`}
                className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-white px-3 text-[12px] font-medium text-ink hover:bg-[#f5f5f5]"
              >
                <DownloadSimple size={16} />
                Download
              </a>
            )}
            <button
              type="button"
              onClick={closeLightbox}
              className="rounded-[6px] p-2 hover:bg-white/12"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
