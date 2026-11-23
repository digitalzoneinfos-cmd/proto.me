import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import { registerSW } from './lib/install.js'
import { startTableLabels } from './lib/stackTables.js'

registerSW()
queueMicrotask(() => startTableLabels())

import { api, recoveryMode } from './lib/api.js'

const start = () => ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
// عند فتح رابط استرجاع كلمة المرور ننتظر Supabase حتى يقرأ الرابط قبل تشغيل الواجهة
if (recoveryMode) api.getUser().catch(() => {}).finally(start)
else start()
