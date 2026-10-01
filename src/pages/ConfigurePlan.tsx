import { useEffect, useRef } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { attachShowroom, setShowroomPlanName } from '../showroom/mountShowroom'
import { useLibrary } from '../store/library'
import { isShowroomSummary, useRenderFlow } from '../store/renderFlow'

export function ConfigurePlan() {
  const navigate = useNavigate()
  const location = useLocation()
  const { planId: routePlanId } = useParams()
  const slotRef = useRef<HTMLDivElement>(null)
  const reviewing = location.pathname.includes('/render/review/')
  const { state } = useLibrary()
  const { draft, setSummary, switchPlan } = useRenderFlow()

  useEffect(() => {
    if (!routePlanId || draft.planId === routePlanId) return
    const plan = state.plans.find((item) => item.id === routePlanId)
    if (plan) switchPlan({ planId: plan.id, planName: plan.name })
  }, [draft.planId, routePlanId, state.plans, switchPlan])

  useEffect(() => {
    setShowroomPlanName(draft.planName)
  }, [draft.planName])

  useEffect(() => {
    const parent = slotRef.current
    if (!parent || (!draft.planId && !draft.planName)) return
    return attachShowroom(parent, (summary) => {
      if (!isShowroomSummary(summary)) return
      setSummary({ ...summary, options: summary.options ?? [] })
      if (draft.planId) navigate(`/autorender/render/studio/${draft.planId}`)
    })
  }, [draft.planId, draft.planName, navigate, setSummary])

  useEffect(() => {
    const id = window.setInterval(() => {
      const cart = document.getElementById('cartFullscreen')
      if (!cart) return
      const open = cart.classList.contains('open')
      if (reviewing && !open) window.openCartFullscreen?.()
      if (!reviewing && open) window.closeCartFullscreen?.()
    }, 250)
    return () => window.clearInterval(id)
  }, [reviewing])

  if (!routePlanId && !draft.planId && !draft.planName) {
    return <Navigate to="/autorender" replace state={{ pickPlan: true }} />
  }

  return <div ref={slotRef} className="relative min-h-0 w-full flex-1 overflow-hidden" />
}
