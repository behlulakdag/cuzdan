import { useRef, useState, type CSSProperties } from 'react'
import { ChevronRight, ShareIcon } from '../components/Icons'
import { CategoryManager } from '../components/CategoryManager'
import { RecurringForm } from '../components/RecurringForm'
import { useToast } from '../components/Toast'
import { BackupError, parseBackup, serializeBackup } from '../domain/backup'
import { lastBackupLabel, needsBackupReminder } from '../domain/backupReminder'
import { transactionsToCsv } from '../domain/csv'
import { todayISO } from '../domain/dates'
import { emptyData } from '../domain/defaults'
import { formatTL } from '../domain/money'
import type { RecurringRule } from '../domain/types'
import { shareOrDownload } from '../share'
import { useStore } from '../store'

type Editing = { rule?: RecurringRule } | null

/** Ana ekrandan açıldıysa kurulum ipucunu gösterme. */
const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

export function SettingsView() {
  const { data, dispatch, categoryById, lastBackup, markBackedUp } = useStore()
  const [editing, setEditing] = useState<Editing>(null)
  const toast = useToast()
  const [managingCategories, setManagingCategories] = useState(false)
  const backupDue = needsBackupReminder(lastBackup, todayISO(), data.transactions.length)
  const fileInput = useRef<HTMLInputElement>(null)

  const exportFile = async (file: File, title: string, onDone?: () => void) => {
    try {
      const result = await shareOrDownload(file, title)
      if (result === 'cancelled') return
      onDone?.()
      toast({ text: result === 'shared' ? `${title} paylaşıldı` : `${title} indirildi` })
    } catch {
      toast({ kind: 'error', text: 'Paylaşılamadı' })
    }
  }

  const exportBackup = () =>
    exportFile(
      new File([serializeBackup(data)], `cuzdan-yedek-${todayISO()}.json`, { type: 'application/json' }),
      'Yedek',
      markBackedUp,
    )

  const exportCsv = () =>
    exportFile(
      new File([transactionsToCsv(data.transactions, categoryById)], `cuzdan-islemler-${todayISO()}.csv`, {
        type: 'text/csv',
      }),
      'Tablo',
    )

  const importBackup = async (file: File) => {
    try {
      const restored = parseBackup(await file.text())
      const ok = confirm(
        `${restored.transactions.length} işlem içeren yedek yüklensin mi? Şu anki verilerin yerini alacak.`,
      )
      if (!ok) return
      const previous = data
      dispatch({ type: 'data/replace', data: restored })
      dispatch({ type: 'recurring/run', today: todayISO() })
      toast({ text: 'Yedek geri yüklendi', undo: () => dispatch({ type: 'data/replace', data: previous }) })
    } catch (err) {
      toast({ kind: 'error', text: err instanceof BackupError ? err.message : 'Yedek yüklenemedi' })
    }
  }

  const resetAll = () => {
    if (confirm('TÜM veriler silinsin mi? Önce yedek almanı öneririm.')) {
      const previous = data
      dispatch({ type: 'data/replace', data: emptyData() })
      toast({ text: 'Tüm veriler silindi', undo: () => dispatch({ type: 'data/replace', data: previous }) })
    }
  }

  return (
    <>
      {!isStandalone() && (
        <section className="card install-card">
          <h3 className="card-title">📲 iPhone'a kur</h3>
          <ol>
            <li>
              Safari'de alttaki <ShareIcon className="inline-icon" /> Paylaş düğmesine dokun
            </li>
            <li>"Ana Ekrana Ekle"yi seç</li>
            <li>Cüzdan artık bir uygulama gibi açılır ve internetsiz çalışır</li>
          </ol>
        </section>
      )}

      <h3 className="section-title">Düzenli Ödemeler</h3>
      <div className="group">
        {data.recurring.length === 0 && (
          <p className="empty-row">Kira, fatura, abonelik veya maaş gibi her ay tekrar edenleri ekle.</p>
        )}
        {data.recurring.map((r) => {
          const c = categoryById(r.categoryId)
          return (
            <button key={r.id} type="button" className="tx-row" onClick={() => setEditing({ rule: r })}>
              <span className="tx-icon" style={{ '--cat': c.color } as CSSProperties}>
                {c.emoji}
              </span>
              <span className="tx-text">
                <span className="tx-title">{r.note || c.name}</span>
                <span className="tx-sub">Her ayın {r.dayOfMonth}. günü</span>
              </span>
              <span className={`tx-amount ${r.type}`}>{formatTL(r.amount)}</span>
              <ChevronRight className="row-chevron" />
            </button>
          )
        })}
        <button type="button" className="row-button" onClick={() => setEditing({})}>
          + Düzenli ödeme ekle
        </button>
      </div>

      <h3 className="section-title">Kategoriler</h3>
      <div className="group">
        <button type="button" className="tx-row" onClick={() => setManagingCategories(true)}>
          <span className="category-stack" aria-hidden>
            {data.categories.slice(0, 4).map((c) => (
              <span key={c.id} style={{ '--cat': c.color } as CSSProperties}>
                {c.emoji}
              </span>
            ))}
          </span>
          <span className="tx-text">
            <span className="tx-title">Kategorileri düzenle</span>
            <span className="tx-sub">{data.categories.length} kategori</span>
          </span>
          <ChevronRight className="row-chevron" />
        </button>
      </div>

      <h3 className="section-title">Yedekleme</h3>
      <div className="group">
        <button type="button" className="row-button with-status" onClick={exportBackup}>
          <span>Yedek al (Dosyalar'a kaydet)</span>
          <span className={`backup-status ${backupDue ? 'due' : ''}`}>
            {lastBackupLabel(lastBackup, todayISO())}
          </span>
        </button>
        <button type="button" className="row-button" onClick={() => fileInput.current?.click()}>
          Yedekten geri yükle
        </button>
        <button
          type="button"
          className="row-button"
          onClick={exportCsv}
          disabled={data.transactions.length === 0}
        >
          Excel tablosu olarak dışa aktar (CSV)
        </button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) importBackup(file)
          e.target.value = ''
        }}
      />
      <p className="section-hint">
        Veriler yalnızca bu telefonda durur. Telefon değiştirirken ya da ara ara yedek almayı unutma.
      </p>

      <h3 className="section-title">Veri</h3>
      <div className="group">
        <div className="row static">
          <span>Toplam işlem</span>
          <span className="muted">{data.transactions.length}</span>
        </div>
        <button type="button" className="row-button danger" onClick={resetAll}>
          Tüm verileri sil
        </button>
      </div>

      <p className="footer-note">Cüzdan · internetsiz çalışır · verilerin sende kalır</p>

      {managingCategories && <CategoryManager onClose={() => setManagingCategories(false)} />}
      {editing && <RecurringForm existing={editing.rule} onClose={() => setEditing(null)} />}
    </>
  )
}
