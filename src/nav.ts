import type { Icon } from '@phosphor-icons/react'
import {
  Buildings,
  Gear,
  HouseLine,
  ImageSquare,
  ListChecks,
  MapPin,
  SquaresFour,
  UsersThree,
} from '@phosphor-icons/react'

export type NavId =
  | 'dashboard'
  | 'plans'
  | 'communities'
  | 'lots'
  | 'options'
  | 'autorender'
  | 'users'
  | 'settings'

export type NavItem = {
  id: NavId
  label: string
  path: string
  icon: Icon
  group: 'workspace' | 'admin'
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: SquaresFour, group: 'workspace' },
  { id: 'plans', label: 'Plans', path: '/plans', icon: HouseLine, group: 'workspace' },
  { id: 'communities', label: 'Communities', path: '/communities', icon: Buildings, group: 'workspace' },
  { id: 'lots', label: 'Lots', path: '/lots', icon: MapPin, group: 'workspace' },
  { id: 'options', label: 'Options', path: '/options', icon: ListChecks, group: 'workspace' },
  { id: 'autorender', label: 'AutoRender', path: '/autorender', icon: ImageSquare, group: 'workspace' },
  { id: 'users', label: 'Users', path: '/users', icon: UsersThree, group: 'admin' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Gear, group: 'admin' },
]

export const PLACEHOLDER_COPY: Record<Exclude<NavId, 'autorender'>, { title: string; body: string }> = {
  dashboard: {
    title: 'Dashboard',
    body: 'Account overview lives here in Config. This prototype only implements AutoRender.',
  },
  plans: {
    title: 'Plans',
    body: 'The plan library stays in Config. AutoRender renders stay with their plan and session, and can be grouped into collections.',
  },
  communities: {
    title: 'Communities',
    body: 'Community records are unchanged. Open AutoRender to browse renders by plan.',
  },
  lots: {
    title: 'Lots',
    body: 'Lot maps stay in Config. This prototype only covers the AutoRender library.',
  },
  options: {
    title: 'Options',
    body: 'The option catalog is unchanged. AutoRender is a new workspace tab.',
  },
  users: {
    title: 'Users',
    body: 'User management stays in Config. This prototype only implements AutoRender.',
  },
  settings: {
    title: 'Settings',
    body: 'Account settings stay in Config. This prototype only implements AutoRender.',
  },
}

export function isAutorenderPath(pathname: string) {
  return pathname === '/autorender' || pathname.startsWith('/autorender/')
}
