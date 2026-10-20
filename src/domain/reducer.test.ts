import { describe, expect, it } from 'vitest'
import { parseBackup, serializeBackup, BackupError } from './backup'
import { emptyData } from './defaults'
import { reducer } from './reducer'
import type { RecurringRule, Transaction } from './types'

const coffee: Transaction = {
  id: 't1', type: 'expense', amount: 9000, categoryId: 'yemek', date: '2026-10-20', note: 'Kahve',
}

const netflix: RecurringRule = {
  id: 'r1', type: 'expense', amount: 22999, categoryId: 'abonelik', note: 'Netflix',
  dayOfMonth: 10, startMonth: '2026-09',
}

describe('reducer', () => {
  it('işlem ekler, günceller, siler', () => {
    let s = reducer(emptyData(), { type: 'tx/add', tx: coffee })
    expect(s.transactions).toHaveLength(1)
    s = reducer(s, { type: 'tx/update', tx: { ...coffee, amount: 12000 } })
    expect(s.transactions[0].amount).toBe(12000)
    s = reducer(s, { type: 'tx/delete', id: 't1' })
    expect(s.transactions).toHaveLength(0)
  })

  it('bütçe 0 verilince kaldırılır', () => {
    let s = reducer(emptyData(), { type: 'budget/set', categoryId: 'market', limit: 500000 })
    expect(s.budgets).toEqual({ market: 500000 })
    s = reducer(s, { type: 'budget/set', categoryId: 'market', limit: 0 })
    expect(s.budgets).toEqual({})
  })

  it('geçmişte başlayan düzenli ödeme eklenince vadesi gelenler hemen oluşur', () => {
    const s = reducer(emptyData(), { type: 'rule/add', rule: netflix, today: '2026-10-20' })
    expect(s.transactions.map((t) => t.date)).toEqual(['2026-09-10', '2026-10-10'])
  })

  it('üretilmiş bir işlem silinirse tekrar üretilmez', () => {
    let s = reducer(emptyData(), { type: 'rule/add', rule: netflix, today: '2026-10-20' })
    s = reducer(s, { type: 'tx/delete', id: s.transactions[0].id })
    s = reducer(s, { type: 'recurring/run', today: '2026-10-21' })
    expect(s.transactions.map((t) => t.date)).toEqual(['2026-10-10'])
  })

  it('düzenli ödeme silinince geçmiş işlemler kalır', () => {
    let s = reducer(emptyData(), { type: 'rule/add', rule: netflix, today: '2026-10-20' })
    s = reducer(s, { type: 'rule/delete', id: 'r1' })
    expect(s.recurring).toHaveLength(0)
    expect(s.transactions).toHaveLength(2)
  })
})

describe('backup', () => {
  it('yedek alıp geri yükleyince veri aynı kalır', () => {
    let s = reducer(emptyData(), { type: 'tx/add', tx: coffee })
    s = reducer(s, { type: 'rule/add', rule: netflix, today: '2026-10-20' })
    s = reducer(s, { type: 'budget/set', categoryId: 'yemek', limit: 300000 })
    expect(parseBackup(serializeBackup(s))).toEqual(s)
  })

  it.each([
    ['bozuk json', '{nope'],
    ['başka uygulama', JSON.stringify({ app: 'baska', data: {} })],
    [
      'negatif tutar',
      JSON.stringify({ app: 'cuzdan', data: { ...emptyData(), transactions: [{ ...coffee, amount: -5 }] } }),
    ],
  ])('%s reddedilir', (_, text) => {
    expect(() => parseBackup(text)).toThrow(BackupError)
  })
})
