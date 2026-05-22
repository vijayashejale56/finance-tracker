import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

// Global toast state — simple event system
const listeners: ((toast: ToastMessage) => void)[] = []

export const toast = {
  success: (message: string) => emit({ type: 'success', message }),
  error:   (message: string) => emit({ type: 'error',   message }),
  warning: (message: string) => emit({ type: 'warning', message }),
}

function emit(t: Omit<ToastMessage, 'id'>) {
  const toast = { ...t, id: Math.random().toString(36).slice(2) }
  listeners.forEach(l => l(toast))
}

const ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️'
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const handler = (t: ToastMessage) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => {
        setToasts(prev => prev.filter(p => p.id !== t.id))
      }, 3500)
    }
    listeners.push(handler)
    return () => {
      const i = listeners.indexOf(handler)
      if (i > -1) listeners.splice(i, 1)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{ICONS[t.type]}</span>
          <span>{t.message}</span>
          <button
            onClick={() =>
              setToasts(prev => prev.filter(p => p.id !== t.id))}
            className="ml-auto text-current opacity-50 hover:opacity-100 text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}