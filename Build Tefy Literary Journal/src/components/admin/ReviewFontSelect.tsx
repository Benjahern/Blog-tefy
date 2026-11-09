import { useId } from 'react'
import { REVIEW_FONTS, type ReviewFontId } from '@/lib/reviewFonts'

export function ReviewFontSelect({ label, value, onChange }: { label: string; value?: ReviewFontId; onChange: (font: ReviewFontId) => void }) {
  const id = useId()
  return (
    <label htmlFor={id} className="mt-2 flex items-center gap-2 text-xs text-ink-3">
      <span>Tipo de letra · {label}</span>
      <select id={id} aria-label={`Tipo de letra para ${label}`} value={value ?? 'default'} onChange={(e) => onChange(e.target.value as ReviewFontId)} className="max-w-52 rounded-lg border border-line bg-night px-2 py-1.5 text-xs text-ink">
        {REVIEW_FONTS.map((font) => <option key={font.id} value={font.id}>{font.label}</option>)}
      </select>
    </label>
  )
}
