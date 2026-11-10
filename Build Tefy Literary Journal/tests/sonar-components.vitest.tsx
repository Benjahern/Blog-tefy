import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { ReactNode } from 'react'

const testState = vi.hoisted(() => ({
  state: {} as any,
  views: [] as any[],
  toast: vi.fn(),
  fileToDataUrl: vi.fn(),
}))

vi.mock('@/hooks/useContent', () => ({
  useContent: () => ({
    state: testState.state,
    updateSettings: vi.fn(() => true),
    setFeatured: vi.fn(() => true),
    resetDemo: vi.fn(),
  }),
  usePublishedReviews: () => testState.views,
}))
vi.mock('@/hooks/useDocumentTitle', () => ({ useDocumentTitle: vi.fn() }))
vi.mock('@/components/ui/Feedback', () => ({ useFeedback: () => ({ toast: testState.toast, confirm: vi.fn().mockResolvedValue(true) }) }))
vi.mock('@/components/ui/Dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) => open ? <div role="dialog">{children}</div> : null,
}))
vi.mock('@/components/books/BookCover', () => ({ BookCover: () => <div data-testid="book-cover" /> }))
vi.mock('@/components/reviews/ReviewArticle', () => ({ ReviewArticle: () => <div>Artículo de reseña</div> }))
vi.mock('@/components/reviews/ReviewCard', () => ({ ReviewGrid: () => <div data-testid="review-grid" /> }))
vi.mock('@/components/admin/AdminLayout', () => ({ AdminPage: ({ title, children }: { title: string; children: ReactNode }) => <main><h1>{title}</h1>{children}</main> }))
vi.mock('@/lib/images', () => ({
  fileToCompressedDataUrl: testState.fileToDataUrl,
  MAX_UPLOAD_MB: 5,
  ImageError: class ImageError extends Error {},
}))

import { createSeedState } from '../src/data/seed'
import { RichTextEditor } from '../src/components/admin/RichTextEditor'
import { GenreCard } from '../src/components/books/GenreCard'
import { SearchOverlay } from '../src/components/layout/SearchOverlay'
import { SiteHead } from '../src/components/layout/SiteHead'
import { RatingEditor } from '../src/components/rating/RatingEditor'
import { ImageUpload } from '../src/components/ui/ImageUpload'
import { truncateAtWordBoundary } from '../src/lib/text'
import { SettingsPage } from '../src/pages/admin/SettingsPage'
import { HomePage } from '../src/pages/public/HomePage'
import { ReviewDetailPage } from '../src/pages/public/ReviewDetailPage'

const reviewView = () => ({
  review: {
    id: 'review-1', slug: 'mar-abierto', title: 'El mar abierto', excerpt: 'Una historia luminosa.',
    content: '<p>Texto visible</p><p data-spoiler="true">Texto secreto</p>', publishedAt: '2026-11-01', rating: 4.5,
  },
  book: { id: 'book-1', title: 'El mar', author: 'Nia', titleFont: 'default', authorFont: 'default', coverUrl: '' },
  genres: [],
})

function withRouter(children: ReactNode, path = '/') {
  return <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
}

describe('Sonar remediation component regressions', () => {
  beforeEach(() => {
    testState.state = createSeedState()
    testState.views = []
    testState.toast.mockReset()
    testState.fileToDataUrl.mockReset().mockResolvedValue('data:image/jpeg;base64,ZmFrZQ==')
    Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn(() => true) })
    Object.defineProperty(document, 'queryCommandState', { configurable: true, value: vi.fn(() => false) })
    Object.defineProperty(document, 'queryCommandValue', { configurable: true, value: vi.fn(() => 'p') })
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn() })
    document.head.innerHTML = ''
  })

  afterEach(() => {
    cleanup()
    document.head.innerHTML = ''
    localStorage.clear()
    delete window.__APP_CONFIG__
  })

  it('keeps the rich-text editor keyboard reachable and handles image insertion', async () => {
    const onChange = vi.fn()
    const { container } = render(<RichTextEditor value="<p>Texto</p>" onChange={onChange} />)
    expect(container.querySelector('[contenteditable="true"]')).toHaveProperty('tabIndex', 0)
    const input = container.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [new File(['img'], 'portada.png', { type: 'image/png' })] } })
    await waitFor(() => expect(testState.fileToDataUrl).toHaveBeenCalled())
    expect(onChange).toHaveBeenCalled()
  })

  it('uses distinct portrait sizing for tall genre cards', () => {
    const genre = { id: 'genre-1', name: 'Fantasía', slug: 'fantasia' }
    const { container } = render(withRouter(<><GenreCard genre={genre} count={1} tall /><GenreCard genre={{ ...genre, id: 'genre-2' }} count={2} /></>))
    const cards = container.querySelectorAll('a')
    expect(cards[0].className).not.toContain('lg:aspect-[4/3.2]')
    expect(cards[1].className).toContain('lg:aspect-[4/3.2]')
  })

  it('focuses search after opening without an autofocus attribute', () => {
    render(withRouter(<SearchOverlay open onClose={vi.fn()} />))
    const input = screen.getByRole('combobox')
    expect(document.activeElement).toBe(input)
    expect(input.hasAttribute('autofocus')).toBe(false)
  })

  it('generates canonical review metadata without spoiler text and trims site URL slashes', () => {
    testState.views = [reviewView()]
    Object.defineProperty(window, '__APP_CONFIG__', { configurable: true, value: { siteUrl: 'https://journal.example///' } })
    render(withRouter(<SiteHead />, '/resenas/mar-abierto'))
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    const jsonLd = JSON.parse(document.querySelector('#page-structured-data')?.textContent ?? '{}')
    expect(canonical.href).toBe('https://journal.example/resenas/mar-abierto')
    expect(jsonLd.reviewBody).toContain('Texto visible')
    expect(jsonLd.reviewBody).not.toContain('Texto secreto')
  })

  it('parses decimal ratings and keeps asynchronous image handlers explicit', async () => {
    const onChange = vi.fn()
    const { unmount } = render(<RatingEditor value={4} onChange={onChange} />)
    const rating = screen.getByLabelText(/Nota exacta/)
    fireEvent.change(rating, { target: { value: '4,2' } })
    expect(onChange).toHaveBeenCalledWith(4.2)
    fireEvent.blur(rating)
    unmount()

    const onImage = vi.fn()
    const { container } = render(<ImageUpload label="Portada" onChange={onImage} />)
    const input = container.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [new File(['img'], 'portada.png', { type: 'image/png' })] } })
    await waitFor(() => expect(onImage).toHaveBeenCalledWith('data:image/jpeg;base64,ZmFrZQ=='))
    onImage.mockClear()
    fireEvent.drop(container.querySelector('.group.relative')!, { dataTransfer: { files: [new File(['img'], 'otra.png', { type: 'image/png' })] } })
    await waitFor(() => expect(onImage).toHaveBeenCalledWith('data:image/jpeg;base64,ZmFrZQ=='))
  })

  it('validates contact email in settings and truncates the homepage biography safely', () => {
    const invalidEmail = render(withRouter(<SettingsPage />))
    fireEvent.change(screen.getByLabelText(/Correo de contacto/), { target: { value: 'no-es-correo' } })
    expect(screen.getByText('Revisa el correo, parece incompleto.')).toBeTruthy()
    invalidEmail.unmount()

    testState.state.settings.aboutText = 'Lectura atenta '.repeat(40)
    render(withRouter(<HomePage />))
    const about = Array.from(document.querySelectorAll('#sobre + p')).at(0)
    expect(about?.textContent).toBe(`${truncateAtWordBoundary(testState.state.settings.aboutText, 320)}…`)
  })

  it('shares a review through the explicit async clipboard fallback', async () => {
    testState.views = [reviewView()]
    render(withRouter(<Routes><Route path="/resenas/:slug" element={<ReviewDetailPage />} /></Routes>, '/resenas/mar-abierto'))
    fireEvent.click(screen.getByRole('button', { name: 'Compartir' }))
    await waitFor(() => expect(testState.toast).toHaveBeenCalledWith('Enlace copiado. ¡Compártelo con quien quieras!', 'success'))
  })
})
