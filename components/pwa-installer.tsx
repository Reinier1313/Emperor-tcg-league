'use client'

import { useEffect, useState } from 'react'

export function PWAInstaller() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    // Detect if app is installable
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    })

    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      const checkForUpdates = async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (
                    newWorker.state === 'installed' &&
                    navigator.serviceWorker.controller
                  ) {
                    setIsUpdateAvailable(true)
                  }
                })
              }
            })
            
            // Check for updates periodically
            setInterval(() => {
              registration.update()
            }, 60000) // Check every minute
          }
        } catch (error) {
          console.error('Service worker registration check failed:', error)
        }
      }
      
      checkForUpdates()
    }

    // Handle app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully')
      setDeferredPrompt(null)
    })
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsInstallable(false)
      }
    }
  }

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          // Skip waiting to activate new service worker
          const newWorker = registration.waiting || registration.installing
          if (newWorker) {
            newWorker.postMessage({ type: 'SKIP_WAITING' })
          }
          
          // Refresh the page
          window.location.reload()
        }
      })
    }
  }

  // Don't render anything if there's nothing to show
  if (!isUpdateAvailable && !isInstallable) {
    return null
  }

  return (
    <>
      {isUpdateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-blue-600 text-white rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Update Available</h3>
              <p className="text-sm mb-4">
                A new version of Emperor Batle League is available. Refresh to get the latest features and improvements.
              </p>
            </div>
            <button
              onClick={() => setIsUpdateAvailable(false)}
              className="text-white hover:text-gray-200 ml-2 flex-shrink-0"
              aria-label="Dismiss update notification"
            >
              ✕
            </button>
          </div>
          <button
            onClick={handleUpdate}
            className="w-full bg-white text-blue-600 font-semibold py-2 px-4 rounded hover:bg-gray-100 transition-colors"
          >
            Update Now
          </button>
        </div>
      )}

      {isInstallable && !isUpdateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-green-600 text-white rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Install App</h3>
              <p className="text-sm mb-4">
                Install Tondo Battle League on your device for quick access and offline support.
              </p>
            </div>
            <button
              onClick={() => setIsInstallable(false)}
              className="text-white hover:text-gray-200 ml-2 flex-shrink-0"
              aria-label="Dismiss install prompt"
            >
              ✕
            </button>
          </div>
          <button
            onClick={handleInstall}
            className="w-full bg-white text-green-600 font-semibold py-2 px-4 rounded hover:bg-gray-100 transition-colors"
          >
            Install
          </button>
        </div>
      )}
    </>
  )
}