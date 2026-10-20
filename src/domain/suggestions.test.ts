import { describe, expect, it } from 'vitest'
import { noteSuggestions } from './suggestions'
import type { Transaction } from './types'

let n = 0
const tx = (note: string, date: string, amount = 1000, categoryId = 'market'): Transaction => ({
  id: String(n++), type: 'expense', amount, categoryId, date, note,
})

describe('noteSuggestions', () => {
  it('en sık kullanılanı önce, eşitlikte en yeniyi önce verir', () => {
    const list = [
      tx('Migros', '2026-10-01', 50000),
      tx('A101', '2026-10-02'),
      tx('migros ', '2026-10-10', 62000),
      tx('BİM', '2026-10-12'),
      tx('Ekmek', '2026-10-03', 1000, 'yemek'),
      tx('', '2026-10-04'),
    ]
    expect(noteSuggestions(list, 'market')).toEqual([
      { note: 'migros', lastAmount: 62000 },
      { note: 'BİM', lastAmount: 1000 },
      { note: 'A101', lastAmount: 1000 },
    ])
  })

  it('sınırı uygular', () => {
    const list = ['a', 'b', 'c', 'd'].map((x, i) => tx(x, `2026-10-0${i + 1}`))
    expect(noteSuggestions(list, 'market', 2).map((s) => s.note)).toEqual(['d', 'c'])
  })
})
