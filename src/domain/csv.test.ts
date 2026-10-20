import { describe, expect, it } from 'vitest'
import { transactionsToCsv } from './csv'
import { DEFAULT_CATEGORIES } from './defaults'
import type { Transaction } from './types'

const byId = (id: string) => DEFAULT_CATEGORIES.find((c) => c.id === id)!

describe('transactionsToCsv', () => {
  it('Türkçe Excel biçiminde, tarihe göre sıralı yazar', () => {
    const list: Transaction[] = [
      { id: '2', type: 'expense', amount: 24990, categoryId: 'market', date: '2026-10-20', note: 'Migros; büyük "alışveriş"' },
      { id: '1', type: 'income', amount: 3500000, categoryId: 'maas', date: '2026-10-01', note: '', recurringId: 'r' },
    ]
    const csv = transactionsToCsv(list, byId)
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv.slice(1).split('\r\n')).toEqual([
      'Tarih;Tür;Kategori;Not;Tutar (TL);Düzenli',
      '2026-10-01;Gelir;Maaş;;35000,00;Evet',
      '2026-10-20;Gider;Market;"Migros; büyük ""alışveriş""";-249,90;',
    ])
  })
})
