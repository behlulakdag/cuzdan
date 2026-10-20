import { describe, expect, it } from 'vitest'
import { budgetStatuses, groupByDay, monthlyTrend, summarizeMonth } from './summary'
import type { Transaction } from './types'

const tx = (p: Partial<Transaction> & Pick<Transaction, 'amount' | 'date'>): Transaction => ({
  id: Math.random().toString(36),
  type: 'expense',
  categoryId: 'market',
  note: '',
  ...p,
})

const data: Transaction[] = [
  tx({ type: 'income', categoryId: 'maas', amount: 3000000, date: '2026-10-01' }),
  tx({ amount: 50000, date: '2026-10-02' }),
  tx({ amount: 25000, date: '2026-10-15' }),
  tx({ categoryId: 'yemek', amount: 40000, date: '2026-10-15' }),
  tx({ amount: 99999, date: '2026-09-30' }),
]

describe('summarizeMonth', () => {
  it('yalnızca o ayın işlemlerini toplar', () => {
    const s = summarizeMonth(data, '2026-10')
    expect(s.income).toBe(3000000)
    expect(s.expense).toBe(115000)
    expect(s.balance).toBe(2885000)
    expect(s.expenseByCategory).toEqual({ market: 75000, yemek: 40000 })
  })
})

describe('monthlyTrend', () => {
  it('boş ayları sıfırla doldurur, eskiden yeniye sıralar', () => {
    const trend = monthlyTrend(data, '2026-10', 3)
    expect(trend).toEqual([
      { month: '2026-08', income: 0, expense: 0 },
      { month: '2026-09', income: 0, expense: 99999 },
      { month: '2026-10', income: 3000000, expense: 115000 },
    ])
  })
})

describe('budgetStatuses', () => {
  it('limite yaklaşanı uyarı, aşanı aşıldı olarak işaretler', () => {
    const s = summarizeMonth(data, '2026-10')
    const statuses = budgetStatuses({ market: 80000, yemek: 30000, ulasim: 50000 }, s)
    expect(statuses.map((b) => [b.categoryId, b.state])).toEqual([
      ['yemek', 'over'],
      ['market', 'warning'],
      ['ulasim', 'ok'],
    ])
  })
})

describe('groupByDay', () => {
  it('günleri yeniden eskiye, gün içinde son ekleneni üstte sıralar', () => {
    const groups = groupByDay(data)
    expect(groups.map(([d]) => d)).toEqual(['2026-10-15', '2026-10-02', '2026-10-01', '2026-09-30'])
    expect(groups[0][1].map((t) => t.categoryId)).toEqual(['yemek', 'market'])
  })
})
