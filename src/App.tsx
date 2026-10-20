import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react'
import { GaugeIcon, GearIcon, HomeIcon, ListIcon, PlusIcon } from './components/Icons'
import { ToastProvider } from './components/Toast'
import { TransactionForm } from './components/TransactionForm'
import { needsBackupReminder } from './domain/backupReminder'
import { monthOf, todayISO } from './domain/dates'
import type { MonthKey, Transaction } from './domain/types'
import { useStore } from './store'
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
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const { data, lastBackup } = useStore()
  const backupDue = needsBackupReminder(lastBackup, todayISO(), data.transactions.length)

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

  const goTo = (next: Tab) => {
    if (next !== 'transactions') setCategoryFilter(null)
    setTab(next)
    window.scrollTo({ top: 0 })
  }

  const current = TABS.find((t) => t.id === tab)!
  const tabButton = (t: (typeof TABS)[number]) => (
    <button
      key={t.id}
      type="button"
      className={`tab ${tab === t.id ? 'active' : ''}`}
      aria-current={tab === t.id ? 'page' : undefined}
      onClick={() => goTo(t.id)}
    >
      <span className="tab-icon">
        <t.Icon />
        {t.id === 'settings' && backupDue && <span className="tab-badge" aria-label="Yedek alma zamanı" />}
      </span>
      <span>{t.label}</span>
    </button>
  )

  return (
    <ToastProvider>
      <div className="app">
        <header className="large-title">
          <h1 key={tab}>{current.title}</h1>
        </header>

        {/* key ile her sekme değişiminde içerik giriş animasyonunu yeniden oynatır. */}
        <main className="content" key={tab}>
          {tab === 'summary' && (
            <SummaryView
              month={month}
              onMonthChange={setMonth}
              onOpenBudget={() => goTo('budget')}
              onOpenCategory={(id) => {
                setCategoryFilter(id)
                setTab('transactions')
                window.scrollTo({ top: 0 })
              }}
            />
          )}
          {tab === 'transactions' && (
            <TransactionsView
              month={month}
              onMonthChange={setMonth}
              onEdit={setForm}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
            />
          )}
          {tab === 'budget' && <BudgetView month={month} onMonthChange={setMonth} />}
          {tab === 'settings' && <SettingsView />}
        </main>

        <nav className="tabbar" aria-label="Sekmeler">
          {TABS.slice(0, 2).map(tabButton)}
          <button
            type="button"
            className={`add-button ${form ? 'open' : ''}`}
            aria-label="Yeni işlem"
            onClick={() => setForm('new')}
          >
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
