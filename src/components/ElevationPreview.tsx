import type { ReactNode } from 'react'

const STROKE = '#2e2e2e'
const WALL = '#fafafa'
const GLASS = '#e8eef2'
const TRIM = '#d4d4d4'

function Frame({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 120 88"
      className="h-full w-full"
      aria-hidden="true"
    >
      <rect width="120" height="88" fill="#f5f5f5" />
      <line x1="8" y1="78" x2="112" y2="78" stroke={STROKE} strokeWidth="1.2" />
      {children}
    </svg>
  )
}

function GableColonial() {
  return (
    <Frame>
      <polygon points="16,44 60,14 104,44" fill={WALL} stroke={STROKE} strokeWidth="1.2" />
      <rect x="22" y="44" width="76" height="34" fill={WALL} stroke={STROKE} strokeWidth="1.2" />
      <polygon points="48,44 60,28 72,44" fill={WALL} stroke={STROKE} strokeWidth="1.1" />
      <rect x="28" y="50" width="14" height="12" fill={GLASS} stroke={STROKE} strokeWidth="1" />
      <rect x="78" y="50" width="14" height="12" fill={GLASS} stroke={STROKE} strokeWidth="1" />
      <rect x="54" y="58" width="12" height="20" fill={TRIM} stroke={STROKE} strokeWidth="1" />
      <rect x="38" y="68" width="44" height="4" fill={WALL} stroke={STROKE} strokeWidth="1" />
    </Frame>
  )
}

function ModernBox() {
  return (
    <Frame>
      <rect x="18" y="22" width="84" height="56" fill={WALL} stroke={STROKE} strokeWidth="1.2" />
      <rect x="18" y="22" width="84" height="8" fill={TRIM} stroke={STROKE} strokeWidth="1" />
      <rect x="26" y="38" width="28" height="22" fill={GLASS} stroke={STROKE} strokeWidth="1" />
      <rect x="66" y="38" width="28" height="22" fill={GLASS} stroke={STROKE} strokeWidth="1" />
      <rect x="54" y="52" width="12" height="26" fill={TRIM} stroke={STROKE} strokeWidth="1" />
    </Frame>
  )
}

function Cottage() {
  return (
    <Frame>
      <polygon points="24,50 60,16 96,50" fill={WALL} stroke={STROKE} strokeWidth="1.2" />
      <rect x="30" y="50" width="60" height="28" fill={WALL} stroke={STROKE} strokeWidth="1.2" />
      <rect x="54" y="18" width="10" height="16" fill={TRIM} stroke={STROKE} strokeWidth="1" />
      <rect x="38" y="56" width="14" height="12" fill={GLASS} stroke={STROKE} strokeWidth="1" />
      <rect x="68" y="56" width="14" height="12" fill={GLASS} stroke={STROKE} strokeWidth="1" />
      <rect x="54" y="62" width="12" height="16" fill={TRIM} stroke={STROKE} strokeWidth="1" />
    </Frame>
  )
}

function Craftsman() {
  return (
    <Frame>
      <polygon points="14,48 60,18 106,48" fill={WALL} stroke={STROKE} strokeWidth="1.2" />
      <rect x="20" y="48" width="80" height="30" fill={WALL} stroke={STROKE} strokeWidth="1.2" />
      <rect x="14" y="46" width="92" height="4" fill={TRIM} stroke={STROKE} strokeWidth="1" />
      <rect x="28" y="54" width="18" height="14" fill={GLASS} stroke={STROKE} strokeWidth="1" />
      <rect x="74" y="54" width="18" height="14" fill={GLASS} stroke={STROKE} strokeWidth="1" />
      <rect x="52" y="58" width="16" height="20" fill={TRIM} stroke={STROKE} strokeWidth="1" />
      <rect x="24" y="72" width="72" height="3" fill={WALL} stroke={STROKE} strokeWidth="1" />
    </Frame>
  )
}

function Farmhouse() {
  return (
    <Frame>
      <polygon points="20,42 50,16 80,42" fill={WALL} stroke={STROKE} strokeWidth="1.2" />
      <rect x="26" y="42" width="48" height="36" fill={WALL} stroke={STROKE} strokeWidth="1.2" />
      <rect x="74" y="34" width="28" height="44" fill={WALL} stroke={STROKE} strokeWidth="1.2" />
      <polygon points="74,34 88,20 102,34" fill={WALL} stroke={STROKE} strokeWidth="1.1" />
      <rect x="36" y="50" width="12" height="10" fill={GLASS} stroke={STROKE} strokeWidth="1" />
      <rect x="82" y="48" width="12" height="10" fill={GLASS} stroke={STROKE} strokeWidth="1" />
      <rect x="44" y="60" width="12" height="18" fill={TRIM} stroke={STROKE} strokeWidth="1" />
    </Frame>
  )
}

const VARIANTS = [GableColonial, ModernBox, Cottage, Craftsman, Farmhouse] as const

const BY_PLAN: Record<string, (typeof VARIANTS)[number]> = {
  allison: GableColonial,
  untitled: Cottage,
  cedar: Craftsman,
  millhouse: Farmhouse,
}

export function ElevationPreview({
  planId,
  width = 96,
  height = 72,
}: {
  planId: string
  width?: number
  height?: number
}) {
  const Drawing =
    BY_PLAN[planId] ??
    VARIANTS[Math.abs([...planId].reduce((n, c) => n + c.charCodeAt(0), 0)) % VARIANTS.length]

  return (
    <div
      className="shrink-0 overflow-hidden rounded-[6px] border border-line bg-[#f5f5f5]"
      style={{ width, height }}
      title="Front elevation"
    >
      <Drawing />
    </div>
  )
}
