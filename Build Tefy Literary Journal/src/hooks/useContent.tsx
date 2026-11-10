import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Book, ContentState, Genre, Review, ReviewDraftInput, ReviewStatus, Series, SeriesKind, SiteSettings } from '@/types'
import { contentRepository } from '@/services/contentRepository'
import { round1, slugify, uid } from '@/lib/format'
import { autoExcerpt, sanitizeHtml } from '@/lib/html'
import { publishedViews } from '@/lib/selectors'

type SaveResult = { ok: boolean; id?: string }

type ContentApi = {
  state: ContentState
  saveReview: (input: ReviewDraftInput, status?: ReviewStatus) => SaveResult
  setReviewStatus: (id: string, status: ReviewStatus) => boolean
  duplicateReview: (id: string) => SaveResult
  deleteReview: (id: string) => boolean
  setFeatured: (ids: string[]) => boolean
  addGenre: (name: string, description?: string, image?: string) => string | undefined
  updateGenre: (id: string, patch: Partial<Genre>) => boolean
  deleteGenre: (id: string) => boolean
  moveGenre: (id: string, dir: -1 | 1) => boolean
  addSeries: (name: string, description?: string, kind?: SeriesKind, image?: string) => string | undefined
  updateSeries: (id: string, patch: Partial<Series>) => boolean
  deleteSeries: (id: string) => boolean
  moveSeries: (id: string, dir: -1 | 1) => boolean
  updateSettings: (patch: Partial<SiteSettings>) => boolean
  resetDemo: () => void
}

const ContentContext = createContext<ContentApi | null>(null)

const uniqueSlug = (base: string, taken: string[]) => {
  let slug = slugify(base)
  let n = 2
  while (taken.includes(slug)) slug = `${slugify(base)}-${n++}`
  return slug
}

const move = <T extends { id: string }>(list: T[], id: string, dir: -1 | 1) => {
  const i = list.findIndex((x) => x.id === id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= list.length) return list
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContentState>(() => contentRepository.empty())
  const ref = useRef(state)

  useEffect(() => {
    let alive = true
    let requestId = 0
    const load = (admin = false) => {
      const currentRequest = ++requestId
      return contentRepository.load(admin).then((next) => {
        if (alive && currentRequest === requestId) { ref.current = next; setState(next) }
      }).catch(() => undefined)
    }
    void load()
    const onSession = (e: Event) => { const admin = (e as CustomEvent<boolean>).detail; if (!admin) { ref.current = contentRepository.empty(); setState(ref.current) }; void load(admin) }
    window.addEventListener('tefy:session', onSession)
    return () => { alive = false; requestId++; window.removeEventListener('tefy:session', onSession) }
  }, [])

  const commit = useCallback((next: ContentState) => {
    ref.current = next
    setState(next)
    try {
      void contentRepository.save(next).catch(() => window.dispatchEvent(new CustomEvent('tefy:save-error')))
      return true
    } catch {
      return false
    }
  }, [])

  const saveReview = useCallback<ContentApi['saveReview']>((input, status) => {
    const cur = ref.current
    const now = new Date().toISOString()
    const genreIds = [input.primaryGenreId, ...input.extraGenreIds.filter((g) => g !== input.primaryGenreId)].filter(Boolean)
    const bookPatch: Omit<Book, 'id'> = {
      title: input.bookTitle.trim(),
      author: input.author.trim(),
      titleFont: input.bookTitleFont ?? 'default',
      authorFont: input.authorFont ?? 'default',
      synopsisFont: input.synopsisFont ?? 'default',
      coverUrl: input.coverUrl,
      synopsis: input.synopsis.trim() || undefined,
      genreIds,
      seriesId: input.seriesId || undefined,
      seriesOrder: input.seriesId && input.seriesOrder ? input.seriesOrder : undefined,
    }
    let books = cur.books
    let bookId = input.bookId && cur.books.some((b) => b.id === input.bookId) ? input.bookId : undefined
    if (bookId) books = books.map((b) => (b.id === bookId ? { ...b, ...bookPatch } : b))
    else {
      bookId = uid('b')
      books = [...books, { id: bookId, ...bookPatch }]
    }
    const content = sanitizeHtml(input.content)
    const existing = input.reviewId ? cur.reviews.find((r) => r.id === input.reviewId) : undefined
    const nextStatus: ReviewStatus = status ?? existing?.status ?? 'draft'
    const base = {
      bookId,
      title: input.reviewTitle.trim() || undefined,
      titleFont: input.reviewTitleFont ?? 'default',
      content,
      excerpt: input.excerpt.trim() || autoExcerpt(content),
      excerptFont: input.excerptFont ?? 'default',
      closingThought: input.closingThought.trim() || undefined,
      closingThoughtFont: input.closingThoughtFont ?? 'default',
      rating: round1(input.rating),
      status: nextStatus,
      updatedAt: now,
    }
    let reviews: Review[]
    let id: string
    if (existing) {
      id = existing.id
      const nextSlug = bookPatch.title ? uniqueSlug(bookPatch.title, cur.reviews.filter((r) => r.id !== id).flatMap((r) => [r.slug, ...(r.previousSlugs ?? [])])) : existing.slug
      const previousSlugs = nextSlug !== existing.slug
        ? [...new Set([...(existing.previousSlugs ?? []), existing.slug])]
        : existing.previousSlugs
      reviews = cur.reviews.map((r) =>
        r.id === id ? { ...r, ...base, slug: nextSlug, previousSlugs, publishedAt: nextStatus === 'published' ? r.publishedAt ?? now : r.publishedAt } : r,
      )
    } else {
      id = uid('r')
      const slug = uniqueSlug(bookPatch.title, cur.reviews.map((r) => r.slug))
      reviews = [...cur.reviews, { id, slug, featured: false, createdAt: now, publishedAt: nextStatus === 'published' ? now : undefined, ...base }]
    }
    return { ok: commit({ ...cur, books, reviews }), id }
  }, [commit])

  const setReviewStatus = useCallback((id: string, status: ReviewStatus) => {
    const cur = ref.current
    const now = new Date().toISOString()
    return commit({
      ...cur,
      reviews: cur.reviews.map((r) =>
        r.id === id
          ? { ...r, status, updatedAt: now, publishedAt: status === 'published' ? r.publishedAt ?? now : r.publishedAt, featured: status === 'draft' ? false : r.featured }
          : r,
      ),
    })
  }, [commit])

  const duplicateReview = useCallback((id: string): SaveResult => {
    const cur = ref.current
    const r = cur.reviews.find((x) => x.id === id)
    if (!r) return { ok: false }
    const now = new Date().toISOString()
    const newId = uid('r')
    const copy: Review = { ...r, id: newId, slug: uniqueSlug(`${r.slug}-copia`, cur.reviews.map((x) => x.slug)), status: 'draft', featured: false, createdAt: now, updatedAt: now, publishedAt: undefined, title: r.title ? `${r.title} (copia)` : undefined }
    return { ok: commit({ ...cur, reviews: [...cur.reviews, copy] }), id: newId }
  }, [commit])

  const deleteReview = useCallback((id: string) => {
    const cur = ref.current
    const r = cur.reviews.find((x) => x.id === id)
    if (!r) return false
    const reviews = cur.reviews.filter((x) => x.id !== id)
    const books = reviews.some((x) => x.bookId === r.bookId) ? cur.books : cur.books.filter((b) => b.id !== r.bookId)
    return commit({ ...cur, reviews, books })
  }, [commit])

  const setFeatured = useCallback((ids: string[]) => {
    const cur = ref.current
    return commit({ ...cur, reviews: cur.reviews.map((r) => ({ ...r, featured: r.status === 'published' && ids.includes(r.id) })) })
  }, [commit])

  const addGenre = useCallback((name: string, description?: string, image?: string) => {
    const cur = ref.current
    const id = uid('g')
    const slug = uniqueSlug(name, cur.genres.map((g) => g.slug))
    return commit({ ...cur, genres: [...cur.genres, { id, name: name.trim(), slug, description, image }] }) ? id : undefined
  }, [commit])
  const updateGenre = useCallback((id: string, patch: Partial<Genre>) => {
    const cur = ref.current
    return commit({ ...cur, genres: cur.genres.map((g) => (g.id === id ? { ...g, ...patch } : g)) })
  }, [commit])
  const deleteGenre = useCallback((id: string) => {
    const cur = ref.current
    return commit({ ...cur, genres: cur.genres.filter((g) => g.id !== id), books: cur.books.map((b) => ({ ...b, genreIds: b.genreIds.filter((g) => g !== id) })) })
  }, [commit])
  const moveGenre = useCallback((id: string, dir: -1 | 1) => commit({ ...ref.current, genres: move(ref.current.genres, id, dir) }), [commit])

  const addSeries = useCallback((name: string, description?: string, kind: SeriesKind = 'saga', image?: string) => {
    const cur = ref.current
    const id = uid('s')
    const slug = uniqueSlug(name, cur.series.map((s) => s.slug))
    return commit({ ...cur, series: [...cur.series, { id, name: name.trim(), slug, description, kind, image }] }) ? id : undefined
  }, [commit])
  const updateSeries = useCallback((id: string, patch: Partial<Series>) => {
    const cur = ref.current
    const books = patch.kind === 'standalone'
      ? cur.books.map((book) => book.seriesId === id ? { ...book, seriesOrder: undefined } : book)
      : cur.books
    return commit({ ...cur, books, series: cur.series.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  }, [commit])
  const deleteSeries = useCallback((id: string) => {
    const cur = ref.current
    return commit({ ...cur, series: cur.series.filter((s) => s.id !== id), books: cur.books.map((b) => (b.seriesId === id ? { ...b, seriesId: undefined, seriesOrder: undefined } : b)) })
  }, [commit])
  const moveSeries = useCallback((id: string, dir: -1 | 1) => commit({ ...ref.current, series: move(ref.current.series, id, dir) }), [commit])

  const updateSettings = useCallback((patch: Partial<SiteSettings>) => commit({ ...ref.current, settings: { ...ref.current.settings, ...patch } }), [commit])

  const resetDemo = useCallback(() => {
    const fresh = contentRepository.empty()
    ref.current = fresh
    setState(fresh)
    void contentRepository.save(fresh).catch(() => window.dispatchEvent(new CustomEvent('tefy:save-error')))
  }, [])

  const api = useMemo<ContentApi>(
    () => ({ state, saveReview, setReviewStatus, duplicateReview, deleteReview, setFeatured, addGenre, updateGenre, deleteGenre, moveGenre, addSeries, updateSeries, deleteSeries, moveSeries, updateSettings, resetDemo }),
    [state, saveReview, setReviewStatus, duplicateReview, deleteReview, setFeatured, addGenre, updateGenre, deleteGenre, moveGenre, addSeries, updateSeries, deleteSeries, moveSeries, updateSettings, resetDemo],
  )
  return <ContentContext.Provider value={api}>{children}</ContentContext.Provider>
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used inside ContentProvider')
  return ctx
}

export function usePublishedReviews() {
  const { state } = useContent()
  return useMemo(() => publishedViews(state), [state])
}
