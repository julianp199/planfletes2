import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './style.css'

const root = createRoot(document.getElementById('root'))
root.render(<App />)

// Register SW for PWA (if supported)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
