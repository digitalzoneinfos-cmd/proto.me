import { t } from './i18n.jsx'
// وضع تجريبي: يعمل بدون Supabase، البيانات تُحفظ في المتصفح فقط.

const KEY = 'aryam-demo-v1'
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
const wait = (v) => new Promise((r) => setTimeout(() => r(v), 120))

function receiptSvg(title, amount, date) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="520" viewBox="0 0 360 520">
  <rect width="360" height="520" fill="#fbfaf6"/>
  <path d="M0 500 l15 20 l15-20 l15 20 l15-20 l15 20 l15-20 l15 20 l15-20 l15 20 l15-20 l15 20 l15-20 l15 20 l15-20 l15 20 l15-20 l15 20 l15-20 l15 20 l15-20 l15 20 l15-20 l15 20 l15-20 V520 H0Z" fill="#e9e6dc"/>
  <text x="180" y="54" font-family="Arial" font-size="22" font-weight="700" text-anchor="middle" fill="#222">RECEIPT · وصل</text>
  <text x="180" y="84" font-family="Arial" font-size="14" text-anchor="middle" fill="#777">${date}</text>
  <line x1="30" y1="104" x2="330" y2="104" stroke="#bbb" stroke-dasharray="4 4"/>
  <text x="330" y="150" font-family="Arial" font-size="18" text-anchor="end" fill="#333" direction="rtl">${title}</text>
  ${[0, 1, 2, 3].map((i) => `<rect x="30" y="${180 + i * 34}" width="${180 - i * 25}" height="10" rx="3" fill="#ddd"/><rect x="270" y="${180 + i * 34}" width="60" height="10" rx="3" fill="#ddd"/>`).join('')}
  <line x1="30" y1="330" x2="330" y2="330" stroke="#bbb" stroke-dasharray="4 4"/>
  <text x="30" y="372" font-family="Arial" font-size="16" fill="#555">TOTAL</text>
  <text x="330" y="372" font-family="Arial" font-size="26" font-weight="700" text-anchor="end" fill="#111">${amount} QAR</text>
  <text x="180" y="440" font-family="Arial" font-size="12" text-anchor="middle" fill="#999">صورة توضيحية — وضع تجريبي</text>
</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

function seed() {
  const org = { id: 'demo-org', name: 'مكتبة أريام', address: 'الشارع التجاري — جنب مطعم البيت التركي، الخور، دولة قطر', phone: '74464624 / 50314150', invite_code: 'ARYM7Q2K', language: 'en' }
  const files = {}
  const entries = []
  const expenses = []
  const addFile = (url, ext = 'svg') => { const p = `demo/${uid()}.${ext}`; files[p] = url; return p }

  // بيانات نوفمبر 2026 (مطابقة للتقرير المرفق)
  const nov = [
    ['2026-11-08', 474, 118], ['2026-11-09', 441.5, 236], ['2026-11-10', 659, 27], ['2026-11-11', 328, 976],
    ['2026-11-12', 382, 28], ['2026-11-13', 241, 61], ['2026-11-14', 958.5, 69], ['2026-11-15', 760.5, 59],
    ['2026-11-16', 906, 124], ['2026-11-17', 373, 438],
  ]
  for (const [d, card, cash] of nov)
    entries.push({ id: uid(), entry_date: d, card_amount: card, cash_amount: cash, other_income: 0, notes: '', report_paths: [addFile(receiptSvg('Day Close', (card + cash).toFixed(2), d))], created_at: d + 'T21:00:00Z' })

  const ex = [
    ['2026-11-08', 'أوبر — أبو يوسف', 'نقل (أوبر)', 17], ['2026-11-09', 'أوبر — عن يوم أمس', 'نقل (أوبر)', 17],
    ['2026-11-09', 'أوبر — 09/11', 'نقل (أوبر)', 9], ['2026-11-11', 'دفعة فاتورة الحبر (INK PAYMENT)', 'مستلزمات', 400],
    ['2026-11-11', 'محمد البنغالي (عامل)', 'عمال', 200], ['2026-11-11', 'المصري — أبجد (مورّد)', 'موردون', 694],
    ['2026-11-11', 'المصري — أبجد (مورّد)', 'موردون', 250], ['2026-11-12', 'أرسلان — ساعات إضافية', 'رواتب وسلف', 40],
    ['2026-11-15', 'أرسلان — راتب', 'رواتب وسلف', 100], ['2026-11-16', 'إرجاع (مرتجع)', 'مرتجعات', 20],
    ['2026-11-16', 'شحن رصيد هاتف المكتبة (Flexi)', 'فواتير (هاتف وإنترنت)', 10], ['2026-11-17', 'مرتجع (Return)', 'مرتجعات', 19],
    ['2026-11-17', 'أرسلان — راتب', 'رواتب وسلف', 300],
  ]
  ex.forEach(([d, desc, cat, amt], i) =>
    expenses.push({ id: uid(), expense_date: d, description: desc, category: cat, amount: amt, receipt_paths: i % 4 === 3 ? [] : [addFile(receiptSvg(desc.split(' — ')[0], amt.toFixed(2), d))], created_at: `${d}T1${i % 10}:00:00Z` }),
  )

  // أكتوبر 2026 (بيانات توضيحية للرجوع للأشهر السابقة)
  for (let day = 1; day <= 31; day++) {
    const d = `2026-10-${String(day).padStart(2, '0')}`
    const s = Math.sin(day * 1.7) * 0.5 + 0.5
    if (new Date(d).getDay() === 5 && day % 2) continue
    entries.push({ id: uid(), entry_date: d, card_amount: Math.round(300 + s * 650), cash_amount: Math.round(40 + (1 - s) * 220), other_income: 0, notes: '', report_paths: [], created_at: d + 'T21:00:00Z' })
    if (day % 3 === 0) expenses.push({ id: uid(), expense_date: d, description: day % 2 ? 'أوبر — توصيل طلبية' : 'أرسلان — سلفة', category: day % 2 ? 'نقل (أوبر)' : 'رواتب وسلف', amount: day % 2 ? 18 : 150, receipt_paths: [], created_at: d + 'T12:00:00Z' })
  }
  expenses.push({ id: uid(), expense_date: '2026-10-05', description: 'المصري — أبجد (مورّد)', category: 'موردون', amount: 820, receipt_paths: [], created_at: '2026-10-05T10:00:00Z' })

  const now = Date.now()
  const notices = [
    { id: uid(), kind: 'supply', title: 'ورق طباعة A4', details: 'نفد المخزون تقريباً — نحتاج 5 كراتين', quantity: '5 كراتين', author: 'أرسلان', priority: 'high', status: 'open', created_at: new Date(now - 3600e3 * 5).toISOString() },
    { id: uid(), kind: 'supply', title: 'حبر طابعة Epson أسود', details: '', quantity: '3 علب', author: 'محمد', priority: 'normal', status: 'progress', created_at: new Date(now - 86400e3 * 2).toISOString() },
    { id: uid(), kind: 'supply', title: 'أكياس تغليف كبيرة', details: '', quantity: '200 كيس', author: 'أرسلان', priority: 'low', status: 'done', created_at: new Date(now - 86400e3 * 6).toISOString() },
    { id: uid(), kind: 'suggestion', title: 'ركن خاص بالقصص للأطفال', details: 'تخصيص رف قرب المدخل لقصص الأطفال مع عروض شهرية', author: 'وسيم', priority: 'normal', status: 'open', created_at: new Date(now - 86400e3).toISOString() },
    { id: uid(), kind: 'suggestion', title: 'عرض العودة للمدارس مبكراً', details: 'إطلاق حزم أدوات مدرسية بسعر موحّد قبل الموسم بأسبوعين', author: 'وسيم', priority: 'high', status: 'progress', created_at: new Date(now - 86400e3 * 4).toISOString() },
    { id: uid(), kind: 'concern', title: 'مكيف الهواء في المخزن ضعيف', details: 'الحرارة مرتفعة بعد الظهر وتؤثر على الورق', author: 'محمد البنغالي', priority: 'high', status: 'open', created_at: new Date(now - 3600e3 * 20).toISOString() },
    { id: uid(), kind: 'concern', title: 'تنظيم جدول الاستراحة', details: 'طلب تثبيت وقت الاستراحة بين 2 و 3', author: 'أرسلان', priority: 'normal', status: 'open', created_at: new Date(now - 86400e3 * 3).toISOString() },
  ]
  const suppliers = [
    { id: uid(), name: 'المصري', company: 'أبجد', phone: '+974 5000 0001', category: 'كتب وقرطاسية', notes: 'التوريد كل أسبوعين' },
    { id: uid(), name: 'أبو يوسف', company: 'خدمات توصيل', phone: '+974 5000 0002', category: 'نقل', notes: '' },
    { id: uid(), name: 'مورد الحبر', company: 'Ink Center', phone: '+974 5000 0003', category: 'حبر وطابعات', notes: 'أرقام توضيحية — استبدلها بالأرقام الحقيقية' },
  ]
  const members = [
    { user_id: 'demo-admin', role: 'admin', full_name: 'مسلاوي وسيم', email: 'admin@demo.qa', created_at: '2026-11-01T08:00:00Z' },
    { user_id: 'demo-manager', role: 'manager', full_name: 'بوخلفة خرامسية', email: 'manager@demo.qa', created_at: '2026-11-02T08:00:00Z' },
  ]
  return { org, files, entries, expenses, notices, suppliers, members, monthlyFiles: [], notes: {}, session: null }
}

export function createMockApi() {
  let db
  try { db = JSON.parse(localStorage.getItem(KEY)) } catch { db = null }
  if (!db) db = seed()
  const listeners = new Set()
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* quota / غير متاح */ } }
  const inRange = (d, from, to) => d >= from && d <= to
  const audit = (entity, action, oldRow, newRow) => {
    db.audit = db.audit || []
    db.audit.unshift({ id: uid(), at: new Date().toISOString(), user_name: db.session?.full_name, action, entity, old_data: oldRow || null, new_data: newRow || null })
    db.audit = db.audit.slice(0, 300)
  }
  const upsertA = (entity, arr, row) => {
    const before = row.id ? arr.find((r) => r.id === row.id) : null
    const prev = before ? { ...before } : null
    const r = upsert(arr, row)
    audit(entity, prev ? 'update' : 'insert', prev, { ...r })
    return r
  }
  const delA = (entity, key, id) => {
    const prev = db[key].find((r) => r.id === id)
    db[key] = db[key].filter((r) => r.id !== id)
    if (prev) audit(entity, 'delete', prev, null)
  }
  const upsert = (arr, row) => {
    if (row.id) { const i = arr.findIndex((r) => r.id === row.id); if (i >= 0) { arr[i] = { ...arr[i], ...row }; return arr[i] } }
    const r = { ...row, id: uid(), created_at: new Date().toISOString() }
    arr.push(r)
    return r
  }

  const api = {
    mode: 'demo',
    setOrg() {},
    getUser: () => wait(db.session),
    onAuthChange(cb) { listeners.add(cb); return () => listeners.delete(cb) },
    async signUp(email, _pw, fullName) {
      db.session = { id: 'demo-new', email, role: null, full_name: fullName || email }
      save(); listeners.forEach((l) => l(db.session)); return { needsConfirm: false }
    },
    async signIn(email) {
      if (/admin/i.test(email)) return api.demoLogin('admin')
      if (/manager/i.test(email)) return api.demoLogin('manager')
      db.session = { id: 'demo-new', email, role: null, full_name: email.split('@')[0] }
      save(); listeners.forEach((l) => l(db.session))
    },
    /** خاص بالوضع التجريبي */
    demoLogin(role) {
      db.session = role === 'admin'
        ? { id: 'demo-admin', email: 'admin@demo.qa', role: 'admin', full_name: 'مسلاوي وسيم' }
        : { id: 'demo-manager', email: 'manager@demo.qa', role: 'manager', full_name: 'بوخلفة خرامسية' }
      save(); listeners.forEach((l) => l(db.session))
    },
    async resetPassword() {},
    async updatePassword() {},
    async storageUsage() {
      const bytes = Object.values(db.files).reduce((a, v) => a + Math.round((v || '').length * 0.75), 0)
      return { bytes, files: Object.keys(db.files).length }
    },
    listAudit: ({ limit = 50, before } = {}) => wait((db.audit || []).filter((a) => !before || a.at < before).slice(0, limit)),
    async signOut() { db.session = null; save(); listeners.forEach((l) => l(null)) },
    resetDemo() { db = seed(); save(); location.reload() },

    async getMembership() {
      if (!db.session || !db.session.role) return null
      return wait({ role: db.session.role, fullName: db.session.full_name, email: db.session.email, org: db.org })
    },
    async createOrg(name, fullName) {
      db.org.name = name || db.org.name
      db.session = { ...db.session, role: 'admin', full_name: fullName || db.session.full_name }
      save(); return db.org
    },
    async joinWithCode(code, fullName) {
      if (code.trim().toUpperCase() !== db.org.invite_code) throw new Error(t('كود الدعوة غير صحيح أو تم تغييره'))
      db.session = { ...db.session, role: 'manager', full_name: fullName || db.session.full_name }
      if (!db.members.find((m) => m.user_id === db.session.id))
        db.members.push({ user_id: db.session.id, role: 'manager', full_name: db.session.full_name, email: db.session.email, created_at: new Date().toISOString() })
      save(); return db.org
    },
    async regenerateCode() { db.org.invite_code = Math.random().toString(36).slice(2, 10).toUpperCase(); save(); return db.org.invite_code },
    async updateOrg(p) { Object.assign(db.org, p); save(); return db.org },
    listMembers: () => wait(db.members),
    async removeMember(id) { db.members = db.members.filter((m) => m.user_id !== id); save() },

    listEntries: (f, t) => wait(db.entries.filter((e) => inRange(e.entry_date, f, t)).sort((a, b) => a.entry_date.localeCompare(b.entry_date))),
    async saveEntry(e) {
      const existing = db.entries.find((x) => x.entry_date === e.entry_date && x.id !== e.id)
      if (existing && !e.id) e = { ...e, id: existing.id }
      const r = upsertA('daily_entries', db.entries, e); save(); return wait(r)
    },
    async deleteEntry(id) { delA('daily_entries', 'entries', id); save() },

    listExpenses: (f, t) => wait(db.expenses.filter((e) => inRange(e.expense_date, f, t))),
    async saveExpense(x) { const r = upsertA('expenses', db.expenses, x); save(); return wait(r) },
    async deleteExpense(id) { delA('expenses', 'expenses', id); save() },

    uploadFile(folder, file) {
      return new Promise((res, rej) => {
        const fr = new FileReader()
        fr.onload = () => {
          const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
          const p = `demo/${folder}/${uid()}.${ext}`
          db.files[p] = fr.result; save(); res(p)
        }
        fr.onerror = rej
        fr.readAsDataURL(file)
      })
    },
    fileUrl: async (p) => db.files[p] || '',
    async removeFile(p) { delete db.files[p]; save() },

    listMonthlyFiles: (m) => wait(db.monthlyFiles.filter((f) => f.month === m)),
    async addMonthlyFile(row) { const r = upsert(db.monthlyFiles, row); save(); return r },
    async deleteMonthlyFile(id) { db.monthlyFiles = db.monthlyFiles.filter((f) => f.id !== id); save() },

    getReportNotes: async (p) => db.notes[p] || {},
    async saveReportNotes(p, data) { db.notes[p] = data; save() },

    listNotices: () => wait([...db.notices].sort((a, b) => b.created_at.localeCompare(a.created_at))),
    async saveNotice(n) { const r = upsertA('notices', db.notices, n); save(); return r },
    async deleteNotice(id) { delA('notices', 'notices', id); save() },

    listSuppliers: () => wait([...db.suppliers].sort((a, b) => a.name.localeCompare(b.name, 'ar'))),
    async saveSupplier(s) { const r = upsertA('suppliers', db.suppliers, s); save(); return r },
    async deleteSupplier(id) { delA('suppliers', 'suppliers', id); save() },
  }
  return api
}
