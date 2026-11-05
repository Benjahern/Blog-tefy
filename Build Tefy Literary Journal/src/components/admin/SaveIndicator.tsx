import { CircleAlert, Check, CloudOff, LoaderCircle } from 'lucide-react'

export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'local' | 'error'

export function SaveIndicator({ state }: { state: SaveState }) {
  const map: Record<SaveState, { text: string; Icon: typeof Check; cls: string }> = {
    idle: { text: 'Cambios pendientes', Icon: CloudOff, cls: 'text-ink-3' },
    pending: { text: 'Cambios sin guardar…', Icon: LoaderCircle, cls: 'text-ink-3' },
    saving: { text: 'Guardando...', Icon: LoaderCircle, cls: 'text-ink-2' },
    saved: { text: 'Guardado', Icon: Check, cls: 'text-sage' },
    local: { text: 'Borrador pendiente guardado en el servidor', Icon: Check, cls: 'text-warm' },
    error: { text: 'Error al guardar', Icon: CircleAlert, cls: 'text-danger' },
  }
  const { text, Icon, cls } = map[state]
  return (
    <p role="status" aria-live="polite" className={`inline-flex items-center gap-1.5 text-[13px] ${cls}`}>
      <Icon size={15} className={state === 'saving' ? 'animate-spin' : ''} /> {text}
    </p>
  )
}
