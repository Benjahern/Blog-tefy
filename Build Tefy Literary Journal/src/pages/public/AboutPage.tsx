import { AtSign, BookOpen, Globe, Mail, Music2 } from 'lucide-react'
import { useContent, usePublishedReviews } from '@/hooks/useContent'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { defaultImages } from '@/data/images'
import { BotanicalDivider, Eyebrow } from '@/components/ui/Decor'
import { ButtonLink } from '@/components/ui/Button'
import { HummingbirdRating } from '@/components/rating/HummingbirdRating'

export function AboutPage() {
  useDocumentTitle('Sobre Nia')
  const { state } = useContent()
  const s = state.settings
  const views = usePublishedReviews()
  const genres = new Set(views.flatMap((v) => v.genres.map((g) => g.id))).size
  const links = [
    { href: s.social.instagram, label: 'Instagram', Icon: AtSign },
    { href: s.social.tiktok, label: 'TikTok', Icon: Music2 },
    { href: s.social.goodreads, label: 'Goodreads', Icon: BookOpen },
    { href: s.social.website, label: 'Sitio web', Icon: Globe },
    { href: s.contactEmail ? `mailto:${s.contactEmail}` : undefined, label: s.contactEmail ?? '', Icon: Mail },
  ].filter((l) => l.href)

  return (
    <>
      <section className="relative isolate overflow-hidden pt-36 md:pt-44">
        <img src={s.heroImage || defaultImages.hero} alt="" className="absolute inset-0 -z-20 h-[70vh] w-full object-cover opacity-50" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[70vh] bg-gradient-to-b from-night/70 via-night/80 to-night" />
        <div className="mx-auto grid max-w-[1280px] items-end gap-12 px-5 sm:px-8 md:grid-cols-[1fr_0.8fr] md:gap-16">
          <div className="animate-enter">
            <Eyebrow>Sobre Nia</Eyebrow>
            <h1 className="mt-5 font-serif text-[clamp(2.6rem,6vw,4.6rem)] font-medium leading-[1] text-ink text-balance">{s.aboutTitle}</h1>
          </div>
          <img src={s.aboutImage || defaultImages.about} alt={`Fotografía de ${s.profileName}`} className="aspect-[4/5] w-full max-w-[420px] justify-self-center rounded-2xl object-cover saturate-[0.7] md:justify-self-end" />
        </div>
      </section>
      <div className="mx-auto mt-16 max-w-[720px] px-5 sm:px-8">
        <div className="tefy-prose">
          {s.aboutText.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <BotanicalDivider className="my-14" />
        <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
          {s.profileImage ? <img src={s.profileImage} alt={`Retrato de ${s.profileName}`} className="h-24 w-24 rounded-full object-cover" /> : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-line bg-surface font-serif text-4xl italic text-mist" aria-hidden="true">{s.profileName.charAt(0)}</div>
          )}
          <div>
            <p className="font-serif text-3xl font-semibold text-ink">{s.profileName}</p>
            <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{s.biography}</p>
            {links.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14.5px]">
                {links.map(({ href, label, Icon }) => (
                  <li key={label}><a href={href} target={href!.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer" className="inline-flex items-center gap-2 text-mist hover:text-ink"><Icon size={16} /> {label}</a></li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <dl className="mt-14 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-line bg-night-2/60 p-6"><dt className="text-[13px] text-ink-3">Reseñas publicadas</dt><dd className="mt-1 font-serif text-4xl text-ink">{views.length}</dd></div>
          <div className="rounded-2xl border border-line bg-night-2/60 p-6"><dt className="text-[13px] text-ink-3">Géneros explorados</dt><dd className="mt-1 font-serif text-4xl text-ink">{genres}</dd></div>
        </dl>
        <section className="mt-14 rounded-2xl border border-line bg-gradient-to-br from-surface to-night-2 p-7 sm:p-9">
          <h2 className="font-serif text-2xl font-semibold text-ink">¿Cómo califico?</h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">En lugar de estrellas, uso picaflores: pequeños, rápidos y fieles a las flores que les gustan. Cada libro recibe de 1 a 5, con décimas, porque a veces una historia es casi perfecta pero no del todo.</p>
          <div className="mt-6"><HummingbirdRating value={4.3} size="md" /></div>
        </section>
        <div className="mt-12 flex justify-center"><ButtonLink to="/resenas">Leer mis reseñas</ButtonLink></div>
      </div>
    </>
  )
}
