import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react'
import { GaugeIcon, GearIcon, HomeIcon, ListIcon, PlusIcon } from './components/Icons'
import { ToastProvider } from './components/Toast'
import { TransactionForm } from './components/TransactionForm'
import { monthOf, todayISO } from './domain/dates'
import type { MonthKey, Transaction } from './domain/types'
import { BudgetView } from './views/BudgetView'
import { SettingsView } from './views/SettingsView'
import { SummaryView } from './views/SummaryView'
import { TransactionsView } from './views/TransactionsView'

type Tab = 'summary' | 'transactions' | 'budget' | 'settings'

const TABS: { id: Tab; label: string; title: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'summary', label: 'Özet', title: 'Cüzdan', Icon: HomeIcon },
  { id: 'transactions', label: 'İşlemler', title: 'İşlemler', Icon: ListIcon },
  { id: 'budget', label: 'Bütçe', title: 'Bütçe', Icon: GaugeIcon },
  { id: 'settings', label: 'Ayarlar', title: 'Ayarlar', Icon: GearIcon },
]

/** null: form kapalı, 'new': yeni işlem, Transaction: düzenleme */
type FormState = null | 'new' | Transaction

export default function App() {
  const [tab, setTab] = useState<Tab>('summary')
  const [month, setMonth] = useState<MonthKey>(() => monthOf(todayISO()))
  const [form, setForm] = useState<FormState>(null)

  // Uygulama günlerce açık kalabilir; ay değiştiğinde "bu ay"a bakan kullanıcıyı yeni aya taşı.
  const lastCurrentMonth = useRef(month)
  useEffect(() => {
    const syncMonth = () => {
      const now = monthOf(todayISO())
      const previous = lastCurrentMonth.current
      if (now === previous) return
      lastCurrentMonth.current = now
      setMonth((shown) => (shown === previous ? now : shown))
    }
    document.addEventListener('visibilitychange', syncMonth)
    const timer = setInterval(syncMonth, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', syncMonth)
      clearInterval(timer)
    }
  }, [])

  const current = TABS.find((t) => t.id === tab)!
  const tabButton = (t: (typeof TABS)[number]) => (
    <button
      key={t.id}
      type="button"
      className={`tab ${tab === t.id ? 'active' : ''}`}
      aria-current={tab === t.id ? 'page' : undefined}
      onClick={() => {
        setTab(t.id)
        window.scrollTo({ top: 0 })
      }}
    >
      <t.Icon />
      <span>{t.label}</span>
    </button>
  )

  return (
    <ToastProvider>
    <div className="app">
      <header className="large-title">
        <h1>{current.title}</h1>
      </header>

      <main className="content">
        {tab === 'summary' && (
          <SummaryView month={month} onMonthChange={setMonth} onOpenBudget={() => setTab('budget')} />
        )}
        {tab === 'transactions' && (
          <TransactionsView month={month} onMonthChange={setMonth} onEdit={setForm} />
        )}
        {tab === 'budget' && <BudgetView month={month} onMonthChange={setMonth} />}
        {tab === 'settings' && <SettingsView />}
      </main>

      <nav className="tabbar" aria-label="Sekmeler">
        {TABS.slice(0, 2).map(tabButton)}
        <button type="button" className="add-button" aria-label="Yeni işlem" onClick={() => setForm('new')}>
          <PlusIcon />
        </button>
        {TABS.slice(2).map(tabButton)}
      </nav>

      {form && (
        <TransactionForm existing={form === 'new' ? undefined : form} onClose={() => setForm(null)} />
      )}
    </div>
    </ToastProvider>
  )
}
