import type { ReactNode } from 'react'

/** Delicate botanical divider: a thin line with a small branch and blossom. */
export function BotanicalDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 text-sage/60 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-line" />
      <svg width="64" height="20" viewBox="0 0 64 20" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <path d="M4 10h56" />
        <path d="M22 10c3-5 7-6 10-5M30 10c2 4 6 5 9 4M14 10c2-3 5-4 7-3M42 10c-2-3-5-4-7-3" />
        <circle cx="32" cy="10" r="2.4" fill="var(--mist-blue)" stroke="none" opacity="0.8" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line" />
    </div>
  )
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-[12px] font-medium uppercase tracking-[0.22em] text-sage ${className}`}>{children}</p>
}

export function SectionHeading({ eyebrow, title, action, className = '' }: { eyebrow?: string; title: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div>
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] text-ink">{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ title, message, action, icon }: { title: string; message: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-night-2/40 px-6 py-14 text-center">
      <div className="mb-4 text-mist/70">{icon ?? <BlossomIcon />}</div>
      <h3 className="font-serif text-2xl font-medium text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-2">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function BlossomIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M20 38V22" stroke="var(--soft-sage)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M20 30c-4-1-7-4-7-8 4 0 7 3 7 8z" fill="var(--forest-green)" stroke="var(--soft-sage)" strokeWidth="1" />
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="20" cy="11" rx="3.6" ry="6.4" transform={`rotate(${r} 20 16)`} fill="var(--mist-blue)" opacity="0.75" />
      ))}
      <circle cx="20" cy="16" r="2.6" fill="var(--accent-warm)" />
    </svg>
  )
}

export function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full border border-line bg-night/50 px-2.5 py-1 text-[12px] font-medium text-sage ${className}`}>{children}</span>
}
