import { useState } from 'react'
import { dayLabel, todayISO } from '../domain/dates'
import { newId } from '../domain/defaults'
import { formatTL, kurusToInput, parseTL } from '../domain/money'
import { nextDueDate } from '../domain/recurring'
import { noteSuggestions } from '../domain/suggestions'
import type { RecurringRule, Transaction, TxType } from '../domain/types'
import { useStore } from '../store'
import { CategoryGrid } from './CategoryGrid'
import { SegmentedControl } from './SegmentedControl'
import { Sheet, useSheet } from './Sheet'
import { useToast } from './Toast'

interface Props {
  existing?: Transaction
  onClose: () => void
}

export function TransactionForm({ existing, onClose }: Props) {
  const { data, dispatch } = useStore()
  const toast = useToast()
  const sheet = useSheet(onClose)
  const today = todayISO()

  const [type, setType] = useState<TxType>(existing?.type ?? 'expense')
  const [amountText, setAmountText] = useState(existing ? kurusToInput(existing.amount) : '')
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '')
  const [date, setDate] = useState(existing?.date ?? today)
  const [note, setNote] = useState(existing?.note ?? '')
  const [repeatMonthly, setRepeatMonthly] = useState(false)

  const categories = data.categories.filter((c) => c.type === type)
  const amount = parseTL(amountText)
  const categoryValid = categories.some((c) => c.id === categoryId)
  const canSave = amount !== null && categoryValid && date !== ''
  const suggestions = categoryValid ? noteSuggestions(data.transactions, categoryId) : []

  const dirty = existing
    ? amount !== existing.amount || categoryId !== existing.categoryId || date !== existing.date ||
      note.trim() !== existing.note || type !== existing.type
    : amountText !== '' || categoryId !== '' || note !== ''

  const changeType = (t: TxType) => {
    setType(t)
    setCategoryId('')
  }

  const save = () => {
    if (!canSave || amount === null) return
    if (repeatMonthly) {
      const day = Number(date.slice(8, 10))
      const rule: RecurringRule = {
        id: newId(),
        type,
        amount,
        categoryId,
        note: note.trim(),
        dayOfMonth: day,
        // Formda seçilen tarih ilk ödemedir: geçmişteyse o aydan itibaren eklenir.
        startMonth: date.slice(0, 7),
      }
      dispatch({ type: 'rule/add', rule, today })
      toast({
        text: date <= today
          ? 'Düzenli ödeme eklendi'
          : `Düzenli ödeme eklendi · ilki ${dayLabel(nextDueDate(rule), today)}`,
      })
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
      toast({
        text: existing
          ? 'Değişiklikler kaydedildi'
          : `${type === 'income' ? 'Gelir' : 'Gider'} eklendi · ${formatTL(amount)}`,
      })
    }
    sheet.close()
  }

  const remove = () => {
    if (!existing) return
    dispatch({ type: 'tx/delete', id: existing.id })
    // Onay sormak yerine geri alma sunulur; iOS'taki alışkanlığa daha yakın.
    toast({ text: 'İşlem silindi', undo: () => dispatch({ type: 'tx/add', tx: existing }) })
    sheet.close()
  }

  return (
    <Sheet
      title={existing ? 'İşlemi Düzenle' : 'Yeni İşlem'}
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

        {suggestions.length > 0 && !note && (
          <div className="suggestions" aria-label="Önceki notlar">
            {suggestions.map((s) => (
              <button
                key={s.note}
                type="button"
                className="suggestion"
                onClick={() => {
                  setNote(s.note)
                  if (!amountText) setAmountText(kurusToInput(s.lastAmount))
                }}
              >
                {s.note}
                {!amountText && <small>{formatTL(s.lastAmount)}</small>}
              </button>
            ))}
          </div>
        )}

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
