import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import Logo, { LogoMark } from '../components/Logo.jsx'
import GIcon from '../components/GIcons.jsx'
import { Icon, WhatsAppIcon } from '../components/Icons.jsx'
import { installApp, canPrompt, onPromptChange, isStandalone } from '../lib/install.js'
import { t, LANGS, useLang } from '../lib/i18n.jsx'
import '../landing.css'

const appUrl = () => location.href.split('#')[0]

/* ---------------- كشف العناصر عند التمرير ---------------- */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.rv')
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])
}

/* ---------------- مبدّل اللغة في الشريط العلوي ---------------- */
function LangMenu() {
  const [lang, setLang] = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const f = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', f)
    return () => document.removeEventListener('mousedown', f)
  }, [])
  const cur = LANGS.find((l) => l.code === lang)
  return (
    <div className="lp-lang" ref={ref}>
      <button className="lp-lang-btn" onClick={() => setOpen(!open)} aria-haspopup="true" aria-expanded={open}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19M12 2.5c2.8 2.6 4.2 5.8 4.2 9.5s-1.4 6.9-4.2 9.5c-2.8-2.6-4.2-5.8-4.2-9.5S9.2 5.1 12 2.5z" /></svg>
        {cur.short}<Icon name="chevD" size={14} />
      </button>
      {open && (
        <div className="lp-lang-menu" role="menu">
          {LANGS.map((l) => (
            <button key={l.code} role="menuitem" lang={l.code} className={l.code === lang ? 'on' : ''} onClick={() => { setLang(l.code); setOpen(false) }}>
              <b>{l.short}</b>{l.label}{l.code === 'en' && <small>{t('الرسمية')}</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- نافذة التثبيت ---------------- */
function InstallSheet({ mode, onClose, onLogin }) {
  const [qr, setQr] = useState('')
  useEffect(() => {
    QRCode.toDataURL(appUrl(), { margin: 1, width: 360, color: { dark: '#050817', light: '#ffffff' } }).then(setQr).catch(() => {})
  }, [])
  return (
    <div className="lp-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lp-sheet" role="dialog" aria-modal="true">
        <button className="lp-x" onClick={onClose} aria-label={t('إغلاق')}><Icon name="x" /></button>
        <GIcon name="phone" size={64} />
        {mode === 'installed' && (
          <>
            <h3>{t('تم تثبيت التطبيق ✔')}</h3>
            <p>{t('ستجد أيقونة ProtoFlow على الشاشة الرئيسية لهاتفك. افتحه وسجّل دخولك بكود الدعوة.')}</p>
            <button className="lp-btn primary block" onClick={onLogin}>{t('المتابعة إلى تسجيل الدخول')}</button>
          </>
        )}
        {mode === 'ios' && (
          <>
            <h3>{t('التثبيت على iPhone')}</h3>
            <ol className="lp-steps-ios">
              <li><b>1</b><span>{t('اضغط زر المشاركة')} <span className="lp-share"><Icon name="upload" size={15} /></span> {t('أسفل متصفح Safari')}</span></li>
              <li><b>2</b><span>{t('اختر')} <strong>{t('«إضافة إلى الشاشة الرئيسية»')}</strong></span></li>
              <li><b>3</b><span>{t('اضغط')} <strong>{t('«إضافة»')}</strong> — {t('وسيظهر التطبيق بين تطبيقاتك')}</span></li>
            </ol>
            <button className="lp-btn ghost block" onClick={onLogin}>{t('أو تابع من المتصفح')}</button>
          </>
        )}
        {(mode === 'desktop' || mode === 'manual' || mode === 'dismissed') && (
          <>
            <h3>{mode === 'desktop' ? t('امسح الرمز بهاتفك') : t('تثبيت التطبيق')}</h3>
            <p>{mode === 'desktop'
              ? t('افتح الكاميرا ووجّهها نحو الرمز، ثم اضغط «حمّل التطبيق» من هاتفك.')
              : t('من قائمة المتصفح (⋮) اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».')}</p>
            {mode === 'desktop' && <div className="lp-qr">{qr ? <img src={qr} alt="QR" /> : <span />}</div>}
            <button className="lp-btn ghost block" onClick={onLogin}>{t('الدخول من هذا الجهاز')}</button>
          </>
        )}
      </div>
    </div>
  )
}

/* ---------------- الهاتف ---------------- */
function StatusBar() {
  return (
    <div className="ph-status">
      <b>9:41</b>
      <span className="ph-ind">
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="1" fill="currentColor" /><rect x="4.5" y="5" width="3" height="6" rx="1" fill="currentColor" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" fill="currentColor" /><rect x="13.5" y="0" width="3" height="11" rx="1" fill="currentColor" /></svg>
        <svg width="15" height="11" viewBox="0 0 15 11"><path d="M7.5 2.2c2.2 0 4.2.8 5.7 2.2l1.3-1.4A10 10 0 0 0 7.5 0 10 10 0 0 0 .5 3l1.3 1.4A8.2 8.2 0 0 1 7.5 2.2zm0 3.4c1.3 0 2.4.5 3.3 1.2l1.3-1.4A6.6 6.6 0 0 0 7.5 3.6c-1.8 0-3.4.7-4.6 1.8l1.3 1.4c.9-.7 2-1.2 3.3-1.2zM7.5 11l2.1-2.3a3 3 0 0 0-4.2 0z" fill="currentColor" /></svg>
        <span className="ph-batt"><i /></span>
      </span>
    </div>
  )
}

function ScreenOverview() {
  const bars = [46, 52, 55, 80, 70, 100, 62]
  return (
    <div className="ps">
      <div className="ps-top"><LogoMark size={18} /><span>{t('نظرة عامة')}</span><span className="ps-bell"><Icon name="bell" size={15} /><i /></span></div>
      <div className="ps-hero">
        <span>{t('صافي المداخيل')} · {t('نوفمبر')}</span>
        <b className="num">5,583<small>.50</small></b>
        <div className="ps-row"><span>{t('بطاقة')} <b className="num">5,523</b></span><span>{t('نقد')} <b className="num">2,136</b></span></div>
        <div className="ps-spark"><svg viewBox="0 0 100 24" preserveAspectRatio="none"><path d="M0 20 C15 18 22 8 35 12 S55 4 68 9 85 2 100 4" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="2" /></svg></div>
      </div>
      <div className="ps-card">
        <div className="ps-h">{t('صافي الأيام الأخيرة')}</div>
        <div className="ps-bars">{bars.map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${0.1 + i * 0.07}s` }} />)}</div>
      </div>
      <div className="ps-mini">
        <div className="ps-chip"><GIcon name="revenue" size={26} /><div><small>{t('اليوم')}</small><b className="num">+1,027</b></div></div>
        <div className="ps-chip"><GIcon name="expenses" size={26} /><div><small>{t('مصاريف')}</small><b className="num">−319</b></div></div>
      </div>
    </div>
  )
}

function ScreenExpenses() {
  const rows = [['المصري — أبجد', '694.00'], ['فاتورة الحبر', '400.00'], ['أرسلان — راتب', '300.00'], ['أوبر — أبو يوسف', '17.00']]
  return (
    <div className="ps">
      <div className="ps-top"><LogoMark size={18} /><span>{t('المصاريف')}</span><Icon name="search" size={15} /></div>
      <div className="ps-card ps-list">
        {rows.map(([a, b], i) => (
          <div className={`ps-li ${i === 0 ? 'hl' : ''}`} key={a} style={{ animationDelay: `${i * 0.08}s` }}>
            <span className="ps-rc"><Icon name="receipt" size={11} /></span><span>{t(a)}</span><b className="num">{b}</b>
          </div>
        ))}
      </div>
      <div className="ps-receipt">
        <div className="ps-paper"><b>RECEIPT</b>{[80, 55, 70, 45, 60].map((w, i) => <i key={i} style={{ width: `${w}%` }} />)}<strong className="num">694.00 QAR</strong></div>
        <span className="ps-tap" />
      </div>
    </div>
  )
}

function ScreenNotices() {
  const items = [['ورق طباعة A4', 'جديد', 'r', 'supply'], ['ركن قصص الأطفال', 'قيد المعالجة', 'y', 'suggestion'], ['مكيف المخزن', 'جديد', 'r', 'team'], ['أكياس تغليف', 'تم', 'g', 'supply']]
  return (
    <div className="ps">
      <div className="ps-top"><LogoMark size={18} /><span>{t('التنبيهات')}</span><span className="ps-count">3</span></div>
      <div className="ps-seg"><span className="on">{t('المفتوحة')}</span><span>{t('المنجزة')}</span></div>
      {items.map(([a, s, c, ic], i) => (
        <div className="ps-note" key={a} style={{ animationDelay: `${i * 0.09}s` }}>
          <GIcon name={ic} size={28} /><span>{t(a)}</span><em className={c}>{t(s)}</em>
        </div>
      ))}
      <div className="ps-wa"><WhatsAppIcon size={14} />{t('مشاركة القائمة مع المورد')}</div>
    </div>
  )
}

const SCREENS = [ScreenOverview, ScreenExpenses, ScreenNotices]
const TABS = ['grid', 'receipt', 'bell', 'truck', 'settings']
const TAB_FOR = [0, 1, 2]

function Phone() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % SCREENS.length), 3800)
    return () => clearInterval(id)
  }, [])
  const S = SCREENS[i]
  return (
    <div className="ph">
      <span className="ph-btn b1" /><span className="ph-btn b2" /><span className="ph-btn b3" /><span className="ph-btn b4" />
      <div className="ph-bezel">
        <div className="ph-screen">
          <StatusBar />
          <div className="ph-island"><i /></div>
          <div className="ph-stage" key={i}><S /></div>
          <div className="ph-tab">{TABS.map((n, k) => <span key={n} className={TAB_FOR[i] === k ? 'on' : ''}><Icon name={n} size={17} /></span>)}</div>
          <div className="ph-home" />
          <div className="ph-glare" />
        </div>
      </div>
      <div className="ph-dots">{SCREENS.map((_, k) => <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`${k + 1}`} />)}</div>
    </div>
  )
}

function HeroArt() {
  const ref = useRef()
  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(hover: none)').matches) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.setProperty('--mx', x.toFixed(3))
      el.style.setProperty('--my', y.toFixed(3))
    }
    const leave = () => { el.style.setProperty('--mx', 0); el.style.setProperty('--my', 0) }
    window.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => { window.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave) }
  }, [])
  return (
    <div className="lp-hero-art" ref={ref}>
      <div className="lp-orb" />
      <div className="lp-ring"><i /><i /></div>
      <div className="lp-tilt"><Phone /></div>
      <div className="lp-float f1"><GIcon name="revenue" size={38} /><div><small>{t('صافي اليوم')}</small><b className="num">+ 1,027.50</b></div></div>
      <div className="lp-float f2"><GIcon name="supply" size={38} /><div><small>{t('تنبيه مستلزمات')}</small><b>{t('ورق طباعة A4')}</b></div></div>
      <div className="lp-float f3"><GIcon name="receipt" size={38} /><div><small>{t('وصل جديد')}</small><b className="num">694.00 QAR</b></div></div>
      <div className="lp-float f4"><GIcon name="report" size={34} /><div><small>{t('التقرير الشهري')}</small><b>PDF · Excel</b></div></div>
    </div>
  )
}

const FEATURES = [
  { cls: 'wide', icon: 'suggestion', title: 'تنبيهات المتجر', text: 'مستلزمات، اقتراحات وانشغالات الطاقم — مع حالة كل طلب.', art: 'notif' },
  { cls: 'wide', icon: 'receipt', title: 'وصل أمام كل مصروف', text: 'اضغط على المصروف لترى صورة الوصل أو ملفه فوراً.', art: 'receipt' },
  { icon: 'calculator', title: 'حساب تلقائي', text: 'بطاقة + نقد − مصاريف = الصافي، يومياً وشهرياً.', art: 'gauge' },
  { icon: 'report', title: 'تقارير جاهزة', text: 'طباعة، PDF، Excel وتعديل النصوص قبل الإرسال.', art: 'report' },
  { icon: 'truck', title: 'الموردون على واتساب', text: 'تواصل مع أي مورد بضغطة واحدة.', art: 'wa' },
]

function FeatureArt({ type }) {
  if (type === 'notif') return (
    <div className="fa-notif">
      {[['ورق طباعة A4', 'جديد', 'r', 'supply'], ['ركن قصص الأطفال', 'قيد المعالجة', 'y', 'suggestion'], ['مكيف المخزن', 'تم', 'g', 'team']].map(([x, s, c, ic], i) => (
        <div key={x} className="fa-n" style={{ '--d': `${i * 0.12}s`, opacity: 1 - i * 0.2 }}>
          <GIcon name={ic} size={30} /><span className="fa-t">{t(x)}</span><span className={`fa-s ${c}`}>{t(s)}</span>
        </div>
      ))}
    </div>
  )
  if (type === 'receipt') return (
    <div className="fa-receipt">
      <div className="fa-paper"><b>RECEIPT</b>{[80, 55, 70, 40].map((w, i) => <i key={i} style={{ width: `${w}%` }} />)}<strong className="num">694.00</strong></div>
      <div className="fa-exp"><span>{t('المصري — أبجد')}</span><b className="num">694.00</b><em><Icon name="eye" size={13} /> {t('معاينة')}</em></div>
    </div>
  )
  if (type === 'gauge') return (
    <div className="fa-gauge">
      <GIcon name="dashboard" size={130} />
      <div className="fa-eq"><span>{t('بطاقة')}</span>+<span>{t('نقد')}</span>−<span>{t('مصاريف')}</span>=<b>{t('الصافي')}</b></div>
    </div>
  )
  if (type === 'report') return (
    <div className="fa-report"><div className="fa-sheet"><b>{t('تقرير المداخيل')}</b><div className="fa-k"><i /><i /><i className="on" /></div>{[90, 75, 85, 60].map((w, i) => <span key={i} style={{ width: `${w}%` }} />)}</div>
      <div className="fa-pills"><span><Icon name="print" size={12} />PDF</span><span><Icon name="download" size={12} />Excel</span></div></div>
  )
  return (
    <div className="fa-wa"><div className="fa-b in">{t('السلام عليكم، نحتاج طلبية جديدة')}</div><div className="fa-b out">{t('وعليكم السلام، تصلكم غداً ✔')}</div><span className="fa-wab"><WhatsAppIcon size={18} /></span></div>
  )
}

export default function Landing() {
  const nav = useNavigate()
  const [sheet, setSheet] = useState(null)
  const [ready, setReady] = useState(canPrompt())
  const [scrolled, setScrolled] = useState(false)
  useReveal()
  useEffect(() => onPromptChange(setReady), [])
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.lp = '1'
    return () => { delete document.documentElement.dataset.lp }
  }, [])

  const download = async () => {
    const r = await installApp()
    if (r === 'installed' && isStandalone()) return nav('/login')
    setSheet(r)
  }
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="lp">
      <div className="lp-bg" />

      <header className={`lp-nav ${scrolled ? 'on' : ''}`}>
        <Logo size={26} />
        <nav className="lp-links">
          <button onClick={() => go('portals')}>{t('البوابات')}</button>
          <button onClick={() => go('features')}>{t('المزايا')}</button>
          <button onClick={() => go('how')}>{t('كيف يعمل')}</button>
          <button onClick={() => go('faq')}>{t('الأسئلة')}</button>
        </nav>
        <div className="lp-nav-cta">
          <LangMenu />
          <button className="lp-btn ghost sm hide-sm" onClick={() => nav('/admin')}>{t('دخول الأدمن')}</button>
          <button className="lp-btn primary sm" onClick={download}>{t('حمّل التطبيق')}</button>
        </div>
      </header>

      {/* -------- HERO -------- */}
      <section className="lp-hero">
        <div className="lp-hero-text">
          <span className="lp-badge"><i />{t('لوحة تقارير المتاجر · 2026')}</span>
          <h1>{t('تقارير متجرك،')}<br /><span className="grad">{t('في جيبك.')}</span></h1>
          <p>{t('المداخيل، المصاريف ووصولاتها، التقارير اليومية والشهرية، تنبيهات الطاقم والموردون — في تطبيق واحد للمسيّرين والإدارة.')}</p>
          <div className="lp-cta">
            <button className="lp-btn primary lg shine" onClick={download}>
              <Icon name="download" size={18} />{t('حمّل التطبيق')}
            </button>
            <button className="lp-btn ghost lg" onClick={() => nav('/admin')}>
              <Icon name="shield" size={18} />{t('بوابة الأدمن')}
            </button>
          </div>
          <div className="lp-meta">
            <span><Icon name="check" size={14} stroke={2.6} />{t('iPhone و Android')}</span>
            <span><Icon name="check" size={14} stroke={2.6} />{t('بدون متجر تطبيقات')}</span>
            <span><Icon name="check" size={14} stroke={2.6} />{t('دخول بكود دعوة سري')}</span>
          </div>
        </div>
        <HeroArt />
      </section>

      <div className="lp-strip">
        <div className="lp-marquee">
          {[0, 1].map((k) => (
            <div key={k} aria-hidden={k === 1}>
              {[['report', 'تقارير PDF'], ['revenue', 'تصدير Excel'], ['phone', 'تطبيق PWA'], ['lock', 'Supabase آمن'], ['truck', 'واتساب'], ['stock', 'متعدد اللغات']].map(([i, x]) => (
                <span key={x}><GIcon name={i} size={26} />{t(x)}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* -------- PORTALS -------- */}
      <section className="lp-sec" id="portals">
        <span className="lp-eyebrow rv">{t('البوابات')}</span>
        <h2 className="rv">{t('بوابة لكل دور')}</h2>
        <p className="lp-sub rv">{t('المسيّرون يطّلعون على كل شيء من هواتفهم، والأدمن وحده يُدخل البيانات ويُديرها.')}</p>
        <div className="lp-portals">
          <div className="lp-portal rv">
            <GIcon name="team" size={64} />
            <h3>{t('أنا مسيّر')}</h3>
            <p>{t('اطّلع على المداخيل والمصاريف والوصولات والتنبيهات في أي وقت.')}</p>
            <ol>
              <li><b>1</b>{t('حمّل التطبيق على هاتفك')}</li>
              <li><b>2</b>{t('أنشئ حسابك')}</li>
              <li><b>3</b>{t('أدخل كود الدعوة من الأدمن')}</li>
            </ol>
            <div className="lp-portal-cta">
              <button className="lp-btn primary" onClick={download}><Icon name="download" size={16} />{t('حمّل التطبيق')}</button>
              <button className="lp-btn link" onClick={() => nav('/login')}>{t('لديك حساب؟ دخول')}</button>
            </div>
          </div>
          <div className="lp-portal admin rv" style={{ '--d': '.1s' }}>
            <GIcon name="lock" size={64} />
            <h3>{t('أنا الأدمن')}</h3>
            <p>{t('أنشئ متجرك، أدخل المداخيل والمصاريف، وأدِر من يطّلع على البيانات.')}</p>
            <ol>
              <li><b>1</b>{t('أنشئ حساب الأدمن')}</li>
              <li><b>2</b>{t('أنشئ متجرك واحصل على الكود')}</li>
              <li><b>3</b>{t('شارك الكود مع المسيّرين')}</li>
            </ol>
            <div className="lp-portal-cta">
              <button className="lp-btn light" onClick={() => nav('/admin')}><Icon name="key" size={16} />{t('إنشاء حساب أدمن')}</button>
              <button className="lp-btn link" onClick={() => nav('/admin')}>{t('تسجيل دخول الأدمن')}</button>
            </div>
          </div>
        </div>
      </section>

      {/* -------- MODULES -------- */}
      <section className="lp-sec" id="features">
        <span className="lp-eyebrow rv">{t('المزايا')}</span>
        <h2 className="rv">{t('كل ما يحتاجه المسيّر… في شاشة')}</h2>
        <p className="lp-sub rv">{t('مصمم انطلاقاً من التقرير اليومي الحقيقي للمتجر، لا من قالب جاهز.')}</p>
        <div className="lp-mods">
          {[['revenue', 'المداخيل'], ['expenses', 'المصاريف'], ['receipt', 'الوصولات'], ['report', 'التقارير'], ['supply', 'المستلزمات'], ['suggestion', 'الاقتراحات'], ['team', 'الطاقم'], ['truck', 'الموردون'], ['dashboard', 'لوحة التحكم']].map(([i, x], k) => (
            <div className="lp-mod rv" key={x} style={{ '--d': `${k * 0.05}s` }}><GIcon name={i} size={54} /><span>{t(x)}</span></div>
          ))}
        </div>
        <div className="lp-bento">
          {FEATURES.map((f, k) => (
            <div className={`lp-feat rv ${f.cls || ''}`} key={f.title} style={{ '--d': `${(k % 3) * 0.08}s` }}>
              <div className="lp-feat-art"><FeatureArt type={f.art} /></div>
              <h4><GIcon name={f.icon} size={26} />{t(f.title)}</h4>
              <p>{t(f.text)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------- DESKTOP SHOWCASE -------- */}
      <section className="lp-sec">
        <span className="lp-eyebrow rv">{t('على الحاسوب أيضاً')}</span>
        <h2 className="rv">{t('لوحة كاملة للأدمن')}</h2>
        <p className="lp-sub rv">{t('نفس البيانات على شاشة كبيرة: إدخال اليوم، التقارير، الوصولات والإعدادات.')}</p>
        <div className="lp-laptop rv"><img src="./showcase-laptop.webp" alt={t('لوحة ProtoFlow على الحاسوب')} loading="lazy" /></div>
      </section>

      {/* -------- HOW / SECURITY -------- */}
      <section className="lp-sec" id="how">
        <span className="lp-eyebrow rv">{t('كيف يعمل')}</span>
        <h2 className="rv">{t('من الصندوق إلى التقرير')}</h2>
        <div className="lp-how">
          {[
            ['calculator', 'الأدمن يُدخل اليوم', 'دخل البطاقة والكاش وصورة الـ Day Close، والمصاريف مع وصولاتها.'],
            ['dashboard', 'المنصة تحسب', 'الصافي، نسبة المصاريف، أفضل وأسوأ يوم، والمصاريف حسب الفئة.'],
            ['report', 'المسيّر يطّلع', 'تقرير يومي وشهري جاهز للطباعة، مع الرجوع لأي تاريخ سابق.'],
          ].map(([i, x, d], k) => (
            <div className="lp-step rv" key={x} style={{ '--d': `${k * 0.1}s` }}>
              <span className="lp-step-n num">0{k + 1}</span>
              <GIcon name={i} size={52} />
              <h4>{t(x)}</h4><p>{t(d)}</p>
            </div>
          ))}
        </div>

        <div className="lp-secure rv">
          <div>
            <h3>{t('دخول آمن بكود دعوة سري')}</h3>
            <p>{t('لا أحد يرى بيانات المتجر إلا من يملك الكود. يستطيع الأدمن تغييره في أي لحظة أو إزالة أي مسيّر.')}</p>
            <div className="lp-facts">
              <span><b>2</b>{t('صلاحيات منفصلة')}</span>
              <span><b>RLS</b>{t('حماية على مستوى قاعدة البيانات')}</span>
              <span><b>3</b>{t('لغات: English · العربية · Français')}</span>
            </div>
          </div>
          <div className="lp-code"><GIcon name="lock" size={58} /><div className="num" dir="ltr">ARYM<span>••••</span></div><small>{t('كود الدعوة')}</small></div>
        </div>
      </section>

      {/* -------- INSTALL BAND -------- */}
      <section className="lp-band rv">
        <div>
          <h2>{t('جاهز؟ حمّل التطبيق الآن')}</h2>
          <p>{t('بضغطة زر يظهر ProtoFlow على الشاشة الرئيسية لهاتفك — دون متجر تطبيقات ودون تحديثات يدوية.')}</p>
          <div className="lp-cta">
            <button className="lp-btn primary lg" onClick={download}><Icon name="download" size={18} />{ready ? t('تثبيت على هذا الجهاز') : t('حمّل التطبيق')}</button>
            <button className="lp-btn ghost lg" onClick={() => nav('/login')}>{t('فتح في المتصفح')}</button>
          </div>
        </div>
        <div className="lp-band-art"><GIcon name="phone" size={150} /></div>
      </section>

      {/* -------- FAQ -------- */}
      <section className="lp-sec narrow" id="faq">
        <span className="lp-eyebrow rv">{t('الأسئلة')}</span>
        <h2 className="rv">{t('أسئلة شائعة')}</h2>
        <div className="lp-faq">
          {[
            ['من أين أحصل على كود الدعوة؟', 'من أدمن المتجر. يجده في صفحة الإعدادات ويمكنه إرساله لك مباشرة عبر واتساب.'],
            ['هل يستطيع المسيّر تعديل الأرقام؟', 'لا. المسيّر يطّلع فقط على التقارير والوصولات والتنبيهات، والأدمن وحده يضيف ويعدّل ويحذف.'],
            ['هل التطبيق متوفر على App Store أو Google Play؟', 'لا حاجة لذلك. هو تطبيق ويب تقدّمي (PWA) يُثبَّت من المتصفح مباشرة ويعمل كتطبيق عادي.'],
            ['هل يمكن تغيير اللغة؟', 'نعم: الإنجليزية (الرسمية)، العربية والفرنسية. يختار المسيّر لغته عند أول دخول ويمكنه تغييرها من القائمة الجانبية، والأدمن من الإعدادات.'],
            ['هل يمكن الرجوع للأشهر السابقة؟', 'نعم، يمكن فتح أي يوم أو شهر سابق مع كل تفاصيله ووصولاته وتقاريره.'],
          ].map(([q, a]) => (
            <details key={q} className="rv"><summary>{t(q)}<Icon name="plus" size={18} /></summary><p>{t(a)}</p></details>
          ))}
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-foot-top">
          <div style={{ display: 'grid', gap: 10 }}>
            <Logo size={26} />
            <p>{t('لوحة تقارير المتاجر للمسيّرين والإدارة.')}</p>
          </div>
          <div className="lp-foot-links">
            <button onClick={download}>{t('تحميل التطبيق')}</button>
            <button onClick={() => nav('/login')}>{t('دخول المسيّرين')}</button>
            <button onClick={() => nav('/admin')}>{t('بوابة الأدمن')}</button>
          </div>
        </div>
        <div className="lp-foot-bottom">
          <span>© {new Date().getFullYear()} <b>PROTO.ME</b> — {t('جميع الحقوق محفوظة.')}</span>
          <span>{t('صُمّم وطُوّر بواسطة')} <b>proto.me</b></span>
        </div>
      </footer>

      {sheet && <InstallSheet mode={sheet} onClose={() => setSheet(null)} onLogin={() => { setSheet(null); nav('/login') }} />}
    </div>
  )
}
