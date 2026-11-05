import type { ReactNode } from 'react'
import { Eyebrow } from '@/components/ui/Decor'
import { defaultImages } from '@/data/images'

/** Quiet atmospheric header for inner public pages. */
export function PageHero({ eyebrow, title, children, image = defaultImages.meadow, position = '50% 60%' }: { eyebrow?: string; title: ReactNode; children?: ReactNode; image?: string; position?: string }) {
  return (
    <section className="relative isolate overflow-hidden pb-14 pt-36 md:pb-20 md:pt-44">
      <img src={image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45" style={{ objectPosition: position }} />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-night/80 via-night/75 to-night" />
      <div className="mx-auto max-w-[1280px] animate-enter px-5 sm:px-8">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-4 max-w-3xl font-serif text-[clamp(2.6rem,6.5vw,4.8rem)] font-medium leading-[1] text-ink text-balance">{title}</h1>
        {children && <div className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-ink-2">{children}</div>}
      </div>
    </section>
  )
}
