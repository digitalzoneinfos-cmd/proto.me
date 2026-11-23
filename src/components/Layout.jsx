import { t } from '../lib/i18n.jsx'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from './Icons.jsx'
import Logo from './Logo.jsx'
import { LangSwitch } from './Lang.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api, isDemo } from '../lib/api.js'

const NAV = [
  { group: null, items: [{ to: '/', label: 'نظرة عامة', icon: 'grid', end: true }] },
  { group: 'التقارير', items: [
    { to: '/daily', label: 'التقرير اليومي', icon: 'calendar' },
    { to: '/monthly', label: 'التقرير الشهري', icon: 'report' },
  ] },
  { group: 'المالية', items: [
    { to: '/entries', label: 'إدخال المداخيل', icon: 'wallet', admin: true },
    { to: '/expenses', label: 'المصاريف والوصولات', icon: 'receipt' },
  ] },
  { group: 'التنبيهات', items: [
    { to: '/notices/supply', label: 'مستلزمات المتجر', icon: 'box', kind: 'supply' },
    { to: '/notices/suggestion', label: 'الاقتراحات', icon: 'bulb', kind: 'suggestion' },
    { to: '/notices/concern', label: 'انشغالات الطاقم', icon: 'users', kind: 'concern' },
  ] },
  { group: 'جهات الاتصال', items: [{ to: '/suppliers', label: 'الموردون', icon: 'truck' }] },
  { group: null, items: [{ to: '/activity', label: 'سجل التعديلات', icon: 'history' }, { to: '/settings', label: 'الإعدادات', icon: 'settings' }] },
]

const TITLES = {
  '/': 'نظرة عامة', '/daily': 'التقرير اليومي', '/monthly': 'التقرير الشهري', '/entries': 'إدخال المداخيل',
  '/expenses': 'المصاريف', '/notices/supply': 'مستلزمات المتجر', '/notices/suggestion': 'الاقتراحات',
  '/notices/concern': 'انشغالات الطاقم', '/suppliers': 'الموردون', '/settings': 'الإعدادات', '/activity': 'سجل التعديلات',
}

export function useTheme() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('theme') || 'dark' } catch { return 'dark' } })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('theme', theme) } catch { /* ignore */ }
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}

export default function Layout() {
  const { membership, isAdmin, org } = useAuth()
  const [open, setOpen] = useState(false)
  const [counts, setCounts] = useState({})
  const [theme, toggleTheme] = useTheme()
  const loc = useLocation()
  const nav = useNavigate()

  useEffect(() => setOpen(false), [loc.pathname])
  useEffect(() => {
    const load = () => api.listNotices().then((ns) => {
      const c = {}
      ns.filter((n) => n.status !== 'done').forEach((n) => { c[n.kind] = (c[n.kind] || 0) + 1 })
      setCounts(c)
    }).catch(() => {})
    load()
    window.addEventListener('notices-changed', load)
    return () => window.removeEventListener('notices-changed', load)
  }, [])

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const initials = (membership?.fullName || '؟').split(' ').map((w) => w[0]).slice(0, 2).join('')

  return (
    <div className="shell">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand"><Logo size={24} /></div>
        <div className="org-switch">
          <strong>{org?.name}</strong>
          <span>{isAdmin ? t('مدير النظام (أدمن)') : t('مسيّر — اطلاع')}</span>
        </div>
        <nav className="nav">
          {NAV.map((g, gi) => {
            const items = g.items.filter((i) => !i.admin || isAdmin)
            if (!items.length) return null
            return (
              <div key={gi}>
                {g.group && <div className="nav-label">{t(g.group)}</div>}
                {items.map((i) => (
                  <NavLink key={i.to} to={i.to} end={i.end}>
                    <span className="l"><Icon name={i.icon} size={17} />{t(i.label)}</span>
                    {i.kind && counts[i.kind] ? <span className="count">{counts[i.kind]}</span> : null}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>
        <div className="side-foot">
          {!isAdmin && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><span className="faint" style={{ fontSize: 12 }}>{t('اللغة')}</span><LangSwitch /></div>}
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <div className="who"><strong>{membership?.fullName}</strong><span>{membership?.email}</span></div>
          </div>
          <button className="btn sm ghost" style={{ justifyContent: 'flex-start' }} onClick={async () => { await api.signOut(); nav('/') }}>
            <Icon name="logout" size={16} />{t('تسجيل الخروج')}
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label={t('القائمة')}><Icon name="menu" /></button>
          <div className="crumbs">
            <Icon name="sidebar" size={16} />
            <span className="hide-sm">{org?.name}</span><span className="hide-sm">/</span>
            <b>{t(TITLES[loc.pathname] || '')}</b>
          </div>
          <div className="spacer" />
          {isDemo && <span className="demo-pill">{t('وضع تجريبي')}</span>}
          <button className="icon-btn" onClick={toggleTheme} aria-label={t('تبديل المظهر')}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
          <button className="icon-btn" onClick={() => nav('/notices/supply')} aria-label={t('التنبيهات')}>
            <Icon name="bell" />{total > 0 && <span className="dot" />}
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
        <nav className="bottom-nav no-print" aria-label="Main">
          {(isAdmin
            ? [['/', 'grid', 'نظرة عامة'], ['/entries', 'wallet', 'إدخال'], ['/daily', 'calendar', 'اليومي'], ['/expenses', 'receipt', 'المصاريف'], ['/notices/supply', 'bell', 'التنبيهات']]
            : [['/', 'grid', 'نظرة عامة'], ['/daily', 'calendar', 'اليومي'], ['/monthly', 'report', 'الشهري'], ['/expenses', 'receipt', 'المصاريف'], ['/notices/supply', 'bell', 'التنبيهات']]
          ).map(([to, ic, l]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive || (to.startsWith('/notices') && loc.pathname.startsWith('/notices')) ? 'active' : '')}>
              <Icon name={ic} size={20} /><span>{t(l)}</span>
              {to.startsWith('/notices') && total > 0 && <i className="count">{total}</i>}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
