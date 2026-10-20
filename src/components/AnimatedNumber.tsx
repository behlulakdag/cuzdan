import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 700

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Değer değişince eskisinden yenisine sayarak geçer.
 * Ekran okuyucular (ve testler) ara değerleri değil, gerçek değeri okusun diye
 * animasyonlu metin aria-hidden, gerçek değer görünmez metin olarak durur.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number
  format: (v: number) => string
  className?: string
}) {
  const [shown, setShown] = useState(prefersReducedMotion() ? value : 0)
  const from = useRef(shown)

  useEffect(() => {
    if (prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') {
      setShown(value)
      return
    }
    const start = performance.now()
    const startValue = from.current
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION_MS, 1)
      const current = startValue + (value - startValue) * easeOutCubic(t)
      from.current = current
      setShown(current)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return (
    <span className={className}>
      <span aria-hidden>{format(Math.round(shown))}</span>
      <span className="visually-hidden">{format(value)}</span>
    </span>
  )
}
