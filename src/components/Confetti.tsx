import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

const PIECES = ['🎉', '✨', '💰', '⭐', '🎊', '💸']
const PIECE_COUNT = 28
const DURATION_MS = 1800

interface Piece {
  emoji: string
  x: number
  drift: number
  delay: number
  spin: number
}

function makePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => ({
    emoji: PIECES[i % PIECES.length],
    x: Math.random() * 100,
    drift: (Math.random() - 0.5) * 160,
    delay: Math.random() * 250,
    spin: (Math.random() - 0.5) * 720,
  }))
}

/** Hedef tamamlanınca ekranın altından yukarı fışkıran emoji konfetisi. */
export function Confetti({ onDone }: { onDone: () => void }) {
  // Rastgele konumlar yalnızca bir kez üretilir; her render'da değişip titremesin.
  const [pieces] = useState(makePieces)

  useEffect(() => {
    const timer = setTimeout(onDone, DURATION_MS + 300)
    return () => clearTimeout(timer)
  }, [onDone])

  return createPortal(
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={
            {
              left: `${p.x}%`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${DURATION_MS}ms`,
            } as CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>,
    document.body,
  )
}
