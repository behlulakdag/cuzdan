import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react'

/** "Sil" düğmesinin genişliği; bu kadar açılınca durur. */
const ACTION_WIDTH = 84
/** Parmağın yön belirlemeden önce kayabileceği mesafe; dikey kaydırmayla karışmasın. */
const DIRECTION_LOCK_PX = 8
/** Satır genişliğinin bu oranı kadar kaydırılıp bırakılırsa düğmeye basmadan silinir. */
const FULL_SWIPE_RATIO = 0.55
const REMOVE_ANIMATION_MS = 260

/** Aynı anda tek satır açık kalsın diye satırlar birbirine haber verir. */
const OPEN_EVENT = 'swiperow:open'

interface Props {
  children: ReactNode
  onDelete: () => void
  deleteLabel?: string
}

export function SwipeRow({ children, onDelete, deleteLabel = 'Sil' }: Props) {
  const id = useId()
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [removing, setRemoving] = useState(false)
  const gesture = useRef<{ x: number; y: number; base: number; axis: 'x' | 'y' | null } | null>(null)
  const suppressClick = useRef(false)
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onOtherOpen = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) setOffset(0)
    }
    window.addEventListener(OPEN_EVENT, onOtherOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOtherOpen)
  }, [id])

  const remove = () => {
    setRemoving(true)
    setTimeout(onDelete, REMOVE_ANIMATION_MS)
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    gesture.current = { x: e.clientX, y: e.clientY, base: offset, axis: null }
    suppressClick.current = false
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g) return
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (g.axis === null) {
      if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (g.axis === 'x') {
        e.currentTarget.setPointerCapture?.(e.pointerId)
        setDragging(true)
        window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }))
      }
    }
    if (g.axis !== 'x') return
    suppressClick.current = true
    const next = g.base + dx
    // Sağa doğru kapalı konumun ötesine gitmez; sola serbest.
    setOffset(Math.min(next, 0))
  }

  const onPointerUp = () => {
    const g = gesture.current
    gesture.current = null
    if (!g || g.axis !== 'x') return
    setDragging(false)
    const width = rowRef.current?.offsetWidth ?? 360
    if (-offset > width * FULL_SWIPE_RATIO) remove()
    else setOffset(-offset > ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0)
  }

  const revealed = -offset

  return (
    <div ref={rowRef} className={`swipe-row ${removing ? 'removing' : ''}`}>
      <button
        type="button"
        className="swipe-action"
        style={{ width: Math.max(revealed, ACTION_WIDTH) }}
        onClick={remove}
        tabIndex={offset === 0 ? -1 : 0}
        aria-hidden={offset === 0}
      >
        <span style={{ opacity: Math.min(revealed / ACTION_WIDTH, 1) }}>{deleteLabel}</span>
      </button>
      <div
        className="swipe-content"
        style={{
          transform: `translateX(${removing ? '-100%' : `${offset}px`})`,
          transition: dragging ? 'none' : undefined,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          // Kaydırma sonrası bırakınca satırın düzenleme ekranı açılmasın;
          // açık satıra dokunmak da önce satırı kapatır.
          if (suppressClick.current || offset !== 0) {
            e.stopPropagation()
            e.preventDefault()
            suppressClick.current = false
            setOffset(0)
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
