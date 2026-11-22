import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ToastProvider, ViewerProvider } from './components/ui.jsx'
import Layout, { useTheme } from './components/Layout.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Landing from './pages/Landing.jsx'
import { isStandalone } from './lib/install.js'
import { I18nRoot, hasChosenLang } from './lib/i18n.jsx'
import { LanguagePicker } from './components/Lang.jsx'
import { misconfigured } from './lib/api.js'
import Auth, { Setup } from './pages/Auth.jsx'
import Overview from './pages/Overview.jsx'
import { DailyReport, MonthlyReport } from './pages/Reports.jsx'
import { Expenses, Entries } from './pages/Finance.jsx'
import Board, { Suppliers } from './pages/Board.jsx'
import Settings from './pages/Settings.jsx'

function Gate() {
  const { loading, user, membership, isAdmin } = useAuth()
  useTheme()
  const [onb, setOnb] = useState(() => { try { return !localStorage.getItem('onb-done') } catch { return true } })
  const [langOk, setLangOk] = useState(hasChosenLang())

  const doneOnb = () => { try { localStorage.setItem('onb-done', '1') } catch { /* ignore */ } setOnb(false) }
  if (loading) return <div className="center-screen"><div className="spinner" /></div>

  if (!user) {
    // شرائح التعريف تظهر للمسيّر مرة واحدة قبل تسجيل الدخول
    const manager = !langOk ? <LanguagePicker onDone={() => setLangOk(true)} /> : onb ? <Onboarding onDone={doneOnb} /> : <Auth portal="manager" />
    return (
      <Routes>
        <Route path="/" element={isStandalone() ? <Navigate to="/login" replace /> : <Landing />} />
        <Route path="/login" element={manager} />
        <Route path="/admin" element={<Auth portal="admin" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }
  if (!membership) return <Setup />
  if (!isAdmin && !langOk) return <LanguagePicker suggested={membership.org?.language || 'en'} onDone={() => setLangOk(true)} />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="daily" element={<DailyReport />} />
        <Route path="monthly" element={<MonthlyReport />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="entries" element={isAdmin ? <Entries /> : <Navigate to="/" />} />
        <Route path="notices/:kind" element={<Board />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  if (misconfigured) return (
    <div className="center-screen" style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ maxWidth: 420, display: 'grid', gap: 10 }}>
        <h2 style={{ margin: 0 }}>App not configured</h2>
        <p className="muted" style={{ margin: 0 }}>Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Add them in the hosting settings and redeploy.</p>
      </div>
    </div>
  )
  return (
    <HashRouter>
      <ToastProvider>
        <ViewerProvider>
          <AuthProvider>
            <I18nRoot><Gate /></I18nRoot>
          </AuthProvider>
        </ViewerProvider>
      </ToastProvider>
    </HashRouter>
  )
}
