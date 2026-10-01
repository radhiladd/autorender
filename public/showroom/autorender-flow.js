;(function () {
  var embedded = window.__autorenderEmbed === true
  var params = new URLSearchParams(location.search)
  if (!embedded && params.get('flow') !== 'render') return

  var label = document.getElementById('cartCheckoutSaveBtnLabel')
  if (label) label.textContent = 'Next'
  var btn = document.getElementById('cartCheckoutSaveBtn')
  if (btn) btn.setAttribute('aria-label', 'Next')

  if (embedded && typeof window.syncAppUrl === 'function') {
    window.syncAppUrl = function () {}
  }
  if (embedded && typeof window.onAppRoutePopState === 'function') {
    window.removeEventListener('popstate', window.onAppRoutePopState)
  }

  window.openSavePlanConfirm = function () {
    var summary =
      typeof window.__autorenderReadConfig === 'function'
        ? window.__autorenderReadConfig()
        : { elevation: '', palette: '', garage: '', optionCount: 0 }
    if (typeof window.__autorenderOnContinue === 'function') {
      window.__autorenderOnContinue(summary)
      return
    }
    window.parent.postMessage({ type: 'autorender:continue', summary: summary }, '*')
  }

  if (!embedded || typeof openCartFullscreen !== 'function' || typeof closeCartFullscreen !== 'function') return

  var openReview = openCartFullscreen
  var closeReview = closeCartFullscreen

  function showPlanConfirmation() {
    if (typeof populateSavedPlanView === 'function') populateSavedPlanView()
    var section = document.getElementById('savePlanAllOptionsSection')
    if (section) {
      section.classList.remove('collapsed')
      var toggle = section.querySelector('.saved-plan-section-toggle')
      if (toggle) toggle.setAttribute('aria-expanded', 'true')
    }
    var scroll = document.querySelector('#savePlanOverlay .saved-plan-right-scroll')
    var right = document.querySelector('#cartFullscreen .plan-checkout-right')
    if (scroll && right && !right.contains(scroll)) right.appendChild(scroll)
  }

  window.openCartFullscreen = function () {
    openReview()
    showPlanConfirmation()
    window.dispatchEvent(new CustomEvent('autorender-review', { detail: { open: true } }))
  }

  window.closeCartFullscreen = function () {
    closeReview()
    window.dispatchEvent(new CustomEvent('autorender-review', { detail: { open: false } }))
  }
})()
