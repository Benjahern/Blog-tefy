export type ReviewStatus = 'draft' | 'published'

export type Book = {
  id: string
  title: string
  author: string
  coverUrl?: string
  synopsis?: string
  genreIds: string[]
  seriesId?: string
  seriesOrder?: number
  titleFont?: import('@/lib/reviewFonts').ReviewFontId
  authorFont?: import('@/lib/reviewFonts').ReviewFontId
  synopsisFont?: import('@/lib/reviewFonts').ReviewFontId
}

export type Review = {
  id: string
  bookId: string
  slug: string
  /** Previous public URLs kept as aliases after a slug change. */
  previousSlugs?: string[]
  titleFont?: import('@/lib/reviewFonts').ReviewFontId
  excerptFont?: import('@/lib/reviewFonts').ReviewFontId
  closingThoughtFont?: import('@/lib/reviewFonts').ReviewFontId
  /** Optional editorial headline for the review. */
  title?: string
  excerpt: string
  /** Sanitized HTML produced by the rich text editor. Spoilers use <div data-spoiler>. */
  content: string
  closingThought?: string
  rating: number
  status: ReviewStatus
  featured: boolean
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export type Genre = {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
}

export type Series = {
  id: string
  name: string
  slug: string
  description?: string
}

export type SocialLinks = {
  instagram?: string
  tiktok?: string
  goodreads?: string
  website?: string
}

export type SiteSettings = {
  siteName: string
  tagline: string
  logoImage?: string
  favicon?: string
  heroTitle: string
  heroDescription: string
  heroImage?: string
  aboutTitle: string
  aboutText: string
  aboutImage?: string
  profileName: string
  profileImage?: string
  biography: string
  contactEmail?: string
  social: SocialLinks
  metaDescription: string
  privacyPolicy?: string
  siteInfo?: string
}

export type ContentState = {
  version: number
  books: Book[]
  reviews: Review[]
  genres: Genre[]
  series: Series[]
  settings: SiteSettings
}

/** A published review joined with its book and taxonomy, ready for display. */
export type ReviewView = {
  review: Review
  book: Book
  genres: Genre[]
  series?: Series
}

/** Form state used by the review wizard. */
export type ReviewDraftInput = {
  reviewId?: string
  bookId?: string
  bookTitle: string
  author: string
  coverUrl?: string
  primaryGenreId: string
  extraGenreIds: string[]
  seriesId?: string
  seriesOrder?: number
  synopsis: string
  rating: number
  reviewTitle: string
  content: string
  excerpt: string
  closingThought: string
  bookTitleFont?: import('@/lib/reviewFonts').ReviewFontId
  authorFont?: import('@/lib/reviewFonts').ReviewFontId
  synopsisFont?: import('@/lib/reviewFonts').ReviewFontId
  reviewTitleFont?: import('@/lib/reviewFonts').ReviewFontId
  excerptFont?: import('@/lib/reviewFonts').ReviewFontId
  closingThoughtFont?: import('@/lib/reviewFonts').ReviewFontId
}
