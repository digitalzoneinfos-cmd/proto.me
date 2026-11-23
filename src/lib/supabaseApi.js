import { createClient } from '@supabase/supabase-js'
import { t } from './i18n.jsx'

const ERR = {
  'Invalid login credentials': 'البريد أو كلمة المرور غير صحيحة',
  'User already registered': 'هذا البريد مسجّل مسبقاً — سجّل الدخول',
  'Email not confirmed': 'يرجى تأكيد بريدك الإلكتروني أولاً (تحقق من صندوق الوارد)',
  INVALID_CODE: 'كود الدعوة غير صحيح أو تم تغييره',
}
const fail = (error) => {
  if (!error) return
  const key = Object.keys(ERR).find((k) => error.message?.includes(k))
  throw new Error(key ? t(ERR[key]) : error.message)
}

export function createSupabaseApi(url, key) {
  const sb = createClient(url, key)
  let orgId = null
  const urlCache = new Map()

  const q = async (p) => {
    const { data, error } = await p
    fail(error)
    return data
  }

  const api = {
    mode: 'supabase',
    setOrg: (id) => { orgId = id },

    // ---------- auth ----------
    async getUser() {
      const { data } = await sb.auth.getSession()
      return data.session?.user || null
    },
    onAuthChange(cb) {
      // لا نستدعي Supabase داخل المستمع مباشرة (يسبب تجمّداً) — نؤجّل الاستدعاء
      const { data } = sb.auth.onAuthStateChange((_e, s) => { setTimeout(() => cb(s?.user || null), 0) })
      return () => data.subscription.unsubscribe()
    },
    async signUp(email, password, fullName) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: location.origin + location.pathname } })
      fail(error)
      return { needsConfirm: !data.session }
    },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password })
      fail(error)
    },
    signOut: () => sb.auth.signOut(),

    // ---------- membership ----------
    async getMembership() {
      const user = await api.getUser()
      if (!user) return null
      const rows = await q(sb.from('memberships').select('role, full_name, org:organizations(*)').eq('user_id', user.id).limit(1))
      if (!rows?.length) return null
      return { role: rows[0].role, fullName: rows[0].full_name || user.user_metadata?.full_name || user.email, email: user.email, org: rows[0].org }
    },
    createOrg: (name, fullName) => q(sb.rpc('create_organization', { p_name: name, p_full_name: fullName })),
    joinWithCode: (code, fullName) => q(sb.rpc('join_with_code', { p_code: code, p_full_name: fullName })),
    regenerateCode: () => q(sb.rpc('regenerate_invite_code', { p_org: orgId })),
    updateOrg: (patch) => q(sb.from('organizations').update(patch).eq('id', orgId).select().single()),
    listMembers: () => q(sb.from('memberships').select('*').eq('org_id', orgId).order('created_at')),
    removeMember: (userId) => q(sb.from('memberships').delete().eq('org_id', orgId).eq('user_id', userId)),

    // ---------- entries ----------
    listEntries: (from, to) =>
      q(sb.from('daily_entries').select('*').eq('org_id', orgId).gte('entry_date', from).lte('entry_date', to).order('entry_date')),
    async saveEntry(e) {
      const row = { ...e, org_id: orgId, updated_at: new Date().toISOString() }
      delete row.created_at
      if (!row.id) delete row.id
      return q(sb.from('daily_entries').upsert(row, { onConflict: 'org_id,entry_date' }).select().single())
    },
    deleteEntry: (id) => q(sb.from('daily_entries').delete().eq('id', id)),

    // ---------- expenses ----------
    listExpenses: (from, to) =>
      q(sb.from('expenses').select('*').eq('org_id', orgId).gte('expense_date', from).lte('expense_date', to).order('expense_date').order('created_at')),
    async saveExpense(x) {
      const row = { ...x, org_id: orgId }
      if (row.id) return q(sb.from('expenses').update(row).eq('id', row.id).select().single())
      delete row.id
      return q(sb.from('expenses').insert(row).select().single())
    },
    deleteExpense: (id) => q(sb.from('expenses').delete().eq('id', id)),

    // ---------- files ----------
    async uploadFile(folder, file) {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
      const path = `${orgId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error } = await sb.storage.from('files').upload(path, file, { contentType: file.type, upsert: false })
      fail(error)
      return path
    },
    async fileUrl(path) {
      const c = urlCache.get(path)
      if (c && c.exp > Date.now()) return c.url
      const { data, error } = await sb.storage.from('files').createSignedUrl(path, 3600)
      fail(error)
      urlCache.set(path, { url: data.signedUrl, exp: Date.now() + 3500e3 })
      return data.signedUrl
    },
    removeFile: (path) => sb.storage.from('files').remove([path]),

    listMonthlyFiles: (month) => q(sb.from('monthly_files').select('*').eq('org_id', orgId).eq('month', month).order('created_at')),
    addMonthlyFile: (row) => q(sb.from('monthly_files').insert({ ...row, org_id: orgId }).select().single()),
    deleteMonthlyFile: (id) => q(sb.from('monthly_files').delete().eq('id', id)),

    // ---------- report notes ----------
    async getReportNotes(period) {
      const rows = await q(sb.from('report_notes').select('data').eq('org_id', orgId).eq('period', period))
      return rows?.[0]?.data || {}
    },
    saveReportNotes: (period, data) =>
      q(sb.from('report_notes').upsert({ org_id: orgId, period, data, updated_at: new Date().toISOString() })),

    // ---------- notices ----------
    listNotices: () => q(sb.from('notices').select('*').eq('org_id', orgId).order('created_at', { ascending: false })),
    async saveNotice(n) {
      const row = { ...n, org_id: orgId }
      if (row.id) return q(sb.from('notices').update(row).eq('id', row.id).select().single())
      delete row.id
      return q(sb.from('notices').insert(row).select().single())
    },
    deleteNotice: (id) => q(sb.from('notices').delete().eq('id', id)),

    // ---------- suppliers ----------
    listSuppliers: () => q(sb.from('suppliers').select('*').eq('org_id', orgId).order('name')),
    async saveSupplier(s) {
      const row = { ...s, org_id: orgId }
      if (row.id) return q(sb.from('suppliers').update(row).eq('id', row.id).select().single())
      delete row.id
      return q(sb.from('suppliers').insert(row).select().single())
    },
    deleteSupplier: (id) => q(sb.from('suppliers').delete().eq('id', id)),
  }
  return api
}
