import type { AppData, Category } from './types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'market', name: 'Market', emoji: '🛒', color: '#34C759', type: 'expense' },
  { id: 'yemek', name: 'Yemek', emoji: '🍔', color: '#FF9500', type: 'expense' },
  { id: 'ulasim', name: 'Ulaşım', emoji: '🚌', color: '#007AFF', type: 'expense' },
  { id: 'fatura', name: 'Fatura', emoji: '💡', color: '#FFCC00', type: 'expense' },
  { id: 'kira', name: 'Kira', emoji: '🏠', color: '#AF52DE', type: 'expense' },
  { id: 'abonelik', name: 'Abonelik', emoji: '📺', color: '#FF2D55', type: 'expense' },
  { id: 'eglence', name: 'Eğlence', emoji: '🎮', color: '#5856D6', type: 'expense' },
  { id: 'giyim', name: 'Giyim', emoji: '👕', color: '#00C7BE', type: 'expense' },
  { id: 'saglik', name: 'Sağlık', emoji: '💊', color: '#FF3B30', type: 'expense' },
  { id: 'egitim', name: 'Eğitim', emoji: '📚', color: '#30B0C7', type: 'expense' },
  { id: 'diger-gider', name: 'Diğer', emoji: '📦', color: '#8E8E93', type: 'expense' },
  { id: 'maas', name: 'Maaş', emoji: '💼', color: '#34C759', type: 'income' },
  { id: 'harclik', name: 'Harçlık', emoji: '🎁', color: '#FF9500', type: 'income' },
  { id: 'ek-is', name: 'Ek İş', emoji: '🛠️', color: '#007AFF', type: 'income' },
  { id: 'diger-gelir', name: 'Diğer', emoji: '💰', color: '#8E8E93', type: 'income' },
]

export function emptyData(): AppData {
  return {
    version: 1,
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    transactions: [],
    budgets: {},
    recurring: [],
  }
}

export function newId(): string {
  return crypto.randomUUID()
}
