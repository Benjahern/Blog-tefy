import { useId, useRef, useState, type ReactNode } from 'react'
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import { fileToCompressedDataUrl, ImageError, MAX_UPLOAD_MB } from '@/lib/images'

type Props = {
  label: string
  value?: string
  onChange: (dataUrl: string | undefined) => void
  hint?: string
  aspect?: string
  maxSize?: number
  preview?: ReactNode
  fallback?: ReactNode
}

/** Drag-and-drop or click-to-pick image input with validation and instant preview. */
export function ImageUpload({ label, value, onChange, hint, aspect = 'aspect-[2/3]', maxSize = 1000, fallback }: Props) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const handle = async (file?: File) => {
    if (!file) return
    setError(undefined)
    setBusy(true)
    try {
      onChange(await fileToCompressedDataUrl(file, maxSize))
    } catch (e) {
      setError(e instanceof ImageError ? e.message : 'No pudimos subir la imagen. Inténtalo otra vez.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p id={`${id}-label`} className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void handle(e.dataTransfer.files[0]) }}
        className={`group relative overflow-hidden rounded-xl border border-dashed transition-colors duration-200 ${aspect} ${dragging ? 'border-mist bg-petrol/40' : 'border-line bg-night/50 hover:border-[#3d6273]'}`}
      >
        {value ? (
          <img src={value} alt={`Vista previa: ${label}`} className="h-full w-full object-cover" />
        ) : (
          fallback ?? null
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-describedby={`${id}-help`}
          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-sm transition-opacity duration-200 ${value ? 'bg-night/70 opacity-0 hover:opacity-100 focus-visible:opacity-100' : fallback ? 'bg-night/60 hover:bg-night/70' : ''}`}
        >
          {busy ? <LoaderCircle className="animate-spin text-mist" /> : <ImagePlus className="text-mist" />}
          <span className="font-medium text-ink">{value ? 'Cambiar imagen' : 'Arrastra una imagen o haz clic'}</span>
          <span className="text-xs text-ink-3">JPG, PNG o WEBP · hasta {MAX_UPLOAD_MB} MB</span>
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" aria-labelledby={`${id}-label`} tabIndex={-1} onChange={(e) => { void handle(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      <div className="mt-2 flex items-start justify-between gap-3">
        <p id={`${id}-help`} className={`text-[13px] ${error ? 'text-danger' : 'text-ink-3'}`} role={error ? 'alert' : undefined}>{error ?? hint}</p>
        {value && (
          <button type="button" onClick={() => onChange(undefined)} className="inline-flex shrink-0 items-center gap-1 text-[13px] text-ink-3 hover:text-danger">
            <Trash2 size={14} /> Quitar
          </button>
        )}
      </div>
    </div>
  )
}
