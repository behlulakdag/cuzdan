import { describe, expect, it } from 'vitest'
import { lastBackupLabel, needsBackupReminder } from './backupReminder'
import { dailyAllowance } from './summary'

describe('yedek hatırlatıcı', () => {
  it('az kayıtta hatırlatmaz', () => {
    expect(needsBackupReminder(null, '2026-10-20', 3)).toBe(false)
  })
  it('hiç yedek yoksa veya 30 gün geçtiyse hatırlatır', () => {
    expect(needsBackupReminder(null, '2026-10-20', 50)).toBe(true)
    expect(needsBackupReminder('2026-09-20', '2026-10-20', 50)).toBe(true)
    expect(needsBackupReminder('2026-10-01', '2026-10-20', 50)).toBe(false)
  })
  it('etiketler', () => {
    expect(lastBackupLabel(null, '2026-10-20')).toBe('Hiç yedek alınmadı')
    expect(lastBackupLabel('2026-10-20', '2026-10-20')).toBe('Son yedek: bugün')
    expect(lastBackupLabel('2026-10-19', '2026-10-20')).toBe('Son yedek: dün')
    expect(lastBackupLabel('2026-10-08', '2026-10-20')).toBe('Son yedek: 12 gün önce')
  })
})

describe('dailyAllowance', () => {
  it('kalan bütçeyi bugün dahil kalan günlere böler', () => {
    // 20 Ekim: 31 - 20 + 1 = 12 gün
    expect(dailyAllowance(120000, '2026-10-20')).toBe(10000)
    expect(dailyAllowance(5000, '2026-10-31')).toBe(5000)
  })
  it('bütçe aşıldıysa 0', () => {
    expect(dailyAllowance(-500, '2026-10-20')).toBe(0)
  })
})
