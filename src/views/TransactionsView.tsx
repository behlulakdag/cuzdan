import { useState } from 'react'
import { MonthPicker } from '../components/MonthPicker'
import { TransactionRow } from '../components/TransactionRow'
import { dayLabel, monthOf } from '../domain/dates'
import { formatTL } from '../domain/money'
import { groupByDay } from '../domain/summary'
import type { MonthKey, Transaction, TxType } from '../domain/types'
import { useStore } from '../store'

type Filter = 'all' | TxType

interface Props {
  month: MonthKey
  onMonthChange: (m: MonthKey) => void
  onEdit: (tx: Transaction) => void
}

/** Türkçe "İ/ı" harflerinde toLowerCase yanlış eşleştiriyordu; tr-TR yerel ayarıyla küçültülür. */
const normalize = (s: string) => s.toLocaleLowerCase('tr-TR')

export function TransactionsView({ month, onMonthChange, onEdit }: Props) {
  const { data, categoryById } = useStore()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const q = normalize(query.trim())
  const visible = data.transactions.filter((t) => {
    if (monthOf(t.date) !== month) return false
    if (filter !== 'all' && t.type !== filter) return false
    if (!q) return true
    return normalize(`${t.note} ${categoryById(t.categoryId).name}`).includes(q)
  })
  const groups = groupByDay(visible)

  return (
    <>
      <MonthPicker month={month} onChange={onMonthChange} />
      <div className="list-tools">
        <input
          type="search"
          className="search"
          placeholder="Ara (not veya kategori)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="İşlemlerde ara"
        />
        <div className="chips" role="radiogroup" aria-label="Filtre">
          {(
            [
              ['all', 'Tümü'],
              ['expense', 'Gider'],
              ['income', 'Gelir'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={filter === value}
              className={`chip ${filter === value ? 'active' : ''}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 && (
        <p className="empty card">{q || filter !== 'all' ? 'Eşleşen işlem yok.' : 'Bu ay işlem yok.'}</p>
      )}

      {groups.map(([date, txs]) => {
        const net = txs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
        return (
          <section key={date} className="day-group">
            <h3 className="day-header">
              <span>{dayLabel(date)}</span>
              <span className={net >= 0 ? 'income' : 'expense'}>{formatTL(net)}</span>
            </h3>
            <div className="group">
              {txs.map((t) => (
                <TransactionRow key={t.id} tx={t} onClick={() => onEdit(t)} />
              ))}
            </div>
          </section>
        )
      })}
    </>
  )
}
