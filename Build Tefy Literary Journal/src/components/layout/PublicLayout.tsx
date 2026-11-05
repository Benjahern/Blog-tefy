import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Menu, Search, X } from 'lucide-react'
import { NiaLogo } from './NiaLogo'
import { SearchOverlay } from './SearchOverlay'
import { Footer } from './Footer'
import { IconButton } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { NAV_LINKS } from './nav'


export function PublicLayout() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setMenuOpen(false), [pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <a href="#contenido" className="fixed left-3 top-3 z-[70] -translate-y-24 rounded-lg bg-mist px-4 py-2 text-sm font-medium text-night focus:translate-y-0">Saltar al contenido</a>
      <header className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${scrolled ? 'border-b border-line/60 bg-night/80 backdrop-blur-xl' : 'border-b border-transparent bg-gradient-to-b from-night/70 to-transparent'}`}>
        <nav aria-label="Principal" className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8">
          <NiaLogo />
          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.end} className={({ isActive }) => `relative rounded-lg px-3.5 py-2 text-[14.5px] transition-colors duration-200 ${isActive ? 'text-ink after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-px after:bg-mist' : 'text-ink-2 hover:text-ink'}`}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setSearchOpen(true)} className="hidden h-10 items-center gap-2.5 rounded-[10px] border border-line/80 bg-night/40 px-3.5 text-[14px] text-ink-3 transition-colors hover:border-[#3a5c6b] hover:text-ink md:inline-flex" aria-label="Buscar libros">
              <Search size={16} /> Buscar <kbd className="ml-3 rounded border border-line px-1.5 text-[11px] text-ink-3">⌘K</kbd>
            </button>
            <IconButton label="Buscar libros" className="md:hidden" onClick={() => setSearchOpen(true)}><Search size={20} /></IconButton>
            <IconButton label="Abrir menú" className="md:hidden" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={22} /></IconButton>
          </div>
        </nav>
      </header>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title="Menú" hideTitle variant="drawer-right">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <NiaLogo size="sm" />
          <IconButton label="Cerrar menú" onClick={() => setMenuOpen(false)}><X size={22} /></IconButton>
        </div>
        <nav aria-label="Menú móvil" className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `block rounded-xl px-4 py-3.5 font-serif text-2xl transition-colors ${isActive ? 'bg-surface text-ink' : 'text-ink-2 hover:bg-surface-hover hover:text-ink'}`}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-line px-5 py-5 text-[13px] text-ink-3">
          <Link to="/admin" onClick={() => setMenuOpen(false)} className="hover:text-ink">Cuaderno de Nia (administración)</Link>
        </div>
      </Dialog>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
