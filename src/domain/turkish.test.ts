import { describe, expect, it } from 'vitest'
import { percentWith, possessiveDativeSuffix, possessiveSuffix } from './turkish'

describe('Türkçe sayı ekleri', () => {
  it.each([
    [38, "%38'i"],
    [40, "%40'ı"],
    [50, "%50'si"],
    [26, "%26'sı"],
    [4, "%4'ü"],
    [3, "%3'ü"],
    [9, "%9'u"],
    [10, "%10'u"],
    [100, "%100'ü"],
    [0, "%0'ı"],
    [2, "%2'si"],
    [-5, "%-5'i"],
  ])('iyelik: %i -> %s', (n, expected) => {
    expect(percentWith(n, possessiveSuffix)).toBe(expected)
  })

  it.each([
    [90, "%90'ına"],
    [83, "%83'üne"],
    [80, "%80'ine"],
    [50, "%50'sine"],
    [86, "%86'sına"],
    [97, "%97'sine"],
    [99, "%99'una"],
    [100, "%100'üne"],
    [84, "%84'üne"],
  ])('iyelik + yönelme: %i -> %s', (n, expected) => {
    expect(percentWith(n, possessiveDativeSuffix)).toBe(expected)
  })
})
