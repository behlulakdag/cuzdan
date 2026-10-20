import { daysBetween } from './dates'
import type { ISODate } from './types'

/** Bu kadar günde bir yedek alınması önerilir. */
export const BACKUP_INTERVAL_DAYS = 30
/** Birkaç deneme kaydı için hatırlatıp rahatsız etmeyelim. */
const MIN_TRANSACTIONS_FOR_REMINDER = 10

export function needsBackupReminder(
  lastBackup: ISODate | null,
  today: ISODate,
  transactionCount: number,
): boolean {
  if (transactionCount < MIN_TRANSACTIONS_FOR_REMINDER) return false
  return lastBackup === null || daysBetween(lastBackup, today) >= BACKUP_INTERVAL_DAYS
}

export function lastBackupLabel(lastBackup: ISODate | null, today: ISODate): string {
  if (!lastBackup) return 'Hiç yedek alınmadı'
  const days = daysBetween(lastBackup, today)
  if (days <= 0) return 'Son yedek: bugün'
  if (days === 1) return 'Son yedek: dün'
  return `Son yedek: ${days} gün önce`
}
