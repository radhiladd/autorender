import {
  Bell,
  CaretRight,
  HouseSimple,
  MagnifyingGlass,
  Plus,
  Question,
  SquaresFour,
} from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { isAutorenderPath, NAV_ITEMS } from '../nav'
import { useLibrary } from '../store/library'
import { NewRenderModal } from './NewRenderModal'
import { StylesButton, StylesDialog } from './StylesDialog'

export function Shell({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const q = params.get('q') ?? ''
  const [draft, setDraft] = useState(q)
  const [newOpen, setNewOpen] = useState(false)
  const [stylesOpen, setStylesOpen] = useState(false)
  const autorender = isAutorenderPath(location.pathname)
  const planMatch = location.pathname.match(/^\/autorender\/plans\/([^/]+)/)
  const presetPlanId = planMatch?.[1]
  const onLibraryHome = location.pathname === '/autorender'
  const searchValue = onLibraryHome ? q : draft
  const activeId =
    NAV_ITEMS.find((item) =>
      item.id === 'autorender' ? autorender : location.pathname === item.path,
    )?.id ?? (autorender ? 'autorender' : undefined)

  return (
    <div className="flex h-full flex-col bg-[#f5f5f5]">
      <header
        className="flex shrink-0 items-center"
        style={{ height: 48, padding: '0 24px', gap: 16 }}
      >
        <div className="flex items-center gap-2 mr-auto">
          <div
            className="flex h-4 w-6 shrink-0 items-center justify-center"
            style={{ borderRadius: 3, background: '#1d4ed8' }}
          >
            <HouseSimple size={11} weight="fill" color="#f5f5f5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-medium leading-[1.15] text-ink-2">
              Rivendell Homes
            </div>
            <div className="text-[10px] leading-[1.15] text-ink-4">Config</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TopBarButton>
            <SquaresFour size={16} />
          </TopBarButton>
          <TopBarButton>
            <Bell size={16} />
          </TopBarButton>
          <TopBarButton>
            <Question size={16} />
          </TopBarButton>
          <div
            className="flex items-center justify-center"
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#1d4ed8',
              fontSize: 11,
              fontWeight: 700,
              color: 'white',
            }}
          >
            RL
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className="flex h-full w-[224px] shrink-0 flex-col"
          style={{ background: '#f5f5f5' }}
        >
          <nav className="ha-scroll flex min-h-0 flex-1 flex-col pt-3">
            <div className="pb-2">
              {NAV_ITEMS.filter((item) => item.group === 'workspace').map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  active={activeId === item.id}
                  to={item.path}
                >
                  {item.label}
                </SidebarItem>
              ))}
            </div>
            <div className="mt-auto border-t border-line py-2">
              {NAV_ITEMS.filter((item) => item.group === 'admin').map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  active={activeId === item.id}
                  to={item.path}
                >
                  {item.label}
                </SidebarItem>
              ))}
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <div
            className="flex shrink-0 items-center gap-2.5 border-b border-line bg-white"
            style={{ padding: '14px 24px', minHeight: 56 }}
          >
            <h1
              className="m-0 shrink-0 text-[18px] font-semibold leading-[1.2] tracking-[-0.1px] text-[#111827]"
            >
              {autorender ? 'AutoRender' : NAV_ITEMS.find((n) => n.id === activeId)?.label ?? 'Config'}
            </h1>
            {autorender && (
              <>
                <label className="relative ml-4 flex min-w-0 max-w-[320px] flex-1 items-center">
                  <MagnifyingGlass
                    size={14}
                    className="pointer-events-none absolute left-2.5 text-ink-4"
                  />
                  <input
                    value={searchValue}
                    placeholder="Search plans and renders"
                    className="h-8 w-full rounded-[6px] border border-[#d1d5db] bg-white pl-8 pr-3 text-[13px] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] placeholder:text-ink-4 focus:outline-none"
                    onChange={(e) => {
                      const value = e.target.value
                      setDraft(value)
                      if (onLibraryHome) {
                        setParams(value ? { q: value } : {})
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !onLibraryHome) {
                        navigate({
                          pathname: '/autorender',
                          search: draft ? `?q=${encodeURIComponent(draft)}` : '',
                        })
                      }
                    }}
                  />
                </label>
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <StylesButton onClick={() => setStylesOpen(true)} />
                  <button
                    type="button"
                    onClick={() => setNewOpen(true)}
                    className="flex h-8 items-center gap-1 rounded-[6px] bg-[#171717] px-3 text-[12px] font-medium text-white hover:bg-[#2e2e2e]"
                  >
                    <Plus size={11} weight="bold" />
                    New render
                  </button>
                </div>
              </>
            )}
          </div>

          {autorender && <HeaderBreadcrumbs />}

          <main className="ha-scroll min-h-0 flex-1">{children}</main>
        </div>
      </div>

      {stylesOpen && <StylesDialog onClose={() => setStylesOpen(false)} />}
      {newOpen && (
        <NewRenderModal
          presetPlanId={presetPlanId}
          onClose={() => setNewOpen(false)}
          onCreated={(planId) => {
            setNewOpen(false)
            navigate(`/autorender/plans/${planId}`)
          }}
        />
      )}
    </div>
  )
}

function TopBarButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[#6b7280] hover:bg-[#ebebeb]"
    >
      {children}
    </button>
  )
}

function SidebarItem({
  icon: Icon,
  active,
  to,
  children,
}: {
  icon: (typeof NAV_ITEMS)[number]['icon']
  active?: boolean
  to: string
  children: ReactNode
}) {
  return (
    <Link to={to} className="flex h-8 items-center px-4 no-underline">
      <span
        className="flex h-8 flex-1 items-center gap-2 rounded-lg px-2"
        style={{
          background: active ? '#e5e5e5' : undefined,
          color: active ? '#2e2e2e' : '#616161',
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.background = '#ebebeb'
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = ''
        }}
      >
        <span className="flex" style={{ color: active ? '#2e2e2e' : '#8A8A8A' }}>
          <Icon size={16} weight="regular" className="shrink-0" />
        </span>
        <span className="truncate text-[14px] leading-[1.2] tracking-[0.15px]">{children}</span>
      </span>
    </Link>
  )
}

export function Breadcrumb({
  items,
}: {
  items: { label: string; to?: string }[]
}) {
  return (
    <nav className="flex items-center gap-1.5 text-[13px] text-ink-3">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <CaretRight size={10} className="text-ink-4" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-ink-2">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink-2">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

function HeaderBreadcrumbs() {
  const location = useLocation()
  const { state } = useLibrary()
  const folderMatch = location.pathname.match(/^\/autorender\/plans\/([^/]+)\/folders\/([^/]+)/)
  const planMatch = location.pathname.match(/^\/autorender\/plans\/([^/]+)/)

  const items: { label: string; to?: string }[] = []
  if (folderMatch) {
    const plan = state.plans.find((p) => p.id === folderMatch[1])
    const folder = state.folders.find((f) => f.id === folderMatch[2])
    items.push(
      { label: 'Library', to: '/autorender' },
      { label: plan?.name ?? 'Plan', to: `/autorender/plans/${folderMatch[1]}` },
      { label: folder?.name ?? 'Folder' },
    )
  } else if (planMatch) {
    const plan = state.plans.find((p) => p.id === planMatch[1])
    items.push(
      { label: 'Library', to: '/autorender' },
      { label: plan?.name ?? 'Plan' },
    )
  }

  if (items.length === 0) return null

  return (
    <div
      className="flex shrink-0 items-center px-6"
      style={{ height: 40 }}
    >
      <Breadcrumb items={items} />
    </div>
  )
}
