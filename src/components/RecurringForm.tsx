import { useState } from 'react'
import { monthOf, todayISO } from '../domain/dates'
import { newId } from '../domain/defaults'
import { kurusToInput, parseTL } from '../domain/money'
import type { RecurringRule, TxType } from '../domain/types'
import { useStore } from '../store'
import { CategoryGrid } from './CategoryGrid'
import { SegmentedControl } from './SegmentedControl'
import { Sheet } from './Sheet'

interface Props {
  existing?: RecurringRule
  onClose: () => void
}

export function RecurringForm({ existing, onClose }: Props) {
  const { data, dispatch } = useStore()
  const [type, setType] = useState<TxType>(existing?.type ?? 'expense')
  const [amountText, setAmountText] = useState(existing ? kurusToInput(existing.amount) : '')
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '')
  const [day, setDay] = useState(existing?.dayOfMonth ?? Number(todayISO().slice(8, 10)))
  const [note, setNote] = useState(existing?.note ?? '')

  const categories = data.categories.filter((c) => c.type === type)
  const amount = parseTL(amountText)
  const canSave = amount !== null && categories.some((c) => c.id === categoryId)

  const save = () => {
    if (!canSave || amount === null) return
    const rule: RecurringRule = existing
      ? { ...existing, type, amount, categoryId, note: note.trim(), dayOfMonth: day }
      : {
          id: newId(),
          type,
          amount,
          categoryId,
          note: note.trim(),
          dayOfMonth: day,
          // Yeni kural bu aydan başlar; geçmiş aylar için işlem uydurmaz.
          startMonth: monthOf(todayISO()),
        }
    dispatch({ type: existing ? 'rule/update' : 'rule/add', rule, today: todayISO() })
    onClose()
  }

  const remove = () => {
    if (existing && confirm('Düzenli ödeme silinsin mi? Geçmişte eklenen işlemler kalır.')) {
      dispatch({ type: 'rule/delete', id: existing.id })
      onClose()
    }
  }

  return (
    <Sheet
      title={existing ? 'Düzenli Ödemeyi Düzenle' : 'Yeni Düzenli Ödeme'}
      onClose={onClose}
      action={{ label: 'Kaydet', onClick: save, disabled: !canSave }}
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <SegmentedControl
          label="Tür"
          value={type}
          onChange={(t) => {
            setType(t)
            setCategoryId('')
          }}
          options={[
            { value: 'expense', label: 'Gider' },
            { value: 'income', label: 'Gelir' },
          ]}
        />
        <label className={`amount-field ${type}`}>
          <span className="amount-currency">₺</span>
          <input
            inputMode="decimal"
            placeholder="0"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            aria-label="Tutar"
          />
        </label>
        <CategoryGrid categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
        <div className="group">
          <label className="row">
            <span>Ayın kaçında</span>
            <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="row">
            <span>Not</span>
            <input
              type="text"
              placeholder="ör. Netflix, Kira"
              value={note}
              maxLength={80}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>
        {day > 28 && <p className="hint">Kısa aylarda ayın son gününe kaydırılır.</p>}
        {existing && (
          <>
            <p className="hint">Değişiklikler sonraki ödemelerden itibaren geçerli olur.</p>
            <button type="button" className="danger-button" onClick={remove}>
              Düzenli Ödemeyi Sil
            </button>
          </>
        )}
      </form>
    </Sheet>
  )
}
