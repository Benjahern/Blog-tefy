import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react'
import { useContent, usePublishedReviews } from '@/hooks/useContent'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { matchesQuery } from '@/lib/selectors'
import { PageHero } from '@/components/layout/PageHero'
import { ReviewGrid } from '@/components/reviews/ReviewCard'
import { EmptyState } from '@/components/ui/Decor'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { SelectField, inputClass } from '@/components/ui/Field'

const SORTS = { recientes: 'Más recientes', mejor: 'Mejor calificadas', antiguas: 'Más antiguas', titulo: 'Título A–Z' } as const
type SortKey = keyof typeof SORTS
const MIN_OPTIONS = ['0', '3', '3.5', '4', '4.5']

export function ReviewsPage() {
  useDocumentTitle('Reseñas')
  const { state } = useContent()
  const views = usePublishedReviews()
  const [params, setParams] = useSearchParams()
  const [panelOpen, setPanelOpen] = useState(false)

  const q = params.get('q') ?? ''
  const genre = params.get('genero') ?? ''
  const min = params.get('min') ?? '0'
  const serie = params.get('saga') ?? ''
  const sort = (params.get('orden') as SortKey) in SORTS ? (params.get('orden') as SortKey) : 'recientes'

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (!value || (key === 'min' && value === '0') || (key === 'orden' && value === 'recientes')) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }
  const reset = () => setParams(new URLSearchParams(), { replace: true })
  const activeCount = [q, genre, min !== '0' ? min : '', serie, sort !== 'recientes' ? sort : ''].filter(Boolean).length

  const results = useMemo(() => {
    const list = views.filter(
      (v) => matchesQuery(v, q) && (!genre || v.genres.some((g) => g.slug === genre)) && v.review.rating >= Number(min) && (!serie || v.series?.slug === serie),
    )
    const date = (v: (typeof list)[number]) => v.review.publishedAt ?? v.review.updatedAt
    const sorters: Record<SortKey, (a: (typeof list)[number], b: (typeof list)[number]) => number> = {
      recientes: (a, b) => date(b).localeCompare(date(a)),
      antiguas: (a, b) => date(a).localeCompare(date(b)),
      mejor: (a, b) => b.review.rating - a.review.rating,
      titulo: (a, b) => a.book.title.localeCompare(b.book.title, 'es'),
    }
    return [...list].sort(sorters[sort])
  }, [views, q, genre, min, serie, sort])

  const filters = (
    <>
      <SelectField label="Género" value={genre} onChange={(e) => update('genero', e.target.value)}>
        <option value="">Todos los géneros</option>
        {state.genres.map((g) => <option key={g.id} value={g.slug}>{g.name}</option>)}
      </SelectField>
      <SelectField label="Calificación mínima" value={min} onChange={(e) => update('min', e.target.value)}>
        {MIN_OPTIONS.map((m) => <option key={m} value={m}>{m === '0' ? 'Cualquiera' : `${m.replace('.', ',')} o más`}</option>)}
      </SelectField>
      <SelectField label="Saga" value={serie} onChange={(e) => update('saga', e.target.value)}>
        <option value="">Todas las sagas</option>
        {state.series.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
      </SelectField>
      <SelectField label="Ordenar por" value={sort} onChange={(e) => update('orden', e.target.value)}>
        {Object.entries(SORTS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </SelectField>
    </>
  )

  return (
    <>
      <PageHero eyebrow="Biblioteca personal" title="Explora las reseñas">
        Busca entre libros que me acompañaron, por género, por saga o por cuántos picaflores se ganaron. Cada historia tiene su rincón.
      </PageHero>
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="sticky top-[72px] z-20 -mx-5 border-b border-line/60 bg-night/90 px-5 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label htmlFor="catalog-q" className="mb-1.5 block text-sm font-medium text-ink">Buscar</label>
              <div className="relative">
                <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
                <input id="catalog-q" type="search" value={q} onChange={(e) => update('q', e.target.value)} placeholder="Título, autor, género o saga" className={`${inputClass} pl-10`} />
              </div>
            </div>
            <div className="hidden grid-cols-4 gap-3 lg:grid lg:w-[680px]">{filters}</div>
            <div className="flex gap-2 lg:hidden">
              <Button variant="secondary" onClick={() => setPanelOpen(true)} aria-haspopup="dialog">
                <SlidersHorizontal size={17} /> Filtros {activeCount > 0 && <span className="rounded-full bg-mist px-1.5 text-[12px] text-night">{activeCount}</span>}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[15px] text-ink-2" aria-live="polite">
            <span className="font-semibold text-ink">{results.length}</span> {results.length === 1 ? 'reseña encontrada' : 'reseñas encontradas'}
          </p>
          {activeCount > 0 && <Button variant="ghost" size="sm" onClick={reset}><RotateCcw size={15} /> Limpiar filtros</Button>}
        </div>

        <div className="mt-6">
          {views.length === 0 ? (
            <EmptyState title="Aún no hay reseñas" message="Cuando Nia publique su primera reseña, aparecerá aquí." />
          ) : results.length === 0 ? (
            <EmptyState title="Ninguna historia coincide" message="Prueba quitando algún filtro o buscando otro título, autor o saga." action={<Button variant="secondary" onClick={reset}><RotateCcw size={16} /> Limpiar filtros</Button>} />
          ) : (
            <ReviewGrid views={results} headingLevel={2} />
          )}
        </div>
      </div>

      <Dialog open={panelOpen} onClose={() => setPanelOpen(false)} title="Filtros" variant="drawer-right">
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">{filters}</div>
        <div className="flex gap-3 border-t border-line px-5 py-4">
          <Button variant="secondary" className="flex-1" onClick={reset}>Limpiar</Button>
          <Button className="flex-1" onClick={() => setPanelOpen(false)}>Ver {results.length}</Button>
        </div>
      </Dialog>
    </>
  )
}
