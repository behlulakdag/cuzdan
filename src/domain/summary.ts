import { addMonths, daysInMonth, monthOf } from './dates'
import { nextDueDate } from './recurring'
import type { ISODate, Kurus, MonthKey, RecurringRule, Transaction } from './types'

export interface MonthSummary {
  income: Kurus
  expense: Kurus
  balance: Kurus
  /** categoryId -> tutar, yalnızca giderler */
  expenseByCategory: Record<string, Kurus>
}

export function summarizeMonth(transactions: Transaction[], month: MonthKey): MonthSummary {
  let income = 0
  let expense = 0
  const expenseByCategory: Record<string, Kurus> = {}
  for (const t of transactions) {
    if (monthOf(t.date) !== month) continue
    if (t.type === 'income') {
      income += t.amount
    } else {
      expense += t.amount
      expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] ?? 0) + t.amount
    }
  }
  return { income, expense, balance: income - expense, expenseByCategory }
}

export interface MonthTrendPoint {
  month: MonthKey
  income: Kurus
  expense: Kurus
}

/** Son `count` ay (en eskiden yeniye), `endMonth` dahil */
export function monthlyTrend(
  transactions: Transaction[],
  endMonth: MonthKey,
  count: number,
): MonthTrendPoint[] {
  const points = new Map<MonthKey, MonthTrendPoint>()
  for (let i = count - 1; i >= 0; i--) {
    const month = addMonths(endMonth, -i)
    points.set(month, { month, income: 0, expense: 0 })
  }
  for (const t of transactions) {
    const p = points.get(monthOf(t.date))
    if (!p) continue
    if (t.type === 'income') p.income += t.amount
    else p.expense += t.amount
  }
  return [...points.values()]
}

export type BudgetState = 'ok' | 'warning' | 'over'

export interface BudgetStatus {
  categoryId: string
  limit: Kurus
  spent: Kurus
  ratio: number
  state: BudgetState
}

/** Limitin bu oranına ulaşınca kullanıcı uyarılır. */
export const BUDGET_WARNING_RATIO = 0.8

export function budgetStatuses(
  budgets: Record<string, Kurus>,
  summary: MonthSummary,
): BudgetStatus[] {
  return Object.entries(budgets)
    .filter(([, limit]) => limit > 0)
    .map(([categoryId, limit]) => {
      const spent = summary.expenseByCategory[categoryId] ?? 0
      const ratio = spent / limit
      const state: BudgetState =
        ratio > 1 ? 'over' : ratio >= BUDGET_WARNING_RATIO ? 'warning' : 'ok'
      return { categoryId, limit, spent, ratio, state }
    })
    .sort((a, b) => b.ratio - a.ratio)
}

/** Tarihe göre yeniden eskiye gruplar; aynı gün içinde son ekleneni üstte tutar. */
export function groupByDay(transactions: Transaction[]): [string, Transaction[]][] {
  const groups = new Map<string, Transaction[]>()
  const sorted = transactions
    .map((t, index) => ({ t, index }))
    .sort((a, b) => (a.t.date === b.t.date ? b.index - a.index : a.t.date < b.t.date ? 1 : -1))
  for (const { t } of sorted) {
    const list = groups.get(t.date)
    if (list) list.push(t)
    else groups.set(t.date, [t])
  }
  return [...groups.entries()]
}

export interface MonthInsights {
  /** Geçen aya göre gider değişimi (0.12 = %12 artış); geçen ay gider yoksa null */
  expenseChange: number | null
  previousExpense: Kurus
  /** Geçen günlere bölünmüş günlük ortalama gider */
  dailyAverage: Kurus
  /** Bu ay için, bu hızla giderse ay sonu toplam gider; geçmiş/gelecek aylarda null */
  projectedExpense: Kurus | null
  daysElapsed: number
}

/** Ay sonu tahmini için gereken en az gün; ayın ilk günlerinde tahmin çok oynak oluyor. */
const MIN_DAYS_FOR_PROJECTION = 5

export function monthInsights(
  transactions: Transaction[],
  month: MonthKey,
  today: ISODate,
  rules: RecurringRule[] = [],
): MonthInsights {
  const current = summarizeMonth(transactions, month)
  const previous = summarizeMonth(transactions, addMonths(month, -1))
  const totalDays = daysInMonth(month)
  const currentMonth = monthOf(today)
  const daysElapsed =
    month === currentMonth ? Number(today.slice(8, 10)) : month < currentMonth ? totalDays : 0

  return {
    expenseChange: previous.expense > 0 ? (current.expense - previous.expense) / previous.expense : null,
    previousExpense: previous.expense,
    dailyAverage: daysElapsed > 0 ? Math.round(current.expense / daysElapsed) : 0,
    projectedExpense:
      month === currentMonth && daysElapsed >= MIN_DAYS_FOR_PROJECTION
        ? projectMonthEnd(transactions, rules, month, today, daysElapsed, totalDays)
        : null,
    daysElapsed,
  }
}

/**
 * Düzenli ödemeler (kira, abonelik) günlük hıza katılırsa ay başında ödenen kira tahmini
 * katlıyordu. Bu yüzden sabit giderler olduğu gibi eklenir, yalnızca diğerleri günlere yayılır.
 */
function projectMonthEnd(
  transactions: Transaction[],
  rules: RecurringRule[],
  month: MonthKey,
  today: ISODate,
  daysElapsed: number,
  totalDays: number,
): Kurus {
  let fixed = 0
  let variable = 0
  for (const t of transactions) {
    if (t.type !== 'expense' || monthOf(t.date) !== month) continue
    if (t.recurringId) fixed += t.amount
    else variable += t.amount
  }
  const upcomingFixed = rules
    .filter((r) => r.type === 'expense')
    .map((r) => ({ r, due: nextDueDate(r) }))
    .filter(({ due }) => monthOf(due) === month && due > today)
    .reduce((sum, { r }) => sum + r.amount, 0)
  return Math.round(fixed + upcomingFixed + (variable / daysElapsed) * totalDays)
}

/**
 * Bütçede kalan parayı ayın kalan günlerine (bugün dahil) böler.
 * Bütçe aşıldıysa 0 döner; negatif "günlük hak" anlamsız.
 */
export function dailyAllowance(remaining: Kurus, today: ISODate): Kurus {
  const daysLeft = daysInMonth(monthOf(today)) - Number(today.slice(8, 10)) + 1
  return remaining > 0 ? Math.floor(remaining / daysLeft) : 0
}
