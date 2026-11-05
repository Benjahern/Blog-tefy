import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './Button'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  hideTitle?: boolean
  children: ReactNode
  className?: string
  variant?: 'center' | 'top' | 'drawer-right' | 'drawer-left'
}

/** Accessible modal built on the native <dialog> element (focus trap, Esc, inert background). */
export function Dialog({ open, onClose, title, hideTitle, children, className = '', variant = 'center' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  const placement = {
    center: 'm-auto w-[min(520px,calc(100vw-32px))] rounded-2xl',
    top: 'mx-auto mt-[8vh] w-[min(680px,calc(100vw-24px))] rounded-2xl',
    'drawer-right': 'ml-auto mr-0 my-0 h-dvh max-h-dvh w-[min(380px,90vw)] rounded-none',
    'drawer-left': 'mr-auto ml-0 my-0 h-dvh max-h-dvh w-[min(320px,86vw)] rounded-none',
  }[variant]

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => { e.preventDefault(); onClose() }}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
      className={`max-w-none border border-line bg-night-2 p-0 text-ink shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop:bg-transparent open:animate-enter ${placement} ${className}`}
    >
      {open && (
        <div className="flex h-full flex-col">
          {!hideTitle && (
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <h2 className="font-serif text-2xl font-semibold">{title}</h2>
              <IconButton label="Cerrar" onClick={onClose}><X size={20} /></IconButton>
            </div>
          )}
          {children}
        </div>
      )}
    </dialog>
  )
}
