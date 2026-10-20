import { addMonths, monthLabel, monthOf, todayISO } from '../domain/dates'
import type { MonthKey } from '../domain/types'
import { ChevronLeft, ChevronRight } from './Icons'

export function MonthPicker({ month, onChange }: { month: MonthKey; onChange: (m: MonthKey) => void }) {
  const current = monthOf(todayISO())
  return (
    <div className="month-picker">
      <button type="button" aria-label="Önceki ay" onClick={() => onChange(addMonths(month, -1))}>
        <ChevronLeft />
      </button>
      <button
        type="button"
        className="month-picker-label"
        onClick={() => onChange(current)}
        aria-label={`${monthLabel(month)}, bu aya dön`}
      >
        {monthLabel(month)}
      </button>
      <button
        type="button"
        aria-label="Sonraki ay"
        onClick={() => onChange(addMonths(month, 1))}
        disabled={month >= current}
      >
        <ChevronRight />
      </button>
    </div>
  )
}
