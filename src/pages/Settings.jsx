import { t } from '../lib/i18n.jsx'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api, isDemo } from '../lib/api.js'
import { dmy, iso } from '../lib/format.js'
import { Icon, WhatsAppIcon } from '../components/Icons.jsx'
import { Confirm, useLoad, useToast } from '../components/ui.jsx'
import { LANGS, getLang, setLang } from '../lib/i18n.jsx'
import { fmtBytes } from '../lib/compress.js'

export default function Settings() {
  const { org, isAdmin, setOrg, membership } = useAuth()
  const toast = useToast()
  const [reveal, setReveal] = useState(false)
  const [info, setInfo] = useState({ name: org?.name || '', address: org?.address || '', phone: org?.phone || '' })
  const [confirmRegen, setConfirmRegen] = useState(false)
  const [rm, setRm] = useState(null)
  const members = useLoad(() => api.listMembers(), [])
  const usage = useLoad(() => (isAdmin ? api.storageUsage() : Promise.resolve(null)), [isAdmin])
  const LIMIT = 1024 ** 3
  const [lang, setL] = useState(org?.language || getLang())
  const saveLang = async () => {
    try { const o = await api.updateOrg({ language: lang }); setOrg({ ...org, ...o, language: lang }) } catch (e) { toast(e.message); return }
    setLang(lang)
  }

  const copy = async (text) => { try { await navigator.clipboard.writeText(text); toast('تم النسخ ✔') } catch { toast(text) } }
  const inviteMsg = t('مرحباً، هذا كود الدعوة للدخول إلى لوحة تقارير {s}:', { s: org?.name }) + `\n${org?.invite_code}\n\n` + t('حمّل التطبيق، أنشئ حسابك، ثم أدخل الكود.') + `\n${location.origin}${location.pathname}`

  return (
    <>
      <div className="page-head"><div><h1 className="page-title">{t('الإعدادات')}</h1><div className="page-sub">{isAdmin ? t('المتجر، كود الدعوة، والأعضاء') : t('معلومات حسابك')}</div></div></div>

      {isAdmin && (
        <div className="grid g-2">
          <div className="panel panel-pad" style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name="key" /><strong>{t('كود الدعوة السري')}</strong></div>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>{t('شاركه فقط مع المسيّرين. بعد إنشاء حسابهم يُطلب منهم هذا الكود للوصول إلى بيانات المتجر (اطلاع فقط).')}</p>
            <div className={`invite-code ${reveal ? '' : 'blur'}`}>{org?.invite_code}</div>
            <div className="settings-actions">
              <button className="btn" onClick={() => setReveal(!reveal)}><Icon name={reveal ? 'eyeOff' : 'eye'} size={16} />{reveal ? t('إخفاء') : t('إظهار')}</button>
              <button className="btn" onClick={() => copy(org.invite_code)}><Icon name="copy" size={16} />{t('نسخ')}</button>
              <a className="btn wa" href={`https://wa.me/?text=${encodeURIComponent(inviteMsg)}`} target="_blank" rel="noreferrer"><WhatsAppIcon size={16} />{t('إرسال عبر واتساب')}</a>
              <button className="btn danger" onClick={() => setConfirmRegen(true)}><Icon name="refresh" size={16} />{t('توليد كود جديد')}</button>
            </div>
          </div>

          <div className="panel panel-pad" style={{ display: 'grid', gap: 14 }}>
            <strong>{t('معلومات المتجر (تظهر في رأس التقارير)')}</strong>
            <div className="field"><label>{t('الاسم')}</label><input className="input" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} /></div>
            <div className="field"><label>{t('العنوان (افصل الأسطر بفاصلة ،)')}</label><input className="input" value={info.address} onChange={(e) => setInfo({ ...info, address: e.target.value })} /></div>
            <div className="field"><label>{t('الهاتف')}</label><input className="input ltr" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} /></div>
            <button className="btn primary" onClick={async () => { const o = await api.updateOrg(info); setOrg({ ...org, ...o }); toast('تم الحفظ ✔') }}>{t('حفظ')}</button>
          </div>
        </div>
      )}

      {isAdmin && usage.data && (() => {
        const pct = Math.min(100, (usage.data.bytes / LIMIT) * 100)
        return (
          <div className="panel panel-pad" style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <strong>{t('مساحة التخزين (الصور والملفات)')}</strong>
              <span className="muted num">{fmtBytes(usage.data.bytes)} / 1 GB</span>
            </div>
            <div className={`progress ${pct > 80 ? 'red' : ''}`}><i style={{ width: `${Math.max(pct, 0.5)}%` }} /></div>
            <div className="muted" style={{ fontSize: 13 }}>
              {t('{n} ملف · تُضغط الصور تلقائياً قبل الرفع لتوفير المساحة.', { n: usage.data.files })}
              {pct > 80 && <b style={{ color: 'var(--red)' }}> {t('المساحة تقترب من الامتلاء.')}</b>}
            </div>
          </div>
        )
      })()}

      {isAdmin && (
        <div className="panel panel-pad" style={{ display: 'grid', gap: 14 }}>
          <div><strong>{t('لغة التطبيق')}</strong><div className="muted" style={{ fontSize: 13 }}>{t('تُحفظ في إعدادات المتجر وتُقترح على المسيّرين عند أول دخول. الإنجليزية هي اللغة الرسمية.')}</div></div>
          <div className="lang-cards">
            {LANGS.map((l) => (
              <button key={l.code} className={lang === l.code ? 'on' : ''} onClick={() => setL(l.code)} lang={l.code}>
                <b>{l.short}</b><span>{l.label}</span>
              </button>
            ))}
          </div>
          <div><button className="btn primary" onClick={saveLang} disabled={lang === getLang() && lang === org?.language}>{t('حفظ اللغة')}</button></div>
        </div>
      )}

      <div className="panel">
        <div className="panel-head"><h3>{t('أعضاء المتجر')}</h3><span className="faint" style={{ fontSize: 12 }}>{t('{n} عضو', { n: members.data?.length || 0 })}</span></div>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="t">
            <thead><tr><th>{t('الاسم')}</th><th>{t('البريد')}</th><th>{t('الدور')}</th><th>{t('تاريخ الانضمام')}</th>{isAdmin && <th />}</tr></thead>
            <tbody>
              {(members.data || []).map((m) => (
                <tr key={m.user_id}>
                  <td><span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="avatar">{(m.full_name || m.email || '?').slice(0, 2)}</span>{m.full_name || '—'}</span></td>
                  <td className="num">{m.email}</td>
                  <td><span className="badge"><i style={{ background: m.role === 'admin' ? 'var(--blue)' : 'var(--yellow)' }} />{m.role === 'admin' ? t('أدمن') : t('مسيّر')}</span></td>
                  <td className="num">{dmy(iso(new Date(m.created_at)))}</td>
                  {isAdmin && <td>{m.role !== 'admin' && <button className="btn sm danger" onClick={() => setRm(m)}>{t('إزالة')}</button>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel panel-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div><strong>{membership?.fullName}</strong><div className="muted num" style={{ fontSize: 13 }}>{membership?.email}</div></div>
        <div className="settings-actions">
          <button className="btn" onClick={() => { try { localStorage.removeItem('onb-done') } catch { /* ignore */ } location.reload() }}>{t('عرض شرائح التعريف')}</button>
          {isDemo && <button className="btn danger" onClick={() => api.resetDemo()}>{t('إعادة البيانات التجريبية')}</button>}
          <button className="btn" onClick={() => api.signOut()}><Icon name="logout" size={16} />{t('خروج')}</button>
        </div>
      </div>

      {confirmRegen && <Confirm yes={t('توليد')} text={t('سيتوقف الكود الحالي فوراً ولن يستطيع أحد الانضمام به (الأعضاء الحاليون يبقون). متابعة؟')} onClose={() => setConfirmRegen(false)}
        onYes={async () => { const c = await api.regenerateCode(); setOrg({ ...org, invite_code: c }); setReveal(true); toast('تم توليد كود جديد') }} />}
      {rm && <Confirm yes={t('إزالة')} text={t('إزالة {x} من المتجر؟ لن يستطيع الاطلاع على البيانات بعد الآن.', { x: rm.full_name || rm.email })} onClose={() => setRm(null)}
        onYes={async () => { await api.removeMember(rm.user_id); members.reload(); toast('تمت الإزالة') }} />}
    </>
  )
}
