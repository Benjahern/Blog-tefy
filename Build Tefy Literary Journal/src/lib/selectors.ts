import type { ContentState, Review, ReviewView } from '@/types'
import { normalize } from './format'

export function toView(state: ContentState, review: Review): ReviewView | null {
  const book = state.books.find((b) => b.id === review.bookId)
  if (!book) return null
  const genres = book.genreIds.map((id) => state.genres.find((g) => g.id === id)).filter((g): g is NonNullable<typeof g> => !!g)
  const series = book.seriesId ? state.series.find((s) => s.id === book.seriesId) : undefined
  return { review, book, genres, series }
}

const sortDate = (r: Review) => r.publishedAt ?? r.updatedAt

/** Only published reviews ever reach public views. Newest first. */
export function publishedViews(state: ContentState): ReviewView[] {
  return state.reviews
    .filter((r) => r.status === 'published')
    .sort((a, b) => sortDate(b).localeCompare(sortDate(a)))
    .map((r) => toView(state, r))
    .filter((v): v is ReviewView => !!v)
}

export function allViews(state: ContentState): ReviewView[] {
  return [...state.reviews]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((r) => toView(state, r))
    .filter((v): v is ReviewView => !!v)
}

export function matchesQuery(v: ReviewView, query: string) {
  const q = normalize(query.trim())
  if (!q) return true
  const hay = normalize([v.book.title, v.book.author, v.review.title ?? '', v.series?.name ?? '', ...v.genres.map((g) => g.name)].join(' '))
  return q.split(/\s+/).every((t) => hay.includes(t))
}
