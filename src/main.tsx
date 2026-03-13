import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTray } from './tray'

const rootElement = document.getElementById('root')!

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('__TAURI__' in window) {
  void initTray()
}
