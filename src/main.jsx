import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import { registerSW } from './lib/install.js'
import { startTableLabels } from './lib/stackTables.js'

registerSW()
queueMicrotask(() => startTableLabels())

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
