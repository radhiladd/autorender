import type { ShowroomSummary } from '../store/renderFlow'

type RecordedListener = {
  target: EventTarget
  type: string
  listener: EventListenerOrEventListenerObject
  options?: boolean | AddEventListenerOptions
}

declare global {
  interface Window {
    __autorenderEmbed?: boolean
    __autorenderOnContinue?: (summary: ShowroomSummary) => void
    __autorenderReadConfig?: () => ShowroomSummary
    syncAppUrl?: () => void
    onAppRoutePopState?: () => void
    openSavePlanConfirm?: () => void
    openCartFullscreen?: () => void
    closeCartFullscreen?: () => void
    init?: () => void
  }
}

const recorded: RecordedListener[] = []
let host: HTMLDivElement | null = null
let booting: Promise<void> | null = null
let listenersActive = true

function showroomBase() {
  return new URL('showroom/', window.location.href).href
}

function installBase() {
  if (document.querySelector('base[data-showroom]')) return
  const base = document.createElement('base')
  base.dataset.showroom = ''
  base.href = showroomBase()
  document.head.prepend(base)
}

function removeBase() {
  document.querySelector('base[data-showroom]')?.remove()
}

function scopeCss(css: string) {
  const faces: string[] = []
  const withoutFaces = css.replace(/@font-face\s*\{[^}]*\}/g, (block) => {
    faces.push(block.replace(/url\((['"]?)fonts\//g, `url($1${showroomBase()}fonts/`))
    return ''
  })
  const scoped = withoutFaces.replaceAll(':root', ':scope')
  return `${faces.join('\n')}
@scope (#showroom-root) {
${scoped}
}
#showroom-root {
  height: 100%;
  width: 100%;
  min-height: 0;
  overflow: hidden;
  position: relative;
  transform: translateZ(0);
  --dev-bar-h: 0px;
  --chrome-h: 0px;
  font-family: var(--font);
  background: var(--bg);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}
#showroom-root .dev-control-bar,
#showroom-root > .topbar {
  display: none !important;
}
#showroom-root .main-container {
  height: 100% !important;
  margin-top: 0 !important;
}
#showroom-root .cart-fullscreen {
  top: 0;
}
#showroom-root .plan-checkout-topbar {
  height: 48px;
}
#showroom-root #cartFullscreen .plan-checkout-topbar,
#showroom-root #cartFullscreen .cart-options-tabs,
#showroom-root #cartFullscreen .cart-options-tab-panel,
#showroom-root #cartFullscreen .spec-home-callout,
#showroom-root #savePlanCustomerSection,
#showroom-root .save-plan-success-banner,
#showroom-root .spec-home-callout {
  display: none !important;
}
#showroom-root #cartFullscreen .plan-checkout-right {
  overflow: auto;
}
#showroom-root #cartFullscreen .saved-plan-right-scroll {
  display: block;
}
#showroom-root #cartFullscreen .saved-plan-right-scroll > section.saved-plan-section:nth-child(3) {
  padding-top: 24px;
  padding-bottom: 24px;
}
`
}

function ensureStyle(css: string) {
  if (document.getElementById('showroom-style')) return
  const style = document.createElement('style')
  style.id = 'showroom-style'
  style.textContent = scopeCss(css)
  document.head.appendChild(style)
}

function ensureFontLinks(doc: Document) {
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute('href')
    if (!href || document.querySelector(`link[data-showroom-font][href="${href}"]`)) return
    const el = document.createElement('link')
    el.rel = 'stylesheet'
    el.href = href
    el.dataset.showroomFont = ''
    document.head.appendChild(el)
  })
}

function setListenersActive(active: boolean) {
  if (active === listenersActive) return
  listenersActive = active
  for (const rec of recorded) {
    if (rec.type === 'popstate') continue
    if (active) rec.target.addEventListener(rec.type, rec.listener, rec.options)
    else rec.target.removeEventListener(rec.type, rec.listener, rec.options)
  }
}

function recordDocumentListeners() {
  const original = EventTarget.prototype.addEventListener
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if ((this === document || this === window) && listener) {
      recorded.push({
        target: this,
        type,
        listener,
        options,
      })
    }
    return original.call(this, type, listener, options)
  }
  return () => {
    EventTarget.prototype.addEventListener = original
  }
}

function preserveHashOnHistory() {
  const replace = history.replaceState.bind(history)
  const push = history.pushState.bind(history)
  const keepHash = (url?: string | URL | null) => {
    if (url == null) return url
    const next = new URL(String(url), window.location.href)
    if (!next.hash && window.location.hash) next.hash = window.location.hash
    return next.toString()
  }
  history.replaceState = (state, title, url) => {
    replace(state, title, keepHash(url))
  }
  history.pushState = (state, title, url) => {
    push(state, title, keepHash(url))
  }
}

function runInlineScript(code: string) {
  const script = document.createElement('script')
  script.textContent = code
  document.body.appendChild(script)
  script.remove()
}

function runExternalScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = false
    script.onload = () => {
      script.remove()
      resolve()
    }
    script.onerror = () => {
      script.remove()
      reject(new Error(`Failed to load ${src}`))
    }
    document.body.appendChild(script)
  })
}

async function boot(root: HTMLDivElement) {
  const html = await fetch(new URL('showroom/index.html', window.location.href)).then((res) => {
    if (!res.ok) throw new Error('Showroom failed to load')
    return res.text()
  })
  const doc = new DOMParser().parseFromString(html, 'text/html')
  ensureFontLinks(doc)
  ensureStyle([...doc.querySelectorAll('style')].map((style) => style.textContent ?? '').join('\n'))

  const body = doc.body.cloneNode(true) as HTMLElement
  body.querySelectorAll('script').forEach((script) => script.remove())
  root.innerHTML = body.innerHTML

  preserveHashOnHistory()
  const restoreListeners = recordDocumentListeners()
  window.__autorenderEmbed = true
  try {
    for (const script of doc.querySelectorAll('script')) {
      const src = script.getAttribute('src')
      if (src) {
        const url = new URL(src, showroomBase()).href
        await runExternalScript(url)
      } else if (script.textContent?.trim()) {
        try {
          runInlineScript(script.textContent)
        } catch (error) {
          console.error(error)
        }
      }
    }
  } finally {
    restoreListeners()
  }
  await whenConnected(root)
  ensureOptionsRendered()
  applyPlanLabel()
}

let planLabel = ''

export function setShowroomPlanName(name: string) {
  planLabel = name.trim()
  applyPlanLabel()
}

function applyPlanLabel() {
  if (!planLabel) return
  document
    .querySelectorAll('#showroom-root .plan-title, #showroom-root #checkoutPlanName, #showroom-root #savePlanName')
    .forEach((el) => {
      el.textContent = planLabel
    })
}

function ensureOptionsRendered() {
  const scroll = document.getElementById('optionsScroll')
  if (scroll && scroll.childElementCount === 0 && typeof window.init === 'function') {
    window.init()
  }
}

function whenConnected(node: HTMLElement) {
  if (node.isConnected) return Promise.resolve()
  return new Promise<void>((resolve) => {
    const check = () => {
      if (node.isConnected) resolve()
      else requestAnimationFrame(check)
    }
    requestAnimationFrame(check)
  })
}

export function attachShowroom(
  parent: HTMLElement,
  onContinue: (summary: ShowroomSummary) => void,
) {
  installBase()
  window.__autorenderEmbed = true
  window.__autorenderOnContinue = onContinue
  if (!host) {
    host = document.createElement('div')
    host.id = 'showroom-root'
  }
  parent.appendChild(host)
  setListenersActive(true)
  if (!booting) {
    const node = host
    booting = whenConnected(node).then(() => boot(node))
  } else {
    void booting.then(() => ensureOptionsRendered())
  }
  return () => {
    window.__autorenderOnContinue = undefined
    setListenersActive(false)
    host?.remove()
    removeBase()
  }
}
