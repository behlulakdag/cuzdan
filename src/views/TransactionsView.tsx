import { useState, type CSSProperties } from 'react'
import { MonthPicker } from '../components/MonthPicker'
import { SwipeRow } from '../components/SwipeRow'
import { useToast } from '../components/Toast'
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
  categoryFilter: string | null
  onCategoryFilterChange: (id: string | null) => void
}

/** Türkçe "İ/ı" harflerinde toLowerCase yanlış eşleştiriyordu; tr-TR yerel ayarıyla küçültülür. */
const normalize = (s: string) => s.toLocaleLowerCase('tr-TR')

export function TransactionsView({
  month,
  onMonthChange,
  onEdit,
  categoryFilter,
  onCategoryFilterChange,
}: Props) {
  const { data, dispatch, categoryById } = useStore()
  const toast = useToast()

  const deleteTx = (tx: Transaction) => {
    dispatch({ type: 'tx/delete', id: tx.id })
    toast({ text: 'İşlem silindi', undo: () => dispatch({ type: 'tx/add', tx }) })
  }
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const q = normalize(query.trim())
  const visible = data.transactions.filter((t) => {
    if (monthOf(t.date) !== month) return false
    if (filter !== 'all' && t.type !== filter) return false
    if (categoryFilter && t.categoryId !== categoryFilter) return false
    if (!q) return true
    return normalize(`${t.note} ${categoryById(t.categoryId).name}`).includes(q)
  })
  const groups = groupByDay(visible)
  const totalIncome = visible.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = visible.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

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
          {categoryFilter && (
            <button
              type="button"
              className="chip active category-filter"
              style={{ '--cat': categoryById(categoryFilter).color } as CSSProperties}
              onClick={() => onCategoryFilterChange(null)}
              aria-label={`${categoryById(categoryFilter).name} filtresini kaldır`}
            >
              {categoryById(categoryFilter).emoji} {categoryById(categoryFilter).name}
              <span aria-hidden> ✕</span>
            </button>
          )}
        </div>
      </div>

      {visible.length > 0 && (
        <div className="list-total">
          <span>{visible.length} işlem</span>
          <span>
            {totalIncome > 0 && <span className="income">+{formatTL(totalIncome)}</span>}
            {totalExpense > 0 && <span>−{formatTL(totalExpense)}</span>}
          </span>
        </div>
      )}

      {groups.length === 0 && (
        <p className="empty card">{q || filter !== 'all' || categoryFilter ? 'Eşleşen işlem yok.' : 'Bu ay işlem yok.'}</p>
      )}

      {groups.map(([date, txs], groupIndex) => {
        const net = txs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
        return (
          <section
            key={date}
            className="day-group"
            // Sadece ilk birkaç grup kademeli girer; uzun listede bekleme olmasın.
            style={{ '--i': Math.min(groupIndex, 8) } as CSSProperties}
          >
            <h3 className="day-header">
              <span>{dayLabel(date)}</span>
              <span className={net >= 0 ? 'income' : 'expense'}>{formatTL(net)}</span>
            </h3>
            <div className="group">
              {txs.map((t) => (
                <SwipeRow key={t.id} onDelete={() => deleteTx(t)}>
                  <TransactionRow tx={t} onClick={() => onEdit(t)} />
                </SwipeRow>
              ))}
            </div>
          </section>
        )
      })}
    </>
  )
}
