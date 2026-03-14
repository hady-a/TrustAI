import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Only register service worker in production
if (import.meta.env.PROD) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        // Add timestamp to service worker URL to prevent caching
        const swUrl = `/sw.js?v=${Date.now()}`
        
        const registration = await navigator.serviceWorker.register(swUrl, { 
          scope: '/',
          updateViaCache: 'none', // Never cache the service worker
        })
        
        console.log('✅ Service Worker registered:', registration)
        
        // Check for updates immediately and then every 30 seconds
        const checkUpdates = async () => {
          try {
            const updated = await registration.update()
            console.log('🔄 Service Worker update checked')
            return updated
          } catch (error) {
            console.warn('⚠️ Service Worker update check failed:', error)
          }
        }
        
        // Check immediately
        await checkUpdates()
        
        // Check regularly
        setInterval(checkUpdates, 30000)
        
        // Listen for controller changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('✅ Service Worker controller changed - refresh to see updates')
        })
        
      } catch (error) {
        console.warn('❌ Service Worker registration failed:', error)
      }
    })
  }
} else {
  // Development: unregister any existing service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().then(() => {
          console.log('♻️ Service Worker unregistered (development mode)')
        })
      })
    })
  }
  
  // Clear all caches in development
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((name) => {
        caches.delete(name).then(() => {
          console.log(`🗑️ Cleared cache in development: ${name}`)
        })
      })
    })
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

