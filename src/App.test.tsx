import { render, screen, within } from '@testing-library/react'
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

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(normalizeSpaces(balanceCard().textContent)).toContain('-₺249,90')

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

  it('işlemi düzenleyip silebilir', async () => {
    const data = emptyData()
    data.transactions.push({
      id: 'a', type: 'expense', amount: 5000, categoryId: 'yemek', date: '2026-10-20', note: 'Kahve',
    })
    const user = renderApp(data)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    await user.click(screen.getByRole('button', { name: /İşlemler/ }))
    await user.click(screen.getByRole('button', { name: /Kahve/ }))
    const dialog = screen.getByRole('dialog', { name: 'İşlemi Düzenle' })
    expect(within(dialog).getByLabelText('Tutar')).toHaveValue('50')
    await user.click(within(dialog).getByRole('button', { name: 'İşlemi Sil' }))

    expect(screen.queryByText('Kahve')).not.toBeInTheDocument()
    expect(screen.getByText('Bu ay işlem yok.')).toBeInTheDocument()
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
})
