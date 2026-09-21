import { NAV_ITEMS, PLACEHOLDER_COPY, type NavId } from '../nav'

export function PlaceholderPage({ id }: { id: Exclude<NavId, 'autorender'> }) {
  const item = NAV_ITEMS.find((n) => n.id === id)
  const copy = PLACEHOLDER_COPY[id]
  const Icon = item?.icon

  return (
    <div className="flex h-full min-h-[360px] items-center justify-center px-6">
      <div className="max-w-sm text-center">
        {Icon && (
          <div
            className="mx-auto mb-3 flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#f5f5f5',
              color: '#8a8a8a',
            }}
          >
            <Icon size={20} />
          </div>
        )}
        <h2 className="text-[16px] font-medium text-ink-2">{copy.title}</h2>
        <p className="mt-1 text-[13px] leading-5 text-ink-3">{copy.body}</p>
      </div>
    </div>
  )
}
