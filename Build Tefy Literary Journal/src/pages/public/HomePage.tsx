import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useContent, usePublishedReviews } from '@/hooks/useContent'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { defaultImages } from '@/data/images'
import { ButtonLink } from '@/components/ui/Button'
import { BotanicalDivider, Eyebrow, SectionHeading, EmptyState } from '@/components/ui/Decor'
import { ReviewGrid } from '@/components/reviews/ReviewCard'
import { BookCover } from '@/components/books/BookCover'
import { HummingbirdRating } from '@/components/rating/HummingbirdRating'
import { GenreCard } from '@/components/books/GenreCard'
import { SeriesCard } from '@/components/books/SeriesCard'
import type { ReviewView } from '@/types'
import { reviewFontFamily } from '@/lib/reviewFonts'

export function HomePage() {
  useDocumentTitle()
  const { state } = useContent()
  const s = state.settings
  const views = usePublishedReviews()
  const latest = views.slice(0, 3)
  const featured = views.filter((v) => v.review.featured).slice(0, 3)
  const seriesWithReviews = state.series
    .map((se) => ({ series: se, views: views.filter((v) => v.series?.id === se.id) }))
    .filter((x) => x.views.length > 0)
    .slice(0, 3)

  return (
    <>
      {/* A — Hero */}
      <section className="relative isolate flex min-h-[86vh] items-end overflow-hidden">
        <img src={s.heroImage || defaultImages.hero} alt="" fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_35%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night via-night/75 to-night/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/30 to-night/40" />
        <div className="mx-auto w-full max-w-[1280px] px-5 pb-20 pt-40 sm:px-8 md:pb-28">
          <div className="max-w-[640px] animate-enter">
            <Eyebrow>{s.tagline}</Eyebrow>
            <h1 className="mt-6 font-serif text-[clamp(3rem,8vw,6.2rem)] font-medium leading-[0.95] tracking-[-0.01em] text-ink text-balance">
              {s.heroTitle}
            </h1>
            <p className="mt-7 max-w-[480px] text-[17px] leading-relaxed text-ink-2 sm:text-lg">{s.heroDescription}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink to="/resenas" size="lg">Explorar reseñas <ArrowRight size={18} /></ButtonLink>
              <ButtonLink to="/sobre-nia" size="lg" variant="secondary">Conoce a Nia</ButtonLink>
            </div>
          </div>
        </div>
        <p className="absolute bottom-8 right-8 hidden font-serif text-sm italic text-ink-3 lg:block" aria-hidden="true">
          {views.length} historias guardadas en el bosque
        </p>
      </section>

      {/* B — Latest */}
      <section aria-labelledby="ultimas" className="mx-auto max-w-[1280px] px-5 pt-20 sm:px-8 md:pt-28">
        <SectionHeading eyebrow="Recién escritas" title={<span id="ultimas">Últimas reseñas</span>} action={<Link to="/resenas" className="inline-flex items-center gap-1.5 text-[15px] text-mist hover:text-ink">Ver todas <ArrowRight size={16} /></Link>} />
        <div className="mt-10">
          {latest.length ? <ReviewGrid views={latest} /> : <EmptyState title="El bosque está en silencio" message="Todavía no hay reseñas publicadas. Vuelve pronto." />}
        </div>
      </section>

      {/* C — Favorites */}
      {featured.length > 0 && (
        <section aria-labelledby="favoritas" className="relative mt-28 overflow-hidden py-20 md:py-28">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-night via-[#0b1d28] to-night" />
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
            <SectionHeading eyebrow="Las que dejaron huella" title={<span id="favoritas">Entre mis favoritas</span>} />
            <FeaturedComposition views={featured} />
          </div>
        </section>
      )}

      {/* D — Genres */}
      <section aria-labelledby="mundos" className="mx-auto max-w-[1280px] px-5 pt-20 sm:px-8 md:pt-24">
        <SectionHeading eyebrow="Por género" title={<span id="mundos">Explora otros mundos</span>} action={<Link to="/generos" className="inline-flex items-center gap-1.5 text-[15px] text-mist hover:text-ink">Todos los géneros <ArrowRight size={16} /></Link>} />
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {state.genres.slice(0, 6).map((g, i) => (
            <li key={g.id}><GenreCard genre={g} count={views.filter((v) => v.genres.some((x) => x.id === g.id)).length} tall={i === 0 || i === 4} /></li>
          ))}
        </ul>
      </section>

      {/* E — Collections */}
      {seriesWithReviews.length > 0 && (
        <section aria-labelledby="sagas" className="mx-auto max-w-[1280px] px-5 pt-24 sm:px-8 md:pt-28">
          <SectionHeading eyebrow="Para leer en orden" title={<span id="sagas">Colecciones y sagas</span>} action={<Link to="/colecciones" className="inline-flex items-center gap-1.5 text-[15px] text-mist hover:text-ink">Ver colecciones <ArrowRight size={16} /></Link>} />
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {seriesWithReviews.map(({ series, views: sv }) => <li key={series.id}><SeriesCard series={series} views={sv} /></li>)}
          </ul>
        </section>
      )}

      {/* F — About */}
      <section aria-labelledby="sobre" className="mx-auto max-w-[1280px] px-5 pt-24 sm:px-8 md:pt-32">
        <div className="grid items-center gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="absolute -inset-3 -rotate-2 rounded-[20px] border border-line/70" aria-hidden="true" />
            <img src={s.aboutImage || defaultImages.about} alt={`Fotografía de ${s.profileName}`} loading="lazy" className="relative aspect-[4/5] w-full rounded-2xl object-cover saturate-[0.7] hue-rotate-[8deg]" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-night/60 to-transparent mix-blend-multiply" aria-hidden="true" />
          </div>
          <div>
            <Eyebrow>Sobre Nia</Eyebrow>
            <h2 id="sobre" className="mt-4 font-serif text-[clamp(2.2rem,4.5vw,3.4rem)] font-medium leading-[1.05] text-ink">{s.aboutTitle}</h2>
            <p className="mt-6 max-w-[56ch] text-[17px] leading-[1.8] text-ink-2">{s.aboutText.length > 320 ? s.aboutText.slice(0, 320).replace(/\s+\S*$/, '') + '…' : s.aboutText}</p>
            <ButtonLink to="/sobre-nia" variant="secondary" className="mt-8">Leer más sobre mí <ArrowUpRight size={17} /></ButtonLink>
          </div>
        </div>
      </section>

      {/* G — Closing invitation */}
      <section className="relative isolate mt-28 overflow-hidden">
        <img src={defaultImages.meadow} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_70%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-night via-night/55 to-night" />
        <div className="mx-auto flex max-w-[860px] flex-col items-center px-5 py-32 text-center md:py-44">
          <BotanicalDivider className="mb-10 w-48" />
          <p className="font-serif text-[clamp(2.2rem,5.5vw,4rem)] font-medium leading-[1.05] text-ink text-balance">Cada libro es un mundo esperando ser descubierto.</p>
          <ButtonLink to="/resenas" size="lg" className="mt-10">Descubrir historias <ArrowRight size={18} /></ButtonLink>
        </div>
      </section>
    </>
  )
}

function FeaturedComposition({ views }: { views: ReviewView[] }) {
  const [main, ...rest] = views
  return (
    <div className="mt-12 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
      <Link to={`/resenas/${main.review.slug}`} className="group relative grid overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-petrol/60 via-surface to-night-2 p-7 transition-colors duration-200 hover:border-[#3d6475] sm:grid-cols-[200px_1fr] sm:gap-8 sm:p-10">
        <BookCover book={main.book} size="md" className="w-[160px] transition-transform duration-300 group-hover:-translate-y-1 sm:w-full" />
        <div className="mt-6 flex flex-col sm:mt-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-sage">{main.genres.map((g) => g.name).join(' · ')}</p>
          <h3 style={{ fontFamily: reviewFontFamily(main.book.titleFont) }} className="mt-3 text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.02] text-ink">{main.book.title}</h3>
          <p style={{ fontFamily: reviewFontFamily(main.book.authorFont) }} className="mt-2 text-ink-2">{main.book.author}</p>
          {main.review.title && <p style={{ fontFamily: reviewFontFamily(main.review.titleFont) }} className="mt-6 text-xl italic text-mist">“{main.review.title}”</p>}
          <p style={{ fontFamily: reviewFontFamily(main.review.excerptFont) }} className="mt-4 line-clamp-4 text-[15px] leading-relaxed text-ink-2">{main.review.excerpt}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-7">
            <HummingbirdRating value={main.review.rating} size="md" />
            <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-mist group-hover:text-ink">Leer reseña <ArrowRight size={15} /></span>
          </div>
        </div>
      </Link>
      <div className="grid gap-5">
        {rest.map((v, i) => (
          <Link key={v.review.id} to={`/resenas/${v.review.slug}`} className={`group flex gap-6 rounded-2xl border border-line bg-night-2/60 p-6 transition-[border-color,transform] duration-200 hover:-translate-y-[3px] hover:border-[#3d6475] ${i === 1 ? 'lg:ml-10' : ''}`}>
            <BookCover book={v.book} size="sm" className="w-[86px] shrink-0" />
            <div className="min-w-0">
              <p style={{ fontFamily: reviewFontFamily(v.book.titleFont) }} className="text-[1.6rem] font-semibold leading-tight text-ink">{v.book.title}</p>
              <p style={{ fontFamily: reviewFontFamily(v.book.authorFont) }} className="mt-1 text-[14px] text-ink-2">{v.book.author}</p>
              <div className="mt-3"><HummingbirdRating value={v.review.rating} size="sm" /></div>
              <p style={{ fontFamily: reviewFontFamily(v.review.excerptFont) }} className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-ink-3">{v.review.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
