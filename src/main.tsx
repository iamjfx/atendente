import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Mata service worker fantasma e limpa caches
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => {
    navigator.serviceWorker.getRegistrations().then(r => {
      r.forEach(reg => {
        if (reg.active && reg.active.scriptURL.includes('sw.js')) {
          reg.active.postMessage({ action: 'kill' })
        }
      })
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
