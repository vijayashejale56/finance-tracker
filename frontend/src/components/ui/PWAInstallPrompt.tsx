import { useEffect, useState } from 'react'

// Type for the browser install event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia(
        '(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // Check if user already dismissed
    const dismissed = localStorage.getItem(
      'pwa-install-dismissed')
    if (dismissed) return

    // Listen for browser's install event
    const handler = (e: Event) => {
      // Prevent browser's default prompt
      e.preventDefault()
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show our custom banner after 3 seconds
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setShowBanner(false)
      setInstalled(true)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener(
        'beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Show browser native install dialog
    await deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowBanner(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    // Remember dismissal — don't show again
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if already installed or no prompt
  if (!showBanner || installed) return null

  return (
    <div className="fixed bottom-20 left-4 right-4
      md:bottom-6 md:left-auto md:right-6 md:w-80
      bg-white dark:bg-gray-900 border border-gray-200
      dark:border-gray-700 rounded-2xl shadow-2xl
      p-4 z-50 animate-slide-up">

      <div className="flex items-start gap-3">
        {/* App Icon */}
        <div className="w-12 h-12 rounded-xl
          bg-gradient-to-br from-indigo-500 to-purple-600
          flex items-center justify-center text-white
          text-xl font-bold flex-shrink-0">
          ₹
        </div>

        <div className="flex-1">
          <p className="font-semibold text-gray-900
            dark:text-white text-sm">
            Install Finance Tracker
          </p>
          <p className="text-xs text-gray-500
            dark:text-gray-400 mt-0.5">
            Add to home screen for quick access —
            works offline too!
          </p>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-indigo-600
                hover:bg-indigo-700 text-white text-xs
                font-semibold py-2 rounded-lg transition">
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-xs text-gray-400
                hover:text-gray-600 dark:hover:text-gray-300
                transition rounded-lg hover:bg-gray-100
                dark:hover:bg-gray-800">
              Not now
            </button>
          </div>
        </div>

        {/* Close */}
        <button onClick={handleDismiss}
          className="text-gray-300 hover:text-gray-500
            dark:text-gray-600 dark:hover:text-gray-400
            transition flex-shrink-0">
          ✕
        </button>
      </div>
    </div>
  )
}