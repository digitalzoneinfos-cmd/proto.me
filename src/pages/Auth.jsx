import { t } from '../lib/i18n.jsx'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, isDemo } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Icon } from '../components/Icons.jsx'
import Logo from '../components/Logo.jsx'

function Side({ admin }) {
  return (
    <div className="auth-side">
      <div className="deco-grid" />
      <Link to="/" style={{ position: 'relative', justifySelf: 'start' }}><Logo size={28} /></Link>
      <div style={{ position: 'relative', display: 'grid', gap: 16 }}>
        <p className="huge">{admin ? <>{t('بوابة')}<br />{t('الأدمن')}</> : <>{t('تقارير متجرك،')}<br />{t('بين يديك.')}</>}</p>
        <p className="muted" style={{ fontSize: 16, maxWidth: 380, margin: 0 }}>
          {admin
            ? t('أنشئ متجرك، أدخل المداخيل والمصاريف والوصولات، وشارك كود الدعوة السري مع المسيّرين.')
            : t('اطّلع على المداخيل والمصاريف والوصولات والتنبيهات — في أي وقت ومن أي مكان.')}
        </p>
      </div>
      <div className="faint" style={{ position: 'relative', fontSize: 12 }}>© {new Date().getFullYear()} PROTO.ME — {t('جميع الحقوق محفوظة')}</div>
    </div>
  )
}

export default function Auth({ portal = 'manager' }) {
  const admin = portal === 'admin'
  const { refresh } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setInfo(''); setBusy(true)
    try {
      try { localStorage.setItem('portal', portal) } catch { /* ignore */ }
      if (mode === 'signup') {
        if (form.password.length < 6) throw new Error(t('كلمة المرور يجب أن تكون 6 أحرف على الأقل'))
        const r = await api.signUp(form.email.trim(), form.password, form.name.trim())
        if (r.needsConfirm) { setInfo(t('تم إنشاء الحساب ✔ — افتح بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول.')); setMode('login'); return }
      } else {
        await api.signIn(form.email.trim(), form.password)
      }
      await refresh()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="auth">
      <Side admin={admin} />
      <div className="auth-main">
        <form className="auth-card" onSubmit={submit}>
          <div>
            <span className="tag" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
              <Icon name={admin ? 'shield' : 'users'} size={14} />{admin ? t('حساب الأدمن') : t('حساب المسيّر')}
            </span>
            <h2>{mode === 'login' ? t('مرحباً بعودتك') : t('إنشاء حساب جديد')}</h2>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              {mode === 'login' ? t('سجّل الدخول للمتابعة.') : admin ? t('بعد إنشاء الحساب ستنشئ متجرك وتحصل على كود الدعوة.') : t('بعد إنشاء الحساب سيُطلب منك كود الدعوة.')}
            </p>
          </div>

          <div className="seg">
            <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>{t('تسجيل الدخول')}</button>
            <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>{t('حساب جديد')}</button>
          </div>

          {mode === 'signup' && (
            <div className="field"><label>{t('الاسم الكامل')}</label><input className="input" required value={form.name} onChange={set('name')} placeholder={t('مثال: بوخلفة خرامسية')} /></div>
          )}
          <div className="field"><label>{t('البريد الإلكتروني')}</label><input className="input ltr" type="email" required value={form.email} onChange={set('email')} placeholder="name@email.com" autoComplete="email" /></div>
          <div className="field">
            <label>{t('كلمة المرور')}</label>
            <div style={{ position: 'relative' }}>
              <input className="input ltr" type={show ? 'text' : 'password'} required value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" className="icon-btn" onClick={() => setShow(!show)} style={{ position: 'absolute', top: 2, insetInlineStart: 2 }} aria-label={t('إظهار كلمة المرور')}><Icon name={show ? 'eyeOff' : 'eye'} size={16} /></button>
            </div>
          </div>
          {err && <div className="err">{err}</div>}
          {info && <div style={{ color: 'var(--green)', fontSize: 13 }}>{info}</div>}
          <button className="btn primary block" style={{ height: 48 }} disabled={busy}>{busy ? '…' : mode === 'login' ? t('دخول') : t('إنشاء الحساب')}</button>

          {isDemo && (
            <div className="panel panel-pad" style={{ display: 'grid', gap: 10, borderStyle: 'dashed' }}>
              <strong style={{ fontSize: 13 }}>{t('وضع تجريبي — دخول سريع')}</strong>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn sm" style={{ flex: 1 }} onClick={() => api.demoLogin('admin')}>{t('كأدمن')}</button>
                <button type="button" className="btn sm" style={{ flex: 1 }} onClick={() => api.demoLogin('manager')}>{t('كمسيّر')}</button>
              </div>
              <span className="faint" style={{ fontSize: 12 }}>{t('أو أنشئ حساباً جديداً وجرّب كود الدعوة:')} <b className="num">ARYM7Q2K</b></span>
            </div>
          )}

          <div className="muted" style={{ fontSize: 13, textAlign: 'center' }}>
            <Link className="link" to="/" style={{ marginInlineEnd: 12 }}>{t('→ الصفحة الرئيسية')}</Link>
            {admin ? <>{t('لست أدمن؟')} <Link className="link" to="/login">{t('دخول المسيّرين')}</Link></> : <>{t('أنت مسؤول المتجر؟')} <Link className="link" to="/admin">{t('بوابة الأدمن')}</Link></>}
          </div>
        </form>
      </div>
    </div>
  )
}

/** بعد تسجيل الدخول وقبل الانضمام لمتجر */
export function Setup() {
  const { refresh, user } = useAuth()
  let portal = 'manager'
  try { portal = localStorage.getItem('portal') || 'manager' } catch { /* ignore */ }
  const [mode, setMode] = useState(portal === 'admin' ? 'create' : 'join')
  const [code, setCode] = useState('')
  const [name, setName] = useState(user?.user_metadata?.full_name || user?.full_name || '')
  const [store, setStore] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      if (mode === 'join') await api.joinWithCode(code, name)
      else await api.createOrg(store, name)
      await refresh()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="auth">
      <Side admin={mode === 'create'} />
      <div className="auth-main">
        <form className="auth-card" onSubmit={submit}>
          <div style={{ width: 56, height: 56, border: '1px solid var(--line)', display: 'grid', placeItems: 'center' }}><Icon name={mode === 'join' ? 'key' : 'grid'} size={24} /></div>
          <div>
            <h2>{mode === 'join' ? t('أدخل كود الدعوة') : t('أنشئ متجرك')}</h2>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              {mode === 'join' ? t('اطلب الكود السري من أدمن المتجر للوصول إلى بياناته.') : t('سيتم إنشاء كود دعوة سري تشاركه مع المسيّرين.')}
            </p>
          </div>
          <div className="field"><label>{t('اسمك (يظهر في التقارير)')}</label><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></div>
          {mode === 'join' ? (
            <div className="field"><label>{t('كود الدعوة')}</label><input className="input code-input" required maxLength={12} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="XXXXXXXX" autoFocus /></div>
          ) : (
            <div className="field"><label>{t('اسم المتجر / المؤسسة')}</label><input className="input" required value={store} onChange={(e) => setStore(e.target.value)} placeholder={t('مكتبة أريام')} autoFocus /></div>
          )}
          {err && <div className="err">{err}</div>}
          <button className="btn primary block" style={{ height: 48 }} disabled={busy}>{busy ? '…' : mode === 'join' ? t('دخول إلى المتجر') : t('إنشاء المتجر')}</button>
          <div className="muted" style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="link" onClick={() => setMode(mode === 'join' ? 'create' : 'join')}>
              {mode === 'join' ? t('أنا الأدمن — إنشاء متجر جديد') : t('لدي كود دعوة')}
            </button>
            <button type="button" className="link" onClick={() => api.signOut()}>{t('خروج')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
