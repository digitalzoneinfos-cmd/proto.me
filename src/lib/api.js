import { createSupabaseApi } from './supabaseApi.js'
import { createMockApi } from './mockApi.js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/** إذا لم تُضبط مفاتيح Supabase يعمل التطبيق في الوضع التجريبي */
export const api = url && key ? createSupabaseApi(url, key) : createMockApi()
export const isDemo = api.mode === 'demo'

/** في النسخة المنشورة: لا وضع تجريبي إلا إذا طُلب صراحةً (VITE_ALLOW_DEMO=1) */
export const misconfigured = isDemo && import.meta.env.PROD && import.meta.env.VITE_ALLOW_DEMO !== '1'
