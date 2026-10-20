import { useState, type CSSProperties } from 'react'
import { newId } from '../domain/defaults'
import { FALLBACK_CATEGORY } from '../domain/reducer'
import type { Category, TxType } from '../domain/types'
import { useStore } from '../store'
import { ChevronRight } from './Icons'
import { SegmentedControl } from './SegmentedControl'
import { Sheet, useSheet } from './Sheet'
import { useToast } from './Toast'

const EMOJIS = [
  '🛒', '🍔', '☕', '🍕', '🚌', '🚗', '⛽', '🚕', '💡', '💧', '📱', '🌐',
  '🏠', '🛋️', '📺', '🎬', '🎮', '🎵', '📚', '✏️', '👕', '👟', '💄', '💇',
  '💊', '🏥', '🏋️', '⚽', '✈️', '🏖️', '🎁', '🐶', '👶', '🚬', '🍺', '💳',
  '💼', '🛠️', '💰', '📈', '🏦', '🎓', '💻', '📦', '❤️', '⭐', '🔧', '🧾',
]

const COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#30B0C7',
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E', '#8E8E93',
]

export function CategoryManager({ onClose }: { onClose: () => void }) {
  const { data } = useStore()
  const sheet = useSheet(onClose)
  const [type, setType] = useState<TxType>('expense')
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const list = data.categories.filter((c) => c.type === type)
  const usage = (id: string) => data.transactions.filter((t) => t.categoryId === id).length

  return (
    <Sheet title="Kategoriler" sheet={sheet}>
      <div className="form">
        <SegmentedControl
          label="Kategori türü"
          value={type}
          onChange={setType}
          options={[
            { value: 'expense', label: 'Gider' },
            { value: 'income', label: 'Gelir' },
          ]}
        />
        <div className="group">
          {list.map((c) => (
            <button key={c.id} type="button" className="tx-row" onClick={() => setEditing(c)}>
              <span className="tx-icon" style={{ '--cat': c.color } as CSSProperties}>
                {c.emoji}
              </span>
              <span className="tx-text">
                <span className="tx-title">{c.name}</span>
                <span className="tx-sub">{usage(c.id)} işlem</span>
              </span>
              <ChevronRight className="row-chevron" />
            </button>
          ))}
          <button type="button" className="row-button" onClick={() => setEditing('new')}>
            + Yeni kategori
          </button>
        </div>
      </div>
      {editing && (
        <CategoryForm
          existing={editing === 'new' ? undefined : editing}
          type={type}
          onClose={() => setEditing(null)}
        />
      )}
    </Sheet>
  )
}

function CategoryForm({
  existing,
  type,
  onClose,
}: {
  existing?: Category
  type: TxType
  onClose: () => void
}) {
  const { data, dispatch } = useStore()
  const toast = useToast()
  const sheet = useSheet(onClose)
  const [name, setName] = useState(existing?.name ?? '')
  const [emoji, setEmoji] = useState(existing?.emoji ?? EMOJIS[0])
  const [color, setColor] = useState(existing?.color ?? COLORS[6])

  const trimmed = name.trim()
  const duplicate = data.categories.some(
    (c) =>
      c.type === type && c.id !== existing?.id &&
      c.name.toLocaleLowerCase('tr-TR') === trimmed.toLocaleLowerCase('tr-TR'),
  )
  const canSave = trimmed !== '' && !duplicate
  const dirty = existing
    ? trimmed !== existing.name || emoji !== existing.emoji || color !== existing.color
    : trimmed !== ''
  const isFallback = existing && Object.values(FALLBACK_CATEGORY).includes(existing.id)
  const usage = existing ? data.transactions.filter((t) => t.categoryId === existing.id).length : 0

  const save = () => {
    if (!canSave) return
    const category: Category = { id: existing?.id ?? newId(), name: trimmed, emoji, color, type }
    dispatch(existing ? { type: 'category/update', category } : { type: 'category/add', category })
    toast({ text: existing ? 'Kategori güncellendi' : `${emoji} ${trimmed} eklendi` })
    sheet.close()
  }

  const remove = () => {
    if (!existing) return
    const message = usage > 0
      ? `${existing.name} silinsin mi? ${usage} işlem "Diğer" kategorisine taşınacak.`
      : `${existing.name} silinsin mi?`
    if (!confirm(message)) return
    const before = data
    dispatch({ type: 'category/delete', id: existing.id })
    toast({ text: 'Kategori silindi', undo: () => dispatch({ type: 'data/replace', data: before }) })
    sheet.close()
  }

  return (
    <Sheet
      title={existing ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
      sheet={sheet}
      dirty={dirty}
      action={{ label: 'Kaydet', onClick: save, disabled: !canSave }}
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <div className="category-preview" style={{ '--cat': color } as CSSProperties}>
          <span className="category-preview-icon">{emoji}</span>
          <span className="category-preview-name">{trimmed || 'Kategori adı'}</span>
        </div>

        <div className="group">
          <label className="row">
            <span>Ad</span>
            <input
              type="text"
              value={name}
              maxLength={20}
              placeholder="ör. Kahve"
              onChange={(e) => setName(e.target.value)}
              autoFocus={!existing}
              aria-label="Kategori adı"
            />
          </label>
        </div>
        {duplicate && <p className="field-error">Bu adda bir kategori zaten var.</p>}

        <div className="picker-grid emoji-grid" role="radiogroup" aria-label="Simge">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              role="radio"
              aria-checked={e === emoji}
              aria-label={e}
              className={e === emoji ? 'selected' : ''}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="picker-grid color-grid" role="radiogroup" aria-label="Renk">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === color}
              aria-label={`Renk ${c}`}
              className={c === color ? 'selected' : ''}
              style={{ '--swatch': c } as CSSProperties}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        {existing && !isFallback && (
          <button type="button" className="danger-button" onClick={remove}>
            Kategoriyi Sil
          </button>
        )}
        {isFallback && (
          <p className="hint">"Diğer" silinemez; silinen kategorilerin işlemleri buraya taşınır.</p>
        )}
      </form>
    </Sheet>
  )
}
