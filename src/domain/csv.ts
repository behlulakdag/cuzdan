import type { Category, Transaction } from './types'

/**
 * Türkçe Excel noktalı virgülü ayraç, virgülü ondalık olarak bekliyor; BOM olmadan da
 * Türkçe karakterler bozuk görünüyor.
 */
const SEPARATOR = ';'
const BOM = '﻿'

function cell(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function amountCell(kurus: number): string {
  const sign = kurus < 0 ? '-' : ''
  const abs = Math.abs(kurus)
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`
}

export function transactionsToCsv(
  transactions: Transaction[],
  categoryById: (id: string) => Category,
): string {
  const header = ['Tarih', 'Tür', 'Kategori', 'Not', 'Tutar (TL)', 'Düzenli']
  const rows = [...transactions]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((t) => [
      t.date,
      t.type === 'income' ? 'Gelir' : 'Gider',
      categoryById(t.categoryId).name,
      t.note,
      // Giderler eksi yazılır ki Excel'de TOPLA doğrudan net bakiyeyi versin.
      amountCell(t.type === 'income' ? t.amount : -t.amount),
      t.recurringId ? 'Evet' : '',
    ])
  return BOM + [header, ...rows].map((r) => r.map(cell).join(SEPARATOR)).join('\r\n')
}
