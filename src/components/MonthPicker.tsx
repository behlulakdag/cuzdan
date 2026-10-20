import { addMonths, monthLabel, monthOf, todayISO } from '../domain/dates'
import type { MonthKey } from '../domain/types'
import { ChevronLeft, ChevronRight } from './Icons'

const MAX_MONTHS_AHEAD = 12

export function MonthPicker({ month, onChange }: { month: MonthKey; onChange: (m: MonthKey) => void }) {
  const current = monthOf(todayISO())
  return (
    <div className="month-picker">
      <button type="button" aria-label="Önceki ay" onClick={() => onChange(addMonths(month, -1))}>
        <ChevronLeft />
      </button>
      <button
        type="button"
        className={`month-picker-label ${month === current ? '' : 'not-current'}`}
        onClick={() => onChange(current)}
        aria-label={`${monthLabel(month)}, bu aya dön`}
      >
        {monthLabel(month)}
        {month !== current && <small>Bu aya dön</small>}
      </button>
      <button
        type="button"
        aria-label="Sonraki ay"
        onClick={() => onChange(addMonths(month, 1))}
        // İleri tarihli işlemler görülebilsin diye bir yıl sonrasına kadar gidilebilir.
        disabled={month >= addMonths(current, MAX_MONTHS_AHEAD)}
      >
        <ChevronRight />
      </button>
    </div>
  )
}
