import type { CSSProperties } from 'react'
import { monthLabel, monthShortLabel } from '../domain/dates'
import { formatTL, formatTLCompact } from '../domain/money'
import type { MonthTrendPoint } from '../domain/summary'
import type { MonthKey } from '../domain/types'

export interface DonutSlice {
  id: string
  label: string
  value: number
  color: string
}

const DONUT_RADIUS = 42
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS
/** Dilimler arasında ince boşluk; tek dilimde boşluk bırakılmaz. */
const SLICE_GAP = 1.6

export function DonutChart({
  slices,
  total,
  onSelect,
}: {
  slices: DonutSlice[]
  total: number
  onSelect?: (id: string) => void
}) {
  const gap = slices.length > 1 ? SLICE_GAP : 0
  const lengths = slices.map((s) => (s.value / total) * DONUT_CIRCUMFERENCE)
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0))
  // Veri değişince maske animasyonu yeniden oynasın diye anahtar tutara bağlı.
  const maskId = `donut-reveal-${total}`
  return (
    <svg viewBox="0 0 100 100" className="donut" role="img" aria-label="Kategori dağılımı">
      <defs>
        <mask id={maskId}>
          <circle
            key={total}
            cx="50"
            cy="50"
            r={DONUT_RADIUS}
            className="donut-reveal"
            style={{ '--circumference': DONUT_CIRCUMFERENCE } as CSSProperties}
          />
        </mask>
      </defs>
      <circle cx="50" cy="50" r={DONUT_RADIUS} className="donut-track" />
      <g mask={`url(#${maskId})`}>
        {slices.map((s, i) => {
          const dash = Math.max(lengths[i] - gap, 0.01)
          return (
            <circle
              key={s.id}
              cx="50"
              cy="50"
              r={DONUT_RADIUS}
              className="donut-slice"
              stroke={s.color}
              strokeDasharray={`${dash} ${DONUT_CIRCUMFERENCE - dash}`}
              strokeDashoffset={-starts[i]}
              onClick={() => onSelect?.(s.id)}
            >
              <title>{`${s.label}: ${formatTL(s.value)}`}</title>
            </circle>
          )
        })}
      </g>
      <text x="50" y="47" className="donut-caption">
        Toplam
      </text>
      <text x="50" y="59" className="donut-total">
        {formatTLCompact(total)}
      </text>
    </svg>
  )
}

const TREND_HEIGHT = 120
const TREND_BAR_WIDTH = 9

export function TrendChart({
  points,
  selectedMonth,
  onSelect,
}: {
  points: MonthTrendPoint[]
  selectedMonth?: MonthKey
  onSelect?: (month: MonthKey) => void
}) {
  const max = Math.max(1, ...points.flatMap((p) => [p.income, p.expense]))
  const columnWidth = 300 / points.length
  const barHeight = (v: number) => (v / max) * TREND_HEIGHT
  return (
    <svg viewBox={`0 0 300 ${TREND_HEIGHT + 22}`} className="trend" aria-label="Aylık gelir ve gider">
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <line key={r} x1="0" x2="300" y1={TREND_HEIGHT * (1 - r)} y2={TREND_HEIGHT * (1 - r)} className="trend-grid" />
      ))}
      {points.map((p, i) => {
        const cx = columnWidth * i + columnWidth / 2
        const ih = barHeight(p.income)
        const eh = barHeight(p.expense)
        const selected = p.month === selectedMonth
        return (
          <g
            key={p.month}
            className={`trend-column ${selected ? 'selected' : ''}`}
            style={{ '--i': i } as CSSProperties}
            role={onSelect ? 'button' : undefined}
            aria-label={`${monthLabel(p.month)}: gelir ${formatTL(p.income)}, gider ${formatTL(p.expense)}`}
            tabIndex={onSelect ? 0 : undefined}
            onClick={() => onSelect?.(p.month)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect?.(p.month)}
          >
            <rect
              x={cx - columnWidth / 2 + 4}
              y={0}
              width={columnWidth - 8}
              height={TREND_HEIGHT + 22}
              rx="8"
              className="trend-hit"
            />
            <rect
              x={cx - TREND_BAR_WIDTH - 1}
              y={TREND_HEIGHT - ih}
              width={TREND_BAR_WIDTH}
              height={Math.max(ih, 0.5)}
              rx="3"
              className="trend-bar trend-income"
            />
            <rect
              x={cx + 1}
              y={TREND_HEIGHT - eh}
              width={TREND_BAR_WIDTH}
              height={Math.max(eh, 0.5)}
              rx="3"
              className="trend-bar trend-expense"
            />
            <text x={cx} y={TREND_HEIGHT + 16} className="trend-label">
              {monthShortLabel(p.month)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
