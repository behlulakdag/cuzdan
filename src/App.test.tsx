import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { emptyData } from './domain/defaults'
import type { AppData } from './domain/types'
import { StoreProvider } from './store'

const TODAY = new Date(2026, 9, 20, 12, 0)

function renderApp(initialData?: AppData) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
  render(
    <StoreProvider initialData={initialData}>
      <App />
    </StoreProvider>,
  )
  return user
}

const balanceCard = () => document.querySelector('.balance-card') as HTMLElement
const normalizeSpaces = (s: string | null) => (s ?? '').replace(/\s/g, ' ')

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(TODAY)
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Cüzdan', () => {
  it('boş başlar ve ilk işlem için yönlendirir', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: 'Cüzdan' })).toBeInTheDocument()
    expect(screen.getByText(/henüz harcama yok/)).toBeInTheDocument()
    expect(normalizeSpaces(balanceCard().textContent)).toContain('₺0,00')
  })

  it('gider ekleyince özet güncellenir ve kalıcı olarak kaydedilir', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Yeni işlem' }))
    const dialog = screen.getByRole('dialog', { name: 'Yeni İşlem' })

    const save = within(dialog).getByRole('button', { name: 'Kaydet' })
    expect(save).toBeDisabled()

    await user.type(within(dialog).getByLabelText('Tutar'), '249,90')
    await user.click(within(dialog).getByRole('radio', { name: /Market/ }))
    expect(save).toBeEnabled()
    await user.click(save)

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(normalizeSpaces(balanceCard().textContent)).toContain('-₺249,90')
    expect(normalizeSpaces(screen.getByRole('status').textContent)).toContain('Gider eklendi · ₺249,90')

    const stored = JSON.parse(localStorage.getItem('cuzdan:data')!)
    expect(stored.data.transactions).toEqual([
      expect.objectContaining({ amount: 24990, categoryId: 'market', date: '2026-10-20', type: 'expense' }),
    ])
  })

  it('geçersiz tutarda kaydetmeye izin vermez', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Yeni işlem' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Tutar'), '12,345')
    await user.click(within(dialog).getByRole('radio', { name: /Market/ }))
    expect(within(dialog).getByText(/Geçerli bir tutar/)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Kaydet' })).toBeDisabled()
  })

  it('"Her ay tekrarla" ile düzenli gelir oluşturur', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Yeni işlem' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('radio', { name: 'Gelir' }))
    await user.type(within(dialog).getByLabelText('Tutar'), '35000')
    await user.click(within(dialog).getByRole('radio', { name: /Maaş/ }))
    await user.click(within(dialog).getByLabelText('Her ay tekrarla'))
    await user.click(within(dialog).getByRole('button', { name: 'Kaydet' }))

    expect(normalizeSpaces(balanceCard().textContent)).toContain('₺35.000,00')
    expect(screen.getByText('Yaklaşan Düzenli Ödemeler')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Ayarlar/ }))
    expect(screen.getByText('Her ayın 20. günü')).toBeInTheDocument()
  })

  it('bütçe limitine yaklaşınca özette uyarır', async () => {
    const data = emptyData()
    data.transactions.push({
      id: 'a', type: 'expense', amount: 90000, categoryId: 'yemek', date: '2026-10-10', note: '',
    })
    const user = renderApp(data)

    await user.click(screen.getByRole('button', { name: /Bütçe/ }))
    await user.click(screen.getByRole('button', { name: /Yemek/ }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Aylık limit'), '1000')
    await user.click(within(dialog).getByRole('button', { name: 'Kaydet' }))

    await user.click(screen.getByRole('button', { name: /Özet/ }))
    expect(screen.getByText(/Yemek bütçesinin %90'ına ulaştı/)).toBeInTheDocument()
  })

  it('işlemi silip geri alabilir', async () => {
    const data = emptyData()
    data.transactions.push({
      id: 'a', type: 'expense', amount: 5000, categoryId: 'yemek', date: '2026-10-20', note: 'Kahve',
    })
    const user = renderApp(data)

    await user.click(screen.getByRole('button', { name: /İşlemler/ }))
    await user.click(screen.getByRole('button', { name: /Kahve/ }))
    const dialog = screen.getByRole('dialog', { name: 'İşlemi Düzenle' })
    expect(within(dialog).getByLabelText('Tutar')).toHaveValue('50')
    await user.click(within(dialog).getByRole('button', { name: 'İşlemi Sil' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    expect(screen.queryByText('Kahve')).not.toBeInTheDocument()
    expect(screen.getByText('Bu ay işlem yok.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Geri al' }))
    expect(screen.getByText('Kahve')).toBeInTheDocument()
  })

  it('dolu form dışarı dokununca kapanmaz, boş form kapanır', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Yeni işlem' }))
    await user.type(within(screen.getByRole('dialog')).getByLabelText('Tutar'), '50')
    await user.click(document.querySelector('.sheet-backdrop')!)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.clear(within(screen.getByRole('dialog')).getByLabelText('Tutar'))
    await user.click(document.querySelector('.sheet-backdrop')!)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('kategoride önceki notları önerir ve tutarı doldurur', async () => {
    const data = emptyData()
    data.transactions.push({
      id: 'a', type: 'expense', amount: 4500, categoryId: 'yemek', date: '2026-10-18', note: 'Kahve',
    })
    const user = renderApp(data)
    await user.click(screen.getByRole('button', { name: 'Yeni işlem' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('radio', { name: /Yemek/ }))
    await user.click(within(dialog).getByRole('button', { name: /Kahve/ }))
    expect(within(dialog).getByLabelText('Tutar')).toHaveValue('45')
    expect(within(dialog).getByLabelText('Not')).toHaveValue('Kahve')
  })

  it('aramada Türkçe büyük/küçük harfi doğru eşleştirir', async () => {
    const data = emptyData()
    data.transactions.push(
      { id: 'a', type: 'expense', amount: 5000, categoryId: 'ulasim', date: '2026-10-19', note: 'İstanbulkart' },
      { id: 'b', type: 'expense', amount: 7000, categoryId: 'yemek', date: '2026-10-18', note: 'Pizza' },
    )
    const user = renderApp(data)
    await user.click(screen.getByRole('button', { name: /İşlemler/ }))
    await user.type(screen.getByLabelText('İşlemlerde ara'), 'istanbul')
    expect(screen.getByText('İstanbulkart')).toBeInTheDocument()
    expect(screen.queryByText('Pizza')).not.toBeInTheDocument()
  })

  it('Ayarlardan geçmiş günlü düzenli ödeme eklerken bu ayı varsayılan olarak atlar', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: /Ayarlar/ }))
    await user.click(screen.getByRole('button', { name: /Düzenli ödeme ekle/ }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Tutar'), '229,99')
    await user.click(within(dialog).getByRole('radio', { name: /Abonelik/ }))
    await user.selectOptions(within(dialog).getByLabelText('Ayın kaçında'), '10')
    expect(within(dialog).getByLabelText('Bu ayınkini de ekle')).not.toBeChecked()
    await user.click(within(dialog).getByRole('button', { name: 'Kaydet' }))

    const stored = JSON.parse(localStorage.getItem('cuzdan:data')!).data
    expect(stored.transactions).toEqual([])
    expect(stored.recurring[0].startMonth).toBe('2026-11')
  })

  it('istenirse bu ayınkini de ekler', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: /Ayarlar/ }))
    await user.click(screen.getByRole('button', { name: /Düzenli ödeme ekle/ }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Tutar'), '100')
    await user.click(within(dialog).getByRole('radio', { name: /Abonelik/ }))
    await user.selectOptions(within(dialog).getByLabelText('Ayın kaçında'), '10')
    await user.click(within(dialog).getByLabelText('Bu ayınkini de ekle'))
    await user.click(within(dialog).getByRole('button', { name: 'Kaydet' }))

    const stored = JSON.parse(localStorage.getItem('cuzdan:data')!).data
    expect(stored.transactions.map((t: { date: string }) => t.date)).toEqual(['2026-10-10'])
  })

  it('geçmiş aya bakarken bakiye etiketi değişir ve bu aya dönülebilir', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Önceki ay' }))
    expect(screen.getByText('Ay sonu kalan')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /bu aya dön/ }))
    expect(screen.getByText('Bu ay kalan')).toBeInTheDocument()
  })

  it('ileri tarihli işlemi görmek için sonraki aylara geçilebilir', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Sonraki ay' }))
    expect(screen.getByText('Kasım 2026')).toBeInTheDocument()
    expect(screen.getByText('Planlanan')).toBeInTheDocument()
  })

  it('uygulama açıkken ay değişirse yeni aya geçer', async () => {
    renderApp()
    expect(screen.getByText('Ekim 2026')).toBeInTheDocument()
    vi.setSystemTime(new Date(2026, 10, 1, 9, 0))
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(screen.getByText('Kasım 2026')).toBeInTheDocument()
  })

  it('yeni kategori ekleyip işlem formunda kullanabilir', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: /Ayarlar/ }))
    await user.click(screen.getByRole('button', { name: /Kategorileri düzenle/ }))
    await user.click(screen.getByRole('button', { name: '+ Yeni kategori' }))
    const form = screen.getByRole('dialog', { name: 'Yeni Kategori' })
    await user.type(within(form).getByLabelText('Kategori adı'), 'Kahve')
    await user.click(within(form).getByRole('radio', { name: '☕' }))
    await user.click(within(form).getByRole('button', { name: 'Kaydet' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Yeni Kategori' })).not.toBeInTheDocument())

    const stored = JSON.parse(localStorage.getItem('cuzdan:data')!).data
    expect(stored.categories.at(-1)).toMatchObject({ name: 'Kahve', emoji: '☕', type: 'expense' })
  })

  it('aynı adda kategoriye izin vermez', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: /Ayarlar/ }))
    await user.click(screen.getByRole('button', { name: /Kategorileri düzenle/ }))
    await user.click(screen.getByRole('button', { name: '+ Yeni kategori' }))
    const form = screen.getByRole('dialog', { name: 'Yeni Kategori' })
    await user.type(within(form).getByLabelText('Kategori adı'), 'market')
    expect(within(form).getByText(/zaten var/)).toBeInTheDocument()
    expect(within(form).getByRole('button', { name: 'Kaydet' })).toBeDisabled()
  })

  it('özette bir kategoriye dokununca o kategorinin işlemleri açılır', async () => {
    const data = emptyData()
    data.transactions.push(
      { id: 'a', type: 'expense', amount: 5000, categoryId: 'yemek', date: '2026-10-19', note: 'Kahve' },
      { id: 'b', type: 'expense', amount: 7000, categoryId: 'market', date: '2026-10-18', note: 'Migros' },
    )
    const user = renderApp(data)
    await user.click(screen.getByRole('button', { name: /Yemek işlemlerini göster/ }))
    expect(screen.getByRole('heading', { name: 'İşlemler' })).toBeInTheDocument()
    expect(screen.getByText('Kahve')).toBeInTheDocument()
    expect(screen.queryByText('Migros')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Yemek filtresini kaldır/ }))
    expect(screen.getByText('Migros')).toBeInTheDocument()
  })

  it('geçen aya göre değişimi ve günlük ortalamayı gösterir', () => {
    const data = emptyData()
    data.transactions.push(
      { id: 'a', type: 'expense', amount: 100000, categoryId: 'yemek', date: '2026-09-10', note: '' },
      { id: 'b', type: 'expense', amount: 80000, categoryId: 'yemek', date: '2026-10-10', note: '' },
    )
    renderApp(data)
    const stats = screen.getByRole('region', { name: 'Bu ayın göstergeleri' })
    expect(within(stats).getByText('%20')).toBeInTheDocument()
    expect(within(stats).getByText('daha az harcama')).toBeInTheDocument()
    expect(normalizeSpaces(within(stats).getByText('20 günde').parentElement!.textContent)).toContain('₺40')
  })
})
