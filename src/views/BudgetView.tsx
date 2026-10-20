import { useState, type CSSProperties } from 'react'
import { MonthPicker } from '../components/MonthPicker'
import { Sheet, useSheet } from '../components/Sheet'
import { useToast } from '../components/Toast'
import { formatTL, kurusToInput, parseTL } from '../domain/money'
import { summarizeMonth, BUDGET_WARNING_RATIO } from '../domain/summary'
import type { Category, MonthKey } from '../domain/types'
import { useStore } from '../store'

interface Props {
  month: MonthKey
  onMonthChange: (m: MonthKey) => void
}

export function BudgetView({ month, onMonthChange }: Props) {
  const { data } = useStore()
  const [editing, setEditing] = useState<Category | null>(null)
  const summary = summarizeMonth(data.transactions, month)
  const expenseCategories = data.categories.filter((c) => c.type === 'expense')

  const totalLimit = Object.values(data.budgets).reduce((s, v) => s + v, 0)
  const budgetedSpent = Object.keys(data.budgets).reduce(
    (s, id) => s + (summary.expenseByCategory[id] ?? 0),
    0,
  )

  // Limiti olanlar üstte, kalanlar harcamaya göre sıralı.
  const sorted = [...expenseCategories].sort((a, b) => {
    const la = data.budgets[a.id] ? 1 : 0
    const lb = data.budgets[b.id] ? 1 : 0
    if (la !== lb) return lb - la
    return (summary.expenseByCategory[b.id] ?? 0) - (summary.expenseByCategory[a.id] ?? 0)
  })

  return (
    <>
      <MonthPicker month={month} onChange={onMonthChange} />

      {totalLimit > 0 && (
        <section className="card budget-total">
          <span className="balance-label">Toplam bütçe</span>
          <strong>
            {formatTL(budgetedSpent)} <small>/ {formatTL(totalLimit)}</small>
          </strong>
          <ProgressBar ratio={budgetedSpent / totalLimit} />
          <span className="hint">
            {budgetedSpent <= totalLimit
              ? `${formatTL(totalLimit - budgetedSpent)} harcayabilirsin`
              : `${formatTL(budgetedSpent - totalLimit)} aştın`}
          </span>
        </section>
      )}

      <p className="section-hint">Bir kategoriye dokunup aylık limit koy. Limitin %80'ine gelince uyarırım.</p>

      <div className="group">
        {sorted.map((c) => {
          const limit = data.budgets[c.id] ?? 0
          const spent = summary.expenseByCategory[c.id] ?? 0
          return (
            <button key={c.id} type="button" className="budget-row" onClick={() => setEditing(c)}>
              <span className="tx-icon" style={{ '--cat': c.color } as CSSProperties}>
                {c.emoji}
              </span>
              <span className="budget-main">
                <span className="budget-line">
                  <span>{c.name}</span>
                  <span className="budget-numbers">
                    {formatTL(spent)}
                    {limit > 0 && <small> / {formatTL(limit)}</small>}
                  </span>
                </span>
                {limit > 0 ? (
                  <ProgressBar ratio={spent / limit} />
                ) : (
                  <span className="budget-nolimit">Limit yok</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {editing && <BudgetSheet category={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function ProgressBar({ ratio }: { ratio: number }) {
  const state = ratio > 1 ? 'over' : ratio >= BUDGET_WARNING_RATIO ? 'warning' : 'ok'
  return (
    <span
      className={`progress ${state}`}
      role="progressbar"
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
    </span>
  )
}

function BudgetSheet({ category, onClose }: { category: Category; onClose: () => void }) {
  const { data, dispatch } = useStore()
  const toast = useToast()
  const sheet = useSheet(onClose)
  const current = data.budgets[category.id]
  const [text, setText] = useState(current ? kurusToInput(current) : '')
  const parsed = parseTL(text)
  const valid = text.trim() === '' || parsed !== null

  const save = () => {
    dispatch({ type: 'budget/set', categoryId: category.id, limit: parsed ?? 0 })
    toast({ text: parsed ? `${category.name} limiti ${formatTL(parsed)}` : `${category.name} limiti kaldırıldı` })
    sheet.close()
  }

  return (
    <Sheet
      title={`${category.emoji} ${category.name}`}
      sheet={sheet}
      dirty={text !== (current ? kurusToInput(current) : '')}
      action={{ label: 'Kaydet', onClick: save, disabled: !valid }}
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) save()
        }}
      >
        <p className="hint">Aylık limit (boş bırakırsan limit kaldırılır)</p>
        <label className="amount-field expense">
          <span className="amount-currency">₺</span>
          <input
            inputMode="decimal"
            placeholder="Limit yok"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            aria-label="Aylık limit"
          />
        </label>
        {current && (
          <button
            type="button"
            className="danger-button"
            onClick={() => {
              dispatch({ type: 'budget/set', categoryId: category.id, limit: 0 })
              toast({
                text: `${category.name} limiti kaldırıldı`,
                undo: () => dispatch({ type: 'budget/set', categoryId: category.id, limit: current }),
              })
              sheet.close()
            }}
          >
            Limiti Kaldır
          </button>
        )}
      </form>
    </Sheet>
  )
}
