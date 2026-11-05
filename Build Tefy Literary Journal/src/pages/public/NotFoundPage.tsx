import { ArrowLeft } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { defaultImages } from '@/data/images'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function NotFoundPage({ message }: { message?: string }) {
  useDocumentTitle('Página no encontrada')
  return (
    <section className="relative isolate flex min-h-[80vh] items-center overflow-hidden">
      <img src={defaultImages.meadow} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-night/80 to-night" />
      <div className="mx-auto max-w-[640px] px-5 pt-24 text-center">
        <p className="font-serif text-[7rem] font-medium leading-none text-mist/70">404</p>
        <h1 className="mt-4 font-serif text-[clamp(2rem,5vw,3rem)] font-medium leading-tight text-ink">Este sendero se perdió entre la niebla.</h1>
        <p className="mt-4 text-[17px] text-ink-2">{message ?? 'La página que buscas no existe o cambió de lugar.'}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/"><ArrowLeft size={17} /> Volver al inicio</ButtonLink>
          <ButtonLink to="/resenas" variant="secondary">Ver reseñas</ButtonLink>
        </div>
      </div>
    </section>
  )
}
