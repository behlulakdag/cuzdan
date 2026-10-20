import { daysBetween } from './dates'
import type { Goal, ISODate, Kurus } from './types'

export interface GoalProgress {
  saved: Kurus
  remaining: Kurus
  /** 0..1 arası; hedef aşılsa da 1'de kalır */
  ratio: number
  completed: boolean
  /** Son tarihe kalan gün; son tarih yoksa null, geçtiyse 0 */
  daysLeft: number | null
  /** Son tarihe yetişmek için ayda biriktirilmesi gereken; son tarih yoksa ya da tamamsa null */
  monthlyNeeded: Kurus | null
}

/** Ortalama ay uzunluğu; "ayda ne kadar" hesabında takvim ayı yerine kullanılır. */
const DAYS_PER_MONTH = 30.44

export function goalSaved(goal: Goal): Kurus {
  return goal.contributions.reduce((sum, c) => sum + c.amount, 0)
}

export function goalProgress(goal: Goal, today: ISODate): GoalProgress {
  const saved = goalSaved(goal)
  const remaining = Math.max(goal.target - saved, 0)
  const completed = saved >= goal.target
  const daysLeft = goal.deadline ? Math.max(daysBetween(today, goal.deadline), 0) : null

  let monthlyNeeded: Kurus | null = null
  if (daysLeft !== null && !completed) {
    // Son ay içindeysek ya da tarih geçtiyse kalan tutarın tamamı "bu ay" gerekir.
    const monthsLeft = Math.max(daysLeft / DAYS_PER_MONTH, 1)
    monthlyNeeded = Math.ceil(remaining / monthsLeft)
  }

  return {
    saved,
    remaining,
    ratio: goal.target > 0 ? Math.min(saved / goal.target, 1) : 0,
    completed,
    daysLeft,
    monthlyNeeded,
  }
}
