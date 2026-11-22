import { useEffect, useState } from 'react'
import en from '../i18n/en.js'
import fr from '../i18n/fr.js'

/**
 * نظام اللغات: النص العربي هو المفتاح، والقاموسان en / fr يترجمانه.
 * English is the official default language.
 */
export const LANGS = [
  { code: 'en', label: 'English', short: 'EN', dir: 'ltr' },
  { code: 'ar', label: 'العربية', short: 'AR', dir: 'rtl' },
  { code: 'fr', label: 'Français', short: 'FR', dir: 'ltr' },
]
const DICTS = { en, fr }
const store = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* ignore */ } },
}

let lang = LANGS.some((l) => l.code === store.get('lang')) ? store.get('lang') : 'en'
const subs = new Set()
const missing = new Set()

function applyDom() {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}
applyDom()

export const getLang = () => lang
export const isRTL = () => lang === 'ar'
export const hasChosenLang = () => !!store.get('lang-chosen')

export function setLang(code, { chosen = true } = {}) {
  if (!LANGS.some((l) => l.code === code)) return
  lang = code
  store.set('lang', code)
  if (chosen) store.set('lang-chosen', '1')
  applyDom()
  subs.forEach((f) => f(code))
}

/** t('نص {n}', { n: 3 }) */
export function t(key, vars) {
  let s = key
  if (lang !== 'ar') {
    const d = DICTS[lang]
    if (d && d[key] !== undefined) s = d[key]
    else if (import.meta.env.DEV && !missing.has(key)) { missing.add(key); console.warn('[i18n] missing', lang, key) }
  }
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k])
  return s
}

export function useLang() {
  const [l, set] = useState(lang)
  useEffect(() => { subs.add(set); return () => subs.delete(set) }, [])
  return [l, setLang]
}

/** يعيد رسم التطبيق بالكامل عند تغيير اللغة */
export function I18nRoot({ children }) {
  const [l] = useLang()
  return <div key={l} style={{ display: 'contents' }}>{children}</div>
}
