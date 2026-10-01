import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bathtub, Bed, Garage, Ruler, X } from '@phosphor-icons/react'
import { ElevationPreview } from '../components/ElevationPreview'
import { PLAN_SPECS } from '../data/seed'
import { useRenderFlow } from '../store/renderFlow'
import { useLibrary } from '../store/library'

export function PlanStats({ planId }: { planId: string }) {
  const specs = PLAN_SPECS[planId]
  if (!specs) return null
  const stats = [
    { icon: <Bed size={12} />, text: `${specs.beds} Bed` },
    { icon: <Bathtub size={12} />, text: `${specs.baths} Bath` },
    { icon: <Garage size={12} />, text: `${specs.garage} Car` },
    { icon: <Ruler size={12} />, text: `${specs.sqft.toLocaleString('en-US')} sqft` },
  ]
  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-ink-3">
      {stats.map((stat) => (
        <span key={stat.text} className="inline-flex items-center gap-1 whitespace-nowrap">
          <span className="text-ink-4">{stat.icon}</span>
          {stat.text}
        </span>
      ))}
    </div>
  )
}

export function PlanPicker({ onClose }: { onClose: () => void }) {
  const { state } = useLibrary()
  const { choosePlan } = useRenderFlow()
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const openPlan = (planId: string, planName: string) => {
    choosePlan({ planId, planName })
    onClose()
    navigate(`/autorender/render/configure/${planId}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[#171717]/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-picker-title"
        className="relative flex max-h-[min(640px,85vh)] w-full max-w-lg flex-col rounded-lg border border-line bg-white p-5 shadow-[0_24px_60px_-28px_rgb(0_0_0_/_0.45)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="plan-picker-title" className="text-[16px] font-semibold tracking-[-0.1px] text-[#111827]">
              Select a plan
            </h2>
            <p className="mt-1 text-[13px] text-ink-3">
              The render uses this plan’s elevation and options. You’ll set the camera and style next.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-ink-3 hover:bg-inset hover:text-ink"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>
        <ul className="ha-scroll mt-4 flex min-h-0 flex-1 flex-col gap-2">
          {state.plans.map((plan) => (
            <li key={plan.id}>
              <button
                type="button"
                onClick={() => openPlan(plan.id, plan.name)}
                className="flex w-full items-center gap-4 rounded-lg border border-line bg-white px-3 py-2.5 text-left transition hover:border-line-strong hover:bg-inset"
              >
                <ElevationPreview planId={plan.id} width={72} height={54} />
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-medium text-ink-2">{plan.name}</div>
                  <PlanStats planId={plan.id} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
