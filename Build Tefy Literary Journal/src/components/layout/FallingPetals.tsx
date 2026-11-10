import type { CSSProperties } from 'react'

const petals = Array.from({ length: 12 }, (_, index) => ({
  left: `${(index * 37 + 9) % 100}%`,
  delay: `${(index % 5) * 0.28}s`,
  duration: `${6.5 + (index % 4) * 0.8}s`,
  drift: `${index % 2 ? 36 : -36}px`,
  glyph: index % 3 === 0 ? '❀' : '✿',
}))

/** Brief, purely decorative flower fall on entry to the public site. */
export function FallingPetals() {
  return (
    <div className="falling-petals" aria-hidden="true">
      {petals.map((petal) => (
        <span key={petal.left} className="falling-petal" style={{ left: petal.left, animationDelay: petal.delay, animationDuration: petal.duration, '--petal-drift': petal.drift } as CSSProperties}>
          {petal.glyph}
        </span>
      ))}
    </div>
  )
}
