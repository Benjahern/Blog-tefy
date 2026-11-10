import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, Link2, Share2 } from 'lucide-react'
import { useContent, usePublishedReviews } from '@/hooks/useContent'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useLocalPreference } from '@/hooks/useLocalPreference'
import { useFeedback } from '@/components/ui/Feedback'
import { ReviewArticle, type FontLevel } from '@/components/reviews/ReviewArticle'
import { ReviewGrid } from '@/components/reviews/ReviewCard'
import { ButtonLink } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/Decor'
import { NotFoundPage } from './NotFoundPage'

const LEVELS: readonly FontLevel[] = ['sm', 'md', 'lg']

function useReadingProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setP(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [])
  return p
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

export function ReviewDetailPage() {
  const { slug } = useParams()
  const { state } = useContent()
  const views = usePublishedReviews()
  const navigate = useNavigate()
  const view = views.find((v) => v.review.slug === slug || v.review.previousSlugs?.includes(slug ?? ''))
  useEffect(() => {
    if (view && slug !== view.review.slug) navigate(`/resenas/${view.review.slug}`, { replace: true })
  }, [view, slug, navigate])
  const [level, setLevel] = useLocalPreference<FontLevel>('tefy:font-size', 'md', LEVELS)
  const progress = useReadingProgress()
  const { toast } = useFeedback()
  useDocumentTitle(view ? `${view.book.title} — reseña` : 'Reseña no encontrada')

  if (!view) return <NotFoundPage message="Esta reseña no existe o todavía no ha sido publicada." />

  const related = views
    .filter((v) => v.review.id !== view.review.id)
    .map((v) => ({ v, score: (v.series && v.series.id === view.series?.id ? 3 : 0) + v.genres.filter((g) => view.genres.some((x) => x.id === g.id)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.v)

  const url = window.location.href
  const copy = async () => toast((await copyText(url)) ? 'Enlace copiado. ¡Compártelo con quien quieras!' : 'No pudimos copiar el enlace.', 'success')
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `${view.book.title} · ${state.settings.siteName}`, text: view.review.excerpt, url }) } catch { /* user cancelled */ }
    } else void copy()
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent" role="progressbar" aria-label="Progreso de lectura" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <div className="h-full origin-left bg-gradient-to-r from-sage to-mist" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-[620px] bg-gradient-to-b from-night-2 via-[#0a1c27] to-night" aria-hidden="true" />
        <div className="mx-auto max-w-[1100px] px-5 pt-28 sm:px-8 md:pt-36">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <Link to="/resenas" className="inline-flex items-center gap-2 text-[14px] text-ink-2 hover:text-ink"><ArrowLeft size={16} /> Volver a reseñas</Link>
            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label="Tamaño del texto" className="flex rounded-[10px] border border-line p-0.5">
                {LEVELS.map((l, i) => (
                  <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)} aria-label={['Texto pequeño', 'Texto mediano', 'Texto grande'][i]} className={`h-9 w-10 rounded-lg font-serif transition-colors ${level === l ? 'bg-surface-hover text-ink' : 'text-ink-3 hover:text-ink'}`} style={{ fontSize: [14, 17, 21][i] }}>
                    A
                  </button>
                ))}
              </div>
              <button type="button" onClick={share} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line px-3.5 text-[14px] text-ink-2 hover:bg-surface-hover hover:text-ink"><Share2 size={16} /> Compartir</button>
              <button type="button" onClick={copy} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line px-3.5 text-[14px] text-ink-2 hover:bg-surface-hover hover:text-ink"><Link2 size={16} /> Copiar enlace</button>
            </div>
          </div>
          <ReviewArticle view={view} fontLevel={level} />
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="relacionadas" className="mx-auto mt-24 max-w-[1280px] px-5 sm:px-8">
          <SectionHeading eyebrow="Si te gustó esta historia" title={<span id="relacionadas">Otras lecturas cercanas</span>} />
          <div className="mt-10"><ReviewGrid views={related} /></div>
        </section>
      )}
      <div className="mt-14 flex justify-center">
        <ButtonLink to="/resenas" variant="secondary">Explorar todas las reseñas <ArrowRight size={17} /></ButtonLink>
      </div>
    </>
  )
}
