import { monthShortLabel } from '../domain/dates'
import { formatTL, formatTLCompact } from '../domain/money'
import type { MonthTrendPoint } from '../domain/summary'

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

export function DonutChart({ slices, total }: { slices: DonutSlice[]; total: number }) {
  const gap = slices.length > 1 ? SLICE_GAP : 0
  const lengths = slices.map((s) => (s.value / total) * DONUT_CIRCUMFERENCE)
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0))
  return (
    <svg viewBox="0 0 100 100" className="donut" role="img" aria-label="Kategori dağılımı">
      <circle cx="50" cy="50" r={DONUT_RADIUS} className="donut-track" />
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
          >
            <title>{`${s.label}: ${formatTL(s.value)}`}</title>
          </circle>
        )
      })}
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

export function TrendChart({ points }: { points: MonthTrendPoint[] }) {
  const max = Math.max(1, ...points.flatMap((p) => [p.income, p.expense]))
  const columnWidth = 300 / points.length
  const barHeight = (v: number) => (v / max) * TREND_HEIGHT
  return (
    <svg
      viewBox={`0 0 300 ${TREND_HEIGHT + 22}`}
      className="trend"
      role="img"
      aria-label="Aylık gelir ve gider"
    >
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <line key={r} x1="0" x2="300" y1={TREND_HEIGHT * (1 - r)} y2={TREND_HEIGHT * (1 - r)} className="trend-grid" />
      ))}
      {points.map((p, i) => {
        const cx = columnWidth * i + columnWidth / 2
        const ih = barHeight(p.income)
        const eh = barHeight(p.expense)
        return (
          <g key={p.month}>
            <rect
              x={cx - TREND_BAR_WIDTH - 1}
              y={TREND_HEIGHT - ih}
              width={TREND_BAR_WIDTH}
              height={Math.max(ih, 0.5)}
              rx="3"
              className="trend-income"
            >
              <title>{`Gelir: ${formatTL(p.income)}`}</title>
            </rect>
            <rect
              x={cx + 1}
              y={TREND_HEIGHT - eh}
              width={TREND_BAR_WIDTH}
              height={Math.max(eh, 0.5)}
              rx="3"
              className="trend-expense"
            >
              <title>{`Gider: ${formatTL(p.expense)}`}</title>
            </rect>
            <text x={cx} y={TREND_HEIGHT + 16} className="trend-label">
              {monthShortLabel(p.month)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
