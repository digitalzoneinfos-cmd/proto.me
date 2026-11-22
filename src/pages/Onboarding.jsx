import { t } from '../lib/i18n.jsx'
import { useEffect, useState } from 'react'
import { Icon, WhatsAppIcon } from '../components/Icons.jsx'
import Logo from '../components/Logo.jsx'

const SLIDES = [
  {
    step: '01 — نظرة عامة',
    title: 'كل أرقام متجرك في شاشة واحدة',
    text: 'مداخيل البطاقة والنقد، المصاريف والصافي — محسوبة تلقائياً يوماً بيوم.',
    points: ['متابعة يومية وشهرية', 'الرجوع لأي تاريخ أو شهر سابق'],
    art: () => (
      <>
        <div className="art-card float" style={{ top: 0, insetInlineStart: '4%', width: '62%', '--r': '-2deg' }}>
          <div className="muted" style={{ fontSize: 12 }}>{t('صافي المداخيل')}</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 40, fontWeight: 700, lineHeight: 1.1 }} className="num">5,583.50</div>
          <div className="progress" style={{ marginTop: 10 }}><i style={{ width: '72%' }} /></div>
        </div>
        <div className="art-card" style={{ bottom: 0, insetInlineEnd: 0, width: '78%', animationDelay: '.15s' }}>
          <div className="mini-bars">
            {[40, 62, 48, 80, 55, 92, 70].map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${0.3 + i * 0.07}s` }} />)}
          </div>
        </div>
      </>
    ),
  },
  {
    step: '02 — المصاريف',
    title: 'كل مصروف… ووصله أمامه',
    text: 'اضغط على أي مصروف لمعاينة صورة الوصل أو ملفه مباشرة، دون البحث في الأوراق.',
    points: ['صور وملفات PDF', 'تصنيف تلقائي حسب الفئة'],
    art: () => (
      <>
        <div className="art-card" style={{ top: '6%', insetInlineStart: 0, width: '70%' }}>
          {[['المصري — أبجد', '694.00'], ['دفعة فاتورة الحبر', '400.00'], ['أرسلان — راتب', '300.00']].map(([a, b], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--line-soft)' : 0 }}>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="thumb" style={{ width: 30, height: 30 }}><Icon name="receipt" size={14} /></span>{t(a)}</span>
              <b className="num">{b}</b>
            </div>
          ))}
        </div>
        <div className="art-card float" style={{ bottom: 0, insetInlineEnd: '2%', width: 170, height: 220, background: '#fbfaf6', color: '#222', '--r': '5deg', animationDelay: '.2s' }}>
          <div style={{ textAlign: 'center', fontWeight: 700 }}>RECEIPT</div>
          {[80, 60, 70, 45, 65].map((w, i) => <div key={i} style={{ height: 8, width: `${w}%`, background: '#ddd', margin: '12px 0' }} />)}
          <div style={{ fontWeight: 700, textAlign: 'left', fontSize: 18 }}>694.00</div>
        </div>
      </>
    ),
  },
  {
    step: '03 — التقارير',
    title: 'تقارير جاهزة للطباعة والتحميل',
    text: 'تقرير يومي وشهري بنفس تنسيق تقرير المكتبة، قابل للتعديل، الطباعة، وتصدير PDF أو Excel.',
    points: ['طباعة بضغطة واحدة', 'تعديل النصوص قبل الطباعة'],
    art: () => (
      <>
        <div className="art-card float" style={{ top: 0, insetInlineStart: '12%', width: '60%', height: '92%', background: '#fff', color: '#1d2433', '--r': '-3deg' }}>
          <div style={{ color: '#1565d8', fontWeight: 700, fontFamily: 'var(--display)', fontSize: 18 }}>{t('تقرير المداخيل والمصاريف')}</div>
          <div style={{ height: 3, background: '#1565d8', margin: '8px 0 12px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ height: 34, border: '1px solid #e5e7eb', borderRadius: 4, background: i === 2 ? '#1565d8' : '#fff' }} />)}
          </div>
          {Array.from({ length: 7 }).map((_, i) => <div key={i} style={{ height: 7, background: '#eef1f6', margin: '11px 0', width: `${95 - (i % 3) * 12}%` }} />)}
        </div>
        <div className="art-card" style={{ bottom: '8%', insetInlineEnd: 0, display: 'flex', gap: 8, padding: 10, animationDelay: '.25s' }}>
          <span className="btn sm primary"><Icon name="print" size={15} />{t('طباعة')}</span>
          <span className="btn sm"><Icon name="download" size={15} />Excel</span>
        </div>
      </>
    ),
  },
  {
    step: '04 — التنبيهات والموردون',
    title: 'صوت الطاقم يصل… والمورد على بعد ضغطة',
    text: 'مستلزمات المتجر، الاقتراحات، وانشغالات الطاقم في صفحات منظمة، مع التواصل مع الموردين عبر واتساب مباشرة.',
    points: ['حالة كل طلب: جديد، قيد المعالجة، تم', 'اتصال أو واتساب فوري'],
    art: () => (
      <>
        <div className="art-card" style={{ top: 0, insetInlineStart: 0, width: '64%' }}>
          {[['ورق طباعة A4', 'var(--red)', 'جديد'], ['ركن قصص الأطفال', 'var(--yellow)', 'قيد المعالجة'], ['أكياس تغليف', 'var(--green)', 'تم']].map(([tt, c, s], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < 2 ? '1px solid var(--line-soft)' : 0 }}>
              <span>{t(tt)}</span><span className="badge"><i style={{ background: c }} />{t(s)}</span>
            </div>
          ))}
        </div>
        <div className="art-card float" style={{ bottom: '4%', insetInlineEnd: '4%', width: '56%', '--r': '2deg', animationDelay: '.2s' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, background: 'var(--blue)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{t('أ')}</div>
            <div><b>{t('المصري — أبجد')}</b><div className="muted num" style={{ fontSize: 12 }}>+974 5000 0001</div></div>
          </div>
          <div className="btn wa sm" style={{ marginTop: 12, width: '100%' }}><WhatsAppIcon size={16} />{t('واتساب')}</div>
        </div>
      </>
    ),
  },
  {
    step: '05 — الأمان',
    title: 'دخول آمن بكود دعوة سري',
    text: 'أنشئ حسابك، ثم أدخل كود الدعوة الذي يشاركه معك الأدمن للوصول إلى بيانات المتجر. الأدمن وحده يضيف ويعدّل.',
    points: ['صلاحيات منفصلة للأدمن والمسيّرين', 'تغيير الكود في أي وقت'],
    art: () => (
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <span className="pulse-ring" style={{ width: 220, height: 220 }} />
        <span className="pulse-ring" style={{ width: 220, height: 220, animationDelay: '1.2s' }} />
        <div className="art-card" style={{ position: 'relative', textAlign: 'center', padding: '24px 30px' }}>
          <Icon name="lock" size={30} />
          <div className="invite-code" style={{ marginTop: 12, fontSize: 26 }}>ARYM••••</div>
        </div>
      </div>
    ),
  },
]

export default function Onboarding({ onDone }) {
  const [i, setI] = useState(0)
  const s = SLIDES[i]
  const last = i === SLIDES.length - 1
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'ArrowLeft') setI((x) => Math.min(x + 1, SLIDES.length - 1))
      if (e.key === 'ArrowRight') setI((x) => Math.max(x - 1, 0))
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  // swipe on mobile
  const [x0, setX0] = useState(null)
  const onTouchEnd = (e) => {
    if (x0 == null) return
    const dx = e.changedTouches[0].clientX - x0
    if (dx > 50) setI((v) => Math.min(v + 1, SLIDES.length - 1))
    if (dx < -50) setI((v) => Math.max(v - 1, 0))
    setX0(null)
  }

  return (
    <div className="onb" onTouchStart={(e) => setX0(e.touches[0].clientX)} onTouchEnd={onTouchEnd}>
      <div className="onb-top">
        <Logo size={26} />
        <button className="btn ghost sm" onClick={onDone}>{t('تخطّي')}</button>
      </div>
      <div className="onb-stage" key={i}>
        <div className="onb-text slide-in">
          <span className="step">{t(s.step)}</span>
          <h1>{t(s.title)}</h1>
          <p>{t(s.text)}</p>
          <ul>{s.points.map((p) => <li key={p}><i />{t(p)}</li>)}</ul>
        </div>
        <div className="onb-art">{s.art()}</div>
      </div>
      <div className="onb-foot">
        <div className="dots">{SLIDES.map((_, k) => <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`${k + 1}`} />)}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {i > 0 && <button className="btn" onClick={() => setI(i - 1)}><Icon name="arrowR" size={16} className="flip-ltr" />{t('السابق')}</button>}
          <button className="btn primary" onClick={() => (last ? onDone() : setI(i + 1))}>
            {last ? t('ابدأ الآن') : t('التالي')}<Icon name="arrowL" size={16} className="flip-ltr" />
          </button>
        </div>
      </div>
    </div>
  )
}
