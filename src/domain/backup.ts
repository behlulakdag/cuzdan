import type { AppData, Category, RecurringRule, Transaction } from './types'

export function serializeBackup(data: AppData): string {
  return JSON.stringify({ app: 'cuzdan', exportedAt: new Date().toISOString(), data }, null, 2)
}

export class BackupError extends Error {}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isStr = (v: unknown): v is string => typeof v === 'string'
const isAmount = (v: unknown): v is number => Number.isInteger(v) && (v as number) > 0
const isType = (v: unknown) => v === 'income' || v === 'expense'
const isDate = (v: unknown) => isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v)
const isMonth = (v: unknown) => isStr(v) && /^\d{4}-\d{2}$/.test(v)

function isCategory(v: unknown): v is Category {
  return isObj(v) && isStr(v.id) && isStr(v.name) && isStr(v.emoji) && isStr(v.color) && isType(v.type)
}

function isTransaction(v: unknown): v is Transaction {
  return (
    isObj(v) && isStr(v.id) && isType(v.type) && isAmount(v.amount) &&
    isStr(v.categoryId) && isDate(v.date) && isStr(v.note)
  )
}

function isRule(v: unknown): v is RecurringRule {
  return (
    isObj(v) && isStr(v.id) && isType(v.type) && isAmount(v.amount) && isStr(v.categoryId) &&
    isStr(v.note) && Number.isInteger(v.dayOfMonth) && (v.dayOfMonth as number) >= 1 &&
    (v.dayOfMonth as number) <= 31 && isMonth(v.startMonth) &&
    (v.generatedThrough === undefined || isMonth(v.generatedThrough))
  )
}

/** Yedek dosyasını doğrular; bozuk bir dosya mevcut verinin üzerine yazılmasın diye her alan kontrol edilir. */
export function parseBackup(text: string): AppData {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new BackupError('Dosya okunamadı (geçerli bir JSON değil).')
  }
  if (!isObj(parsed) || parsed.app !== 'cuzdan' || !isObj(parsed.data)) {
    throw new BackupError('Bu bir Cüzdan yedek dosyası değil.')
  }
  const d = parsed.data
  if (d.version !== 1) throw new BackupError('Desteklenmeyen yedek sürümü.')
  if (!Array.isArray(d.categories) || !d.categories.every(isCategory)) {
    throw new BackupError('Kategoriler bozuk.')
  }
  if (!Array.isArray(d.transactions) || !d.transactions.every(isTransaction)) {
    throw new BackupError('İşlemler bozuk.')
  }
  if (!Array.isArray(d.recurring) || !d.recurring.every(isRule)) {
    throw new BackupError('Düzenli ödemeler bozuk.')
  }
  if (!isObj(d.budgets) || !Object.values(d.budgets).every(isAmount)) {
    throw new BackupError('Bütçeler bozuk.')
  }
  return {
    version: 1,
    categories: d.categories,
    transactions: d.transactions,
    recurring: d.recurring,
    budgets: d.budgets as Record<string, number>,
  }
}
