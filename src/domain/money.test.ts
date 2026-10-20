import { describe, expect, it } from 'vitest'
import { formatTL, formatTLCompact, kurusToInput, parseTL } from './money'

describe('parseTL', () => {
  it.each([
    ['150', 15000],
    ['150,5', 15050],
    ['150,75', 15075],
    ['150.75', 15075],
    ['1.500', 150000],
    ['1.234,56', 123456],
    ['1,234.56', 123456],
    ['₺ 99', 9900],
    ['0,01', 1],
  ])('%s -> %i kuruş', (input, expected) => {
    expect(parseTL(input)).toBe(expected)
  })

  it.each(['', 'abc', '0', '0,00', '-5', '1,234', '12,345', '1.2.3', '5,123', '100000001', '9999999999999'])(
    '%s geçersiz sayılır',
    (input) => {
      // "1,234" belirsizdir; 1,23 mü 1234 mü bilinemez, ama tek virgül TR'de ondalık
      // olduğundan 3 haneli kesir geçersiz kabul edilir.
      expect(parseTL(input)).toBeNull()
    },
  )
})

describe('formatTL', () => {
  it('Türk lirası biçiminde yazar', () => {
    expect(formatTL(123456).replace(/\s/g, ' ')).toBe('₺1.234,56')
  })
})

describe('kurusToInput', () => {
  it('kuruşu forma yazılabilir metne çevirir', () => {
    expect(kurusToInput(15000)).toBe('150')
    expect(kurusToInput(15005)).toBe('150,05')
    expect(parseTL(kurusToInput(98765))).toBe(98765)
  })
})

describe('formatTLCompact', () => {
  const clean = (s: string) => s.replace(/\s/g, ' ')
  it('küçük tutarları kuruşsuz tam yazar', () => {
    expect(clean(formatTLCompact(24990))).toBe('₺250')
    expect(clean(formatTLCompact(3500000))).toBe('₺35.000')
  })
  it('büyük tutarları kısaltır', () => {
    expect(clean(formatTLCompact(125000000))).toMatch(/^₺1,3 Mn$/)
  })
})
