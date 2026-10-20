import type { CSSProperties } from 'react'

interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
}

export function SegmentedControl<T extends string>({ options, value, onChange, label }: Props<T>) {
  const activeIndex = options.findIndex((o) => o.value === value)
  return (
    <div
      className="segmented"
      role="radiogroup"
      aria-label={label}
      style={{ '--count': options.length, '--index': activeIndex } as CSSProperties}
    >
      <span className="segmented-thumb" aria-hidden />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
