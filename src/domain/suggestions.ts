import type { Kurus, Transaction } from './types'

export interface NoteSuggestion {
  note: string
  /** Bu notla girilen en son tutar; hızlı doldurma için */
  lastAmount: Kurus
}

/**
 * Bir kategoride en sık kullanılan notlar (eşitlikte en yeni önce).
 * "Migros", "migros " gibi yazımlar tek öneri olarak sayılır.
 */
export function noteSuggestions(
  transactions: Transaction[],
  categoryId: string,
  limit = 5,
): NoteSuggestion[] {
  const stats = new Map<string, { note: string; count: number; lastDate: string; lastAmount: Kurus }>()
  for (const t of transactions) {
    const note = t.note.trim()
    if (t.categoryId !== categoryId || !note) continue
    const key = note.toLocaleLowerCase('tr-TR')
    const s = stats.get(key)
    if (!s) {
      stats.set(key, { note, count: 1, lastDate: t.date, lastAmount: t.amount })
    } else {
      s.count += 1
      if (t.date >= s.lastDate) {
        s.lastDate = t.date
        s.lastAmount = t.amount
        s.note = note
      }
    }
  }
  return [...stats.values()]
    .sort((a, b) => b.count - a.count || (a.lastDate < b.lastDate ? 1 : -1))
    .slice(0, limit)
    .map(({ note, lastAmount }) => ({ note, lastAmount }))
}
