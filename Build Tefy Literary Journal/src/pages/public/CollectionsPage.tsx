import { Link, useParams } from 'react-router'
import { useContent, usePublishedReviews } from '@/hooks/useContent'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { PageHero } from '@/components/layout/PageHero'
import { SeriesCard } from '@/components/books/SeriesCard'
import { BookCover } from '@/components/books/BookCover'
import { HummingbirdRating } from '@/components/rating/HummingbirdRating'
import { EmptyState } from '@/components/ui/Decor'
import { ButtonLink } from '@/components/ui/Button'
import { defaultImages } from '@/data/images'
import { NotFoundPage } from './NotFoundPage'
import { reviewFontFamily } from '@/lib/reviewFonts'
import { seriesKindLabel } from '@/types'

export function CollectionsPage() {
  useDocumentTitle('Colecciones')
  const { state } = useContent()
  const views = usePublishedReviews()
  const list = state.series.map((s) => ({ series: s, views: views.filter((v) => v.series?.id === s.id) })).filter((x) => x.views.length)
  return (
    <>
      <PageHero eyebrow="Libros relacionados" title="Colecciones y sagas" image={defaultImages.hero} position="50% 30%">
        Sagas, trilogías, bilogías y libros autoconclusivos, hilados para encontrar cada lectura en su lugar.
      </PageHero>
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {list.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((x) => <li key={x.series.id}><SeriesCard series={x.series} views={x.views} /></li>)}</ul>
        ) : (
          <EmptyState title="Aún no hay sagas" message="Cuando se publiquen reseñas de libros que forman parte de una saga, aparecerán aquí." />
        )}
      </div>
    </>
  )
}

export function CollectionDetailPage() {
  const { slug } = useParams()
  const { state } = useContent()
  const views = usePublishedReviews()
  const series = state.series.find((s) => s.slug === slug)
  useDocumentTitle(series?.name ?? 'Colección')
  if (!series) return <NotFoundPage message="Esta colección no existe." />
  const list = views.filter((v) => v.series?.id === series.id).sort((a, b) => (a.book.seriesOrder ?? 99) - (b.book.seriesOrder ?? 99))
  return (
    <>
      <PageHero eyebrow={seriesKindLabel(series.kind)} title={series.name} image={series.image || defaultImages.hero} position="50% 30%">{series.description}</PageHero>
      <div className="mx-auto max-w-[960px] px-5 sm:px-8">
        {list.length === 0 ? (
          <EmptyState title="Sin reseñas publicadas" message="Esta saga todavía no tiene reseñas publicadas." action={<ButtonLink to="/colecciones" variant="secondary">Ver colecciones</ButtonLink>} />
        ) : (
          <ol className="relative space-y-6 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-px before:bg-line sm:before:left-[35px]">
            {list.map((v) => (
              <li key={v.review.id} className="relative flex gap-5 sm:gap-8">
                <span className="z-10 mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line bg-night font-serif text-xl text-mist sm:h-[72px] sm:w-[72px] sm:text-2xl">{v.book.seriesOrder ?? '·'}</span>
                <Link to={`/resenas/${v.review.slug}`} className="group flex flex-1 gap-5 rounded-2xl border border-line bg-night-2/60 p-5 transition-[border-color,transform] duration-200 hover:-translate-y-[3px] hover:border-[#3d6475] sm:p-6">
                  <BookCover book={v.book} size="sm" className="w-[80px] shrink-0 sm:w-[100px]" />
                  <div className="min-w-0">
                    <h2 style={{ fontFamily: reviewFontFamily(v.book.titleFont) }} className="text-[1.7rem] font-semibold leading-tight text-ink">{v.book.title}</h2>
                    <p style={{ fontFamily: reviewFontFamily(v.book.authorFont) }} className="mt-1 text-[14px] text-ink-2">{v.book.author}</p>
                    <div className="mt-3"><HummingbirdRating value={v.review.rating} size="sm" /></div>
                    <p style={{ fontFamily: reviewFontFamily(v.review.excerptFont) }} className="mt-3 line-clamp-2 text-[14.5px] leading-relaxed text-ink-2">{v.review.excerpt}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  )
}
