import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRight, RotateCcw } from 'lucide-react'
import type { SiteSettings } from '@/types'
import { useContent } from '@/hooks/useContent'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { TextArea, TextField } from '@/components/ui/Field'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { useFeedback } from '@/components/ui/Feedback'
import { BookCover } from '@/components/books/BookCover'
import { publishedViews } from '@/lib/selectors'
import { defaultImages } from '@/data/images'

const SECTIONS = [
  ['identidad', 'Identidad de Nia'],
  ['apariencia', 'Apariencia'],
  ['perfil', 'Mi perfil'],
  ['destacado', 'Contenido destacado'],
  ['categorias', 'Categorías y colecciones'],
  ['general', 'Ajustes generales'],
] as const

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-24 rounded-2xl border border-line bg-night/60 p-5 sm:p-8">
      <h2 id={`${id}-t`} className="font-serif text-2xl font-medium text-ink">{title}</h2>
      {description && <p className="mt-1 text-[14px] text-ink-3">{description}</p>}
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  )
}

const urlError = (v?: string) => (v && !/^https?:\/\//i.test(v) ? 'Debe empezar con https://' : undefined)
const emailError = (v?: string) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Revisa el correo, parece incompleto.' : undefined)

export function SettingsPage() {
  const { state, updateSettings, setFeatured, resetDemo } = useContent()
  const { toast, confirm } = useFeedback()
  const [form, setForm] = useState<SiteSettings>(state.settings)
  const published = useMemo(() => publishedViews(state), [state])
  const initialFeatured = useMemo(() => state.reviews.filter((r) => r.featured).map((r) => r.id), [state.reviews])
  const [featured, setFeaturedIds] = useState<string[]>(initialFeatured)

  useEffect(() => { setForm(state.settings) }, [state.settings])
  useEffect(() => { setFeaturedIds(initialFeatured) }, [initialFeatured])

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setForm((f) => ({ ...f, [k]: v }))
  const setSocial = (k: keyof SiteSettings['social'], v: string) => setForm((f) => ({ ...f, social: { ...f.social, [k]: v.trim() || undefined } }))

  const dirty = JSON.stringify(form) !== JSON.stringify(state.settings) || featured.slice().sort().join() !== initialFeatured.slice().sort().join()
  const errors = {
    siteName: !form.siteName.trim() ? 'El sitio necesita un nombre.' : undefined,
    heroTitle: !form.heroTitle.trim() ? 'Escribe un título para la portada.' : undefined,
    email: emailError(form.contactEmail),
    instagram: urlError(form.social.instagram), tiktok: urlError(form.social.tiktok), goodreads: urlError(form.social.goodreads), website: urlError(form.social.website),
  }
  const hasErrors = Object.values(errors).some(Boolean)

  const saveAll = () => {
    if (hasErrors) { toast('Revisa los campos marcados en rojo.', 'error'); return }
    const ok = updateSettings({ ...form, siteName: form.siteName.trim() }) && setFeatured(featured)
    toast(ok ? 'Configuración guardada. Tu blog ya muestra los cambios.' : 'No pudimos guardar. Puede que las imágenes sean muy pesadas.', ok ? 'success' : 'error')
  }
  const cancel = () => { setForm(state.settings); setFeaturedIds(initialFeatured); toast('Cambios descartados.') }

  return (
    <AdminPage title="Configuración" subtitle="Personaliza cómo se ve y se presenta tu blog." narrow>
      <nav aria-label="Secciones" className="-mx-1 mb-6 flex gap-1 overflow-x-auto pb-1">
        {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} className="shrink-0 rounded-full border border-line px-3.5 py-1.5 text-[13px] text-ink-2 hover:border-[#3d6475] hover:text-ink">{label}</a>)}
      </nav>

      <div className="space-y-6 pb-28">
        <Section id="identidad" title="Identidad de Nia">
          <TextField label="Nombre del sitio" required value={form.siteName} error={errors.siteName} onChange={(e) => set('siteName', e.target.value)} />
          <TextField label="Frase de presentación" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
          <div className="grid gap-6 sm:grid-cols-2">
            <ImageUpload label="Logo" aspect="aspect-square" maxSize={256} value={form.logoImage} onChange={(v) => set('logoImage', v)} hint="Opcional. Si no subes uno, usamos el picaflor de Nia." />
            <ImageUpload label="Ícono de la pestaña (favicon)" aspect="aspect-square" maxSize={128} value={form.favicon} onChange={(v) => set('favicon', v)} hint="Una imagen cuadrada pequeña." />
          </div>
        </Section>

        <Section id="apariencia" title="Apariencia" description="La paleta Bosque de medianoche se mantiene para cuidar la lectura. Puedes cambiar imágenes y textos de portada.">
          <ImageUpload label="Imagen de portada" aspect="aspect-[16/9]" maxSize={1800} value={form.heroImage} onChange={(v) => set('heroImage', v)} hint="Las imágenes oscuras y azuladas funcionan mejor. Siempre agregamos un velo para que el texto se lea bien." fallback={<img src={defaultImages.hero} alt="" className="h-full w-full object-cover object-[50%_35%]" />} />
          <TextField label="Título de portada" required value={form.heroTitle} error={errors.heroTitle} onChange={(e) => set('heroTitle', e.target.value)} />
          <TextArea label="Texto de portada" value={form.heroDescription} onChange={(e) => set('heroDescription', e.target.value)} />
          <ImageUpload label="Imagen de “Sobre Nia”" aspect="aspect-[4/3]" value={form.aboutImage} onChange={(v) => set('aboutImage', v)} fallback={<img src={defaultImages.about} alt="" className="h-full w-full object-cover" />} />
          <TextField label="Título de “Sobre Nia”" value={form.aboutTitle} onChange={(e) => set('aboutTitle', e.target.value)} />
          <TextArea label="Texto de “Sobre Nia”" value={form.aboutText} onChange={(e) => set('aboutText', e.target.value)} hint="Deja una línea en blanco para separar párrafos." className="[&_textarea]:min-h-40" />
        </Section>

        <Section id="perfil" title="Mi perfil">
          <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
            <ImageUpload label="Foto de perfil" aspect="aspect-square" maxSize={500} value={form.profileImage} onChange={(v) => set('profileImage', v)} />
            <div className="space-y-6">
              <TextField label="Nombre" value={form.profileName} onChange={(e) => set('profileName', e.target.value)} />
              <TextArea label="Biografía corta" value={form.biography} onChange={(e) => set('biography', e.target.value)} />
            </div>
          </div>
          <TextField label="Correo de contacto" optional type="email" value={form.contactEmail ?? ''} error={errors.email} onChange={(e) => set('contactEmail', e.target.value.trim() || undefined)} placeholder="hola@ejemplo.cl" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Instagram" optional value={form.social.instagram ?? ''} error={errors.instagram} onChange={(e) => setSocial('instagram', e.target.value)} placeholder="https://instagram.com/…" />
            <TextField label="TikTok" optional value={form.social.tiktok ?? ''} error={errors.tiktok} onChange={(e) => setSocial('tiktok', e.target.value)} placeholder="https://tiktok.com/@…" />
            <TextField label="Goodreads" optional value={form.social.goodreads ?? ''} error={errors.goodreads} onChange={(e) => setSocial('goodreads', e.target.value)} placeholder="https://goodreads.com/…" />
            <TextField label="Otro sitio web" optional value={form.social.website ?? ''} error={errors.website} onChange={(e) => setSocial('website', e.target.value)} placeholder="https://…" />
          </div>
          <p className="text-[13px] text-ink-3">Solo aparecerán en el blog las redes que completes.</p>
        </Section>

        <Section id="destacado" title="Contenido destacado" description="Elige hasta 3 reseñas publicadas para la sección “Entre mis favoritas” de la portada. La primera elegida aparece en grande.">
          {published.length === 0 ? <p className="text-[14px] text-ink-3">Publica una reseña para poder destacarla.</p> : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {published.map((v) => {
                const on = featured.includes(v.review.id)
                const full = !on && featured.length >= 3
                return (
                  <li key={v.review.id}>
                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-mist ${on ? 'border-mist bg-mist/10' : 'border-line hover:border-[#3d6475]'} ${full ? 'opacity-50' : ''}`}>
                      <input type="checkbox" className="h-4 w-4 accent-[#91B8C9]" checked={on} disabled={full} onChange={() => setFeaturedIds(on ? featured.filter((x) => x !== v.review.id) : [...featured, v.review.id])} />
                      <BookCover book={v.book} size="xs" className="w-8 shrink-0" />
                      <span className="min-w-0 truncate text-[14px] text-ink">{v.book.title}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>

        <Section id="categorias" title="Categorías y colecciones">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/admin/categorias" className="flex items-center justify-between rounded-xl border border-line p-4 hover:border-[#3d6475]"><span><span className="block font-medium text-ink">Géneros</span><span className="text-[13px] text-ink-3">{state.genres.length} categorías</span></span><ArrowRight size={18} className="text-mist" /></Link>
            <Link to="/admin/colecciones" className="flex items-center justify-between rounded-xl border border-line p-4 hover:border-[#3d6475]"><span><span className="block font-medium text-ink">Sagas y colecciones</span><span className="text-[13px] text-ink-3">{state.series.length} sagas</span></span><ArrowRight size={18} className="text-mist" /></Link>
          </div>
        </Section>

        <Section id="general" title="Ajustes generales">
          <TextArea label="Descripción del sitio para buscadores" value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} maxLength={160} hint={`${form.metaDescription.length}/160 · Aparece en Google y al compartir enlaces.`} />
          <TextArea label="Información del sitio (pie de página)" value={form.siteInfo ?? ''} onChange={(e) => set('siteInfo', e.target.value)} />
          <TextArea label="Política de privacidad" optional value={form.privacyPolicy ?? ''} onChange={(e) => set('privacyPolicy', e.target.value || undefined)} hint="Si la completas, aparecerá un enlace en el pie de página." className="[&_textarea]:min-h-40" />
          <div className="rounded-xl border border-danger/30 p-4">
            <p className="text-[14px] font-medium text-ink">Restablecer la demostración</p>
            <p className="mt-1 text-[13px] text-ink-3">Vuelve al contenido de ejemplo original. Se borrarán las reseñas y ajustes guardados en este navegador.</p>
            <Button variant="danger" size="sm" className="mt-3" onClick={async () => {
              if (await confirm({ title: '¿Restablecer todo?', message: 'Perderás todas las reseñas y cambios que hiciste en esta demostración.', confirmLabel: 'Sí, restablecer', tone: 'danger' })) { resetDemo(); toast('Demostración restablecida.') }
            }}><RotateCcw size={15} /> Restablecer contenido</Button>
          </div>
        </Section>
      </div>

      <div className={`fixed inset-x-0 bottom-0 z-20 border-t border-line bg-night/95 backdrop-blur transition-transform duration-200 lg:left-[264px] ${dirty ? 'translate-y-0' : 'translate-y-full'}`} aria-hidden={!dirty}>
        <div className="mx-auto flex max-w-[860px] items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <p className="text-[14px] text-ink-2">Tienes cambios sin guardar</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={cancel} tabIndex={dirty ? 0 : -1}>Cancelar</Button>
            <Button onClick={saveAll} tabIndex={dirty ? 0 : -1}>Guardar</Button>
          </div>
        </div>
      </div>
    </AdminPage>
  )
}
