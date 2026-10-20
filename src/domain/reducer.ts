import { materializeRecurring } from './recurring'
import type { AppData, ISODate, Kurus, RecurringRule, Transaction } from './types'

export type Action =
  | { type: 'tx/add'; tx: Transaction }
  | { type: 'tx/update'; tx: Transaction }
  | { type: 'tx/delete'; id: string }
  | { type: 'budget/set'; categoryId: string; limit: Kurus }
  | { type: 'rule/add'; rule: RecurringRule; today: ISODate }
  | { type: 'rule/update'; rule: RecurringRule; today: ISODate }
  | { type: 'rule/delete'; id: string }
  | { type: 'recurring/run'; today: ISODate }
  | { type: 'data/replace'; data: AppData }

function runRecurring(state: AppData, today: ISODate): AppData {
  const { rules, created } = materializeRecurring(state.recurring, today)
  if (created.length === 0) return state
  return { ...state, recurring: rules, transactions: [...state.transactions, ...created] }
}

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'tx/add':
      return { ...state, transactions: [...state.transactions, action.tx] }
    case 'tx/update':
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.tx.id ? action.tx : t)),
      }
    case 'tx/delete':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) }
    case 'budget/set': {
      const budgets = { ...state.budgets }
      if (action.limit > 0) budgets[action.categoryId] = action.limit
      else delete budgets[action.categoryId]
      return { ...state, budgets }
    }
    case 'rule/add':
      // Başlangıç tarihi geçmişteyse vadesi gelen aylar hemen eklenir.
      return runRecurring({ ...state, recurring: [...state.recurring, action.rule] }, action.today)
    case 'rule/update':
      // Önceden üretilmiş işlemler olduğu gibi kalır; değişiklik sonraki aylara uygulanır.
      return runRecurring(
        {
          ...state,
          recurring: state.recurring.map((r) => (r.id === action.rule.id ? action.rule : r)),
        },
        action.today,
      )
    case 'rule/delete':
      // Geçmişte üretilmiş işlemler gerçek harcamalardır, silinmez.
      return { ...state, recurring: state.recurring.filter((r) => r.id !== action.id) }
    case 'recurring/run':
      return runRecurring(state, action.today)
    case 'data/replace':
      return action.data
  }
}
