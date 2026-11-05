import { Link } from 'react-router'
import { AtSign, BookOpen, Globe, Mail, Music2 } from 'lucide-react'
import { useContent } from '@/hooks/useContent'
import { NiaLogo } from './NiaLogo'
import { NAV_LINKS } from './nav'

export function Footer() {
  const { state } = useContent()
  const s = state.settings
  const socials = [
    { href: s.social.instagram, label: 'Instagram', Icon: AtSign },
    { href: s.social.tiktok, label: 'TikTok', Icon: Music2 },
    { href: s.social.goodreads, label: 'Goodreads', Icon: BookOpen },
    { href: s.social.website, label: 'Sitio web', Icon: Globe },
    { href: s.contactEmail ? `mailto:${s.contactEmail}` : undefined, label: 'Correo', Icon: Mail },
  ].filter((x) => x.href)

  return (
    <footer className="relative mt-24 border-t border-line/70 bg-night">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <NiaLogo showTagline />
          <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-ink-3">{s.siteInfo}</p>
        </div>
        <nav aria-label="Pie de página">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.2em] text-sage">Explorar</h2>
          <ul className="mt-4 space-y-2.5 text-[14.5px]">
            {NAV_LINKS.map((l) => <li key={l.to}><Link to={l.to} className="text-ink-2 hover:text-ink">{l.label}</Link></li>)}
          </ul>
        </nav>
        <div>
          <h2 className="text-[12px] font-medium uppercase tracking-[0.2em] text-sage">Sígueme</h2>
          {socials.length ? (
            <ul className="mt-4 space-y-2.5 text-[14.5px]">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a href={href} target={href!.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer" className="inline-flex items-center gap-2 text-ink-2 hover:text-ink">
                    <Icon size={16} /> {label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[14px] text-ink-3">Pronto encontrarás aquí mis redes.</p>
          )}
        </div>
      </div>
      <div className="border-t border-line/50">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-5 py-5 text-[13px] text-ink-3 sm:px-8">
          <p>© {new Date().getFullYear()} {s.siteName}. Escrito con calma, entre árboles.</p>
          <div className="flex gap-5">
            {s.privacyPolicy && <Link to="/privacidad" className="hover:text-ink">Política de privacidad</Link>}
            <Link to="/admin" className="hover:text-ink">Cuaderno</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
