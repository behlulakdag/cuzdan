import { describe, expect, it } from 'vitest'
import { materializeRecurring, nextDueDate } from './recurring'
import type { RecurringRule } from './types'

const rent: RecurringRule = {
  id: 'kira',
  type: 'expense',
  amount: 1500000,
  categoryId: 'kira',
  note: 'Ev kirası',
  dayOfMonth: 5,
  startMonth: '2026-08',
}

describe('materializeRecurring', () => {
  it('kaçırılan tüm ayları üretir, vadesi gelmemiş ayı atlar', () => {
    const { rules, created } = materializeRecurring([rent], '2026-10-04')
    expect(created.map((t) => t.date)).toEqual(['2026-08-05', '2026-09-05'])
    expect(rules[0].generatedThrough).toBe('2026-09')
    expect(created[0]).toMatchObject({ amount: 1500000, recurringId: 'kira', type: 'expense' })
  })

  it('vade günü geldiğinde o ayı da üretir', () => {
    const { created } = materializeRecurring([rent], '2026-10-05')
    expect(created.map((t) => t.date)).toEqual(['2026-08-05', '2026-09-05', '2026-10-05'])
  })

  it('tekrar çalıştırınca aynı ayı ikinci kez üretmez', () => {
    const first = materializeRecurring([rent], '2026-10-20')
    const second = materializeRecurring(first.rules, '2026-10-25')
    expect(second.created).toEqual([])
    expect(second.rules[0]).toBe(first.rules[0])
  })

  it('yeni aya geçince yalnızca o ayı ekler', () => {
    const first = materializeRecurring([rent], '2026-10-20')
    const next = materializeRecurring(first.rules, '2026-11-05')
    expect(next.created.map((t) => t.date)).toEqual(['2026-11-05'])
  })

  it('ayın 31i Şubatta ayın son gününe düşer', () => {
    const rule = { ...rent, dayOfMonth: 31, startMonth: '2027-01' }
    const { created } = materializeRecurring([rule], '2027-03-01')
    expect(created.map((t) => t.date)).toEqual(['2027-01-31', '2027-02-28'])
  })

  it('gelecekte başlayan kural şimdilik hiçbir şey üretmez', () => {
    const rule = { ...rent, startMonth: '2027-01' }
    const { rules, created } = materializeRecurring([rule], '2026-10-20')
    expect(created).toEqual([])
    expect(rules[0].generatedThrough).toBeUndefined()
  })
})

describe('nextDueDate', () => {
  it('son üretilen aydan sonraki vadeyi verir', () => {
    expect(nextDueDate(rent)).toBe('2026-08-05')
    expect(nextDueDate({ ...rent, generatedThrough: '2026-10' })).toBe('2026-11-05')
  })
})
