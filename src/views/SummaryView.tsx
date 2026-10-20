import { useState, type CSSProperties } from 'react'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { DonutChart, TrendChart, type DonutSlice } from '../components/charts'
import { GoalRing } from '../components/GoalRing'
import { MonthPicker } from '../components/MonthPicker'
import { YearSheet } from '../components/YearSheet'
import { dayLabel, daysBetween, monthOf, todayISO } from '../domain/dates'
import { goalProgress } from '../domain/goals'
import { formatTL, formatTLCompact } from '../domain/money'
import { nextDueDate } from '../domain/recurring'
import { budgetStatuses, monthInsights, monthlyTrend, summarizeMonth } from '../domain/summary'
import { percentWith, possessiveDativeSuffix, possessiveSuffix } from '../domain/turkish'
import type { MonthKey } from '../domain/types'
import { useStore } from '../store'

/** Donut'ta en büyük bu kadar kategori ayrı gösterilir, gerisi "Diğer"de toplanır. */
const MAX_DONUT_SLICES = 5
const UPCOMING_LIMIT = 4
const REST_SLICE_ID = 'rest'

interface Props {
  month: MonthKey
  onMonthChange: (m: MonthKey) => void
  onOpenBudget: () => void
  onOpenCategory: (categoryId: string) => void
  onOpenGoals: () => void
}

export function SummaryView({ month, onMonthChange, onOpenBudget, onOpenCategory, onOpenGoals }: Props) {
  const { data, categoryById } = useStore()
  const [showYear, setShowYear] = useState(false)
  const today = todayISO()
  const currentMonth = monthOf(today)
  const summary = summarizeMonth(data.transactions, month)
  const trend = monthlyTrend(data.transactions, month, 6)
  const insights = monthInsights(data.transactions, month, today, data.recurring)
  const alerts = budgetStatuses(data.budgets, summary).filter((b) => b.state !== 'ok')

  const ranked = Object.entries(summary.expenseByCategory).sort((a, b) => b[1] - a[1])
  const slices: DonutSlice[] = ranked.slice(0, MAX_DONUT_SLICES).map(([id, value]) => {
    const c = categoryById(id)
    return { id, label: `${c.emoji} ${c.name}`, value, color: c.color }
  })
  const restTotal = ranked.slice(MAX_DONUT_SLICES).reduce((sum, [, v]) => sum + v, 0)
  if (restTotal > 0) slices.push({ id: REST_SLICE_ID, label: 'Diğerleri', value: restTotal, color: '#8E8E93' })

  const upcoming = [...data.recurring]
    .map((r) => ({ rule: r, due: nextDueDate(r) }))
    .sort((a, b) => (a.due < b.due ? -1 : 1))
    .slice(0, UPCOMING_LIMIT)

  const savingsRate = summary.income > 0 ? Math.round((summary.balance / summary.income) * 100) : null
  const balanceLabel =
    month === currentMonth ? 'Bu ay kalan' : month < currentMonth ? 'Ay sonu kalan' : 'Planlanan'

  const openSlice = (id: string) => id !== REST_SLICE_ID && onOpenCategory(id)

  return (
    <>
      <MonthPicker month={month} onChange={onMonthChange} />

      <section className={`balance-card ${summary.balance < 0 ? 'negative' : ''}`}>
        <span className="balance-label">{balanceLabel}</span>
        <AnimatedNumber className="balance-value" value={summary.balance} format={formatTL} />
        {savingsRate !== null && (
          <span className="balance-rate">
            {savingsRate >= 0
              ? `Gelirinin ${percentWith(savingsRate, possessiveSuffix)} cepte`
              : 'Gelirinden fazla harcadın'}
          </span>
        )}
        <div className="balance-split">
          <div>
            <span className="balance-split-label">
              <span className="dot income" /> Gelir
            </span>
            <AnimatedNumber value={summary.income} format={formatTL} />
          </div>
          <div>
            <span className="balance-split-label">
              <span className="dot expense" /> Gider
            </span>
            <AnimatedNumber value={summary.expense} format={formatTL} />
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
                    : // Aşağı yuvarlanır: %99,6 "%100" görünüp aşılmış sanılmasın.
                      `bütçesinin ${percentWith(Math.floor(a.ratio * 100), possessiveDativeSuffix)} ulaştı`}
                </span>
              </div>
            )
          })}
        </button>
      )}

      {summary.expense > 0 && (
        <section className="stats" aria-label="Bu ayın göstergeleri">
          {insights.expenseChange !== null && (
            <div className={`stat ${insights.expenseChange > 0 ? 'up' : 'down'}`}>
              <span className="stat-label">Geçen aya göre</span>
              <strong>
                <span className="stat-arrow" aria-hidden>
                  {insights.expenseChange > 0 ? '↑' : '↓'}
                </span>
                %{Math.abs(Math.round(insights.expenseChange * 100))}
              </strong>
              <span className="stat-sub">
                {insights.expenseChange > 0 ? 'daha fazla harcama' : 'daha az harcama'}
              </span>
            </div>
          )}
          {insights.daysElapsed > 0 && (
            <div className="stat">
              <span className="stat-label">Günlük ortalama</span>
              <strong>{formatTLCompact(insights.dailyAverage)}</strong>
              <span className="stat-sub">{insights.daysElapsed} günde</span>
            </div>
          )}
          {insights.projectedExpense !== null && (
            <div className="stat">
              <span className="stat-label">Ay sonu tahmini</span>
              <strong>{formatTLCompact(insights.projectedExpense)}</strong>
              <span className="stat-sub">bu hızla gider</span>
            </div>
          )}
        </section>
      )}

      <section className="card">
        <h3 className="card-title">Harcama Dağılımı</h3>
        {slices.length === 0 ? (
          <div className="empty-state">
            <span className="empty-illustration" aria-hidden>
              <span>🧾</span>
              <span>💸</span>
              <span>🪙</span>
            </span>
            <p className="empty">
              {month === currentMonth
                ? 'Bu ay henüz harcama yok. Aşağıdaki + ile ilk işlemini ekle.'
                : 'Bu ay harcama yok.'}
            </p>
          </div>
        ) : (
          <div className="donut-wrap">
            <DonutChart slices={slices} total={summary.expense} onSelect={openSlice} />
            <ul className="legend">
              {slices.map((s, i) => (
                <li key={s.id} style={{ '--cat': s.color, '--i': i } as CSSProperties}>
                  <button
                    type="button"
                    onClick={() => openSlice(s.id)}
                    disabled={s.id === REST_SLICE_ID}
                    aria-label={`${s.label} işlemlerini göster`}
                  >
                    <span className="legend-label">{s.label}</span>
                    <span className="legend-value">
                      {formatTL(s.value)}
                      <small>%{Math.round((s.value / summary.expense) * 100)}</small>
                    </span>
                  </button>
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
          <button type="button" className="year-link" onClick={() => setShowYear(true)}>
            Yıl ›
          </button>
        </h3>
        <TrendChart points={trend} selectedMonth={month} onSelect={onMonthChange} />
      </section>

      {data.goals.length > 0 && (
        <button type="button" className="card goals-strip" onClick={onOpenGoals}>
          <h3 className="card-title">
            Hedefler <span className="year-link">Tümü ›</span>
          </h3>
          <span className="goals-strip-list">
            {data.goals.slice(0, 4).map((g) => {
              const p = goalProgress(g, today)
              return (
                <span key={g.id} className="goals-strip-item">
                  <GoalRing ratio={p.ratio} color={g.color} emoji={g.emoji} size={56} completed={p.completed} />
                  <span className="goals-strip-name">{g.name}</span>
                  <span className="goals-strip-percent">%{Math.floor(p.ratio * 100)}</span>
                </span>
              )
            })}
          </span>
        </button>
      )}

      {upcoming.length > 0 && (
        <section className="card">
          <h3 className="card-title">Yaklaşan Düzenli Ödemeler</h3>
          <ul className="upcoming">
            {upcoming.map(({ rule, due }) => {
              const c = categoryById(rule.categoryId)
              const daysLeft = daysBetween(today, due)
              return (
                <li key={rule.id}>
                  <span className="tx-icon small" style={{ '--cat': c.color } as CSSProperties}>
                    {c.emoji}
                  </span>
                  <span className="upcoming-text">
                    {rule.note || c.name}
                    <small>{dayLabel(due, today)}</small>
                  </span>
                  <span className="upcoming-right">
                    <span className={`tx-amount ${rule.type}`}>{formatTL(rule.amount)}</span>
                    {daysLeft > 1 && (
                      <span className={`days-badge ${daysLeft <= 3 ? 'soon' : ''}`}>{daysLeft} gün</span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {showYear && (
        <YearSheet
          initialYear={Number(month.slice(0, 4))}
          onClose={() => setShowYear(false)}
          onOpenMonth={onMonthChange}
        />
      )}
    </>
  )
}
