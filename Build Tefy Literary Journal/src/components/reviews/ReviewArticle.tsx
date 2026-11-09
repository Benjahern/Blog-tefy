import { Link } from 'react-router'
import type { ReviewView } from '@/types'
import { BookCover } from '@/components/books/BookCover'
import { HummingbirdRating } from '@/components/rating/HummingbirdRating'
import { Chip, BotanicalDivider } from '@/components/ui/Decor'
import { formatDate, readingMinutes } from '@/lib/format'
import { ReviewContent } from './ReviewContent'
import { reviewFontFamily } from '@/lib/reviewFonts'

export type FontLevel = 'sm' | 'md' | 'lg'
export const FONT_SIZES: Record<FontLevel, string> = { sm: '16.5px', md: '18.5px', lg: '21px' }

/** Header + body of a review. Shared by the public detail page and the admin preview. */
export function ReviewArticle({ view, fontLevel = 'md', preview = false }: { view: ReviewView; fontLevel?: FontLevel; preview?: boolean }) {
  const { review, book, genres, series } = view
  const date = review.publishedAt ?? review.updatedAt
  const linkOr = (to: string, label: string) => (preview ? <span>{label}</span> : <Link to={to} className="hover:text-ink">{label}</Link>)
  return (
    <article>
      <header className="grid items-end gap-8 md:grid-cols-[minmax(0,260px)_1fr] md:gap-12">
        <BookCover book={book} size="lg" eager className="mx-auto w-[min(220px,60vw)] md:mx-0 md:w-full" />
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => <Chip key={g.id}>{linkOr(`/generos/${g.slug}`, g.name)}</Chip>)}
          </div>
          <h1 style={{ fontFamily: reviewFontFamily(book.titleFont) }} className="mt-5 text-[clamp(2.4rem,6vw,4.2rem)] font-semibold leading-[1.02] text-ink">{book.title}</h1>
          <p style={{ fontFamily: reviewFontFamily(book.authorFont) }} className="mt-3 text-lg text-ink-2">{book.author}</p>
          {series && (
            <p className="mt-2 text-[15px] text-ink-3">
              {linkOr(`/colecciones/${series.slug}`, series.name)}{book.seriesOrder ? ` · Libro ${book.seriesOrder}` : ''}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-5">
            <HummingbirdRating value={review.rating} size="md" />
            <p className="text-[14px] text-ink-3">
              {review.status === 'published' ? <time dateTime={date}>{formatDate(date)}</time> : 'Borrador sin publicar'} · {readingMinutes(review.content)} min de lectura
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-14 max-w-[720px] md:mt-20">
        {review.title && <p style={{ fontFamily: reviewFontFamily(review.titleFont) }} className="mb-8 text-[clamp(1.6rem,3.4vw,2.2rem)] italic leading-snug text-mist">{review.title}</p>}
        {book.synopsis && (
          <details className="group mb-10 rounded-xl border border-line bg-night-2/50 px-5 py-4 text-[15px]">
            <summary className="cursor-pointer list-none font-medium text-ink-2 marker:hidden">
              <span className="text-sage">Sinopsis del libro</span> <span className="text-ink-3 group-open:hidden">· mostrar</span>
            </summary>
            <p style={{ fontFamily: reviewFontFamily(book.synopsisFont) }} className="mt-3 leading-relaxed text-ink-2">{book.synopsis}</p>
          </details>
        )}
        <ReviewContent html={review.content} style={{ ['--prose-size' as string]: FONT_SIZES[fontLevel] }} />

        <BotanicalDivider className="my-14" />
        <section aria-labelledby="final-rating" className="rounded-2xl border border-line bg-gradient-to-br from-surface to-night-2 p-7 text-center sm:p-10">
          <h2 id="final-rating" className="text-[12px] font-medium uppercase tracking-[0.22em] text-sage">Calificación final</h2>
          <div className="mt-5 flex justify-center"><HummingbirdRating value={review.rating} size="lg" /></div>
          {review.closingThought && <p style={{ fontFamily: reviewFontFamily(review.closingThoughtFont) }} className="mx-auto mt-6 max-w-lg text-[1.45rem] italic leading-snug text-ink">“{review.closingThought}”</p>}
        </section>
      </div>
    </article>
  )
}
