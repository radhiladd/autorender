import {
  CaretLeft,
  Cards,
  Check,
  DotsThree,
  DownloadSimple,
  MinusCircle,
  PencilSimple,
  Plus,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { renderSrc } from '../lib/format'
import { useLibrary } from '../store/library'
import type { Render } from '../types'
import { NameDialog } from './NameDialog'

export function RenderCard({
  render,
  compact,
  collectionId,
}: {
  render: Render
  compact?: boolean
  collectionId?: string
}) {
  const { state, openLightbox, renameRender, setRenderInCollection, createCollection } =
    useLibrary()
  const [menuOpen, setMenuOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [creating, setCreating] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const current = state.collections.find((c) => c.id === collectionId)
  const pickerRows = state.collections
    .filter((c) => !c.parentId)
    .flatMap((c) => [
      { collection: c, nested: false },
      ...state.collections
        .filter((child) => child.parentId === c.id)
        .map((child) => ({ collection: child, nested: true })),
    ])

  const closeMenu = () => {
    setMenuOpen(false)
    setPicking(false)
  }

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (!menuRef.current?.contains(target) && !popupRef.current?.contains(target)) {
        setMenuOpen(false)
        setPicking(false)
      }
    }
    const close = () => {
      setMenuOpen(false)
      setPicking(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('resize', close)
    document.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('resize', close)
      document.removeEventListener('scroll', close, true)
    }
  }, [menuOpen])

  return (
    <>
      <article className={`group relative ${compact ? 'w-[196px] shrink-0' : ''}`}>
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
            {!render.downloadable && (
              <div className="truncate text-[12px] text-ink-4">Generating</div>
            )}
          </div>
        </button>
        <div
          className={`absolute top-2 right-2 transition-opacity group-hover:opacity-100 focus-within:opacity-100 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          ref={menuRef}
        >
          <button
            type="button"
            aria-label="Render actions"
            className="rounded-[6px] border border-line bg-white p-1 text-ink-3 shadow-sm hover:bg-inset"
            onClick={(e) => {
              e.stopPropagation()
              const rect = e.currentTarget.getBoundingClientRect()
              setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
              setMenuOpen((v) => !v)
              setPicking(false)
            }}
          >
            <DotsThree size={16} weight="bold" />
          </button>
          {menuOpen &&
            menuPos &&
            createPortal(
              <div
                ref={popupRef}
                onClick={(e) => e.stopPropagation()}
                className="ha-menu fixed z-50 w-56 py-1"
                style={{ top: menuPos.top, right: menuPos.right }}
              >
                {!picking ? (
                  <>
                    <MenuItem
                      icon={<PencilSimple size={14} />}
                      onClick={() => {
                        closeMenu()
                        setRenaming(true)
                      }}
                    >
                      Rename
                    </MenuItem>
                    <MenuItem icon={<Cards size={14} />} onClick={() => setPicking(true)}>
                      Add to collection
                    </MenuItem>
                    {current && (
                      <MenuItem
                        icon={<MinusCircle size={14} />}
                        onClick={() => {
                          setRenderInCollection(render.id, current.id, false)
                          closeMenu()
                        }}
                      >
                        <span className="truncate">Remove from {current.name}</span>
                      </MenuItem>
                    )}
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
                    <MenuItem icon={<CaretLeft size={12} />} onClick={() => setPicking(false)}>
                      <span className="text-[12px] text-ink-3">Add to collection</span>
                    </MenuItem>
                    <div className="my-1 border-t border-line" />
                    <div className="max-h-64 overflow-y-auto">
                      {pickerRows.map(({ collection, nested }) => {
                        const checked = render.collectionIds.includes(collection.id)
                        return (
                          <button
                            key={collection.id}
                            type="button"
                            role="menuitemcheckbox"
                            aria-checked={checked}
                            className={`flex w-full items-center gap-2 py-1.5 pr-3 text-left text-[13px] text-ink-2 hover:bg-inset ${nested ? 'pl-8' : 'pl-3'}`}
                            onClick={() =>
                              setRenderInCollection(render.id, collection.id, !checked)
                            }
                          >
                            <span
                              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border ${checked ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white'}`}
                            >
                              {checked && <Check size={10} weight="bold" />}
                            </span>
                            <span className="truncate">{collection.name}</span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="my-1 border-t border-line" />
                    <MenuItem
                      icon={<Plus size={14} />}
                      onClick={() => {
                        closeMenu()
                        setCreating(true)
                      }}
                    >
                      New collection…
                    </MenuItem>
                  </>
                )}
              </div>,
              document.body,
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
      {creating && (
        <NameDialog
          title="New collection"
          label="Name"
          initial=""
          confirmLabel="Create and add"
          onClose={() => setCreating(false)}
          onSubmit={(name) => {
            createCollection(name, null, [render.id])
            setCreating(false)
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
      className="flex w-full min-w-0 items-center gap-2 px-3 py-1.5 text-left text-[13px] text-ink-2 hover:bg-inset"
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  )
}
