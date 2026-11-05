import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { clamp, formatRating, round1 } from '@/lib/format'
import { HUMMINGBIRD_PATHS } from './hummingbirdPath'

export type HummingbirdRatingProps = {
  value: number
  max?: 5
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (value: number) => void
  showValue?: boolean
  disabled?: boolean
  className?: string
}

const SIZES = { sm: 16, md: 22, lg: 46 }
const GAPS = { sm: 2, md: 3, lg: 8 }
export const MIN_RATING = 1
// Horizontal extent of the silhouette, so a 70% fill covers 70% of the visible bird.
const SIL_X = 1.2
const SIL_W = 27.6

/** Fill fraction for a bird at index i: clamp(value - i, 0, 1). */
export const birdFill = (value: number, index: number) => clamp(round1(value) - index, 0, 1)

function Bird({ fill, px, animate }: { fill: number; px: number; animate: boolean }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={px} height={px} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0 overflow-visible">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a8d4dc" />
          <stop offset="1" stopColor="#7fb3c4" />
        </linearGradient>
        <clipPath id={`c${id}`}>
          {/* Scale a full-size rect horizontally so the fill is exact and animatable. */}
          <rect
            x={SIL_X} y="0" width={SIL_W} height="32"
            style={{ transform: `scaleX(${fill})`, transformOrigin: `${SIL_X}px 0`, transition: animate ? 'transform 380ms cubic-bezier(.2,.7,.2,1)' : 'none' }}
          />
        </clipPath>
      </defs>
      <g fill="var(--bird-empty)">{HUMMINGBIRD_PATHS.map((d) => <path key={d} d={d} />)}</g>
      <g fill={`url(#g${id})`} clipPath={`url(#c${id})`}>{HUMMINGBIRD_PATHS.map((d) => <path key={d} d={d} />)}</g>
    </svg>
  )
}

export function HummingbirdRating({ value, max = 5, size = 'md', interactive = false, onChange, showValue = true, disabled = false, className = '' }: HummingbirdRatingProps) {
  const [hover, setHover] = useState<number | null>(null)
  const birdsRef = useRef<HTMLSpanElement>(null)
  const safe = clamp(round1(value || 0), 0, max)
  const shown = hover ?? safe
  const px = SIZES[size]
  const label = `Calificación de Nia: ${formatRating(safe)} de ${max}`

  const valueFromPointer = (e: PointerEvent) => {
    const birds = Array.from(birdsRef.current?.children ?? []) as HTMLElement[]
    for (let i = 0; i < birds.length; i++) {
      const r = birds[i].getBoundingClientRect()
      const next = birds[i + 1]?.getBoundingClientRect()
      const end = next ? (r.right + next.left) / 2 : Infinity
      if (e.clientX <= end) {
        const frac = clamp((e.clientX - r.left) / r.width, 0, 1)
        // Snap to one decimal, never below the minimum publishable rating.
        return clamp(round1(i + Math.max(0.1, Math.ceil(frac * 10) / 10)), MIN_RATING, max)
      }
    }
    return max
  }

  const set = (v: number) => onChange?.(clamp(round1(v), MIN_RATING, max))

  const onKeyDown = (e: KeyboardEvent) => {
    const steps: Record<string, number> = { ArrowRight: 0.1, ArrowUp: 0.1, ArrowLeft: -0.1, ArrowDown: -0.1, PageUp: 1, PageDown: -1 }
    if (e.key in steps) { e.preventDefault(); set(safe + steps[e.key]) }
    else if (e.key === 'Home') { e.preventDefault(); set(MIN_RATING) }
    else if (e.key === 'End') { e.preventDefault(); set(max) }
  }

  const birds = (
    <span ref={birdsRef} className="inline-flex items-center" style={{ gap: GAPS[size] }}>
      {Array.from({ length: max }, (_, i) => <Bird key={i} fill={birdFill(shown, i)} px={px} animate={hover === null} />)}
    </span>
  )

  const valueText = showValue && (
    <span className={`tabular-nums text-ink ${size === 'lg' ? 'font-serif text-4xl font-semibold' : size === 'md' ? 'text-[15px] font-semibold' : 'text-[13px] font-semibold'}`} aria-hidden="true">
      {formatRating(shown)} <span className="font-normal text-ink-3">/ {max}</span>
    </span>
  )

  if (!interactive) {
    return (
      <span role="img" aria-label={label} className={`inline-flex items-center gap-2.5 ${className}`}>
        {birds}
        {valueText}
      </span>
    )
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-4 ${className}`}>
      <span
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Calificación en picaflores"
        aria-valuemin={MIN_RATING}
        aria-valuemax={max}
        aria-valuenow={safe}
        aria-valuetext={`${formatRating(safe)} de ${max} picaflores`}
        aria-disabled={disabled}
        onKeyDown={disabled ? undefined : onKeyDown}
        onPointerMove={disabled ? undefined : (e) => setHover(valueFromPointer(e))}
        onPointerLeave={() => setHover(null)}
        onClick={disabled ? undefined : (e) => set(valueFromPointer(e as unknown as PointerEvent))}
        className={`cursor-pointer touch-none rounded-lg p-1.5 ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        {birds}
      </span>
      {valueText}
    </span>
  )
}
