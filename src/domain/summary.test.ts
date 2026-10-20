import { describe, expect, it } from 'vitest'
import { budgetStatuses, groupByDay, monthInsights, monthlyTrend, summarizeMonth, summarizeYear } from './summary'
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

describe('monthInsights', () => {
  it('geçen ayla karşılaştırır, günlük ortalama ve ay sonu tahmini verir', () => {
    // Ekim gideri 115000, Eylül 99999; bugün 20 Ekim
    const i = monthInsights(data, '2026-10', '2026-10-20')
    expect(i.expenseChange).toBeCloseTo(115000 / 99999 - 1)
    expect(i.daysElapsed).toBe(20)
    expect(i.dailyAverage).toBe(5750)
    expect(i.projectedExpense).toBe(178250)
  })

  it('geçmiş ayda tüm günleri sayar, tahmin vermez', () => {
    const i = monthInsights(data, '2026-09', '2026-10-20')
    expect(i.daysElapsed).toBe(30)
    expect(i.projectedExpense).toBeNull()
    expect(i.expenseChange).toBeNull()
  })

  it('ayın ilk günlerinde oynak tahmin vermez', () => {
    expect(monthInsights(data, '2026-10', '2026-10-03').projectedExpense).toBeNull()
  })

  it('düzenli giderleri günlere yaymaz, ayın kalanındaki vadeleri ekler', () => {
    const list: Transaction[] = [
      tx({ amount: 1200000, date: '2026-10-03', categoryId: 'kira', recurringId: 'kira' }),
      tx({ amount: 100000, date: '2026-10-10' }),
    ]
    const netflix = {
      id: 'n', type: 'expense' as const, amount: 23000, categoryId: 'abonelik', note: '',
      dayOfMonth: 28, startMonth: '2026-10',
    }
    // 1.000 TL değişken gider / 20 gün * 31 gün = 1.550 TL + 12.000 kira + 230 Netflix
    expect(monthInsights(list, '2026-10', '2026-10-20', [netflix]).projectedExpense).toBe(1378000)
  })
})

describe('summarizeYear', () => {
  it('yılın toplamlarını, en çok harcanan kategorileri ve en yüksek/düşük ayı verir', () => {
    const y = summarizeYear(data, 2026, '2026-12-31')
    expect(y.months).toHaveLength(12)
    expect(y.income).toBe(3000000)
    expect(y.expense).toBe(214999)
    expect(y.topCategories).toEqual([['market', 174999], ['yemek', 40000]])
    expect(y.highestExpenseMonth?.month).toBe('2026-10')
    expect(y.lowestExpenseMonth?.month).toBe('2026-09')
    // 2 harcamalı ay: 214.999 / 2
    expect(y.averageMonthlyExpense).toBe(107500)
  })

  it('başka yılların işlemlerini saymaz', () => {
    const y = summarizeYear(data, 2025, '2026-10-20')
    expect(y.expense).toBe(0)
    expect(y.highestExpenseMonth).toBeNull()
  })

  it('devam eden ayı en tasarruflu ay saymaz ve ortalamaya katmaz', () => {
    const list = [
      tx({ amount: 300000, date: '2026-08-10' }),
      tx({ amount: 200000, date: '2026-09-10' }),
      tx({ amount: 5000, date: '2026-10-02' }),
    ]
    const y = summarizeYear(list, 2026, '2026-10-05')
    expect(y.lowestExpenseMonth?.month).toBe('2026-09')
    expect(y.highestExpenseMonth?.month).toBe('2026-08')
    expect(y.averageMonthlyExpense).toBe(250000)
  })

  it('tamamlanmış ay yoksa devam eden ayı kullanır', () => {
    const y = summarizeYear([tx({ amount: 5000, date: '2026-10-02' })], 2026, '2026-10-05')
    expect(y.highestExpenseMonth?.month).toBe('2026-10')
    expect(y.averageMonthlyExpense).toBe(5000)
  })
})
