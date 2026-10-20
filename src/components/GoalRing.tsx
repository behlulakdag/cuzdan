import type { CSSProperties } from 'react'

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Hedef ilerleme halkası: soluk iz, renkli ilerleme ve ortada simge.
 * Tamamlanınca dışında ikinci bir parlayan halka belirir.
 */
export function GoalRing({
  ratio,
  color,
  emoji,
  size = 64,
  completed = false,
}: {
  ratio: number
  color: string
  emoji: string
  size?: number
  completed?: boolean
}) {
  const dash = CIRCUMFERENCE * Math.min(Math.max(ratio, 0), 1)
  return (
    <span
      className={`goal-ring ${completed ? 'completed' : ''}`}
      style={{ '--ring': color, width: size, height: size, fontSize: size * 0.38 } as CSSProperties}
    >
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={RADIUS} className="goal-ring-track" />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          className="goal-ring-fill"
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          style={{ '--dash': dash, '--circumference': CIRCUMFERENCE } as CSSProperties}
        />
      </svg>
      <span className="goal-ring-emoji">{emoji}</span>
    </span>
  )
}
