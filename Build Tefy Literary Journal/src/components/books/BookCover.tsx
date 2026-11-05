import type { Book } from '@/types'

const PALETTES = [
  ['#1c4554', '#0d2230', '#91b8c9'],
  ['#233f3a', '#0f201d', '#a3bdb0'],
  ['#2b3a52', '#121a2a', '#b6c4dd'],
  ['#3a3a4a', '#171722', '#c3b59d'],
  ['#1f3d4a', '#0a1820', '#c9dde3'],
  ['#34443c', '#141c17', '#d6cfb8'],
]

const hash = (s: string) => Array.from(s).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

type Props = { book: Pick<Book, 'title' | 'author' | 'coverUrl'>; className?: string; size?: 'xs' | 'sm' | 'md' | 'lg'; eager?: boolean }

/**
 * Shows the uploaded cover, or a designed typographic cover so no copyrighted artwork is invented.
 */
export function BookCover({ book, className = '', size = 'md', eager = false }: Props) {
  const base = `relative aspect-[2/3] overflow-hidden rounded-[6px] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04)] ${className}`
  if (book.coverUrl) {
    return (
      <div className={base}>
        <img src={book.coverUrl} alt={`Portada de ${book.title}`} loading={eager ? 'eager' : 'lazy'} decoding="async" className="h-full w-full object-cover" />
        <span className="pointer-events-none absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/35 to-transparent" />
      </div>
    )
  }
  const [a, b, ink] = PALETTES[hash(book.title) % PALETTES.length]
  const titleSize = { xs: 'text-[7px]', sm: 'text-[13px]', md: 'text-[clamp(17px,2vw,22px)]', lg: 'text-[clamp(22px,3vw,32px)]' }[size]
  const authorSize = { xs: 'hidden', sm: 'text-[7px]', md: 'text-[10px]', lg: 'text-[12px]' }[size]
  return (
    <div className={base} role="img" aria-label={`Portada ilustrativa de ${book.title}, de ${book.author}`} style={{ background: `linear-gradient(160deg, ${a}, ${b})` }}>
      <svg className="absolute inset-0 h-full w-full opacity-[0.22]" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 118 L12 96 L18 104 L28 82 L36 98 L46 74 L56 96 L64 86 L74 104 L84 88 L100 112 V150 H0Z" fill={ink} opacity="0.5" />
        <path d="M0 130 L10 114 L20 124 L32 106 L44 126 L58 110 L70 128 L84 112 L100 128 V150 H0Z" fill={ink} opacity="0.7" />
        <circle cx="74" cy="32" r="8" fill={ink} opacity="0.55" />
      </svg>
      <div className="absolute inset-[7%] flex flex-col justify-between border border-white/10 p-[8%]" style={{ color: ink }}>
        <span className={`font-serif font-semibold leading-[1.05] ${titleSize}`}>{book.title}</span>
        <span className={`font-sans uppercase tracking-[0.18em] opacity-80 ${authorSize}`}>{book.author}</span>
      </div>
      <span className="pointer-events-none absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/40 to-transparent" />
    </div>
  )
}
