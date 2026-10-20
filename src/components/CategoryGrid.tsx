import type { CSSProperties } from 'react'
import type { Category } from '../domain/types'

interface Props {
  categories: Category[]
  selectedId: string
  onSelect: (id: string) => void
}

export function CategoryGrid({ categories, selectedId, onSelect }: Props) {
  return (
    <div className="category-grid" role="radiogroup" aria-label="Kategori">
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={c.id === selectedId}
          className={`category-chip ${c.id === selectedId ? 'selected' : ''}`}
          style={{ '--cat': c.color } as CSSProperties}
          onClick={() => onSelect(c.id)}
        >
          <span className="category-chip-emoji">{c.emoji}</span>
          <span className="category-chip-name">{c.name}</span>
        </button>
      ))}
    </div>
  )
}
