import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Copy, Eye, EyeOff, Pencil, PenLine, Search, Send, Trash2 } from 'lucide-react'
import { useContent } from '@/hooks/useContent'
import { allViews, matchesQuery } from '@/lib/selectors'
import { formatDate } from '@/lib/format'
import { AdminPage } from '@/components/admin/AdminLayout'
import { BookCover } from '@/components/books/BookCover'
import { HummingbirdRating } from '@/components/rating/HummingbirdRating'
import { ButtonLink, IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Decor'
import { Dialog } from '@/components/ui/Dialog'
import { inputClass } from '@/components/ui/Field'
import { useFeedback } from '@/components/ui/Feedback'
import { ReviewArticle } from '@/components/reviews/ReviewArticle'
import type { ReviewView } from '@/types'

const TABS = [
  { key: '', label: 'Todas' },
  { key: 'published', label: 'Publicadas' },
  { key: 'draft', label: 'Borradores' },
]

export function AdminReviewsPage() {
  const { state, setReviewStatus, duplicateReview, deleteReview } = useContent()
  const { toast, confirm } = useFeedback()
  const [params, setParams] = useSearchParams()
  const status = params.get('estado') ?? ''
  const [q, setQ] = useState('')
  const [preview, setPreview] = useState<ReviewView | null>(null)

  const views = useMemo(() => allViews(state), [state])
  const list = views.filter((v) => (!status || v.review.status === status) && matchesQuery(v, q))

  const togglePublish = async (v: ReviewView) => {
    const publishing = v.review.status === 'draft'
    const ok = await confirm(
      publishing
        ? { title: '¿Publicar esta reseña?', message: `“${v.book.title}” será visible en tu blog.`, confirmLabel: 'Publicar' }
        : { title: '¿Ocultar esta reseña?', message: `“${v.book.title}” dejará de verse en el blog y volverá a tus borradores.`, confirmLabel: 'Pasar a borrador' },
    )
    if (!ok) return
    toast(setReviewStatus(v.review.id, publishing ? 'published' : 'draft') ? (publishing ? 'Reseña publicada.' : 'La reseña volvió a borradores.') : 'No pudimos guardar el cambio.', 'success')
  }
  const remove = async (v: ReviewView) => {
    const ok = await confirm({ title: '¿Eliminar esta reseña?', message: `Vas a borrar tu reseña de “${v.book.title}”. Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar para siempre', tone: 'danger' })
    if (ok && deleteReview(v.review.id)) toast('Reseña eliminada.')
  }
  const duplicate = (v: ReviewView) => {
    if (duplicateReview(v.review.id).ok) toast(`Creamos una copia en borradores de “${v.book.title}”.`)
  }

  return (
    <AdminPage title="Mis reseñas" subtitle={`${views.length} en total · ${views.filter((v) => v.review.status === 'draft').length} borradores`} actions={<ButtonLink to="/admin/resenas/nueva"><PenLine size={17} /> Nueva reseña</ButtonLink>}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Filtrar por estado" className="flex rounded-[11px] border border-line p-1">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={status === t.key} onClick={() => setParams(t.key ? { estado: t.key } : {}, { replace: true })} className={`rounded-lg px-4 py-1.5 text-[14px] transition-colors ${status === t.key ? 'bg-surface-hover text-ink' : 'text-ink-3 hover:text-ink'}`}>{t.label}</button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input type="search" aria-label="Buscar en mis reseñas" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar libro o autor" className={`${inputClass} pl-9`} />
        </div>
      </div>

      <div className="mt-6">
        {views.length === 0 ? (
          <EmptyState title="Tu cuaderno está en blanco" message="Escribe tu primera reseña y aparecerá aquí." action={<ButtonLink to="/admin/resenas/nueva">Escribir una reseña</ButtonLink>} />
        ) : list.length === 0 ? (
          <EmptyState title="Nada por aquí" message="No hay reseñas que coincidan con esta búsqueda." />
        ) : (
          <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-night/60">
            {list.map((v) => (
              <li key={v.review.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <BookCover book={v.book} size="xs" className="w-12 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/admin/resenas/${v.review.id}/editar`} className="truncate font-serif text-xl font-semibold text-ink hover:text-mist">{v.book.title}</Link>
                      <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-medium ${v.review.status === 'published' ? 'bg-sage/15 text-sage' : 'bg-warm/15 text-warm'}`}>{v.review.status === 'published' ? 'Publicada' : 'Borrador'}</span>
                      {v.review.featured && <span className="rounded-full bg-mist/15 px-2 py-0.5 text-[11.5px] font-medium text-mist">Destacada</span>}
                    </div>
                    <p className="truncate text-[13.5px] text-ink-2">{v.book.author}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <HummingbirdRating value={v.review.rating} size="sm" />
                      <span className="text-[12.5px] text-ink-3">Editada el {formatDate(v.review.updatedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-0.5 sm:justify-end">
                  <Link to={`/admin/resenas/${v.review.id}/editar`} className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3 text-[14px] text-ink-2 hover:bg-surface-hover hover:text-ink"><Pencil size={16} /> Editar</Link>
                  <IconButton label="Vista previa" onClick={() => setPreview(v)}><Eye size={17} /></IconButton>
                  <IconButton label={v.review.status === 'draft' ? 'Publicar' : 'Pasar a borrador'} onClick={() => togglePublish(v)}>{v.review.status === 'draft' ? <Send size={17} /> : <EyeOff size={17} />}</IconButton>
                  <IconButton label="Duplicar" onClick={() => duplicate(v)}><Copy size={17} /></IconButton>
                  <IconButton label="Eliminar" className="hover:text-danger" onClick={() => remove(v)}><Trash2 size={17} /></IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!preview} onClose={() => setPreview(null)} title="Vista previa" variant="top" className="!w-[min(1000px,calc(100vw-24px))]">
        <div className="max-h-[78vh] overflow-y-auto bg-night p-5 sm:p-10">{preview && <ReviewArticle view={preview} preview />}</div>
      </Dialog>
    </AdminPage>
  )
}
