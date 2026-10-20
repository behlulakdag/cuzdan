import { describe, expect, it } from 'vitest'
import { parseBackup, serializeBackup } from './backup'
import { emptyData } from './defaults'
import { goalProgress } from './goals'
import { reducer } from './reducer'
import type { Goal } from './types'

const tatil: Goal = {
  id: 'g1', name: 'Tatil', emoji: '🏖️', color: '#00C7BE', target: 2000000,
  deadline: '2027-04-20', contributions: [],
}

describe('goalProgress', () => {
  it('biriken, kalan ve aylık gereken tutarı hesaplar', () => {
    const g = { ...tatil, contributions: [{ id: 'c', date: '2026-10-01', amount: 500000 }] }
    const p = goalProgress(g, '2026-10-20')
    expect(p.saved).toBe(500000)
    expect(p.remaining).toBe(1500000)
    expect(p.ratio).toBe(0.25)
    expect(p.daysLeft).toBe(182)
    // 182 gün ≈ 5,98 ay → 15.000 TL / 5,98 = 2.508,79 TL, yukarı yuvarlanır
    expect(p.monthlyNeeded).toBe(250880)
  })

  it('para çekmeleri düşer, hedef aşılınca tamamlanır', () => {
    const g = {
      ...tatil,
      contributions: [
        { id: 'a', date: '2026-10-01', amount: 2500000 },
        { id: 'b', date: '2026-10-02', amount: -300000 },
      ],
    }
    const p = goalProgress(g, '2026-10-20')
    expect(p.saved).toBe(2200000)
    expect(p.completed).toBe(true)
    expect(p.ratio).toBe(1)
    expect(p.remaining).toBe(0)
    expect(p.monthlyNeeded).toBeNull()
  })

  it('son tarih geçtiyse kalanın tamamı gerekir; son tarih yoksa hesaplanmaz', () => {
    expect(goalProgress(tatil, '2027-05-01').monthlyNeeded).toBe(2000000)
    expect(goalProgress({ ...tatil, deadline: undefined }, '2026-10-20').monthlyNeeded).toBeNull()
  })
})

describe('hedef reducer ve yedek', () => {
  it('katkı ekler/geri alır, düzenlemede katkıları korur', () => {
    let s = reducer(emptyData(), { type: 'goal/add', goal: tatil })
    s = reducer(s, { type: 'goal/contribute', goalId: 'g1', contribution: { id: 'c1', date: '2026-10-20', amount: 1000 } })
    s = reducer(s, { type: 'goal/update', goal: { ...tatil, name: 'Yaz tatili', contributions: [] } })
    expect(s.goals[0].name).toBe('Yaz tatili')
    expect(s.goals[0].contributions).toHaveLength(1)
    s = reducer(s, { type: 'goal/uncontribute', goalId: 'g1', contributionId: 'c1' })
    expect(s.goals[0].contributions).toHaveLength(0)
    s = reducer(s, { type: 'goal/delete', id: 'g1' })
    expect(s.goals).toEqual([])
  })

  it('hedefler yedekte korunur; hedefsiz eski yedekler de açılır', () => {
    const s = reducer(emptyData(), { type: 'goal/add', goal: tatil })
    expect(parseBackup(serializeBackup(s))).toEqual(s)
    const old = emptyData() as Partial<ReturnType<typeof emptyData>>
    delete old.goals
    expect(parseBackup(JSON.stringify({ app: 'cuzdan', data: old })).goals).toEqual([])
  })
})
