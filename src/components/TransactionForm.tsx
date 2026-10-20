import { useState } from 'react'
import { monthOf, todayISO } from '../domain/dates'
import { newId } from '../domain/defaults'
import { kurusToInput, parseTL } from '../domain/money'
import type { RecurringRule, Transaction, TxType } from '../domain/types'
import { useStore } from '../store'
import { CategoryGrid } from './CategoryGrid'
import { SegmentedControl } from './SegmentedControl'
import { Sheet } from './Sheet'

interface Props {
  existing?: Transaction
  onClose: () => void
}

export function TransactionForm({ existing, onClose }: Props) {
  const { data, dispatch } = useStore()
  const [type, setType] = useState<TxType>(existing?.type ?? 'expense')
  const [amountText, setAmountText] = useState(existing ? kurusToInput(existing.amount) : '')
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '')
  const [date, setDate] = useState(existing?.date ?? todayISO())
  const [note, setNote] = useState(existing?.note ?? '')
  const [repeatMonthly, setRepeatMonthly] = useState(false)

  const categories = data.categories.filter((c) => c.type === type)
  const amount = parseTL(amountText)
  const categoryValid = categories.some((c) => c.id === categoryId)
  const canSave = amount !== null && categoryValid && date !== ''

  const changeType = (t: TxType) => {
    setType(t)
    setCategoryId('')
  }

  const save = () => {
    if (!canSave || amount === null) return
    if (repeatMonthly) {
      const rule: RecurringRule = {
        id: newId(),
        type,
        amount,
        categoryId,
        note: note.trim(),
        dayOfMonth: Number(date.slice(8, 10)),
        startMonth: monthOf(date),
      }
      dispatch({ type: 'rule/add', rule, today: todayISO() })
    } else {
      const tx: Transaction = {
        ...existing,
        id: existing?.id ?? newId(),
        type,
        amount,
        categoryId,
        date,
        note: note.trim(),
      }
      dispatch(existing ? { type: 'tx/update', tx } : { type: 'tx/add', tx })
    }
    onClose()
  }

  const remove = () => {
    if (existing && confirm('Bu işlem silinsin mi?')) {
      dispatch({ type: 'tx/delete', id: existing.id })
      onClose()
    }
  }

  return (
    <Sheet
      title={existing ? 'İşlemi Düzenle' : 'Yeni İşlem'}
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
          label="İşlem türü"
          value={type}
          onChange={changeType}
          options={[
            { value: 'expense', label: 'Gider' },
            { value: 'income', label: 'Gelir' },
          ]}
        />

        <label className={`amount-field ${type}`}>
          <span className="visually-hidden">Tutar</span>
          <span className="amount-currency">₺</span>
          <input
            inputMode="decimal"
            placeholder="0"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            autoFocus={!existing}
            aria-label="Tutar"
            aria-invalid={amountText !== '' && amount === null}
          />
        </label>
        {amountText !== '' && amount === null && (
          <p className="field-error">Geçerli bir tutar yaz (ör. 149,90)</p>
        )}

        <CategoryGrid categories={categories} selectedId={categoryId} onSelect={setCategoryId} />

        <div className="group">
          <label className="row">
            <span>Tarih</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="row">
            <span>Not</span>
            <input
              type="text"
              placeholder="İsteğe bağlı"
              value={note}
              maxLength={80}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          {!existing && (
            <label className="row">
              <span>Her ay tekrarla</span>
              <input
                type="checkbox"
                className="switch"
                checked={repeatMonthly}
                onChange={(e) => setRepeatMonthly(e.target.checked)}
              />
            </label>
          )}
        </div>
        {repeatMonthly && (
          <p className="hint">
            Her ayın {Number(date.slice(8, 10))}. günü otomatik eklenir. Ayarlar &gt; Düzenli
            Ödemeler'den değiştirebilirsin.
          </p>
        )}
        {existing?.recurringId && (
          <p className="hint">Bu işlem düzenli bir ödemeden otomatik eklendi.</p>
        )}

        {existing && (
          <button type="button" className="danger-button" onClick={remove}>
            İşlemi Sil
          </button>
        )}
        <button type="submit" hidden />
      </form>
    </Sheet>
  )
}
