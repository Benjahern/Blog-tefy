import { Link } from 'react-router'
import { ArrowRight, PenLine } from 'lucide-react'
import { useContent } from '@/hooks/useContent'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { allViews } from '@/lib/selectors'
import { formatDate, formatRating } from '@/lib/format'
import { BookCover } from '@/components/books/BookCover'
import type { ReviewView } from '@/types'

function MiniList({ title, views, empty, linkTo }: { title: string; views: ReviewView[]; empty: string; linkTo?: string }) {
  return (
    <section className="rounded-2xl border border-line bg-night/60 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-medium text-ink">{title}</h2>
        {linkTo && <Link to={linkTo} className="text-[13px] text-mist hover:text-ink">Ver todo</Link>}
      </div>
      {views.length === 0 ? (
        <p className="mt-4 text-[14px] text-ink-3">{empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-line/60">
          {views.map((v) => (
            <li key={v.review.id}>
              <Link to={`/admin/resenas/${v.review.id}/editar`} className="group flex items-center gap-4 py-3">
                <BookCover book={v.book} size="xs" className="w-10 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink group-hover:text-mist">{v.book.title}</span>
                  <span className="block text-[13px] text-ink-3">Editada el {formatDate(v.review.updatedAt)}</span>
                </span>
                <span className="text-[13px] tabular-nums text-ink-2">{formatRating(v.review.rating)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function DashboardPage() {
  useDocumentTitle('Inicio del cuaderno')
  const { state } = useContent()
  const views = allViews(state)
  const drafts = views.filter((v) => v.review.status === 'draft')
  const published = views.filter((v) => v.review.status === 'published')
  const genres = new Set(published.flatMap((v) => v.book.genreIds)).size
  const firstName = state.settings.profileName.split(' ')[0] || 'Nia'

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8 md:py-14">
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-petrol/50 via-surface to-night p-8 sm:p-12">
        <svg className="absolute -right-10 -top-6 h-64 w-64 text-mist/[0.07]" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M15.4 13.7C17.4 9.3 21.5 4.9 28.8 2.4 27.6 6.6 24.7 10.9 19.7 15.9Z M9.9 13.9C9.9 11.7 11.7 10.4 13.6 10.8 15.4 11.2 16.4 12.6 17.4 14.2L22.6 21.4C23.4 22.6 23.2 24 22 24.4 20.2 25 18 23.6 16.4 22 13.6 19.2 9.9 16.7 9.9 13.9Z" /></svg>
        <h1 className="font-serif text-[clamp(2.4rem,5vw,3.6rem)] font-medium leading-none text-ink">¡Hola, {firstName}!</h1>
        <p className="mt-3 text-lg text-ink-2">¿Qué historia quieres compartir hoy?</p>
        <Link to="/admin/resenas/nueva" className="mt-8 inline-flex h-14 items-center gap-2.5 rounded-xl bg-mist px-7 text-[17px] font-medium text-night shadow-[0_14px_40px_-16px_rgba(145,184,201,0.9)] transition-colors hover:bg-[#a9cad8]">
          <PenLine size={20} /> + Escribir una reseña
        </Link>
      </section>

      <dl className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        {[['Reseñas publicadas', published.length], ['Borradores', drafts.length], ['Géneros explorados', genres]].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-line bg-night/60 p-4 sm:p-6">
            <dt className="text-[12.5px] text-ink-3 sm:text-[13px]">{k}</dt>
            <dd className="mt-1 font-serif text-3xl text-ink sm:text-4xl">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <MiniList title="Borradores pendientes" views={drafts.slice(0, 4)} empty="No tienes borradores. ¡Todo está publicado!" linkTo="/admin/resenas?estado=draft" />
        <MiniList title="Editadas hace poco" views={views.slice(0, 4)} empty="Aún no has escrito nada." />
        <div className="lg:col-span-2">
          <MiniList title="Publicadas" views={published.slice(0, 5)} empty="Todavía no has publicado reseñas." linkTo="/admin/resenas?estado=published" />
        </div>
      </div>
      <Link to="/" className="mt-8 inline-flex items-center gap-1.5 text-[14px] text-mist hover:text-ink">Ver cómo luce mi blog <ArrowRight size={15} /></Link>
    </div>
  )
}
