import type { CSSProperties } from 'react'

export const EMOJIS = [
  '🛒', '🍔', '☕', '🍕', '🚌', '🚗', '⛽', '🚕', '💡', '💧', '📱', '🌐',
  '🏠', '🛋️', '📺', '🎬', '🎮', '🎵', '📚', '✏️', '👕', '👟', '💄', '💇',
  '💊', '🏥', '🏋️', '⚽', '✈️', '🏖️', '🎁', '🐶', '👶', '🚬', '🍺', '💳',
  '💼', '🛠️', '💰', '📈', '🏦', '🎓', '💻', '📦', '❤️', '⭐', '🔧', '🧾',
]

export const GOAL_EMOJIS = [
  '🏖️', '✈️', '🚗', '🏍️', '🏠', '💻', '📱', '🎮', '🎸', '📷', '💍', '🎓',
  '🛡️', '👶', '🐶', '🚲', '⌚', '🎧', '🏋️', '💰', '🎁', '🌍', '⛺', '⭐',
]

export const COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#30B0C7',
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E', '#8E8E93',
]

export function EmojiPicker({
  emojis,
  value,
  onChange,
}: {
  emojis: string[]
  value: string
  onChange: (emoji: string) => void
}) {
  return (
    <div className="picker-grid emoji-grid" role="radiogroup" aria-label="Simge">
      {emojis.map((e) => (
        <button
          key={e}
          type="button"
          role="radio"
          aria-checked={e === value}
          aria-label={e}
          className={e === value ? 'selected' : ''}
          onClick={() => onChange(e)}
        >
          {e}
        </button>
      ))}
    </div>
  )
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="picker-grid color-grid" role="radiogroup" aria-label="Renk">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={c === value}
          aria-label={`Renk ${c}`}
          className={c === value ? 'selected' : ''}
          style={{ '--swatch': c } as CSSProperties}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  )
}
