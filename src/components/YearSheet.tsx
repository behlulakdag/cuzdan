import { useState, type CSSProperties } from 'react'
import { monthLabel, monthOf, todayISO } from '../domain/dates'
import { formatTL } from '../domain/money'
import { summarizeYear } from '../domain/summary'
import { percentWith, possessiveSuffix } from '../domain/turkish'
import type { MonthKey } from '../domain/types'
import { useStore } from '../store'
import { AnimatedNumber } from './AnimatedNumber'
import { TrendChart } from './charts'
import { ChevronLeft, ChevronRight } from './Icons'
import { Sheet, useSheet } from './Sheet'

const TOP_CATEGORY_COUNT = 5

interface Props {
  initialYear: number
  onClose: () => void
  onOpenMonth: (month: MonthKey) => void
}

export function YearSheet({ initialYear, onClose, onOpenMonth }: Props) {
  const { data, categoryById } = useStore()
  const sheet = useSheet(onClose)
  const [year, setYear] = useState(initialYear)
  const currentYear = Number(todayISO().slice(0, 4))
  const y = summarizeYear(data.transactions, year)
  const savingsRate = y.income > 0 ? Math.round((y.balance / y.income) * 100) : null
  const topCategories = y.topCategories.slice(0, TOP_CATEGORY_COUNT)
  const topMax = topCategories[0]?.[1] ?? 1
  const empty = y.income === 0 && y.expense === 0

  return (
    <Sheet title="Yıllık Görünüm" sheet={sheet}>
      <div className="form">
        <div className="month-picker">
          <button type="button" aria-label="Önceki yıl" onClick={() => setYear(year - 1)}>
            <ChevronLeft />
          </button>
          <span className="month-picker-label">{year}</span>
          <button
            type="button"
            aria-label="Sonraki yıl"
            onClick={() => setYear(year + 1)}
            disabled={year >= currentYear}
          >
            <ChevronRight />
          </button>
        </div>

        {empty ? (
          <p className="empty card">{year} yılında kayıt yok.</p>
        ) : (
          // key: yıl değişince içerik giriş animasyonunu yeniden oynatır.
          <div className="year-body" key={year}>
            <section className={`balance-card compact ${y.balance < 0 ? 'negative' : ''}`}>
              <span className="balance-label">{year} net</span>
              <AnimatedNumber className="balance-value" value={y.balance} format={formatTL} />
              {savingsRate !== null && savingsRate >= 0 && (
                <span className="balance-rate">
                  Gelirinin {percentWith(savingsRate, possessiveSuffix)} biriktirdin
                </span>
              )}
              <div className="balance-split">
                <div>
                  <span className="balance-split-label">
                    <span className="dot income" /> Gelir
                  </span>
                  <span>{formatTL(y.income)}</span>
                </div>
                <div>
                  <span className="balance-split-label">
                    <span className="dot expense" /> Gider
                  </span>
                  <span>{formatTL(y.expense)}</span>
                </div>
              </div>
            </section>

            <section className="card">
              <h3 className="card-title">Aylar</h3>
              <TrendChart
                points={y.months}
                selectedMonth={year === currentYear ? monthOf(todayISO()) : undefined}
                onSelect={(m) => {
                  onOpenMonth(m)
                  sheet.close()
                }}
              />
              <p className="hint chart-hint">Bir aya dokunarak o ayın özetine git.</p>
            </section>

            <section className="stats" aria-label="Yılın göstergeleri">
              <div className="stat">
                <span className="stat-label">Aylık ort. gider</span>
                <strong>{formatTL(y.averageMonthlyExpense)}</strong>
              </div>
              {y.highestExpenseMonth && (
                <div className="stat up">
                  <span className="stat-label">En pahalı ay</span>
                  <strong>{monthLabel(y.highestExpenseMonth.month).split(' ')[0]}</strong>
                  <span className="stat-sub">{formatTL(y.highestExpenseMonth.expense)}</span>
                </div>
              )}
              {y.lowestExpenseMonth && (
                <div className="stat down">
                  <span className="stat-label">En tasarruflu ay</span>
                  <strong>{monthLabel(y.lowestExpenseMonth.month).split(' ')[0]}</strong>
                  <span className="stat-sub">{formatTL(y.lowestExpenseMonth.expense)}</span>
                </div>
              )}
            </section>

            {topCategories.length > 0 && (
              <section className="card">
                <h3 className="card-title">En Çok Harcanan</h3>
                <ol className="rank-list">
                  {topCategories.map(([id, amount], i) => {
                    const c = categoryById(id)
                    return (
                      <li
                        key={id}
                        style={{ '--cat': c.color, '--w': amount / topMax, '--i': i } as CSSProperties}
                      >
                        <span className="rank-head">
                          <span>
                            {c.emoji} {c.name}
                          </span>
                          <span className="rank-amount">
                            {formatTL(amount)}
                            <small>%{Math.round((amount / y.expense) * 100)}</small>
                          </span>
                        </span>
                        <span className="rank-bar" />
                      </li>
                    )
                  })}
                </ol>
              </section>
            )}
          </div>
        )}
      </div>
    </Sheet>
  )
}
