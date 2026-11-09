import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, Check, ChevronDown, Lightbulb, Plus, Send } from 'lucide-react'
import type { Book, Review, ReviewDraftInput, ReviewView } from '@/types'
import { useContent } from '@/hooks/useContent'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useFeedback } from '@/components/ui/Feedback'
import { Button, ButtonLink } from '@/components/ui/Button'
import { SelectField, TextArea, TextField, inputClass } from '@/components/ui/Field'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { BookCover } from '@/components/books/BookCover'
import { RatingEditor } from '@/components/rating/RatingEditor'
import { HummingbirdRating } from '@/components/rating/HummingbirdRating'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { ReviewFontSelect } from '@/components/admin/ReviewFontSelect'
import { SaveIndicator, type SaveState } from '@/components/admin/SaveIndicator'
import { ReviewArticle } from '@/components/reviews/ReviewArticle'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { autoExcerpt, hasText } from '@/lib/html'
import { reviewFontFamily } from '@/lib/reviewFonts'
import { defaultImages } from '@/data/images'
import { NotFoundPage } from '@/pages/public/NotFoundPage'

const STEPS = ['El libro', 'La calificación', 'Mi reseña', 'Revisar y publicar']
const csrf = () => decodeURIComponent(document.cookie.split('; ').find((c) => c.startsWith('nia_csrf='))?.split('=')[1] ?? '')
const workingCopy = (id: string, method: 'GET' | 'PUT' | 'DELETE', body?: unknown) => fetch(`/api/v1/admin/reviews/${encodeURIComponent(id)}/working-copy`, { method, credentials: 'include', headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' ? { 'X-CSRF-Token': csrf() } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })

const blank = (): ReviewDraftInput => ({ bookTitle: '', author: '', primaryGenreId: '', extraGenreIds: [], synopsis: '', rating: 4, reviewTitle: '', content: '', excerpt: '', closingThought: '' })

function fromExisting(review: Review, book: Book): ReviewDraftInput {
  return {
    reviewId: review.id, bookId: book.id, bookTitle: book.title, author: book.author, coverUrl: book.coverUrl,
    bookTitleFont: book.titleFont, authorFont: book.authorFont, synopsisFont: book.synopsisFont,
    primaryGenreId: book.genreIds[0] ?? '', extraGenreIds: book.genreIds.slice(1), seriesId: book.seriesId, seriesOrder: book.seriesOrder,
    synopsis: book.synopsis ?? '', rating: review.rating, reviewTitle: review.title ?? '', content: review.content, excerpt: review.excerpt, closingThought: review.closingThought ?? '',
    reviewTitleFont: review.titleFont, excerptFont: review.excerptFont, closingThoughtFont: review.closingThoughtFont,
  }
}

type Errors = Partial<Record<'bookTitle' | 'author' | 'primaryGenreId' | 'rating' | 'content', string>>

export function ReviewEditorPage() {
  const { id } = useParams()
  const { state } = useContent()
  const location = useLocation()
  const existing = id ? state.reviews.find((r) => r.id === id) : undefined
  const book = existing ? state.books.find((b) => b.id === existing.bookId) : undefined
  if (id && (!existing || !book)) return <NotFoundPage message="No encontramos esa reseña en tu cuaderno." />
  return <Wizard key={`${id ?? 'new'}-${location.key}`} initial={existing && book ? fromExisting(existing, book) : blank()} initialId={existing?.id} />
}

function Wizard({ initial, initialId }: { initial: ReviewDraftInput; initialId?: string }) {
  const { state, saveReview, addSeries } = useContent()
  const { toast, confirm } = useFeedback()
  const navigate = useNavigate()
  const editorLabel = useId()

  const [reviewId, setReviewId] = useState(initialId)
  const current = reviewId ? state.reviews.find((r) => r.id === reviewId) : undefined
  const isPublished = current?.status === 'published'

  const [form, setForm] = useState<ReviewDraftInput>(initial)
  const [recovered, setRecovered] = useState(false)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})
  const [save, setSave] = useState<SaveState>(initialId ? 'saved' : 'idle')
  const [done, setDone] = useState<null | 'published' | 'updated'>(null)
  const [newSeries, setNewSeries] = useState('')
  const dirty = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!initialId) return
    let alive = true
    void workingCopy(initialId, 'GET').then(async (r) => { if (!r.ok) return; const copy = await r.json(); if (alive && copy.form) { setForm({ ...initial, ...copy.form }); setStep(copy.wizardStep ?? 0); setRecovered(true); requestAnimationFrame(() => window.scrollTo(0, Number(copy.scrollPosition) || 0)) } }).catch(() => undefined)
    return () => { alive = false }
  }, [initialId])

  useDocumentTitle(initialId ? 'Editar reseña' : 'Nueva reseña')

  const patch = useCallback((p: Partial<ReviewDraftInput>) => {
    dirty.current = true
    setForm((f) => ({ ...f, ...p }))
  }, [])

  // Published changes are isolated in a server-side working copy until explicitly applied.
  useEffect(() => {
    if (!dirty.current || done) return
    setSave('pending')
    clearTimeout(timer.current)
    const t = setTimeout(() => {
      if (isPublished && reviewId) {
        void workingCopy(reviewId, 'PUT', { form, wizardStep: step, editorPosition: 0, scrollPosition: window.scrollY }).then((r) => setSave(r.ok ? 'saved' : 'error')).catch(() => setSave('error'))
        return
      }
      setSave('saving')
      const res = saveReview({ ...form, reviewId })
      if (res.ok && res.id) {
        setReviewId(res.id)
        dirty.current = false
        void workingCopy(res.id, 'PUT', { form, wizardStep: step, editorPosition: 0, scrollPosition: window.scrollY }).catch(() => undefined)
        // Keep the URL stable for later reopen without remounting the wizard.
        if (!reviewId) window.history.replaceState(window.history.state, '', window.location.pathname.replace(/nueva$/, `${res.id}/editar`))
        setTimeout(() => setSave('saved'), 350)
      } else setSave('error')
    }, 1100)
    timer.current = t
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, step, reviewId, isPublished])

  const validate = (s: number): Errors => {
    const e: Errors = {}
    if (s === 0 || s === 3) {
      if (!form.bookTitle.trim()) e.bookTitle = 'Escribe el título del libro.'
      if (!form.author.trim()) e.author = 'Escribe quién escribió el libro.'
      if (!form.primaryGenreId) e.primaryGenreId = 'Elige un género principal.'
    }
    if ((s === 1 || s === 3) && !(form.rating >= 1 && form.rating <= 5)) e.rating = 'La calificación debe estar entre 1,0 y 5,0.'
    if ((s === 2 || s === 3) && !hasText(form.content)) e.content = 'Escribe al menos unas líneas sobre el libro.'
    return e
  }

  const goTo = (s: number) => {
    setStep(s)
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
    requestAnimationFrame(() => headingRef.current?.focus())
  }
  const next = () => {
    const e = validate(step)
    setErrors(e)
    if (Object.keys(e).length) { toast('Revisa los campos marcados antes de continuar.', 'error'); return }
    goTo(Math.min(step + 1, 3))
  }

  const clearBuffer = () => {
    clearTimeout(timer.current)
    if (reviewId) void workingCopy(reviewId, 'DELETE').catch(() => undefined)
  }
  const canReach = (i: number) => Array.from({ length: i }, (_, s) => s).every((s) => Object.keys(validate(s)).length === 0)

  const saveDraft = async () => {
    if (isPublished) {
      const ok = await confirm({ title: '¿Pasar a borrador?', message: 'La reseña dejará de verse en el blog hasta que vuelvas a publicarla. Tus cambios se guardarán.', confirmLabel: 'Sí, pasar a borrador' })
      if (!ok) return
    }
    clearTimeout(timer.current)
    setSave('saving')
    const res = saveReview({ ...form, reviewId }, 'draft')
    if (res.ok) {
      setReviewId(res.id); if (res.id) void workingCopy(res.id, 'PUT', { form, wizardStep: step, editorPosition: 0, scrollPosition: window.scrollY }).catch(() => undefined); clearBuffer(); dirty.current = false
      setSave('saved'); toast('Borrador guardado. Puedes seguir cuando quieras.')
    } else { setSave('error'); toast('No pudimos guardar. Puede que el navegador no tenga espacio (prueba con imágenes más livianas).', 'error') }
  }

  const publish = async () => {
    const e = validate(3)
    setErrors(e)
    if (Object.keys(e).length) {
      toast('Falta completar algo antes de publicar.', 'error')
      goTo(e.bookTitle || e.author || e.primaryGenreId ? 0 : e.rating ? 1 : 2)
      return
    }
    const ok = await confirm(
      isPublished
        ? { title: '¿Guardar los cambios?', message: 'Los cambios se verán de inmediato en tu blog.', confirmLabel: 'Guardar cambios' }
        : { title: '¿Publicar esta reseña?', message: 'Tu reseña será visible para todas las personas que visiten Nia.', confirmLabel: 'Publicar reseña' },
    )
    if (!ok) return
    clearTimeout(timer.current)
    const res = saveReview({ ...form, reviewId }, 'published')
    if (!res.ok) { setSave('error'); toast('No pudimos guardar. Inténtalo de nuevo.', 'error'); return }
    setReviewId(res.id); clearBuffer(); dirty.current = false; setSave('saved')
    setDone(isPublished ? 'updated' : 'published')
    window.scrollTo({ top: 0 })
  }

  const previewView: ReviewView = useMemo(() => {
    const genreIds = [form.primaryGenreId, ...form.extraGenreIds.filter((g) => g !== form.primaryGenreId)].filter(Boolean)
    const now = new Date().toISOString()
    const b: Book = { id: form.bookId ?? 'preview', title: form.bookTitle || 'Título del libro', author: form.author || 'Autor', titleFont: form.bookTitleFont, authorFont: form.authorFont, synopsisFont: form.synopsisFont, coverUrl: form.coverUrl, synopsis: form.synopsis || undefined, genreIds, seriesId: form.seriesId, seriesOrder: form.seriesOrder }
    const r: Review = { id: reviewId ?? 'preview', bookId: b.id, slug: current?.slug ?? 'vista-previa', title: form.reviewTitle || undefined, titleFont: form.reviewTitleFont, excerptFont: form.excerptFont, closingThoughtFont: form.closingThoughtFont, excerpt: form.excerpt || autoExcerpt(form.content), content: form.content, closingThought: form.closingThought || undefined, rating: form.rating, status: 'published', featured: false, createdAt: now, updatedAt: now, publishedAt: current?.publishedAt ?? now }
    return { review: r, book: b, genres: genreIds.map((g) => state.genres.find((x) => x.id === g)!).filter(Boolean), series: state.series.find((s) => s.id === form.seriesId) }
  }, [form, state.genres, state.series, reviewId, current])

  if (done) {
    const slug = state.reviews.find((r) => r.id === reviewId)?.slug
    return (
      <div className="relative isolate flex min-h-[calc(100dvh-64px)] items-center justify-center overflow-hidden px-5 py-16 lg:min-h-dvh">
        <img src={defaultImages.meadow} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0a1821]/70 to-[#0a1821]" />
        <div className="max-w-lg animate-enter text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mist/15 text-mist"><Check size={30} /></div>
          <h1 className="mt-6 font-serif text-[clamp(2.2rem,5vw,3.2rem)] font-medium leading-tight text-ink">{done === 'published' ? '¡Tu reseña ya está en el bosque!' : 'Cambios guardados'}</h1>
          <p className="mt-3 text-[16px] text-ink-2">{done === 'published' ? `${form.bookTitle} ya se puede leer en tu blog.` : 'La versión publicada ya muestra tus cambios.'}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {slug && <ButtonLink to={`/resenas/${slug}`} size="lg">Ver mi reseña</ButtonLink>}
            <ButtonLink to="/admin/resenas" size="lg" variant="secondary">Volver a mis reseñas</ButtonLink>
          </div>
        </div>
      </div>
    )
  }

  const genres = state.genres
  const headings = ['¿Qué libro quieres reseñar?', '¿Cuántos picaflores se ganó esta historia?', 'Ahora cuéntanos tu historia con este libro.', 'Tu reseña está casi lista.']

  return (
    <div className="pb-32">
      {/* Progress + status */}
      <div className="border-b border-line bg-night/60">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link to="/admin/resenas" className="inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink"><ArrowLeft size={16} /> Mis reseñas</Link>
          <SaveIndicator state={save} />
        </div>
        <ol className="mx-auto grid max-w-[960px] grid-cols-4 gap-2 px-5 pb-5 sm:px-8" aria-label="Pasos">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button type="button" onClick={() => (i <= step || canReach(i) ? goTo(i) : next())} aria-current={i === step ? 'step' : undefined} className="group w-full text-left">
                <span className={`block h-1 rounded-full transition-colors ${i <= step ? 'bg-mist' : 'bg-line'}`} />
                <span className={`mt-2 block text-[12px] sm:text-[13px] ${i === step ? 'font-medium text-ink' : 'text-ink-3 group-hover:text-ink-2'}`}>
                  <span className="tabular-nums">{i + 1}.</span> <span className="hidden sm:inline">{label}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="mx-auto max-w-[960px] px-5 pt-10 sm:px-8">
        {recovered && step === 0 && (
          <p className="mb-6 rounded-xl border border-warm/30 bg-warm/[0.06] px-4 py-3 text-[14px] text-ink-2">Recuperamos cambios que no habías publicado todavía. Revisa y pulsa <strong className="text-ink">Guardar cambios</strong> para que se vean en el blog.</p>
        )}
        <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-sage">Paso {step + 1} de 4 · {STEPS[step]}</p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-serif text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.08] text-ink focus:outline-none">{headings[step]}</h1>

        {step === 0 && (
          <div className="mt-10 grid gap-10 md:grid-cols-[220px_1fr]">
            <div>
              <ImageUpload label="Portada del libro" value={form.coverUrl} onChange={(v) => patch({ coverUrl: v })} hint="Opcional, pero hace que tu reseña luzca mucho mejor." fallback={<BookCover book={{ title: form.bookTitle || 'Tu libro', author: form.author || 'Autor', coverUrl: undefined }} className="h-full w-full rounded-none shadow-none" />} />
            </div>
            <div className="space-y-6">
              <SelectField label="¿Ya reseñaste otro libro de este título?" optional value={form.bookId ?? ''} hint="Elige un libro ya registrado para no duplicarlo, o déjalo como libro nuevo." onChange={(e) => {
                const b = state.books.find((x) => x.id === e.target.value)
                if (!b) patch({ bookId: undefined })
                 else patch({ bookId: b.id, bookTitle: b.title, author: b.author, bookTitleFont: b.titleFont, authorFont: b.authorFont, synopsisFont: b.synopsisFont, coverUrl: b.coverUrl, primaryGenreId: b.genreIds[0] ?? '', extraGenreIds: b.genreIds.slice(1), seriesId: b.seriesId, seriesOrder: b.seriesOrder, synopsis: b.synopsis ?? '' })
              }}>
                <option value="">Es un libro nuevo</option>
                {[...state.books].sort((a, b) => a.title.localeCompare(b.title, 'es')).map((b) => <option key={b.id} value={b.id}>{b.title} — {b.author}</option>)}
              </SelectField>
              <div><TextField label="Título del libro" required value={form.bookTitle} error={errors.bookTitle} style={{ fontFamily: reviewFontFamily(form.bookTitleFont) }} onChange={(e) => patch({ bookTitle: e.target.value })} placeholder="Por ejemplo: Dune" /><ReviewFontSelect label="título del libro" value={form.bookTitleFont} onChange={(bookTitleFont) => patch({ bookTitleFont })} /></div>
              <div><TextField label="Autor o autora" required value={form.author} error={errors.author} style={{ fontFamily: reviewFontFamily(form.authorFont) }} onChange={(e) => patch({ author: e.target.value })} placeholder="Por ejemplo: Frank Herbert" /><ReviewFontSelect label="autor" value={form.authorFont} onChange={(authorFont) => patch({ authorFont })} /></div>
              <SelectField label="Género principal" required value={form.primaryGenreId} error={errors.primaryGenreId} onChange={(e) => patch({ primaryGenreId: e.target.value, extraGenreIds: form.extraGenreIds.filter((g) => g !== e.target.value) })}>
                <option value="">Elige un género…</option>
                {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </SelectField>
              <fieldset>
                <legend className="mb-2 flex items-baseline gap-2 text-sm font-medium text-ink">Otros géneros <span className="text-xs font-normal text-ink-3">opcional</span></legend>
                <div className="flex flex-wrap gap-2">
                  {genres.filter((g) => g.id !== form.primaryGenreId).map((g) => {
                    const on = form.extraGenreIds.includes(g.id)
                    return (
                      <label key={g.id} className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[13.5px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-mist ${on ? 'border-mist bg-mist/15 text-ink' : 'border-line text-ink-2 hover:border-[#3d6475]'}`}>
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => patch({ extraGenreIds: on ? form.extraGenreIds.filter((x) => x !== g.id) : [...form.extraGenreIds, g.id] })} />
                        {on && <Check size={13} className="mr-1 inline" />}{g.name}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <SelectField label="Saga o colección" optional value={form.seriesId ?? ''} onChange={(e) => patch({ seriesId: e.target.value || undefined })}>
                  <option value="">No pertenece a una saga</option>
                  {state.series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </SelectField>
                <TextField label="Número" optional type="number" min={1} value={form.seriesOrder ?? ''} disabled={!form.seriesId} onChange={(e) => patch({ seriesOrder: e.target.value ? Math.max(1, parseInt(e.target.value)) : undefined })} />
              </div>
              <div className="flex gap-2">
                <input aria-label="Nombre de una nueva saga" value={newSeries} onChange={(e) => setNewSeries(e.target.value)} placeholder="¿No está la saga? Escribe su nombre" className={inputClass} />
                <Button variant="secondary" disabled={!newSeries.trim()} onClick={() => {
                  const sid = addSeries(newSeries.trim())
                  if (sid) { patch({ seriesId: sid }); setNewSeries(''); toast('Saga creada y seleccionada.') }
                }}><Plus size={16} /> Crear</Button>
              </div>
              <div><TextArea label="Sinopsis del libro" optional value={form.synopsis} style={{ fontFamily: reviewFontFamily(form.synopsisFont) }} onChange={(e) => patch({ synopsis: e.target.value })} placeholder="Unas líneas sobre de qué trata el libro, sin spoilers." /><ReviewFontSelect label="sinopsis" value={form.synopsisFont} onChange={(synopsisFont) => patch({ synopsisFont })} /></div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-10 grid gap-10 md:grid-cols-[1fr_300px]">
            <div className="rounded-2xl border border-line bg-night-2/60 p-6 sm:p-10">
              <RatingEditor value={form.rating} onChange={(v) => patch({ rating: v })} />
              {errors.rating && <p className="mt-4 text-[13px] text-danger">{errors.rating}</p>}
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-ink-2">Así se verá en tu blog</p>
              <div inert className="pointer-events-none"><ReviewCard view={{ ...previewView, review: { ...previewView.review, excerpt: previewView.review.excerpt || 'Aquí aparecerá un pequeño adelanto de tu reseña.' } }} /></div>
              <div className="mt-4 rounded-xl border border-line px-4 py-3"><HummingbirdRating value={form.rating} size="sm" /></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-10 space-y-8">
            <details className="group rounded-2xl border border-line bg-night-2/50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[15px] text-ink-2">
                <span className="inline-flex items-center gap-2"><Lightbulb size={18} className="text-warm" /> ¿No sabes por dónde empezar? Algunas ideas</span>
                <ChevronDown size={18} className="transition-transform group-open:rotate-180" />
              </summary>
              <ul className="grid gap-2 px-5 pb-5 text-[15px] text-ink-2 sm:grid-cols-2">
                {['¿Qué fue lo que más te gustó?', '¿Qué te hicieron sentir los personajes?', '¿Qué cambiarías?', '¿A quién recomendarías este libro?'].map((q) => <li key={q} className="rounded-xl bg-night/50 px-4 py-3 font-serif text-lg italic text-sage">{q}</li>)}
              </ul>
              <p className="px-5 pb-5 text-[13px] text-ink-3">Son solo sugerencias. Puedes escribir libremente, como una carta o un ensayo.</p>
            </details>
            <div><TextField label="Título de tu reseña" optional value={form.reviewTitle} style={{ fontFamily: reviewFontFamily(form.reviewTitleFont) }} onChange={(e) => patch({ reviewTitle: e.target.value })} placeholder="Por ejemplo: La arena también recuerda" /><ReviewFontSelect label="título de la reseña" value={form.reviewTitleFont} onChange={(reviewTitleFont) => patch({ reviewTitleFont })} /></div>
            <div>
              <p id={editorLabel} className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-ink">Tu reseña <span className="text-xs font-normal text-warm">obligatorio</span></p>
              <RichTextEditor value={form.content} onChange={(html) => patch({ content: html })} resetKey={reviewId ?? 'new'} labelledBy={editorLabel} onError={(m) => toast(m, 'error')} />
              {errors.content && <p className="mt-2 text-[13px] text-danger" role="alert">{errors.content}</p>}
              <p className="mt-2 text-[13px] text-ink-3">Selecciona texto y pulsa “Spoiler” para ocultarlo a quienes no han leído el libro. Puedes agregar varias imágenes con el botón de imagen.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div><TextArea label="Resumen corto para las tarjetas" optional value={form.excerpt} style={{ fontFamily: reviewFontFamily(form.excerptFont) }} onChange={(e) => patch({ excerpt: e.target.value })} maxLength={240} placeholder={autoExcerpt(form.content) || 'Si lo dejas vacío, usaremos el comienzo de tu reseña (sin spoilers).'} hint={`${form.excerpt.length}/240 caracteres`} /><ReviewFontSelect label="resumen corto" value={form.excerptFont} onChange={(excerptFont) => patch({ excerptFont })} /></div>
              <div><TextArea label="Pensamiento final" optional value={form.closingThought} style={{ fontFamily: reviewFontFamily(form.closingThoughtFont) }} onChange={(e) => patch({ closingThought: e.target.value })} placeholder="Una frase para cerrar, junto a tu calificación final." /><ReviewFontSelect label="pensamiento final" value={form.closingThoughtFont} onChange={(closingThoughtFont) => patch({ closingThoughtFont })} /></div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-8">
            <p className="text-[15px] text-ink-2">Así la verán tus lectores. Si algo no te convence, vuelve a cualquier paso: nada de lo que escribiste se pierde.</p>
            <div className="mt-8 rounded-2xl border border-line bg-night p-5 sm:p-10">
              <ReviewArticle view={previewView} preview />
            </div>
            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => goTo(2)}><ArrowLeft size={16} /> Seguir editando</Button>
              {!isPublished && <Button variant="secondary" onClick={saveDraft}>Guardar borrador</Button>}
              <Button onClick={publish}><Send size={16} /> {isPublished ? 'Guardar cambios' : 'Publicar reseña'}</Button>
            </div>
          </div>
        )}
      </div>

      {/* Persistent wizard controls */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-night/95 backdrop-blur lg:left-[264px]">
        <div className="mx-auto flex max-w-[960px] items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Button variant="ghost" onClick={() => (step === 0 ? navigate('/admin/resenas') : goTo(step - 1))}><ArrowLeft size={16} /> {step === 0 ? 'Salir' : 'Atrás'}</Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={isPublished ? publish : saveDraft}>{isPublished ? 'Guardar cambios' : 'Guardar borrador'}</Button>
            {step < 3 ? <Button onClick={next}>Continuar <ArrowRight size={16} /></Button> : <Button onClick={publish} className="hidden sm:inline-flex"><Send size={16} /> {isPublished ? 'Guardar cambios' : 'Publicar'}</Button>}
          </div>
        </div>
      </div>
    </div>
  )
}
