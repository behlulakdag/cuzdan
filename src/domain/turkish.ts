/**
 * Sayılardan sonra gelen Türkçe ekler, sayının okunuşundaki son kelimeye göre değişir:
 * %90'ına (doksan), %83'üne (seksen üç), %50'sine (elli).
 */

const UNITS = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz']
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan']

function lastSpokenWord(n: number): string {
  n = Math.abs(Math.trunc(n))
  if (n === 0) return 'sıfır'
  if (n % 10 !== 0) return UNITS[n % 10]
  if (n % 100 !== 0) return TENS[(n / 10) % 10]
  if (n % 1000 !== 0) return 'yüz'
  if (n % 1_000_000 !== 0) return 'bin'
  return 'milyon'
}

const VOWELS = 'aıoueiöü'

function lastVowel(word: string): string {
  for (let i = word.length - 1; i >= 0; i--) {
    if (VOWELS.includes(word[i])) return word[i]
  }
  return 'e'
}

/** Dört yönlü ünlü uyumu: ı, i, u, ü */
function highVowel(v: string): string {
  return ({ a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' } as Record<string, string>)[v]
}

/** İki yönlü ünlü uyumu: a, e */
function lowVowel(v: string): string {
  return 'aıou'.includes(v) ? 'a' : 'e'
}

/** 3. tekil iyelik: %38'i, %40'ı, %50'si */
export function possessiveSuffix(n: number): string {
  const word = lastSpokenWord(n)
  const v = lastVowel(word)
  const buffer = VOWELS.includes(word.at(-1)!) ? 's' : ''
  return buffer + highVowel(v)
}

/** İyelik + yönelme: %90'ına, %83'üne, %50'sine */
export function possessiveDativeSuffix(n: number): string {
  const word = lastSpokenWord(n)
  const v = lastVowel(word)
  return possessiveSuffix(n) + 'n' + lowVowel(highVowel(v))
}

/** "%83'üne" gibi tam ifadeyi üretir. */
export function percentWith(n: number, suffix: (n: number) => string): string {
  return `%${n}'${suffix(n)}`
}
