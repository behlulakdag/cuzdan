import type { TxType } from './types'

export interface RecurringPreset {
  label: string
  emoji: string
  type: TxType
  categoryId: string
}

/**
 * Düzenli ödeme formunda tek dokunuşla doldurulan yaygın ödemeler. Fiyatlar plana ve kura
 * göre değiştiği için tutar bilerek boş bırakılır.
 */
export const RECURRING_PRESETS: RecurringPreset[] = [
  { label: 'Claude', emoji: '✳️', type: 'expense', categoryId: 'abonelik' },
  { label: 'Netflix', emoji: '🎬', type: 'expense', categoryId: 'abonelik' },
  { label: 'Spotify', emoji: '🎵', type: 'expense', categoryId: 'abonelik' },
  { label: 'YouTube Premium', emoji: '▶️', type: 'expense', categoryId: 'abonelik' },
  { label: 'iCloud+', emoji: '☁️', type: 'expense', categoryId: 'abonelik' },
  { label: 'Disney+', emoji: '🏰', type: 'expense', categoryId: 'abonelik' },
  { label: 'Amazon Prime', emoji: '📦', type: 'expense', categoryId: 'abonelik' },
  { label: 'Kira', emoji: '🏠', type: 'expense', categoryId: 'kira' },
  { label: 'Telefon faturası', emoji: '📱', type: 'expense', categoryId: 'fatura' },
  { label: 'İnternet', emoji: '🌐', type: 'expense', categoryId: 'fatura' },
  { label: 'Maaş', emoji: '💼', type: 'income', categoryId: 'maas' },
]
