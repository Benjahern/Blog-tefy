import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, Search, X } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { BookCover } from '@/components/books/BookCover'
import { usePublishedReviews } from '@/hooks/useContent'
import { matchesQuery } from '@/lib/selectors'
import { formatRating } from '@/lib/format'

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const views = usePublishedReviews()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => { if (open) { setQ(''); setActive(0) } }, [open])

  const results = useMemo(() => (q.trim() ? views.filter((v) => matchesQuery(v, q)).slice(0, 7) : []), [views, q])
  useEffect(() => setActive(0), [q])

  const go = (to: string) => { onClose(); navigate(to) }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (results[active]) go(`/resenas/${results[active].review.slug}`)
      else if (q.trim()) go(`/resenas?q=${encodeURIComponent(q.trim())}`)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Buscar en Nia" hideTitle variant="top">
      <div className="flex items-center gap-3 border-b border-line px-5">
        <Search size={20} className="shrink-0 text-mist" aria-hidden="true" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="search-results"
          aria-activedescendant={results[active] ? `sr-${results[active].review.id}` : undefined}
          aria-label="Buscar por título, autor, género o saga"
          placeholder="Busca por título, autor, género o saga…"
          className="h-16 flex-1 bg-transparent text-lg text-ink outline-none focus-visible:outline-none"
        />
        <button type="button" onClick={onClose} className="rounded-md border border-line px-2 py-1 text-xs text-ink-3 hover:text-ink" aria-label="Cerrar búsqueda">
          <span className="hidden sm:inline">Esc</span><X size={14} className="sm:hidden" />
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-2">
        {!q.trim() && (
          <p className="px-4 py-8 text-center text-[15px] text-ink-3">Escribe para buscar entre {views.length} reseñas publicadas.</p>
        )}
        {q.trim() && results.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="font-serif text-xl text-ink">No encontramos ese libro entre los árboles.</p>
            <p className="mt-1 text-[14px] text-ink-3">Prueba con otro título, autor o género.</p>
          </div>
        )}
        <ul id="search-results" role="listbox" aria-label="Resultados">
          {results.map((v, i) => (
            <li key={v.review.id} id={`sr-${v.review.id}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(`/resenas/${v.review.slug}`)}
                className={`flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-colors ${i === active ? 'bg-surface-hover' : ''}`}
              >
                <BookCover book={v.book} size="xs" className="w-10 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-lg font-semibold text-ink">{v.book.title}</span>
                  <span className="block truncate text-[13px] text-ink-3">{v.book.author}{v.series ? ` · ${v.series.name}` : ''}</span>
                </span>
                <span className="text-[13px] tabular-nums text-ink-2">{formatRating(v.review.rating)}</span>
              </button>
            </li>
          ))}
        </ul>
        {q.trim() && (
          <button type="button" onClick={() => go(`/resenas?q=${encodeURIComponent(q.trim())}`)} className="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-[14px] text-mist hover:bg-surface-hover">
            Ver todos los resultados en el catálogo <ArrowRight size={16} />
          </button>
        )}
      </div>
    </Dialog>
  )
}
