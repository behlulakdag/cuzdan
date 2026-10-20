import type { CSSProperties } from 'react'
import { DonutChart, TrendChart, type DonutSlice } from '../components/charts'
import { MonthPicker } from '../components/MonthPicker'
import { dayLabel } from '../domain/dates'
import { formatTL } from '../domain/money'
import { nextDueDate } from '../domain/recurring'
import { budgetStatuses, monthlyTrend, summarizeMonth } from '../domain/summary'
import type { MonthKey } from '../domain/types'
import { useStore } from '../store'

/** Donut'ta en büyük bu kadar kategori ayrı gösterilir, gerisi "Diğer"de toplanır. */
const MAX_DONUT_SLICES = 5
const UPCOMING_LIMIT = 4

interface Props {
  month: MonthKey
  onMonthChange: (m: MonthKey) => void
  onOpenBudget: () => void
}

export function SummaryView({ month, onMonthChange, onOpenBudget }: Props) {
  const { data, categoryById } = useStore()
  const summary = summarizeMonth(data.transactions, month)
  const trend = monthlyTrend(data.transactions, month, 6)
  const alerts = budgetStatuses(data.budgets, summary).filter((b) => b.state !== 'ok')

  const ranked = Object.entries(summary.expenseByCategory).sort((a, b) => b[1] - a[1])
  const slices: DonutSlice[] = ranked.slice(0, MAX_DONUT_SLICES).map(([id, value]) => {
    const c = categoryById(id)
    return { id, label: `${c.emoji} ${c.name}`, value, color: c.color }
  })
  const restTotal = ranked.slice(MAX_DONUT_SLICES).reduce((sum, [, v]) => sum + v, 0)
  if (restTotal > 0) slices.push({ id: 'rest', label: 'Diğerleri', value: restTotal, color: '#8E8E93' })

  const upcoming = [...data.recurring]
    .map((r) => ({ rule: r, due: nextDueDate(r) }))
    .sort((a, b) => (a.due < b.due ? -1 : 1))
    .slice(0, UPCOMING_LIMIT)

  const savingsRate = summary.income > 0 ? Math.round((summary.balance / summary.income) * 100) : null

  return (
    <>
      <MonthPicker month={month} onChange={onMonthChange} />

      <section className={`balance-card ${summary.balance < 0 ? 'negative' : ''}`}>
        <span className="balance-label">Bu ay kalan</span>
        <strong className="balance-value">{formatTL(summary.balance)}</strong>
        {savingsRate !== null && (
          <span className="balance-rate">
            {savingsRate >= 0 ? `Gelirinin %${savingsRate}'i cepte` : 'Gelirinden fazla harcadın'}
          </span>
        )}
        <div className="balance-split">
          <div>
            <span className="dot income" /> Gelir
            <b>{formatTL(summary.income)}</b>
          </div>
          <div>
            <span className="dot expense" /> Gider
            <b>{formatTL(summary.expense)}</b>
          </div>
        </div>
      </section>

      {alerts.length > 0 && (
        <button type="button" className="card alert-card" onClick={onOpenBudget}>
          {alerts.map((a) => {
            const c = categoryById(a.categoryId)
            return (
              <div key={a.categoryId} className={`alert-line ${a.state}`}>
                <span>{c.emoji}</span>
                <span>
                  {c.name}{' '}
                  {a.state === 'over'
                    ? `bütçesini ${formatTL(a.spent - a.limit)} aştı`
                    : `bütçesinin %${Math.round(a.ratio * 100)}'ine ulaştı`}
                </span>
              </div>
            )
          })}
        </button>
      )}

      <section className="card">
        <h3 className="card-title">Harcama Dağılımı</h3>
        {slices.length === 0 ? (
          <p className="empty">Bu ay henüz harcama yok. Aşağıdaki + ile ilk işlemini ekle.</p>
        ) : (
          <div className="donut-wrap">
            <DonutChart slices={slices} total={summary.expense} />
            <ul className="legend">
              {slices.map((s) => (
                <li key={s.id} style={{ '--cat': s.color } as CSSProperties}>
                  <span className="legend-label">{s.label}</span>
                  <span className="legend-value">
                    {formatTL(s.value)}
                    <small>%{Math.round((s.value / summary.expense) * 100)}</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">
          Son 6 Ay
          <span className="trend-key">
            <span className="dot income" /> Gelir <span className="dot expense" /> Gider
          </span>
        </h3>
        <TrendChart points={trend} />
      </section>

      {upcoming.length > 0 && (
        <section className="card">
          <h3 className="card-title">Yaklaşan Düzenli Ödemeler</h3>
          <ul className="upcoming">
            {upcoming.map(({ rule, due }) => {
              const c = categoryById(rule.categoryId)
              return (
                <li key={rule.id}>
                  <span className="tx-icon small" style={{ '--cat': c.color } as CSSProperties}>
                    {c.emoji}
                  </span>
                  <span className="upcoming-text">
                    {rule.note || c.name}
                    <small>{dayLabel(due)}</small>
                  </span>
                  <span className={`tx-amount ${rule.type}`}>{formatTL(rule.amount)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
