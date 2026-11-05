import { Link } from 'react-router'
import type { ReviewView, Series } from '@/types'
import { BookCover } from './BookCover'
import { formatRating } from '@/lib/format'

export function SeriesCard({ series, views }: { series: Series; views: ReviewView[] }) {
  const sorted = [...views].sort((a, b) => (a.book.seriesOrder ?? 0) - (b.book.seriesOrder ?? 0))
  const avg = views.reduce((s, v) => s + v.review.rating, 0) / (views.length || 1)
  return (
    <Link to={`/colecciones/${series.slug}`} className="group flex h-full flex-col rounded-2xl border border-line bg-gradient-to-b from-surface/70 to-night-2/50 p-6 transition-[border-color,transform] duration-200 hover:-translate-y-[3px] hover:border-[#3d6475]">
      <div className="flex h-[150px] items-end pl-2" aria-hidden="true">
        {sorted.slice(0, 3).map((v, i) => (
          <div key={v.review.id} className="-ml-6 first:ml-0 transition-transform duration-300 group-hover:-translate-y-1" style={{ transform: `rotate(${(i - 1) * 4}deg)`, zIndex: 3 - i }}>
            <BookCover book={v.book} size="sm" className="w-[88px]" />
          </div>
        ))}
      </div>
      <h3 className="mt-6 font-serif text-[1.75rem] font-semibold leading-tight text-ink">{series.name}</h3>
      {series.description && <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-ink-2">{series.description}</p>}
      <p className="mt-auto pt-5 text-[13px] text-ink-3">
        {views.length} {views.length === 1 ? 'libro reseñado' : 'libros reseñados'} · promedio {formatRating(avg)} / 5
      </p>
    </Link>
  )
}
