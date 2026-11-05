import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import type { ReviewView } from '@/types'
import { BookCover } from '@/components/books/BookCover'
import { HummingbirdRating } from '@/components/rating/HummingbirdRating'

/** Standard review card used across the homepage, catalog, genre and collection pages. */
export function ReviewCard({ view, headingLevel = 3 }: { view: ReviewView; headingLevel?: 2 | 3 }) {
  const { review, book, genres } = view
  const H = `h${headingLevel}` as const
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line/70 bg-gradient-to-b from-surface/80 to-night-2/60 p-5 transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-[3px] hover:border-[#3a5f70] focus-within:border-[#3a5f70]">
      <div className="flex gap-5">
        <BookCover book={book} size="sm" className="w-[96px] shrink-0 transition-transform duration-200 group-hover:-rotate-1 sm:w-[108px]" />
        <div className="flex min-w-0 flex-1 flex-col">
          {genres[0] && <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sage">{genres[0].name}</p>}
          <H className="mt-2 font-serif text-[1.55rem] font-semibold leading-[1.1] text-ink">
            <Link to={`/resenas/${review.slug}`} className="after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none">
              {book.title}
            </Link>
          </H>
          <p className="mt-1 text-[14px] text-ink-2">{book.author}</p>
          <div className="mt-auto pt-4">
            <HummingbirdRating value={review.rating} size="sm" />
          </div>
        </div>
      </div>
      <p className="mt-5 line-clamp-3 text-[14.5px] leading-relaxed text-ink-2">{review.excerpt}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-mist transition-colors group-hover:text-ink">
        Leer reseña <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </article>
  )
}

export function ReviewGrid({ views, headingLevel }: { views: ReviewView[]; headingLevel?: 2 | 3 }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {views.map((v) => (
        <li key={v.review.id}><ReviewCard view={v} headingLevel={headingLevel} /></li>
      ))}
    </ul>
  )
}
