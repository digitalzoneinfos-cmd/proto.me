import { LANGS, useLang, t } from '../lib/i18n.jsx'
import Logo from './Logo.jsx'

/** مبدّل لغة صغير (EN | AR | FR) */
export function LangSwitch({ className = '', onChange }) {
  const [lang, setLang] = useLang()
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l.code} className={lang === l.code ? 'on' : ''} onClick={() => { setLang(l.code); onChange?.(l.code) }} lang={l.code}>
          {l.short}
        </button>
      ))}
    </div>
  )
}

const HELLO = { en: 'Welcome', ar: 'مرحباً', fr: 'Bienvenue' }
const SUB = { en: 'Choose your language', ar: 'اختر لغتك', fr: 'Choisissez votre langue' }

/** شاشة اختيار اللغة عند أول دخول للمسيّر */
export function LanguagePicker({ suggested = 'en', onDone }) {
  const [, setLang] = useLang()
  return (
    <div className="langpick">
      <div className="langpick-glow" />
      <div className="langpick-card">
        <Logo size={30} />
        <div className="langpick-hello">
          {LANGS.map((l) => <span key={l.code} lang={l.code}>{HELLO[l.code]}</span>)}
        </div>
        <p>{SUB.en} · {SUB.ar} · {SUB.fr}</p>
        <div className="langpick-list">
          {LANGS.map((l, i) => (
            <button key={l.code} lang={l.code} dir={l.dir} style={{ animationDelay: `${0.15 + i * 0.08}s` }}
              className={l.code === suggested ? 'sug' : ''} onClick={() => { setLang(l.code); onDone(l.code) }}>
              <b>{l.short}</b>
              <span>{l.label}</span>
              {l.code === 'en' && <small>{t('اللغة الرسمية')}</small>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
