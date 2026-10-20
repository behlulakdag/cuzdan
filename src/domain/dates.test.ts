import { describe, expect, it } from 'vitest'
import { addDays, addMonths, dateInMonth, dayLabel, daysBetween, monthLabel, monthRange, toISODate } from './dates'

describe('dates', () => {
  it('yerel tarihi UTC kaymasından etkilenmeden yazar', () => {
    expect(toISODate(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01')
    expect(toISODate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
  })

  it('ay ekleme yıl sınırını geçer', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-03', -14)).toBe('2025-01')
  })

  it('kısa aylarda günü ayın sonuna kaydırır', () => {
    expect(dateInMonth('2026-02', 31)).toBe('2026-02-28')
    expect(dateInMonth('2028-02', 30)).toBe('2028-02-29')
    expect(dateInMonth('2026-04', 31)).toBe('2026-04-30')
    expect(dateInMonth('2026-05', 5)).toBe('2026-05-05')
  })

  it('ay aralığı uçları dahil eder', () => {
    expect(monthRange('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
    expect(monthRange('2026-05', '2026-04')).toEqual([])
  })

  it('Türkçe etiketler', () => {
    expect(monthLabel('2026-08')).toBe('Ağustos 2026')
    expect(dayLabel('2026-10-20', '2026-10-20')).toBe('Bugün')
    expect(dayLabel('2026-09-30', '2026-10-01')).toBe('Dün')
    expect(dayLabel('2026-11-01', '2026-10-31')).toBe('Yarın')
  })

  it('gün ekleme ve fark ay/yıl sınırını geçer', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(daysBetween('2026-10-20', '2026-11-02')).toBe(13)
    // Türkiye'de yaz saati yok ama başka saat dilimlerinde de doğru kalmalı.
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
  })
})
