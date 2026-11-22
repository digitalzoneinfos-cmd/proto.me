import { t, getLang } from './i18n.jsx'

export const CURRENCY = 'QAR'

export const money = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const pad = (n) => String(n).padStart(2, '0')

/** Date -> 'YYYY-MM-DD' (local) */
export const iso = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY' */
export const dmy = (s) => {
  if (!s) return ''
  const [y, m, d] = s.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`

const MONTHS = {
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
}
const DAYS = {
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
}
const DAYS_S = {
  ar: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  fr: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
}
export const dayShort = (i) => DAYS_S[getLang()][i]

export const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS[getLang()][m - 1]} ${y}`
}

export const monthRange = (key) => {
  const [y, m] = key.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return { from: `${key}-01`, to: `${key}-${pad(last)}` }
}

export const shiftMonth = (key, delta) => {
  const [y, m] = key.split('-').map(Number)
  return monthKey(new Date(y, m - 1 + delta, 1))
}

export const shiftDay = (s, delta) => {
  const [y, m, d] = s.split('-').map(Number)
  return iso(new Date(y, m - 1, d + delta))
}

export const dayName = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return DAYS[getLang()][new Date(y, m - 1, d).getDay()]
}

export const timeAgo = (ts) => {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60) return t('الآن')
  if (diff < 3600) return t('منذ {n} دقيقة', { n: Math.floor(diff / 60) })
  if (diff < 86400) return t('منذ {n} ساعة', { n: Math.floor(diff / 3600) })
  if (diff < 86400 * 30) return t('منذ {n} يوم', { n: Math.floor(diff / 86400) })
  return dmy(iso(new Date(ts)))
}

export const EXPENSE_CATEGORIES = [
  'موردون',
  'رواتب وسلف',
  'عمال',
  'مستلزمات',
  'نقل (أوبر)',
  'مرتجعات',
  'فواتير (هاتف وإنترنت)',
  'إيجار ورسوم',
  'صيانة',
  'أخرى',
]

// تُترجم عند العرض (getters)
const NK = {
  supply: ['مستلزمات المتجر', 'طلب مستلزمات', 'ما ينقص المتجر من أدوات ومواد'],
  suggestion: ['الاقتراحات', 'اقتراح', 'أفكار لتحسين العمل والمبيعات'],
  concern: ['انشغالات الطاقم', 'انشغال', 'ما يشغل طاقم المتجر ويحتاج متابعة'],
}
export const NOTICE_KINDS = Object.fromEntries(Object.entries(NK).map(([k, [a, b, c]]) => [k, {
  get title() { return t(a) }, get single() { return t(b) }, get hint() { return t(c) },
}]))

const ST = { open: ['جديد', 'var(--red)'], progress: ['قيد المعالجة', 'var(--yellow)'], done: ['تم', 'var(--green)'] }
export const STATUS = Object.fromEntries(Object.entries(ST).map(([k, [l, c]]) => [k, { get label() { return t(l) }, color: c }]))

const PR = { low: 'منخفضة', normal: 'عادية', high: 'عاجلة' }
export const PRIORITY = Object.fromEntries(Object.keys(PR).map((k) => [k, null]))
for (const k in PR) Object.defineProperty(PRIORITY, k, { get: () => t(PR[k]), enumerable: true })

/** Qatar-friendly WhatsApp link */
export const waLink = (phone, text = '') => {
  let d = String(phone || '').replace(/[^\d]/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.length === 8) d = '974' + d // رقم قطري محلي
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export const isImage = (path = "") => /\.(png|jpe?g|webp|gif|heic|bmp|svg)$/i.test(path) || path.startsWith("data:image")
