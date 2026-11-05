import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { BookOpen, ExternalLink, House, Library, LogOut, Menu, PenLine, Settings, Tags, X } from 'lucide-react'
import { useAdminSession } from '@/hooks/useAdminSession'
import { NiaLogo } from '@/components/layout/NiaLogo'
import { IconButton, Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { defaultImages } from '@/data/images'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const LINKS = [
  { to: '/admin', label: 'Inicio', Icon: House, end: true },
  { to: '/admin/resenas', label: 'Mis reseñas', Icon: BookOpen, end: true },
  { to: '/admin/colecciones', label: 'Colecciones', Icon: Library },
  { to: '/admin/categorias', label: 'Categorías', Icon: Tags },
  { to: '/admin/configuracion', label: 'Configuración', Icon: Settings },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { leave } = useAdminSession()
  const navigate = useNavigate()
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-6 pt-7">
        <NiaLogo size="sm" to="/admin" />
        <p className="mt-1.5 text-[12px] text-ink-3">Mi cuaderno de reseñas</p>
      </div>
      <div className="px-4">
        <NavLink to="/admin/resenas/nueva" onClick={onNavigate} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-mist font-medium text-night shadow-[0_10px_30px_-14px_rgba(145,184,201,0.8)] transition-colors hover:bg-[#a9cad8]">
          <PenLine size={18} /> Nueva reseña
        </NavLink>
      </div>
      <nav aria-label="Administración" className="mt-6 flex-1 px-3">
        <ul className="space-y-0.5">
          {LINKS.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} onClick={onNavigate} className={({ isActive }) => `flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-[15px] transition-colors ${isActive ? 'bg-surface text-ink' : 'text-ink-2 hover:bg-surface-hover/60 hover:text-ink'}`}>
                <Icon size={18} className="opacity-80" /> {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-0.5 border-t border-line px-3 py-4">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-[15px] text-ink-2 hover:bg-surface-hover/60 hover:text-ink">
          <ExternalLink size={18} className="opacity-80" /> Ver mi blog
        </Link>
        <button type="button" onClick={() => { leave(); onNavigate?.(); navigate('/admin') }} className="flex w-full items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-[15px] text-ink-2 hover:bg-surface-hover/60 hover:text-ink">
          <LogOut size={18} className="opacity-80" /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}

function AdminEntry() {
  useDocumentTitle('Entrar al cuaderno')
  const { enter, error } = useAdminSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center px-5 py-16">
      <img src={defaultImages.meadow} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-50" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-night/70 via-night/80 to-night" />
      <main className="w-full max-w-[440px] animate-enter rounded-2xl border border-line bg-night-2/90 p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md sm:p-10">
        <NiaLogo size="lg" />
        <h1 className="mt-8 font-serif text-3xl font-medium text-ink">Bienvenida a tu cuaderno</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">Aquí escribes, guardas y publicas tus reseñas.</p>
        <form className="mt-7 space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { await enter(username, password) } finally { setBusy(false) } }}>
          <label className="block text-sm font-medium text-ink">Usuario<input required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-night px-4 py-3 text-ink" /></label>
          <label className="block text-sm font-medium text-ink">Contraseña<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-night px-4 py-3 text-ink" /></label>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'Conectando…' : 'Entrar a mi cuaderno'}</Button>
        </form>
        <Link to="/" className="mt-5 block text-center text-[14px] text-ink-3 hover:text-ink">Volver al blog</Link>
      </main>
    </div>
  )
}

export function AdminLayout() {
  const { active, loading } = useAdminSession()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  if (loading) return <div className="min-h-dvh bg-[#0a1821]" aria-busy="true" />
  if (!active) return <AdminEntry />
  return (
    <div className="min-h-dvh bg-[#0a1821] lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-night lg:block"><SidebarContent /></aside>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-night/95 px-4 backdrop-blur lg:hidden">
        <NiaLogo size="sm" to="/admin" />
        <div className="flex items-center gap-1">
          <Link to="/admin/resenas/nueva" className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-mist px-3 text-sm font-medium text-night"><PenLine size={16} /> Nueva</Link>
          <IconButton label="Abrir menú" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={22} /></IconButton>
        </div>
      </header>
      <Dialog open={open} onClose={() => setOpen(false)} title="Menú del cuaderno" hideTitle variant="drawer-left">
        <div className="absolute right-3 top-5"><IconButton label="Cerrar menú" onClick={() => setOpen(false)}><X size={20} /></IconButton></div>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </Dialog>
      <main id="contenido" className="min-w-0">
        <Outlet />
      </main>
    </div>
  )
}

export function AdminPage({ title, subtitle, actions, children, narrow = false }: { title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode; narrow?: boolean }) {
  useDocumentTitle(title)
  return (
    <div className={`mx-auto w-full px-5 py-8 sm:px-8 md:py-12 ${narrow ? 'max-w-[860px]' : 'max-w-[1120px]'}`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[clamp(2rem,4vw,2.8rem)] font-medium leading-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[15px] text-ink-2">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  )
}
