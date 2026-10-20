export type TxType = 'income' | 'expense'

/** Tutarlar her yerde kuruş cinsinden tamsayı tutulur; ondalık hatalarını önler. */
export type Kurus = number

/** 'YYYY-MM-DD' (yerel tarih) */
export type ISODate = string
/** 'YYYY-MM' */
export type MonthKey = string

export interface Category {
  id: string
  name: string
  emoji: string
  color: string
  type: TxType
}

export interface Transaction {
  id: string
  type: TxType
  amount: Kurus
  categoryId: string
  date: ISODate
  note: string
  recurringId?: string
}

export interface RecurringRule {
  id: string
  type: TxType
  amount: Kurus
  categoryId: string
  note: string
  /** 1-31; kısa aylarda ayın son gününe kaydırılır */
  dayOfMonth: number
  startMonth: MonthKey
  /**
   * Bu aya kadar (dahil) işlemler üretildi. Kullanıcı üretilmiş bir işlemi silerse
   * tekrar üretilmesin diye "hangi işlemler var" yerine bu işaretçiye bakılır.
   */
  generatedThrough?: MonthKey
}

export interface AppData {
  version: 1
  categories: Category[]
  transactions: Transaction[]
  /** categoryId -> aylık limit */
  budgets: Record<string, Kurus>
  recurring: RecurringRule[]
}
