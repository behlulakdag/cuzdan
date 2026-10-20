import { materializeRecurring } from './recurring'
import type { AppData, Category, Goal, GoalContribution, ISODate, Kurus, RecurringRule, Transaction } from './types'

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
  | { type: 'category/add'; category: Category }
  | { type: 'category/update'; category: Category }
  | { type: 'category/delete'; id: string }
  | { type: 'goal/add'; goal: Goal }
  | { type: 'goal/update'; goal: Goal }
  | { type: 'goal/delete'; id: string }
  | { type: 'goal/contribute'; goalId: string; contribution: GoalContribution }
  | { type: 'goal/uncontribute'; goalId: string; contributionId: string }

/** Silinemeyen, silinen kategorilerin kayıtlarının taşındığı kategoriler */
export const FALLBACK_CATEGORY: Record<Category['type'], string> = {
  expense: 'diger-gider',
  income: 'diger-gelir',
}

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
    case 'category/add':
      return { ...state, categories: [...state.categories, action.category] }
    case 'category/update':
      return {
        ...state,
        categories: state.categories.map((c) =>
          // Tür değişirse eski işlemler yanlış tarafa geçerdi; tür sabit tutulur.
          c.id === action.category.id ? { ...action.category, type: c.type } : c,
        ),
      }
    case 'goal/add':
      return { ...state, goals: [...state.goals, action.goal] }
    case 'goal/update':
      return {
        ...state,
        // Katkı geçmişi formdan gelmez; düzenleme sırasında kaybolmasın.
        goals: state.goals.map((g) =>
          g.id === action.goal.id ? { ...action.goal, contributions: g.contributions } : g,
        ),
      }
    case 'goal/delete':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) }
    case 'goal/contribute':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId ? { ...g, contributions: [...g.contributions, action.contribution] } : g,
        ),
      }
    case 'goal/uncontribute':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId
            ? { ...g, contributions: g.contributions.filter((c) => c.id !== action.contributionId) }
            : g,
        ),
      }
    case 'category/delete': {
      const target = state.categories.find((c) => c.id === action.id)
      if (!target || Object.values(FALLBACK_CATEGORY).includes(action.id)) return state
      const fallback = FALLBACK_CATEGORY[target.type]
      const move = <T extends { categoryId: string }>(item: T): T =>
        item.categoryId === action.id ? { ...item, categoryId: fallback } : item
      const budgets = { ...state.budgets }
      delete budgets[action.id]
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.id),
        transactions: state.transactions.map(move),
        recurring: state.recurring.map(move),
        budgets,
      }
    }
  }
}
