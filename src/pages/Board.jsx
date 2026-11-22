import { t } from '../lib/i18n.jsx'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { NOTICE_KINDS, STATUS, PRIORITY, timeAgo, waLink } from '../lib/format.js'
import { Icon, WhatsAppIcon } from '../components/Icons.jsx'
import { Modal, Confirm, useLoad, useToast, Loading, Empty } from '../components/ui.jsx'

const changed = () => window.dispatchEvent(new Event('notices-changed'))

function NoticeForm({ kind, initial, onClose, onSaved }) {
  const [n, setN] = useState({ kind, title: '', details: '', quantity: '', author: '', priority: 'normal', status: 'open', ...initial })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setN((s) => ({ ...s, [k]: e.target.value }))
  const save = async () => {
    if (!n.title.trim()) return
    setBusy(true)
    try { await api.saveNotice(n); onSaved(); onClose() } finally { setBusy(false) }
  }
  return (
    <Modal title={t(n.id ? 'تعديل {x}' : 'إضافة {x}', { x: NOTICE_KINDS[kind].single })} onClose={onClose}
      footer={<><button className="btn primary" disabled={busy || !n.title.trim()} onClick={save}>{t('حفظ')}</button><button className="btn ghost" onClick={onClose}>{t('إلغاء')}</button></>}>
      <div className="form-grid">
        <div className="field full"><label>{t('العنوان')}</label><input className="input" autoFocus value={n.title} onChange={set('title')} placeholder={kind === 'supply' ? t('مثال: ورق طباعة A4') : ''} /></div>
        {kind === 'supply' && <div className="field"><label>{t('الكمية')}</label><input className="input" value={n.quantity || ''} onChange={set('quantity')} placeholder={t('مثال: 5 كراتين')} /></div>}
        <div className="field"><label>{t('صاحب الطلب / المقترِح')}</label><input className="input" value={n.author || ''} onChange={set('author')} /></div>
        <div className="field full"><label>{t('التفاصيل')}</label><textarea className="textarea" value={n.details || ''} onChange={set('details')} /></div>
        <div className="field"><label>{t('الأولوية')}</label><select className="select" value={n.priority} onChange={set('priority')}>{Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="field"><label>{t('الحالة')}</label><select className="select" value={n.status} onChange={set('status')}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
      </div>
    </Modal>
  )
}

export default function Board() {
  const { kind } = useParams()
  const meta = NOTICE_KINDS[kind] || NOTICE_KINDS.supply
  const { isAdmin } = useAuth()
  const { loading, data, reload } = useLoad(() => api.listNotices(), [])
  const [filter, setFilter] = useState('active')
  const [edit, setEdit] = useState(null)
  const [del, setDel] = useState(null)
  const toast = useToast()

  const all = useMemo(() => (data || []).filter((n) => n.kind === kind), [data, kind])
  const counts = { active: all.filter((n) => n.status !== 'done').length, done: all.filter((n) => n.status === 'done').length, all: all.length }
  const list = all.filter((n) => (filter === 'all' ? true : filter === 'done' ? n.status === 'done' : n.status !== 'done'))
    .sort((a, b) => (b.priority === 'high') - (a.priority === 'high'))
  const refresh = () => { reload(); changed() }

  const setStatus = async (n, status) => { await api.saveNotice({ ...n, status }); refresh(); toast(t('الحالة: {s}', { s: STATUS[status].label })) }

  const shareList = () => {
    const open = all.filter((n) => n.status !== 'done')
    const text = `${meta.title}:\n` + open.map((n, i) => `${i + 1}. ${n.title}${n.quantity ? ` — ${n.quantity}` : ''}`).join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{meta.title}</h1>
          <div className="page-sub">{meta.hint}</div>
        </div>
        <div className="head-actions">
          {kind === 'supply' && counts.active > 0 && <button className="btn" onClick={shareList}><WhatsAppIcon size={16} />{t('مشاركة القائمة')}</button>}
          {isAdmin && <button className="btn primary" onClick={() => setEdit({})}><Icon name="plus" size={16} />{t('إضافة {x}', { x: meta.single })}</button>}
        </div>
      </div>

      <div className="tabs">
        {[['active', t('المفتوحة')], ['done', t('المنجزة')], ['all', t('الكل')]].map(([k, l]) => (
          <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l} <span className="num faint" style={{ marginInlineStart: 6 }}>{counts[k]}</span></button>
        ))}
      </div>

      {loading ? <Loading /> : !list.length ? (
        <div className="panel"><Empty icon={kind === 'supply' ? 'box' : kind === 'suggestion' ? 'bulb' : 'users'} title={t('لا شيء هنا')} text={filter === 'active' ? t('لا توجد عناصر مفتوحة حالياً.') : t('القائمة فارغة.')} /></div>
      ) : (
        <div className="cards">
          {list.map((n, i) => (
            <div className="ncard" key={n.id} style={{ animationDelay: `${i * 0.04}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span className="badge"><i style={{ background: STATUS[n.status].color }} />{STATUS[n.status].label}</span>
                <span className={`tag ${n.priority === 'high' ? 'high' : ''}`}>{PRIORITY[n.priority]}</span>
              </div>
              <h4>{n.title}{n.quantity && <span className="muted" style={{ fontWeight: 400 }}> — {n.quantity}</span>}</h4>
              {n.details && <p>{n.details}</p>}
              <div className="meta"><span>{n.author || '—'}</span><span>{timeAgo(n.created_at)}</span></div>
              {isAdmin && (
                <div className="acts">
                  {n.status !== 'progress' && n.status !== 'done' && <button className="btn sm" onClick={() => setStatus(n, 'progress')}>{t('قيد المعالجة')}</button>}
                  {n.status !== 'done' ? <button className="btn sm" onClick={() => setStatus(n, 'done')}><Icon name="check" size={14} />{t('تم')}</button>
                    : <button className="btn sm" onClick={() => setStatus(n, 'open')}>{t('إعادة فتح')}</button>}
                  <div style={{ flex: 1 }} />
                  <button className="icon-btn" onClick={() => setEdit(n)} aria-label={t('تعديل')}><Icon name="edit" size={15} /></button>
                  <button className="icon-btn" style={{ color: 'var(--red)' }} onClick={() => setDel(n)} aria-label={t('حذف')}><Icon name="trash" size={15} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {edit && <NoticeForm kind={kind} initial={edit} onClose={() => setEdit(null)} onSaved={() => { refresh(); toast('تم الحفظ ✔') }} />}
      {del && <Confirm text={t('حذف «{x}»؟', { x: del.title })} onClose={() => setDel(null)} onYes={async () => { await api.deleteNotice(del.id); refresh() }} />}
    </>
  )
}

/* ====================== الموردون ====================== */
function SupplierForm({ initial, onClose, onSaved }) {
  const [s, setS] = useState({ name: '', company: '', phone: '', category: '', notes: '', ...initial })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setS((x) => ({ ...x, [k]: e.target.value }))
  const ok = s.name.trim() && s.phone.trim()
  return (
    <Modal title={s.id ? t('تعديل مورد') : t('مورد جديد')} onClose={onClose}
      footer={<><button className="btn primary" disabled={!ok || busy} onClick={async () => { setBusy(true); try { await api.saveSupplier(s); onSaved(); onClose() } finally { setBusy(false) } }}>{t('حفظ')}</button><button className="btn ghost" onClick={onClose}>{t('إلغاء')}</button></>}>
      <div className="form-grid">
        <div className="field"><label>{t('الاسم')}</label><input className="input" autoFocus value={s.name} onChange={set('name')} /></div>
        <div className="field"><label>{t('الشركة')}</label><input className="input" value={s.company || ''} onChange={set('company')} /></div>
        <div className="field"><label>{t('رقم الهاتف / واتساب')}</label><input className="input ltr" type="tel" value={s.phone} onChange={set('phone')} placeholder="+974 5xxx xxxx" /></div>
        <div className="field"><label>{t('المجال')}</label><input className="input" value={s.category || ''} onChange={set('category')} placeholder={t('كتب، قرطاسية، حبر…')} /></div>
        <div className="field full"><label>{t('ملاحظات')}</label><textarea className="textarea" value={s.notes || ''} onChange={set('notes')} /></div>
      </div>
      <span className="faint" style={{ fontSize: 12 }}>{t('الأرقام القطرية من 8 أرقام يُضاف لها مفتاح 974 تلقائياً عند فتح واتساب.')}</span>
    </Modal>
  )
}

export function Suppliers() {
  const { isAdmin, org } = useAuth()
  const { loading, data, reload } = useLoad(() => api.listSuppliers(), [])
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)
  const [del, setDel] = useState(null)
  const list = (data || []).filter((s) => !q || [s.name, s.company, s.category, s.phone].join(' ').includes(q))

  return (
    <>
      <div className="page-head">
        <div><h1 className="page-title">{t('الموردون')}</h1><div className="page-sub">{t('{n} جهة اتصال — تواصل مباشرة عبر واتساب أو الهاتف', { n: data?.length || 0 })}</div></div>
        <div className="head-actions">
          <input className="input" style={{ width: 220 }} placeholder={t('بحث…')} value={q} onChange={(e) => setQ(e.target.value)} />
          {isAdmin && <button className="btn primary" onClick={() => setEdit({})}><Icon name="plus" size={16} />{t('مورد جديد')}</button>}
        </div>
      </div>
      {loading ? <Loading /> : !list.length ? <div className="panel"><Empty icon="truck" title={t('لا يوجد موردون')} /></div> : (
        <div className="cards">
          {list.map((s, i) => (
            <div className="scard" key={s.id} style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="top">
                <div className="mono">{s.name.trim()[0]}</div>
                <div style={{ minWidth: 0 }}>
                  <strong>{s.name}{s.company && <span className="muted" style={{ fontWeight: 400 }}> — {s.company}</span>}</strong>
                  <div className="num muted" style={{ fontSize: 13 }}>{s.phone}</div>
                </div>
              </div>
              <div className="body">
                {s.category && <span><span className="tag">{s.category}</span></span>}
                {s.notes && <span>{s.notes}</span>}
              </div>
              <div className="foot">
                <a className="wa" href={waLink(s.phone, t('السلام عليكم {a}، معك {b}.', { a: s.name, b: org?.name || '' }))} target="_blank" rel="noreferrer"><WhatsAppIcon size={17} />{t('واتساب')}</a>
                <a href={`tel:${s.phone.replace(/\s/g, '')}`}><Icon name="phone" size={16} />{t('اتصال')}</a>
                {isAdmin ? (
                  <span style={{ display: 'flex', padding: '0 6px' }}>
                    <button className="icon-btn" onClick={() => setEdit(s)} aria-label={t('تعديل')}><Icon name="edit" size={15} /></button>
                    <button className="icon-btn" style={{ color: 'var(--red)' }} onClick={() => setDel(s)} aria-label={t('حذف')}><Icon name="trash" size={15} /></button>
                  </span>
                ) : <span />}
              </div>
            </div>
          ))}
        </div>
      )}
      {edit && <SupplierForm initial={edit} onClose={() => setEdit(null)} onSaved={reload} />}
      {del && <Confirm text={t('حذف المورد «{x}»؟', { x: del.name })} onClose={() => setDel(null)} onYes={async () => { await api.deleteSupplier(del.id); reload() }} />}
    </>
  )
}
