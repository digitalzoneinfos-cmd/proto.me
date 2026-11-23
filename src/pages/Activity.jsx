import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { t } from '../lib/i18n.jsx'
import { money, dmy, iso, timeAgo, STATUS } from '../lib/format.js'
import { Icon } from '../components/Icons.jsx'
import { Loading, Empty } from '../components/ui.jsx'

const ENTITY = {
  daily_entries: { label: 'المداخيل', icon: 'wallet' },
  expenses: { label: 'المصاريف', icon: 'receipt' },
  notices: { label: 'التنبيهات', icon: 'bell' },
  suppliers: { label: 'الموردون', icon: 'truck' },
}
const ACTION = {
  insert: { label: 'أضاف', color: 'var(--green)' },
  update: { label: 'عدّل', color: 'var(--yellow)' },
  delete: { label: 'حذفَ', color: 'var(--red)' },
}

/** وصف مختصر لما تغيّر */
function describe(a) {
  const o = a.old_data || {}, n = a.new_data || {}
  const r = a.new_data || a.old_data || {}
  const changes = []
  const diff = (key, label, fmt = (v) => v ?? '—') => {
    if (a.action === 'update' && String(o[key] ?? '') !== String(n[key] ?? '')) changes.push(`${t(label)}: ${fmt(o[key])} → ${fmt(n[key])}`)
  }
  let title = ''
  if (a.entity === 'daily_entries') {
    title = t('مداخيل يوم {d}', { d: dmy(r.entry_date) })
    if (a.action !== 'update') changes.push(`${t('بطاقة')} ${money(r.card_amount)} · ${t('نقد')} ${money(r.cash_amount)}${Number(r.other_income) ? ` · ${t('أخرى')} ${money(r.other_income)}` : ''}`)
    diff('card_amount', 'بطاقة', money); diff('cash_amount', 'نقد', money); diff('other_income', 'أخرى', money); diff('notes', 'ملاحظات')
    if (a.action === 'update' && (o.report_paths || []).length !== (n.report_paths || []).length) changes.push(`${t('صور التقرير')}: ${(o.report_paths || []).length} → ${(n.report_paths || []).length}`)
  } else if (a.entity === 'expenses') {
    title = `${r.description} — ${money(r.amount)} ${t('ر.ق')}`
    if (a.action !== 'update') changes.push(`${dmy(r.expense_date)} · ${t(r.category || 'أخرى')}`)
    diff('amount', 'المبلغ', money); diff('description', 'البيان'); diff('expense_date', 'التاريخ', dmy); diff('category', 'الفئة', (v) => t(v || ''))
    if (a.action === 'update' && (o.receipt_paths || []).length !== (n.receipt_paths || []).length) changes.push(`${t('الوصولات')}: ${(o.receipt_paths || []).length} → ${(n.receipt_paths || []).length}`)
  } else if (a.entity === 'notices') {
    title = r.title
    diff('status', 'الحالة', (v) => STATUS[v]?.label || v); diff('title', 'العنوان'); diff('quantity', 'الكمية')
  } else if (a.entity === 'suppliers') {
    title = r.name
    diff('phone', 'الهاتف'); diff('name', 'الاسم')
  }
  if (a.action === 'update' && !changes.length) changes.push(t('تعديل بسيط'))
  return { title, changes }
}

export default function Activity() {
  const [items, setItems] = useState(null)
  const [more, setMore] = useState(true)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('')

  const load = async (before) => {
    setBusy(true)
    try {
      const rows = await api.listAudit({ limit: 50, before })
      setItems((x) => (before ? [...(x || []), ...rows] : rows))
      setMore(rows.length === 50)
    } catch (e) { console.error(e); setItems((x) => x || []) } finally { setBusy(false) }
  }
  useEffect(() => { load() }, [])

  const list = (items || []).filter((a) => !filter || a.entity === filter)
  const groups = []
  for (const a of list) {
    const d = iso(new Date(a.at))
    if (!groups.length || groups[groups.length - 1].d !== d) groups.push({ d, rows: [] })
    groups[groups.length - 1].rows.push(a)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t('سجل التعديلات')}</h1>
          <div className="page-sub">{t('كل إضافة أو تعديل أو حذف، مع صاحبها ووقتها.')}</div>
        </div>
        <div className="head-actions">
          <select className="select" style={{ width: 'auto', minWidth: 180 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">{t('كل الأقسام')}</option>
            {Object.entries(ENTITY).map(([k, v]) => <option key={k} value={k}>{t(v.label)}</option>)}
          </select>
        </div>
      </div>

      {items === null ? <Loading /> : !list.length ? (
        <div className="panel"><Empty icon="refresh" title={t('لا توجد تعديلات بعد')} text={t('ستظهر هنا كل العمليات على المداخيل والمصاريف والتنبيهات والموردين.')} /></div>
      ) : (
        <div className="panel">
          {groups.map((g) => (
            <div key={g.d}>
              <div className="act-day">{dmy(g.d)}</div>
              {g.rows.map((a) => {
                const d = describe(a)
                const ac = ACTION[a.action]
                return (
                  <div className="act-row" key={a.id}>
                    <span className="act-ico" style={{ color: ac.color, borderColor: ac.color }}><Icon name={ENTITY[a.entity]?.icon || 'file'} size={16} /></span>
                    <div className="act-body">
                      <div><b>{a.user_name || t('مستخدم')}</b> <span style={{ color: ac.color }}>{t(ac.label)}</span> <span className="muted">· {t(ENTITY[a.entity]?.label || a.entity)}</span></div>
                      <div className="act-title">{d.title}</div>
                      {d.changes.map((c, i) => <div key={i} className="act-change">{c}</div>)}
                    </div>
                    <span className="act-time" title={new Date(a.at).toLocaleString()}>{timeAgo(a.at)}</span>
                  </div>
                )
              })}
            </div>
          ))}
          {more && filter === '' && (
            <div style={{ padding: 14, textAlign: 'center' }}>
              <button className="btn" disabled={busy} onClick={() => load(items[items.length - 1]?.at)}>{busy ? '…' : t('تحميل المزيد')}</button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
