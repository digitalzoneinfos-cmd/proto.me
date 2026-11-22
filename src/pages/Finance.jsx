import { t } from '../lib/i18n.jsx'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { useReport } from '../lib/hooks.js'
import { money, iso, dmy, dayName, monthKey, monthRange, monthLabel, EXPENSE_CATEGORIES } from '../lib/format.js'
import { Icon } from '../components/Icons.jsx'
import { DayStepper, MonthStepper, Modal, Confirm, Uploader, useToast, Loading } from '../components/ui.jsx'
import { ExpensesTable } from './Reports.jsx'

/* ====================== نموذج المصروف ====================== */
export function ExpenseForm({ initial, onClose, onSaved }) {
  const [x, setX] = useState(() => ({ expense_date: iso(), description: '', category: 'أخرى', amount: '', receipt_paths: [], ...initial }))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const toast = useToast()
  const set = (k) => (e) => setX((s) => ({ ...s, [k]: e.target.value }))
  const save = async () => {
    if (!x.description.trim()) return setErr(t('اكتب البيان'))
    if (!(Number(x.amount) >= 0) || x.amount === '') return setErr(t('أدخل مبلغاً صحيحاً'))
    setBusy(true)
    try {
      await api.saveExpense({ ...x, amount: Number(x.amount), description: x.description.trim() })
      toast(x.id ? t('تم تعديل المصروف ✔') : t('تمت إضافة المصروف ✔'))
      onSaved()
      onClose()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={x.id ? t('تعديل مصروف') : t('مصروف جديد')} onClose={onClose}
      footer={<><button className="btn primary" disabled={busy} onClick={save}>{busy ? '…' : t('حفظ')}</button><button className="btn ghost" onClick={onClose}>{t('إلغاء')}</button></>}>
      <div className="form-grid">
        <div className="field"><label>{t('التاريخ')}</label><input className="input" type="date" value={x.expense_date} onChange={set('expense_date')} /></div>
        <div className="field"><label>{t('المبلغ (ر.ق)')}</label><input className="input ltr" inputMode="decimal" type="number" step="0.01" min="0" value={x.amount} onChange={set('amount')} placeholder="0.00" autoFocus={!x.id} /></div>
        <div className="field full"><label>{t('البيان')}</label><input className="input" value={x.description} onChange={set('description')} placeholder={t('مثال: المصري — أبجد (مورّد)')} list="desc-hints" /></div>
        <div className="field full"><label>{t('الفئة')}</label>
          <select className="select" value={x.category} onChange={set('category')}>{EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}</select>
        </div>
        <div className="field full"><label>{t('صور / ملفات الوصل')}</label>
          <Uploader folder="receipts" paths={x.receipt_paths || []} onChange={(p) => setX((s) => ({ ...s, receipt_paths: p }))} />
        </div>
      </div>
      {err && <div className="err">{err}</div>}
    </Modal>
  )
}

/* ====================== صفحة المصاريف ====================== */
export function Expenses() {
  const { isAdmin } = useAuth()
  const [sp, setSp] = useSearchParams()
  const [month, setMonth] = useState(() => (sp.get('add') ? sp.get('add').slice(0, 7) : monthKey()))
  const { from, to } = monthRange(month)
  const { loading, report, reload } = useReport(from, to)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [receipt, setReceipt] = useState('')
  const [edit, setEdit] = useState(sp.get('add') && isAdmin ? { expense_date: sp.get('add') } : null)
  const [del, setDel] = useState(null)
  const toast = useToast()

  const list = useMemo(() => report.expenses.filter((x) =>
    (!q || x.description.includes(q)) && (!cat || x.category === cat) &&
    (!receipt || (receipt === 'yes' ? x.receipt_paths?.length : !x.receipt_paths?.length)),
  ), [report.expenses, q, cat, receipt])
  const sum = list.reduce((a, x) => a + Number(x.amount), 0)

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t('المصاريف')}</h1>
          <div className="page-sub">{t('{n} مصروف في {m} — المجموع', { n: report.expenses.length, m: monthLabel(month) })} <span className="num">{money(report.totals.expenses)}</span> {t('ر.ق')}</div>
        </div>
        <div className="head-actions">
          <MonthStepper value={month} onChange={setMonth} />
          {isAdmin && <button className="btn primary" onClick={() => setEdit({})}><Icon name="plus" size={16} />{t('مصروف جديد')}</button>}
        </div>
      </div>

      <div className="grid g-4">
        {report.categories.slice(0, 4).map((c) => (
          <button key={c.name} className="panel stat" style={{ textAlign: 'start', cursor: 'pointer', borderColor: cat === c.name ? 'var(--blue)' : undefined }} onClick={() => setCat(cat === c.name ? '' : c.name)}>
            <span className="k">{t(c.name)}</span><span className="v num" style={{ fontSize: 24 }}>{money(c.amount)}<small>QAR</small></span>
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="filters">
          <input className="input" placeholder={t('بحث في المصاريف…')} value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">{t('كل الفئات')}</option>{EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}
          </select>
          <select className="select" value={receipt} onChange={(e) => setReceipt(e.target.value)}>
            <option value="">{t('الوصل: الكل')}</option><option value="yes">{t('مع وصل')}</option><option value="no">{t('بدون وصل')}</option>
          </select>
          <button className="btn" onClick={() => { setQ(''); setCat(''); setReceipt('') }}>{t('إعادة ضبط')}</button>
        </div>
        {loading ? <Loading /> : (
          <ExpensesTable expenses={list} onEdit={isAdmin ? (x) => setEdit(x) : undefined} onDelete={isAdmin ? (x) => setDel(x) : undefined} />
        )}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }} className="muted">
          <span>{t('عرض {a} من {b}', { a: list.length, b: report.expenses.length })}</span><span>{t('المجموع:')} <b className="num" style={{ color: 'var(--text)' }}>{money(sum)}</b> {t('ر.ق')}</span>
        </div>
      </div>

      {edit && <ExpenseForm initial={edit} onClose={() => { setEdit(null); if (sp.get('add')) setSp({}) }} onSaved={reload} />}
      {del && <Confirm text={t('حذف المصروف «{d}» بمبلغ {a} ر.ق؟', { d: del.description, a: money(del.amount) })} onClose={() => setDel(null)}
        onYes={async () => { await api.deleteExpense(del.id); for (const p of del.receipt_paths || []) await api.removeFile(p); reload(); toast('تم الحذف') }} />}
    </>
  )
}

/* ====================== إدخال المداخيل (أدمن) ====================== */
const EMPTY = { card_amount: '', cash_amount: '', other_income: '', other_income_note: '', notes: '', report_paths: [] }

export function Entries() {
  const [sp, setSp] = useSearchParams()
  const day = sp.get('d') || iso()
  const setDay = (d) => setSp({ d })
  const month = day.slice(0, 7)
  const { from, to } = monthRange(month)
  const { loading, report, reload } = useReport(from, to)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [addExp, setAddExp] = useState(false)
  const [editExp, setEditExp] = useState(null)
  const [del, setDel] = useState(null)
  const toast = useToast()

  const row = report.days.find((d) => d.date === day)
  const entry = row?.entry
  useEffect(() => {
    setForm(entry ? { ...EMPTY, ...entry, other_income: entry.other_income || '' } : EMPTY)
  }, [entry?.id, day]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const card = Number(form.card_amount || 0), cash = Number(form.cash_amount || 0), other = Number(form.other_income || 0)
  const exp = row?.expenses || 0
  const total = card + cash + other

  const save = async () => {
    setBusy(true)
    try {
      await api.saveEntry({
        id: entry?.id, entry_date: day, card_amount: card, cash_amount: cash, other_income: other,
        other_income_note: form.other_income_note || null, notes: form.notes || null, report_paths: form.report_paths || [],
      })
      toast('تم حفظ مداخيل اليوم ✔')
      reload()
    } catch (e) { toast('خطأ: ' + e.message) } finally { setBusy(false) }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t('إدخال المداخيل')}</h1>
          <div className="page-sub">{dayName(day)} {dmy(day)} — {entry ? t('يوم مسجّل، يمكنك تعديله') : t('يوم جديد')}</div>
        </div>
        <div className="head-actions">
          <DayStepper value={day} onChange={setDay} />
          <Link className="btn" to={`/daily?d=${day}`}><Icon name="report" size={16} />{t('التقرير اليومي')}</Link>
        </div>
      </div>

      <div className="grid g-3-2">
        <div className="panel panel-pad" style={{ display: 'grid', gap: 18 }}>
          <div className="form-grid">
            <div className="field"><label>{t('دخل البطاقة (ر.ق)')}</label><input className="input ltr" style={{ height: 52, fontSize: 20, fontWeight: 700 }} type="number" step="0.01" min="0" inputMode="decimal" value={form.card_amount} onChange={set('card_amount')} placeholder="0.00" /></div>
            <div className="field"><label>{t('دخل الكاش (ر.ق)')}</label><input className="input ltr" style={{ height: 52, fontSize: 20, fontWeight: 700 }} type="number" step="0.01" min="0" inputMode="decimal" value={form.cash_amount} onChange={set('cash_amount')} placeholder="0.00" /></div>
            <div className="field"><label>{t('مداخيل أخرى (اختياري)')}</label><input className="input ltr" type="number" step="0.01" min="0" value={form.other_income} onChange={set('other_income')} placeholder="0.00" /></div>
            <div className="field"><label>{t('مصدرها')}</label><input className="input" value={form.other_income_note || ''} onChange={set('other_income_note')} placeholder={t('مثال: سلفة من…')} /></div>
            <div className="field full"><label>{t('ملاحظات اليوم')}</label><textarea className="textarea" value={form.notes || ''} onChange={set('notes')} placeholder={t('أي ملاحظة تظهر في التقرير اليومي')} /></div>
            <div className="field full"><label>{t('صورة التقرير اليومي (Day Close / ورقة الكاش)')}</label>
              <Uploader folder="daily" paths={form.report_paths || []} label={t('ارفع صورة التقرير اليومي')} onChange={(p) => setForm((f) => ({ ...f, report_paths: p }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn primary" style={{ height: 48, flex: 1 }} disabled={busy} onClick={save}><Icon name="check" size={16} />{busy ? t('جارٍ الحفظ…') : t('حفظ اليوم')}</button>
            {entry && <button className="btn danger" style={{ height: 48 }} onClick={() => setDel({ type: 'entry' })}><Icon name="trash" size={16} />{t('حذف')}</button>}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 22, alignContent: 'start' }}>
          <div className="panel stat accent">
            <span className="k">{t('صافي اليوم (حساب تلقائي)')}</span>
            <span className="v num" style={{ fontSize: 40 }}>{money(total - exp)}<small>QAR</small></span>
            <div style={{ display: 'grid', gap: 6, fontSize: 13, marginTop: 6, color: 'rgba(255,255,255,.9)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('إجمالي اليوم')}</span><b className="num">{money(total)}</b></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('مصاريف اليوم')}</span><b className="num">− {money(exp)}</b></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('نسبة البطاقة')}</span><b className="num">{total ? Math.round((card / total) * 100) : 0}%</b></div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><h3>{t('مصاريف هذا اليوم')}</h3><button className="link" onClick={() => setAddExp(true)}>{t('+ إضافة مصروف')}</button></div>
            <div className="list panel-pad" style={{ paddingTop: 6 }}>
              {(row?.items || []).map((x) => (
                <div className="list-row" key={x.id} style={{ alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div>{x.description}</div>
                    <div className="faint" style={{ fontSize: 12 }}>{t(x.category)} · {x.receipt_paths?.length ? t('{n} وصل', { n: x.receipt_paths.length }) : t('بدون وصل')}</div>
                  </div>
                  <b className="num">{money(x.amount)}</b>
                  <button className="icon-btn" onClick={() => setEditExp(x)} aria-label={t('تعديل')}><Icon name="edit" size={15} /></button>
                </div>
              ))}
              {!row?.items?.length && <span className="muted" style={{ fontSize: 13 }}>{t('لا توجد مصاريف لهذا اليوم.')}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>{t('أيام {m}', { m: monthLabel(month) })}</h3><span className="faint" style={{ fontSize: 12 }}>{t('اضغط على يوم لتعديله')}</span></div>
        {loading ? <Loading /> : (
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="t">
              <thead><tr><th>{t('التاريخ')}</th><th>{t('البطاقة')}</th><th>{t('الكاش')}</th><th>{t('المصاريف')}</th><th>{t('الصافي')}</th><th>{t('صورة التقرير')}</th></tr></thead>
              <tbody>
                {report.days.map((d) => (
                  <tr key={d.date} style={{ cursor: 'pointer', background: d.date === day ? 'var(--blue-soft)' : undefined }} onClick={() => setDay(d.date)}>
                    <td>{dayName(d.date)} <span className="num">{dmy(d.date)}</span></td>
                    <td className="num">{d.entry ? money(d.card) : <span className="faint">{t('لم يُدخل')}</span>}</td>
                    <td className="num">{d.entry ? money(d.cash) : '—'}</td>
                    <td className="num neg">{d.expenses ? money(d.expenses) : '—'}</td>
                    <td className={`num ${d.net < 0 ? 'neg' : ''}`} style={{ fontWeight: 700 }}>{money(d.net)}</td>
                    <td>{d.entry?.report_paths?.length ? <span className="badge"><i style={{ background: 'var(--green)' }} />{t('مرفوعة')}</span> : <span className="badge"><i style={{ background: 'var(--line)' }} />—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {addExp && <ExpenseForm initial={{ expense_date: day }} onClose={() => setAddExp(false)} onSaved={reload} />}
      {editExp && <ExpenseForm initial={editExp} onClose={() => setEditExp(null)} onSaved={reload} />}
      {del && <Confirm text={t('حذف مداخيل يوم {d}؟ (المصاريف لا تُحذف)', { d: dmy(day) })} onClose={() => setDel(null)}
        onYes={async () => { await api.deleteEntry(entry.id); reload(); toast('تم الحذف') }} />}
    </>
  )
}
