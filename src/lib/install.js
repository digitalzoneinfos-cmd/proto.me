// تثبيت التطبيق على الهاتف (PWA)
let deferred = null
const subs = new Set()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e
    subs.forEach((f) => f(true))
  })
  window.addEventListener('appinstalled', () => { deferred = null; subs.forEach((f) => f(false)) })
}

export const canPrompt = () => !!deferred
export const onPromptChange = (f) => { subs.add(f); return () => subs.delete(f) }

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const isMobile = () => /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || isIOS()

/** يعيد: 'installed' | 'dismissed' | 'ios' | 'desktop' | 'manual' */
export async function installApp() {
  if (isStandalone()) return 'installed'
  if (deferred) {
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null
    return outcome === 'accepted' ? 'installed' : 'dismissed'
  }
  if (isIOS()) return 'ios'
  if (!isMobile()) return 'desktop'
  return 'manual'
}

export function registerSW() {
  if (!('serviceWorker' in navigator)) return
  try {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
  } catch { /* sandboxed */ }
}
