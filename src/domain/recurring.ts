import { addMonths, dateInMonth, monthOf, monthRange } from './dates'
import type { ISODate, MonthKey, RecurringRule, Transaction } from './types'

/**
 * Bugüne kadar vadesi gelmiş ama henüz üretilmemiş düzenli işlemleri üretir.
 * Uygulama birkaç ay açılmasa bile kaçırılan aylar eksiksiz eklenir.
 */
export function materializeRecurring(
  rules: RecurringRule[],
  today: ISODate,
): { rules: RecurringRule[]; created: Transaction[] } {
  const currentMonth = monthOf(today)
  const created: Transaction[] = []

  const updated = rules.map((rule) => {
    const from = rule.generatedThrough ? addMonths(rule.generatedThrough, 1) : rule.startMonth
    let lastDone = rule.generatedThrough

    for (const month of monthRange(from, currentMonth)) {
      const date = dateInMonth(month, rule.dayOfMonth)
      if (date > today) break
      created.push({
        id: `rec-${rule.id}-${month}`,
        type: rule.type,
        amount: rule.amount,
        categoryId: rule.categoryId,
        date,
        note: rule.note,
        recurringId: rule.id,
      })
      lastDone = month
    }

    return lastDone === rule.generatedThrough ? rule : { ...rule, generatedThrough: lastDone }
  })

  return { rules: updated, created }
}

/** Bu kuralın bir sonraki ödeme tarihi */
export function nextDueDate(rule: RecurringRule): ISODate {
  const from = rule.generatedThrough ? addMonths(rule.generatedThrough, 1) : rule.startMonth
  return dateInMonth(from, rule.dayOfMonth)
}

/**
 * Yeni bir düzenli ödemenin başlangıç ayı. Bu ayın ödeme günü geçtiyse kullanıcı büyük
 * ihtimalle o ödemeyi zaten elle girmiştir; açıkça istemedikçe bu ay için kayıt üretilmez.
 */
export function startMonthForNewRule(
  dayOfMonth: number,
  today: ISODate,
  includeCurrentMonth: boolean,
): MonthKey {
  const currentMonth = monthOf(today)
  const alreadyDue = dateInMonth(currentMonth, dayOfMonth) <= today
  return alreadyDue && !includeCurrentMonth ? addMonths(currentMonth, 1) : currentMonth
}

/** Bu ayın ödeme günü bugün ya da daha önce mi? */
export function isDueThisMonth(dayOfMonth: number, today: ISODate): boolean {
  return dateInMonth(monthOf(today), dayOfMonth) <= today
}
