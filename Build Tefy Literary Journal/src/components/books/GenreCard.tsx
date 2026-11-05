import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import type { Genre } from '@/types'
import { genreImages, defaultImages } from '@/data/images'

export function GenreCard({ genre, count, tall = false }: { genre: Genre; count: number; tall?: boolean }) {
  const img = genre.image || genreImages[genre.slug] || defaultImages.meadow
  return (
    <Link to={`/generos/${genre.slug}`} className={`group relative isolate flex flex-col justify-end overflow-hidden rounded-2xl border border-line/70 p-4 sm:p-6 ${tall ? 'aspect-[4/5] lg:aspect-[4/3.2]' : 'aspect-[4/5] lg:aspect-[4/3.2]'}`}>
      <img src={img} alt="" loading="lazy" decoding="async" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-70 saturate-[0.55] transition-[opacity,transform] duration-500 group-hover:scale-[1.03] group-hover:opacity-90" />
      <div className="absolute inset-0 -z-10 bg-[#0b2a3a]/45 mix-blend-color" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/55 to-night/5" />
      <ArrowUpRight size={20} className="absolute right-4 top-4 text-ink-2 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden="true" />
      <p className="font-serif text-[clamp(1.4rem,2.6vw,2.1rem)] font-semibold leading-none text-ink">{genre.name}</p>
      <p className="mt-2 text-[13px] text-ink-2">{count} {count === 1 ? 'reseña' : 'reseñas'}</p>
      {genre.description && <p className="mt-2 hidden max-w-[34ch] text-[14px] leading-snug text-ink-2 sm:line-clamp-2">{genre.description}</p>}
    </Link>
  )
}
