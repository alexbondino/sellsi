// 🛡️ SAFARI FIX: Polyfill para requestIdleCallback (debe ir PRIMERO antes que cualquier otro import)
import './lib/polyfills.js';

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
