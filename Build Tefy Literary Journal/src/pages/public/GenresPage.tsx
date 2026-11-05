import { useParams } from 'react-router'
import { useContent, usePublishedReviews } from '@/hooks/useContent'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { PageHero } from '@/components/layout/PageHero'
import { GenreCard } from '@/components/books/GenreCard'
import { ReviewGrid } from '@/components/reviews/ReviewCard'
import { EmptyState } from '@/components/ui/Decor'
import { ButtonLink } from '@/components/ui/Button'
import { genreImages, defaultImages } from '@/data/images'
import { NotFoundPage } from './NotFoundPage'

export function GenresPage() {
  useDocumentTitle('Géneros')
  const { state } = useContent()
  const views = usePublishedReviews()
  return (
    <>
      <PageHero eyebrow="Mapas del bosque" title="Géneros literarios">Cada género es un sendero distinto. Elige uno y descubre las historias que viven ahí.</PageHero>
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {state.genres.map((g) => <li key={g.id}><GenreCard genre={g} count={views.filter((v) => v.genres.some((x) => x.id === g.id)).length} /></li>)}
        </ul>
      </div>
    </>
  )
}

export function GenreDetailPage() {
  const { slug } = useParams()
  const { state } = useContent()
  const views = usePublishedReviews()
  const genre = state.genres.find((g) => g.slug === slug)
  useDocumentTitle(genre?.name ?? 'Género')
  if (!genre) return <NotFoundPage message="Este género no existe." />
  const list = views.filter((v) => v.genres.some((g) => g.id === genre.id))
  return (
    <>
      <PageHero eyebrow="Género" title={genre.name} image={genre.image || genreImages[genre.slug] || defaultImages.meadow} position="50% 50%">
        {genre.description}
      </PageHero>
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <p className="mb-6 text-[15px] text-ink-2"><span className="font-semibold text-ink">{list.length}</span> {list.length === 1 ? 'reseña' : 'reseñas'} en este género</p>
        {list.length ? <ReviewGrid views={list} headingLevel={2} /> : <EmptyState title="Este sendero aún está vacío" message="Todavía no hay reseñas publicadas en este género." action={<ButtonLink to="/resenas" variant="secondary">Ver todas las reseñas</ButtonLink>} />}
      </div>
    </>
  )
}
