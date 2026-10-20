import type { ISODate, MonthKey } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

/** toISOString UTC'ye çevirdiği için gece yarısına yakın saatlerde yanlış gün verir; yerel tarih kullanılır. */
export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayISO(): ISODate {
  return toISODate(new Date())
}

export function monthOf(date: ISODate): MonthKey {
  return date.slice(0, 7)
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const [y, m] = month.split('-').map(Number)
  const total = y * 12 + (m - 1) + delta
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`
}

export function daysInMonth(month: MonthKey): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** 31'inde yapılan ödeme Şubat'ta 28/29'una düşer. */
export function dateInMonth(month: MonthKey, day: number): ISODate {
  return `${month}-${pad(Math.min(day, daysInMonth(month)))}`
}

/** start..end (ikisi de dahil); start > end ise boş */
export function monthRange(start: MonthKey, end: MonthKey): MonthKey[] {
  const out: MonthKey[] = []
  for (let m = start; m <= end; m = addMonths(m, 1)) out.push(m)
  return out
}

const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

export function monthLabel(month: MonthKey): string {
  const [y, m] = month.split('-').map(Number)
  return `${monthNames[m - 1]} ${y}`
}

export function monthShortLabel(month: MonthKey): string {
  return monthNames[Number(month.slice(5, 7)) - 1].slice(0, 3)
}

export function dayLabel(date: ISODate, today: ISODate = todayISO()): string {
  if (date === today) return 'Bugün'
  const yesterday = toISODate(new Date(new Date(today + 'T12:00').getTime() - 864e5))
  if (date === yesterday) return 'Dün'
  const d = new Date(date + 'T12:00')
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })
}
