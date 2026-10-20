import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface ToastOptions {
  text: string
  /** Verilirse "Geri al" düğmesi gösterilir. */
  undo?: () => void
  kind?: 'ok' | 'error'
}

interface ToastState extends ToastOptions {
  id: number
  leaving: boolean
}

const ToastContext = createContext<(options: ToastOptions) => void>(() => {})

const VISIBLE_MS = 3200
/** Geri alma fırsatı tanımak için bildirim biraz daha uzun kalır. */
const VISIBLE_WITH_UNDO_MS = 5000
const LEAVE_ANIMATION_MS = 220

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const nextId = useRef(0)

  const show = useCallback((options: ToastOptions) => {
    nextId.current += 1
    setToast({ ...options, id: nextId.current, leaving: false })
  }, [])

  useEffect(() => {
    if (!toast || toast.leaving) return
    const hideTimer = setTimeout(
      () => setToast((t) => (t?.id === toast.id ? { ...t, leaving: true } : t)),
      toast.undo ? VISIBLE_WITH_UNDO_MS : VISIBLE_MS,
    )
    return () => clearTimeout(hideTimer)
  }, [toast])

  useEffect(() => {
    if (!toast?.leaving) return
    const removeTimer = setTimeout(
      () => setToast((t) => (t?.id === toast.id ? null : t)),
      LEAVE_ANIMATION_MS,
    )
    return () => clearTimeout(removeTimer)
  }, [toast])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-host" aria-live="polite">
        {toast && (
          <div
            key={toast.id}
            className={`toast-pill ${toast.kind ?? 'ok'} ${toast.leaving ? 'leaving' : ''}`}
            role="status"
          >
            <span>{toast.text}</span>
            {toast.undo && (
              <button
                type="button"
                onClick={() => {
                  toast.undo?.()
                  setToast({ ...toast, leaving: true })
                }}
              >
                Geri al
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
