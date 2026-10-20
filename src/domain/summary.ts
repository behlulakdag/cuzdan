import { addMonths, monthOf } from './dates'
import type { Kurus, MonthKey, Transaction } from './types'

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
