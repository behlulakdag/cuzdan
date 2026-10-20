import { parseBackup } from './domain/backup'
import { emptyData } from './domain/defaults'
import type { AppData } from './domain/types'

const STORAGE_KEY = 'cuzdan:data'

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    // Kayıtlı veri de yedek formatıyla aynı doğrulamadan geçer.
    return parseBackup(raw)
  } catch (err) {
    console.error('Kayıtlı veri okunamadı', err)
    return emptyData()
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ app: 'cuzdan', data }))
  } catch (err) {
    console.error('Veri kaydedilemedi', err)
  }
}

/**
 * Tarayıcıdan verinin yer açmak için silinmemesini ister. Ana ekrana eklenmiş
 * iOS uygulamalarında zaten kalıcıdır; Safari sekmesinde ise bu çağrı yardımcı olur.
 */
export async function requestPersistentStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    // Desteklenmiyorsa sorun değil.
  }
}
