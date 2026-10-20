import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'

/** Bu kadar aşağı sürüklenince bırakıldığında sheet kapanır. */
const DISMISS_DISTANCE = 110
/** Hızlı bir aşağı fiske de kapatır (px/ms). */
const DISMISS_VELOCITY = 0.6
/** Çıkış animasyonu bitmezse (ör. azaltılmış hareket ayarı) yine de kapat. */
const EXIT_FALLBACK_MS = 380

export interface SheetController {
  closing: boolean
  /** Çıkış animasyonunu başlatır; bitince onClose çağrılır. */
  close: () => void
  onExited: () => void
}

export function useSheet(onClose: () => void): SheetController {
  const [closing, setClosing] = useState(false)
  const close = useCallback(() => setClosing(true), [])
  return { closing, close, onExited: onClose }
}

interface SheetProps {
  title: string
  sheet: SheetController
  /** Kaydedilmemiş değişiklik varsa yanlışlıkla kapatmaya karşı korunur. */
  dirty?: boolean
  /** Verilirse sağ üstte gösterilir (ör. "Kaydet") */
  action?: { label: string; onClick: () => void; disabled?: boolean }
  children: ReactNode
}

const DISCARD_QUESTION = 'Değişiklikler kaydedilmeden kapatılsın mı?'

/** iOS tarzı alttan açılan sayfa */
export function Sheet({ title, sheet, dirty = false, action, children }: SheetProps) {
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [shaking, setShaking] = useState(false)
  const drag = useRef<{ startY: number; startTime: number } | null>(null)
  const { closing, close, onExited } = sheet

  const tryClose = useCallback(() => {
    if (!dirty || confirm(DISCARD_QUESTION)) close()
    else setDragY(0)
  }, [dirty, close])

  useEffect(() => {
    // Arka plan kaymasın; iOS'ta sheet içinde kaydırırken sayfa da kayıyordu.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && tryClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tryClose])

  useEffect(() => {
    if (!closing) return
    const timer = setTimeout(onExited, EXIT_FALLBACK_MS)
    return () => clearTimeout(timer)
  }, [closing, onExited])

  const onBackdropClick = () => {
    if (!dirty) return close()
    // Dolu formu dışarı dokunarak kaybetmek yerine sheet "burada değişiklik var" diye sallanır.
    setShaking(true)
  }

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    drag.current = { startY: e.clientY, startTime: performance.now() }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!drag.current) return
    const dy = e.clientY - drag.current.startY
    // Yukarı çekince lastik gibi direnç gösterir.
    setDragY(dy > 0 ? dy : dy / 6)
  }

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    if (!drag.current) return
    const dy = e.clientY - drag.current.startY
    const velocity = dy / (performance.now() - drag.current.startTime)
    drag.current = null
    setDragging(false)
    if (dy > DISMISS_DISTANCE || (dy > 30 && velocity > DISMISS_VELOCITY)) tryClose()
    else setDragY(0)
  }

  return (
    <div className={`sheet-backdrop ${closing ? 'closing' : ''}`} onClick={onBackdropClick}>
      <div
        className={`sheet ${closing ? 'closing' : ''} ${shaking ? 'shake' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={(e) => {
          if (e.target !== e.currentTarget) return
          if (closing) onExited()
          setShaking(false)
        }}
        style={
          dragY !== 0 && !closing
            ? { transform: `translateY(${dragY}px)`, transition: dragging ? 'none' : undefined }
            : closing && dragY > 0
              ? ({ '--drag-start': `${dragY}px` } as CSSProperties)
              : undefined
        }
      >
        <div
          className="sheet-handle"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="sheet-grabber" />
          <header className="sheet-header">
            <button type="button" className="link-button" onClick={tryClose}>
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
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
