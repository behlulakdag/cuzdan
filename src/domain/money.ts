import type { Kurus } from './types'

const tlFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const tlCompactFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatTL(amount: Kurus): string {
  return tlFormatter.format(amount / 100)
}

export function formatTLCompact(amount: Kurus): string {
  return tlCompactFormatter.format(amount / 100)
}

/**
 * Kullanıcının yazdığı tutarı kuruşa çevirir. Hem "1.234,56" (TR) hem "1234.56" kabul edilir.
 * Geçersiz ya da sıfır/negatif ise null döner.
 */
export function parseTL(input: string): Kurus | null {
  let s = input.trim().replace(/[₺\s]/g, '')
  if (!s) return null

  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > -1 && lastDot > -1) {
    // Hangisi sonda ise o ondalık ayracıdır, diğeri binlik ayracı.
    const decimalSep = lastComma > lastDot ? ',' : '.'
    const thousandSep = decimalSep === ',' ? '.' : ','
    s = s.split(thousandSep).join('').replace(decimalSep, '.')
  } else if (lastComma > -1) {
    s = s.replace(',', '.')
  } else if (lastDot > -1 && /^\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.500" gibi yalnızca binlik ayracı kullanılmış.
    s = s.split('.').join('')
  }

  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null
  const [whole, frac = ''] = s.split('.')
  const kurus = Number(whole) * 100 + Number(frac.padEnd(2, '0'))
  return kurus > 0 ? kurus : null
}

/** Düzenleme formunda göstermek için: 123456 -> "1234,56" */
export function kurusToInput(amount: Kurus): string {
  const whole = Math.floor(amount / 100)
  const frac = amount % 100
  return frac === 0 ? String(whole) : `${whole},${String(frac).padStart(2, '0')}`
}
