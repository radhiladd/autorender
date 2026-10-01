import type { Collection, Plan, Render, Session } from '../types'

export function renderSrc(file: string) {
  const base = import.meta.env.BASE_URL
  return `${base}renders/${file}`
}

export function formatSessionDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatSessionDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function styleChips(label: string) {
  return [
    ...new Set(
      label
        .split('·')
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ]
}

export function replaceStyleName(label: string, from: string, to: string) {
  const chips = label.split('·').map((part) => part.trim())
  if (chips[0] === from) chips[0] = to
  return chips.filter(Boolean).join(' · ')
}

export function personName(person?: { firstName: string; lastName: string } | null) {
  if (!person) return 'Unknown'
  return `${person.firstName} ${person.lastName}`.trim()
}

export function formatRelative(iso: string, now = new Date()) {
  const date = new Date(iso)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfThat = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfToday.getTime() - startOfThat.getTime()) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`
  return formatSessionDate(iso)
}

export function lastActivityIso(renders: Render[], planId: string) {
  const dates = renders.filter((r) => r.planId === planId).map((r) => r.createdAt)
  if (dates.length === 0) return null
  return dates.sort().at(-1) ?? null
}

export function collectionScope(collections: Collection[], collectionId: string) {
  return [collectionId, ...collections.filter((c) => c.parentId === collectionId).map((c) => c.id)]
}

export function rendersInCollection(
  renders: Render[],
  collections: Collection[],
  collectionId: string,
  includeChildren = true,
) {
  const scope = includeChildren ? collectionScope(collections, collectionId) : [collectionId]
  return renders
    .filter((r) => r.collectionIds.some((id) => scope.includes(id)))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function sessionNumbers(sessions: Session[]) {
  const numbers = new Map<string, number>()
  const byPlan = new Map<string, Session[]>()
  for (const session of sessions) {
    byPlan.set(session.planId, [...(byPlan.get(session.planId) ?? []), session])
  }
  for (const list of byPlan.values()) {
    list
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .forEach((session, i) => numbers.set(session.id, i + 1))
  }
  return numbers
}

export function latestCover(renders: Render[], planId: string) {
  const list = renders
    .filter((r) => r.planId === planId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return list[0] ?? null
}

export function sortPlansByActivity(plans: Plan[], renders: Render[]) {
  return plans.slice().sort((a, b) => {
    const aIso = lastActivityIso(renders, a.id) ?? ''
    const bIso = lastActivityIso(renders, b.id) ?? ''
    return bIso.localeCompare(aIso)
  })
}

export function recents(renders: Render[], limit = 8) {
  return renders
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export function rendersForSession(renders: Render[], sessionId: string) {
  return renders
    .filter((r) => r.sessionId === sessionId)
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function recentSessions(sessions: Session[], renders: Render[], limit = 8) {
  return sessions
    .filter((s) => renders.some((r) => r.sessionId === s.id))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export function sessionsForPlan(sessions: Session[], planId: string) {
  return sessions
    .filter((s) => s.planId === planId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function collectionsForPlan(collections: Collection[], renders: Render[], planId: string) {
  const ids = new Set(renders.filter((r) => r.planId === planId).flatMap((r) => r.collectionIds))
  return collections.filter((c) => ids.has(c.id))
}

export function matchesQuery(query: string, ...values: Array<string | null | undefined>) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return values.some((v) => (v ?? '').toLowerCase().includes(q))
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}
