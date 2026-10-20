import { useState } from 'react'
import { dayLabel, todayISO } from '../domain/dates'
import { newId } from '../domain/defaults'
import { goalProgress, goalSaved } from '../domain/goals'
import { formatTL, kurusToInput, parseTL } from '../domain/money'
import type { Goal, GoalContribution } from '../domain/types'
import { useStore } from '../store'
import { Confetti } from './Confetti'
import { GoalRing } from './GoalRing'
import { ColorPicker, COLORS, EmojiPicker, GOAL_EMOJIS } from './Pickers'
import { SegmentedControl } from './SegmentedControl'
import { Sheet, useSheet } from './Sheet'
import { SwipeRow } from './SwipeRow'
import { useToast } from './Toast'

type Editing = null | { goal?: Goal }

export function GoalsPanel() {
  const { data } = useStore()
  const [editing, setEditing] = useState<Editing>(null)
  const [openGoalId, setOpenGoalId] = useState<string | null>(null)
  const today = todayISO()
  const openGoal = data.goals.find((g) => g.id === openGoalId)

  const totalSaved = data.goals.reduce((sum, g) => sum + goalSaved(g), 0)

  return (
    <>
      {data.goals.length === 0 ? (
        <div className="card empty-state">
          <span className="empty-illustration" aria-hidden>
            <span>🏖️</span>
            <span>🐷</span>
            <span>✈️</span>
          </span>
          <p className="empty">
            Tatil, telefon, acil durum fonu... Bir hedef koy, biriktirdikçe halkası dolsun.
          </p>
        </div>
      ) : (
        <>
          <section className="card goals-total">
            <span className="balance-label">Toplam birikim</span>
            <strong>{formatTL(totalSaved)}</strong>
            <span className="hint">Hedeflere konan para aylık bakiyeni etkilemez.</span>
          </section>
          <div className="goal-list">
            {data.goals.map((g) => (
              <GoalCard key={g.id} goal={g} today={today} onOpen={() => setOpenGoalId(g.id)} />
            ))}
          </div>
        </>
      )}

      <button type="button" className="primary-button" onClick={() => setEditing({})}>
        + Yeni hedef
      </button>

      {openGoal && (
        <GoalDetail
          goal={openGoal}
          onClose={() => setOpenGoalId(null)}
          onEdit={() => setEditing({ goal: openGoal })}
        />
      )}
      {editing && (
        <GoalForm
          existing={editing.goal}
          onClose={() => setEditing(null)}
          onDeleted={() => setOpenGoalId(null)}
        />
      )}
    </>
  )
}

function GoalCard({ goal, today, onOpen }: { goal: Goal; today: string; onOpen: () => void }) {
  const p = goalProgress(goal, today)
  return (
    <button type="button" className="goal-card" onClick={onOpen}>
      <GoalRing ratio={p.ratio} color={goal.color} emoji={goal.emoji} completed={p.completed} />
      <span className="goal-card-text">
        <span className="goal-card-title">{goal.name}</span>
        <span className="goal-card-amounts">
          <b>{formatTL(p.saved)}</b> / {formatTL(goal.target)}
        </span>
        <GoalStatus goal={goal} today={today} />
      </span>
      <span className="goal-card-percent" style={{ color: goal.color }}>
        %{Math.floor(p.ratio * 100)}
      </span>
    </button>
  )
}

function GoalStatus({ goal, today }: { goal: Goal; today: string }) {
  const p = goalProgress(goal, today)
  if (p.completed) return <span className="goal-status done">🎉 Hedefe ulaştın</span>
  if (p.monthlyNeeded !== null) {
    return (
      <span className={`goal-status ${p.daysLeft === 0 ? 'late' : ''}`}>
        {p.daysLeft === 0
          ? `Süre doldu · ${formatTL(p.remaining)} kaldı`
          : `Ayda ${formatTL(p.monthlyNeeded)} biriktirmelisin`}
      </span>
    )
  }
  return <span className="goal-status">{formatTL(p.remaining)} kaldı</span>
}

function GoalDetail({ goal, onClose, onEdit }: { goal: Goal; onClose: () => void; onEdit: () => void }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const sheet = useSheet(onClose)
  const [mode, setMode] = useState<null | 'deposit' | 'withdraw'>(null)
  const [celebrate, setCelebrate] = useState(false)
  const today = todayISO()
  const p = goalProgress(goal, today)
  const history = [...goal.contributions].sort((a, b) => (a.date < b.date ? 1 : -1))

  const contribute = (amount: number) => {
    const contribution: GoalContribution = { id: newId(), date: today, amount }
    const wasCompleted = p.completed
    dispatch({ type: 'goal/contribute', goalId: goal.id, contribution })
    const nowCompleted = goalSaved(goal) + amount >= goal.target
    if (!wasCompleted && nowCompleted) {
      setCelebrate(true)
      toast({ text: `🎉 ${goal.name} hedefine ulaştın!` })
    } else {
      toast({
        text: amount > 0 ? `${formatTL(amount)} eklendi` : `${formatTL(-amount)} çekildi`,
        undo: () => dispatch({ type: 'goal/uncontribute', goalId: goal.id, contributionId: contribution.id }),
      })
    }
  }

  const removeContribution = (c: GoalContribution) => {
    dispatch({ type: 'goal/uncontribute', goalId: goal.id, contributionId: c.id })
    toast({ text: 'Kayıt silindi', undo: () => dispatch({ type: 'goal/contribute', goalId: goal.id, contribution: c }) })
  }

  return (
    <Sheet title={goal.name} sheet={sheet} action={{ label: 'Düzenle', onClick: onEdit }}>
      <div className="form">
        <div className="goal-hero">
          <GoalRing ratio={p.ratio} color={goal.color} emoji={goal.emoji} size={132} completed={p.completed} />
          <strong className="goal-hero-saved">{formatTL(p.saved)}</strong>
          <span className="hint">
            {formatTL(goal.target)} hedefin %{Math.floor(p.ratio * 100)}
            {goal.deadline && ` · son tarih ${dayLabel(goal.deadline, today)}`}
          </span>
          <GoalStatus goal={goal} today={today} />
        </div>

        <div className="goal-actions">
          <button type="button" className="primary-button" onClick={() => setMode('deposit')}>
            + Para ekle
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setMode('withdraw')}
            disabled={p.saved <= 0}
          >
            − Para çek
          </button>
        </div>

        {history.length > 0 && (
          <>
            <h3 className="section-title">Geçmiş</h3>
            <div className="group">
              {history.map((c) => (
                <SwipeRow key={c.id} onDelete={() => removeContribution(c)}>
                  <div className="row static">
                    <span>{dayLabel(c.date, today)}</span>
                    <span className={c.amount > 0 ? 'income' : 'muted'}>
                      {c.amount > 0 ? '+' : '−'}
                      {formatTL(Math.abs(c.amount))}
                    </span>
                  </div>
                </SwipeRow>
              ))}
            </div>
            <p className="section-hint">Yanlış kaydı sola kaydırarak silebilirsin.</p>
          </>
        )}
      </div>

      {mode && (
        <ContributionSheet
          mode={mode}
          maxWithdraw={p.saved}
          color={goal.color}
          onClose={() => setMode(null)}
          onSubmit={contribute}
        />
      )}
      {celebrate && <Confetti onDone={() => setCelebrate(false)} />}
    </Sheet>
  )
}

function ContributionSheet({
  mode,
  maxWithdraw,
  color,
  onClose,
  onSubmit,
}: {
  mode: 'deposit' | 'withdraw'
  maxWithdraw: number
  color: string
  onClose: () => void
  onSubmit: (amount: number) => void
}) {
  const sheet = useSheet(onClose)
  const [text, setText] = useState('')
  const amount = parseTL(text)
  const tooMuch = mode === 'withdraw' && amount !== null && amount > maxWithdraw
  const canSave = amount !== null && !tooMuch

  const save = () => {
    if (!canSave || amount === null) return
    onSubmit(mode === 'deposit' ? amount : -amount)
    sheet.close()
  }

  return (
    <Sheet
      title={mode === 'deposit' ? 'Para Ekle' : 'Para Çek'}
      sheet={sheet}
      dirty={text !== ''}
      action={{ label: 'Kaydet', onClick: save, disabled: !canSave }}
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <label className="amount-field" style={{ color }}>
          <span className="amount-currency">₺</span>
          <input
            inputMode="decimal"
            placeholder="0"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            aria-label="Tutar"
            style={{ color }}
          />
        </label>
        {tooMuch && <p className="field-error">En fazla {formatTL(maxWithdraw)} çekebilirsin.</p>}
        {mode === 'withdraw' && !tooMuch && (
          <p className="hint">Hedefte {formatTL(maxWithdraw)} birikmiş.</p>
        )}
      </form>
    </Sheet>
  )
}

function GoalForm({
  existing,
  onClose,
  onDeleted,
}: {
  existing?: Goal
  onClose: () => void
  onDeleted: () => void
}) {
  const { dispatch, data } = useStore()
  const toast = useToast()
  const sheet = useSheet(onClose)
  const [name, setName] = useState(existing?.name ?? '')
  const [emoji, setEmoji] = useState(existing?.emoji ?? GOAL_EMOJIS[0])
  const [color, setColor] = useState(existing?.color ?? COLORS[4])
  const [targetText, setTargetText] = useState(existing ? kurusToInput(existing.target) : '')
  const [deadline, setDeadline] = useState(existing?.deadline ?? '')
  const [deadlineType, setDeadlineType] = useState<'none' | 'date'>(existing?.deadline ? 'date' : 'none')
  const hasDeadline = deadlineType === 'date'

  const today = todayISO()
  const target = parseTL(targetText)
  const trimmed = name.trim()
  // Süresi geçmiş bir hedefin tarihine dokunmadan da ad/renk düzenlenebilsin.
  const deadlineValid =
    !hasDeadline || (deadline !== '' && (deadline > today || deadline === existing?.deadline))
  const canSave = trimmed !== '' && target !== null && deadlineValid
  const dirty = existing
    ? trimmed !== existing.name || emoji !== existing.emoji || color !== existing.color ||
      target !== existing.target || (hasDeadline ? deadline : undefined) !== existing.deadline
    : trimmed !== '' || targetText !== ''

  const save = () => {
    if (!canSave || target === null) return
    const goal: Goal = {
      id: existing?.id ?? newId(),
      name: trimmed,
      emoji,
      color,
      target,
      deadline: hasDeadline ? deadline : undefined,
      contributions: existing?.contributions ?? [],
    }
    dispatch(existing ? { type: 'goal/update', goal } : { type: 'goal/add', goal })
    toast({ text: existing ? 'Hedef güncellendi' : `${emoji} ${trimmed} hedefi eklendi` })
    sheet.close()
  }

  const remove = () => {
    if (!existing) return
    if (!confirm(`${existing.name} hedefi silinsin mi? Birikim kayıtları da silinir.`)) return
    const before = data
    dispatch({ type: 'goal/delete', id: existing.id })
    toast({ text: 'Hedef silindi', undo: () => dispatch({ type: 'data/replace', data: before }) })
    onDeleted()
    sheet.close()
  }

  return (
    <Sheet
      title={existing ? 'Hedefi Düzenle' : 'Yeni Hedef'}
      sheet={sheet}
      dirty={dirty}
      action={{ label: 'Kaydet', onClick: save, disabled: !canSave }}
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <div className="goal-hero small">
          <GoalRing ratio={0.66} color={color} emoji={emoji} size={84} />
          <strong>{trimmed || 'Hedef adı'}</strong>
        </div>

        <div className="group">
          <label className="row">
            <span>Ad</span>
            <input
              type="text"
              value={name}
              maxLength={24}
              placeholder="ör. Yaz tatili"
              onChange={(e) => setName(e.target.value)}
              autoFocus={!existing}
              aria-label="Hedef adı"
            />
          </label>
          <label className="row">
            <span>Hedef tutar</span>
            <input
              type="text"
              inputMode="decimal"
              value={targetText}
              placeholder="₺0"
              onChange={(e) => setTargetText(e.target.value)}
              aria-label="Hedef tutar"
            />
          </label>
        </div>

        <SegmentedControl
          label="Son tarih"
          value={deadlineType}
          onChange={setDeadlineType}
          options={[
            { value: 'none', label: 'Son tarih yok' },
            { value: 'date', label: 'Son tarih var' },
          ]}
        />
        {hasDeadline && (
          <div className="group">
            <label className="row">
              <span>Son tarih</span>
              <input
                type="date"
                value={deadline}
                min={today}
                onChange={(e) => setDeadline(e.target.value)}
                aria-label="Son tarih"
              />
            </label>
          </div>
        )}
        {hasDeadline && !deadlineValid && deadline !== '' && (
          <p className="field-error">Son tarih ileri bir gün olmalı.</p>
        )}

        <EmojiPicker emojis={GOAL_EMOJIS} value={emoji} onChange={setEmoji} />
        <ColorPicker value={color} onChange={setColor} />

        {existing && (
          <button type="button" className="danger-button" onClick={remove}>
            Hedefi Sil
          </button>
        )}
      </form>
    </Sheet>
  )
}
