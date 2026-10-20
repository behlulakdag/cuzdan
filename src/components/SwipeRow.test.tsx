import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SwipeRow } from './SwipeRow'

function swipe(el: Element, dx: number, dy = 0) {
  fireEvent.pointerDown(el, { clientX: 300, clientY: 100, pointerId: 1 })
  fireEvent.pointerMove(el, { clientX: 300 + dx / 2, clientY: 100 + dy / 2, pointerId: 1 })
  fireEvent.pointerMove(el, { clientX: 300 + dx, clientY: 100 + dy, pointerId: 1 })
  fireEvent.pointerUp(el, { clientX: 300 + dx, clientY: 100 + dy, pointerId: 1 })
}

function setup() {
  const onDelete = vi.fn()
  const onClick = vi.fn()
  render(
    <SwipeRow onDelete={onDelete}>
      <button type="button" onClick={onClick}>Kahve</button>
    </SwipeRow>,
  )
  const content = document.querySelector('.swipe-content') as HTMLElement
  Object.defineProperty(content.parentElement!, 'offsetWidth', { value: 360 })
  return { onDelete, onClick, content }
}

describe('SwipeRow', () => {
  it('kısa kaydırmada Sil düğmesini açar, düzenlemeyi açmaz', async () => {
    const { content, onClick, onDelete } = setup()
    swipe(content, -70)
    expect(content.style.transform).toBe('translateX(-84px)')
    fireEvent.click(screen.getByText('Kahve'))
    // Açık satıra dokunmak yalnızca satırı kapatır.
    expect(onClick).not.toHaveBeenCalled()
    expect(content.style.transform).toBe('translateX(0px)')
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('açıkken Sil düğmesine basınca siler', async () => {
    const { content, onDelete } = setup()
    swipe(content, -70)
    fireEvent.click(screen.getByRole('button', { name: 'Sil' }))
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1))
  })

  it('uzun kaydırmada doğrudan siler', async () => {
    const { content, onDelete } = setup()
    swipe(content, -250)
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1))
  })

  it('dikey harekette kaymaz (liste kaydırmasıyla çakışmaz)', () => {
    const { content } = setup()
    swipe(content, -20, 120)
    expect(content.style.transform).toBe('translateX(0px)')
  })

  it('sağa kaydırma kapalı konumun ötesine geçmez', () => {
    const { content } = setup()
    swipe(content, 120)
    expect(content.style.transform).toBe('translateX(0px)')
  })
})
