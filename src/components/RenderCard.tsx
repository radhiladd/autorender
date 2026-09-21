import { DotsThree, DownloadSimple, FolderSimple, PencilSimple } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { renderSrc } from '../lib/format'
import { useLibrary } from '../store/library'
import type { Render } from '../types'
import { NameDialog } from './NameDialog'

export function RenderCard({
  render,
  compact,
}: {
  render: Render
  compact?: boolean
}) {
  const { state, openLightbox, renameRender, moveRender } = useLibrary()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moving, setMoving] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const folders = state.folders.filter((f) => f.planId === render.planId)

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false)
        setMoving(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  return (
    <>
      <article className={`group relative ${compact ? 'w-36 shrink-0' : ''}`}>
        <button
          type="button"
          onClick={() => openLightbox(render.id)}
          className="block w-full text-left"
        >
          <div
            className={`still relative overflow-hidden rounded-lg border border-line ${compact ? 'aspect-[5/4]' : 'aspect-[4/3]'}`}
          >
            <img
              src={renderSrc(render.image)}
              alt=""
              className={`h-full w-full object-cover ${render.downloadable ? '' : 'opacity-70'}`}
            />
            {!render.downloadable && (
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#171717]/70 via-transparent to-transparent">
                <span className="m-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-ink-2">
                  Generating
                </span>
              </div>
            )}
          </div>
          <div className="mt-2 min-w-0">
            <div className="truncate text-[13px] font-medium text-ink-2">{render.name}</div>
            <div className="truncate text-[12px] text-ink-4">
              {render.downloadable ? 'Ready' : 'Generating'}
            </div>
          </div>
        </button>
        <div className="absolute top-2 right-2" ref={menuRef}>
          <button
            type="button"
            aria-label="Render actions"
            className="rounded-[6px] border border-line bg-white p-1 text-ink-3 shadow-sm hover:bg-inset"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
              setMoving(false)
            }}
          >
            <DotsThree size={16} weight="bold" />
          </button>
          {menuOpen && (
            <div className="ha-menu absolute right-0 z-20 mt-1 w-48 py-1">
              {!moving ? (
                <>
                  <MenuItem
                    icon={<PencilSimple size={14} />}
                    onClick={() => {
                      setMenuOpen(false)
                      setRenaming(true)
                    }}
                  >
                    Rename
                  </MenuItem>
                  <MenuItem
                    icon={<FolderSimple size={14} />}
                    onClick={() => setMoving(true)}
                  >
                    Move to folder
                  </MenuItem>
                  {render.downloadable ? (
                    <a
                      href={renderSrc(render.image)}
                      download={`${render.name}.jpg`}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] text-ink-2 hover:bg-inset"
                    >
                      <DownloadSimple size={14} />
                      Download
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-ink-4">
                      <DownloadSimple size={14} />
                      Download
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.4px] text-ink-4">
                    File in
                  </div>
                  <MenuItem
                    onClick={() => {
                      moveRender(render.id, null)
                      setMenuOpen(false)
                      setMoving(false)
                    }}
                  >
                    Unfiled (session stack)
                  </MenuItem>
                  {folders.map((f) => (
                    <MenuItem
                      key={f.id}
                      onClick={() => {
                        moveRender(render.id, f.id)
                        setMenuOpen(false)
                        setMoving(false)
                      }}
                    >
                      {f.name}
                      {render.folderId === f.id ? ' · here' : ''}
                    </MenuItem>
                  ))}
                  {folders.length === 0 && (
                    <div className="px-3 py-2 text-[12px] text-ink-4">No folders in this plan yet</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </article>
      {renaming && (
        <NameDialog
          title="Rename render"
          label="Name"
          initial={render.name}
          confirmLabel="Save"
          onClose={() => setRenaming(false)}
          onSubmit={(name) => {
            renameRender(render.id, name)
            setRenaming(false)
          }}
        />
      )}
    </>
  )
}

function MenuItem({
  children,
  onClick,
  icon,
}: {
  children: ReactNode
  onClick: () => void
  icon?: ReactNode
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-ink-2 hover:bg-inset"
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  )
}
