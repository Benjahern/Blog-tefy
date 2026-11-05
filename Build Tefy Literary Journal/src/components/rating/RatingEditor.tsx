import { useEffect, useId, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { clamp, formatRating, round1 } from '@/lib/format'
import { HummingbirdRating, MIN_RATING } from './HummingbirdRating'

/** Large interactive rating with synchronized numeric field and ± controls (0.1 steps). */
export function RatingEditor({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId()
  const [text, setText] = useState(formatRating(value))
  useEffect(() => setText(formatRating(value)), [value])

  const commitText = (raw: string) => {
    const n = parseFloat(raw.replace(',', '.'))
    if (Number.isFinite(n)) onChange(clamp(round1(n), MIN_RATING, 5))
    else setText(formatRating(value))
  }
  const step = (d: number) => onChange(clamp(round1(value + d), MIN_RATING, 5))

  return (
    <div className="flex flex-col items-start gap-6">
      <HummingbirdRating value={value} interactive size="lg" onChange={onChange} />
      <div className="flex flex-wrap items-end gap-3">
        <button type="button" onClick={() => step(-0.1)} disabled={value <= MIN_RATING} aria-label="Bajar una décima" className="flex h-12 w-12 items-center justify-center rounded-xl border border-line text-ink hover:bg-surface-hover disabled:opacity-40">
          <Minus size={18} />
        </button>
        <div>
          <label htmlFor={id} className="mb-1 block text-xs font-medium text-ink-3">Nota exacta (1,0 a 5,0)</label>
          <input
            id={id}
            inputMode="decimal"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              const n = parseFloat(e.target.value.replace(',', '.'))
              if (Number.isFinite(n) && n >= MIN_RATING && n <= 5) onChange(round1(n))
            }}
            onBlur={(e) => commitText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') { e.preventDefault(); step(0.1) }
              if (e.key === 'ArrowDown') { e.preventDefault(); step(-0.1) }
              if (e.key === 'Enter') commitText((e.target as HTMLInputElement).value)
            }}
            className="h-12 w-28 rounded-xl border border-line bg-night/60 text-center font-serif text-2xl font-semibold tabular-nums text-ink focus:border-mist focus:outline-none"
          />
        </div>
        <button type="button" onClick={() => step(0.1)} disabled={value >= 5} aria-label="Subir una décima" className="flex h-12 w-12 items-center justify-center rounded-xl border border-line text-ink hover:bg-surface-hover disabled:opacity-40">
          <Plus size={18} />
        </button>
      </div>
      <p className="text-[13px] text-ink-3">Pasa el cursor sobre los picaflores y haz clic, usa las flechas del teclado o escribe la nota exacta.</p>
    </div>
  )
}
