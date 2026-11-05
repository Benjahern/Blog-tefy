import { useId, useState, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/** Hidden-by-default spoiler. Content is not rendered at all until revealed. */
export function SpoilerBlock({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <aside className="not-prose my-8 rounded-xl border border-dashed border-warm/45 bg-warm/[0.04] px-5 py-4 font-sans" aria-label="Spoiler">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-warm">
          <span className="font-semibold uppercase tracking-[0.14em] text-[12px]">Spoiler</span>
          <span className="ml-2 text-ink-2">{open ? 'Estás leyendo detalles importantes de la trama.' : 'Esta parte revela detalles de la trama.'}</span>
        </p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-warm/40 px-3 py-1.5 text-[13px] font-medium text-warm transition-colors hover:bg-warm/10"
        >
          {open ? <EyeOff size={15} /> : <Eye size={15} />}
          {open ? 'Ocultar spoiler' : 'Mostrar spoiler'}
        </button>
      </div>
      <div id={id} hidden={!open} className="tefy-prose mt-4 max-w-none" style={{ fontSize: 'inherit' }}>
        {open && children}
      </div>
    </aside>
  )
}
