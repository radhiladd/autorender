import { DotsThree, Folder } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { folderCover, formatRelative, lastFolderActivityIso, renderSrc } from '../lib/format'
import { useLibrary } from '../store/library'
import type { Folder as FolderType } from '../types'
import { NameDialog } from './NameDialog'
import type { FolderView } from './ViewToggle'

export const FOLDER_LIST_ROW =
  'grid grid-cols-[minmax(8rem,1fr)_5.5rem_7.5rem_8.5rem] items-center gap-x-4 px-3 pr-11'

export function FolderCard({
  folder,
  planId,
  layout = 'grid',
}: {
  folder: FolderType
  planId: string
  layout?: FolderView
}) {
  const { state, renameFolder, deleteFolder } = useLibrary()
  const count = state.renders.filter((r) => r.folderId === folder.id).length
  const subfolders = state.folders.filter((f) => f.parentId === folder.id).length
  const cover = folderCover(state.renders, folder.id)
  const activity = lastFolderActivityIso(state.renders, folder.id)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const menu = (
    <div className="absolute top-1/2 right-2 -translate-y-1/2" ref={menuRef}>
      <button
        type="button"
        aria-label="Folder actions"
        className="rounded-[6px] border border-line bg-white p-1 text-ink-3 shadow-sm hover:bg-inset"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setMenuOpen((v) => !v)
        }}
      >
        <DotsThree size={16} weight="bold" />
      </button>
      {menuOpen && (
        <div className="ha-menu absolute right-0 z-20 mt-1 w-40 py-1">
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-[13px] text-ink-2 hover:bg-inset"
            onClick={() => {
              setMenuOpen(false)
              setRenaming(true)
            }}
          >
            Rename
          </button>
          <button
            type="button"
            disabled={count > 0}
            className="block w-full px-3 py-1.5 text-left text-[13px] text-ink-2 hover:bg-inset disabled:text-ink-4 disabled:hover:bg-transparent"
            title={count > 0 ? 'Move renders out before deleting' : undefined}
            onClick={() => {
              deleteFolder(folder.id)
              setMenuOpen(false)
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className={`group relative ${menuOpen ? 'z-30' : ''}`}>
        {layout === 'list' ? (
          <Link
            to={`/autorender/plans/${planId}/folders/${folder.id}`}
            className={`${FOLDER_LIST_ROW} h-10 text-[13px] hover:bg-inset`}
          >
            <div className="truncate font-medium text-ink-2">{folder.name}</div>
            <div className="tabular-nums text-ink-3">{count}</div>
            <div className="tabular-nums text-ink-3">{subfolders}</div>
            <div className="truncate text-ink-3">{activity ? formatRelative(activity) : '—'}</div>
          </Link>
        ) : (
          <Link
            to={`/autorender/plans/${planId}/folders/${folder.id}`}
            className="flex gap-3 rounded-lg border border-line bg-white p-2 hover:border-line-strong hover:bg-inset"
          >
            <div className="still h-[64px] w-[88px] shrink-0 overflow-hidden rounded-[6px]">
              {cover ? (
                <img src={renderSrc(cover.image)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-inset text-ink-4">
                  <Folder size={22} />
                </div>
              )}
            </div>
            <div className="min-w-0 py-1 pr-8">
              <div className="truncate text-[14px] font-medium text-ink-2">{folder.name}</div>
              <div className="mt-0.5 text-[12px] text-ink-4">
                {count} {count === 1 ? 'render' : 'renders'}
              </div>
            </div>
          </Link>
        )}
        {menu}
      </div>
      {renaming && (
        <NameDialog
          title="Rename folder"
          label="Folder name"
          initial={folder.name}
          confirmLabel="Save"
          onClose={() => setRenaming(false)}
          onSubmit={(name) => {
            renameFolder(folder.id, name)
            setRenaming(false)
          }}
        />
      )}
    </>
  )
}
