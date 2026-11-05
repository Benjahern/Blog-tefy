import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { Dialog } from './Dialog'
import { Button } from './Button'

type Toast = { id: number; message: string; tone: 'success' | 'error' }
type ConfirmOptions = { title: string; message: string; confirmLabel: string; cancelLabel?: string; tone?: 'danger' | 'primary' }

type FeedbackApi = {
  toast: (message: string, tone?: Toast['tone']) => void
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackApi | null>(null)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pending, setPending] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<(v: boolean) => void>(undefined)

  const toast = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])

  const confirm = useCallback((opts: ConfirmOptions) => {
    setPending(opts)
    return new Promise<boolean>((resolve) => { resolver.current = resolve })
  }, [])

  const settle = (v: boolean) => {
    resolver.current?.(v)
    setPending(null)
  }

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <Dialog open={!!pending} onClose={() => settle(false)} title={pending?.title ?? ''}>
        <div className="px-5 py-5">
          <p className="text-[15px] leading-relaxed text-ink-2">{pending?.message}</p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => settle(false)} autoFocus>{pending?.cancelLabel ?? 'Cancelar'}</Button>
            <Button variant={pending?.tone === 'danger' ? 'danger' : 'primary'} onClick={() => settle(true)}>{pending?.confirmLabel}</Button>
          </div>
        </div>
      </Dialog>
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex max-w-md animate-enter items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-[0_18px_40px_-16px_rgba(0,0,0,0.8)]">
            {t.tone === 'success' ? <CircleCheck size={18} className="shrink-0 text-sage" /> : <CircleAlert size={18} className="shrink-0 text-danger" />}
            {t.message}
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback must be used inside FeedbackProvider')
  return ctx
}
