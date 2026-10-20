import type { CSSProperties } from 'react'
import { formatTL } from '../domain/money'
import type { Transaction } from '../domain/types'
import { useStore } from '../store'
import { RepeatIcon } from './Icons'

export function TransactionRow({ tx, onClick }: { tx: Transaction; onClick: () => void }) {
  const { categoryById } = useStore()
  const cat = categoryById(tx.categoryId)
  return (
    <button type="button" className="tx-row" onClick={onClick}>
      <span className="tx-icon" style={{ '--cat': cat.color } as CSSProperties}>
        {cat.emoji}
      </span>
      <span className="tx-text">
        <span className="tx-title">
          {tx.note || cat.name}
          {tx.recurringId && <RepeatIcon className="tx-repeat" role="img" aria-hidden={false} aria-label="Düzenli" />}
        </span>
        {tx.note && <span className="tx-sub">{cat.name}</span>}
      </span>
      <span className={`tx-amount ${tx.type}`}>
        {tx.type === 'income' ? '+' : '−'}
        {formatTL(tx.amount)}
      </span>
    </button>
  )
}
