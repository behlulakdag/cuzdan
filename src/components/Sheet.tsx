import { useEffect, type ReactNode } from 'react'

interface SheetProps {
  title: string
  onClose: () => void
  /** Verilirse sağ üstte gösterilir (ör. "Kaydet") */
  action?: { label: string; onClick: () => void; disabled?: boolean }
  children: ReactNode
}

/** iOS tarzı alttan açılan sayfa */
export function Sheet({ title, onClose, action, children }: SheetProps) {
  useEffect(() => {
    // Arka plan kaymasın; iOS'ta sheet içinde kaydırırken sayfa da kayıyordu.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grabber" />
        <header className="sheet-header">
          <button type="button" className="link-button" onClick={onClose}>
            Vazgeç
          </button>
          <h2>{title}</h2>
          {action ? (
            <button
              type="button"
              className="link-button strong"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ) : (
            <span className="sheet-header-spacer" />
          )}
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
