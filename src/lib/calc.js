import { money as m0, dmy } from './format.js'
import { t } from './i18n.jsx'
const money = (v) => '\u2066' + m0(v) + '\u2069'

const n = (v) => Number(v || 0)

/** Build per-day rows + totals for a period from entries + expenses */
export function computeReport(entries, expenses) {
  const byDay = new Map()
  const ensure = (date) => {
    if (!byDay.has(date)) byDay.set(date, { date, card: 0, cash: 0, other: 0, expenses: 0, entry: null, items: [] })
    return byDay.get(date)
  }
  for (const e of entries) {
    const r = ensure(e.entry_date)
    r.card += n(e.card_amount)
    r.cash += n(e.cash_amount)
    r.other += n(e.other_income)
    r.entry = e
  }
  for (const x of expenses) {
    const r = ensure(x.expense_date)
    r.expenses += n(x.amount)
    r.items.push(x)
  }
  const days = [...byDay.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({ ...r, total: r.card + r.cash + r.other, net: r.card + r.cash + r.other - r.expenses }))

  const t = days.reduce(
    (acc, r) => {
      acc.card += r.card; acc.cash += r.cash; acc.other += r.other
      acc.total += r.total; acc.expenses += r.expenses; acc.net += r.net
      return acc
    },
    { card: 0, cash: 0, other: 0, total: 0, expenses: 0, net: 0 },
  )

  const catMap = new Map()
  for (const x of expenses) catMap.set(x.category || 'أخرى', (catMap.get(x.category || 'أخرى') || 0) + n(x.amount))
  const categories = [...catMap.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)

  const recorded = days.filter((d) => d.entry)
  const best = recorded.reduce((b, d) => (!b || d.net > b.net ? d : b), null)
  const worst = recorded.reduce((b, d) => (!b || d.net < b.net ? d : b), null)
  const cardShare = t.total ? Math.round((t.card / t.total) * 100) : 0
  const expenseShare = t.total ? ((t.expenses / t.total) * 100).toFixed(1) : '0.0'
  const maxNet = Math.max(1, ...days.map((d) => Math.abs(d.net)))

  const sortedExpenses = [...expenses].sort((a, b) =>
    a.expense_date === b.expense_date ? String(a.created_at).localeCompare(String(b.created_at)) : a.expense_date.localeCompare(b.expense_date),
  )

  return { days, totals: t, categories, best, worst, cardShare, expenseShare, recordedCount: recorded.length, maxNet, expenses: sortedExpenses }
}

export function autoSummary(r) {
  if (!r.recordedCount) return t('لا توجد مداخيل مسجّلة في هذه الفترة بعد.')
  const T = r.totals
  let s = t('حقّقت المكتبة خلال الفترة إجمالي مداخيل قدره {a} ر.ق، منها {p}% عن طريق البطاقة. وبعد طرح المصاريف البالغة {e} ر.ق، يكون الصافي {n} ر.ق.', { a: money(T.total), p: r.cardShare, e: money(T.expenses), n: money(T.net) })
  if (r.best && r.worst && r.recordedCount > 1)
    s += ' ' + t('أعلى يوم صافٍ كان {d1} بـ {a1} ر.ق، وأدناه {d2} بـ {a2} ر.ق.', { d1: dmy(r.best.date), a1: money(r.best.net), d2: dmy(r.worst.date), a2: money(r.worst.net) })
  return s
}

const NOTE_AR = `تبقى صحة هذه الأرقام رهينة بالتأكيد النهائي من طرف السيد المسيّر، نظرًا لاطلاعه المباشر على التحويلات التي تتم عن طريق خدمة «فورا» وعلى كشوفات الحساب البنكي. وقد تظهر فوارق بسيطة بين هذا التقرير والمبالغ المودعة فعليًا، تعود أساسًا إلى:
• عمولات وخصومات البنك على عمليات الدفع بالبطاقة.
• رسوم تحويلات «فورا» أو تأخر قيدها.
• اختلاف تاريخ القيد البنكي عن تاريخ عملية البيع.
كما تجدر الإشارة إلى إمكانية وجود مداخيل أو مصاريف خارج إطار المكتبة لم تُدرج في هذا التقرير.`

export const defaultNote = () => t(NOTE_AR)
