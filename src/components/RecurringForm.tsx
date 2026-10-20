import { useState } from 'react'
import { todayISO } from '../domain/dates'
import { isDueThisMonth, startMonthForNewRule } from '../domain/recurring'
import { newId } from '../domain/defaults'
import { RECURRING_PRESETS, type RecurringPreset } from '../domain/presets'
import { formatTL, kurusToInput, parseTL } from '../domain/money'
import type { RecurringRule, TxType } from '../domain/types'
import { useStore } from '../store'
import { CategoryGrid } from './CategoryGrid'
import { SegmentedControl } from './SegmentedControl'
import { Sheet, useSheet } from './Sheet'
import { useToast } from './Toast'

interface Props {
  existing?: RecurringRule
  onClose: () => void
}

export function RecurringForm({ existing, onClose }: Props) {
  const { data, dispatch } = useStore()
  const toast = useToast()
  const sheet = useSheet(onClose)
  const [type, setType] = useState<TxType>(existing?.type ?? 'expense')
  const [amountText, setAmountText] = useState(existing ? kurusToInput(existing.amount) : '')
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '')
  const [day, setDay] = useState(existing?.dayOfMonth ?? Number(todayISO().slice(8, 10)))
  const [note, setNote] = useState(existing?.note ?? '')
  const [includeThisMonth, setIncludeThisMonth] = useState(false)
  const today = todayISO()
  const askAboutThisMonth = !existing && isDueThisMonth(day, today)

  const categories = data.categories.filter((c) => c.type === type)
  const amount = parseTL(amountText)
  const canSave = amount !== null && categories.some((c) => c.id === categoryId)

  // Kullanıcı varsayılan kategoriyi silmişse ön ayar o kategoriyi seçmez, sadece adı doldurur.
  const applyPreset = (preset: RecurringPreset) => {
    setType(preset.type)
    setNote(preset.label)
    const categoryExists = data.categories.some((c) => c.id === preset.categoryId && c.type === preset.type)
    setCategoryId(categoryExists ? preset.categoryId : '')
  }
  const dirty = existing
    ? amount !== existing.amount || categoryId !== existing.categoryId || day !== existing.dayOfMonth ||
      note.trim() !== existing.note || type !== existing.type
    : amountText !== '' || categoryId !== '' || note !== ''

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
          startMonth: startMonthForNewRule(day, today, includeThisMonth),
        }
    dispatch({ type: existing ? 'rule/update' : 'rule/add', rule, today })
    toast({ text: existing ? 'Düzenli ödeme güncellendi' : `Düzenli ödeme eklendi · ${formatTL(amount)}` })
    sheet.close()
  }

  const remove = () => {
    if (!existing) return
    dispatch({ type: 'rule/delete', id: existing.id })
    toast({
      text: 'Düzenli ödeme silindi · geçmiş kayıtlar duruyor',
      undo: () => dispatch({ type: 'rule/add', rule: existing, today: todayISO() }),
    })
    sheet.close()
  }

  return (
    <Sheet
      title={existing ? 'Düzenli Ödemeyi Düzenle' : 'Yeni Düzenli Ödeme'}
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
        {!existing && (
          <div className="suggestions presets" aria-label="Hızlı seçim">
            {RECURRING_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className={`suggestion ${note === p.label ? 'selected' : ''}`}
                onClick={() => applyPreset(p)}
              >
                <span aria-hidden>{p.emoji}</span> {p.label}
              </button>
            ))}
          </div>
        )}
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
        {askAboutThisMonth && (
          <>
            <div className="group">
              <label className="row">
                <span>Bu ayınkini de ekle</span>
                <input
                  type="checkbox"
                  className="switch"
                  checked={includeThisMonth}
                  onChange={(e) => setIncludeThisMonth(e.target.checked)}
                />
              </label>
            </div>
            <p className="hint">
              Bu ayın {day}. günü geçti. Bu ayki ödemeyi zaten girdiysen kapalı bırak, yoksa çift
              kayıt olur.
            </p>
          </>
        )}
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
