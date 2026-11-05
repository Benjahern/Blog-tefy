import { Link } from 'react-router'
import { useContent } from '@/hooks/useContent'
import { HUMMINGBIRD_PATHS } from '@/components/rating/hummingbirdPath'

export function NiaMark({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <g fill="var(--mist-blue)">{HUMMINGBIRD_PATHS.map((d) => <path key={d} d={d} />)}</g>
    </svg>
  )
}

type Props = { size?: 'sm' | 'md' | 'lg'; to?: string; showTagline?: boolean; className?: string }

/** Wordmark: Cormorant "Nia" with a small hummingbird hovering beside the name. */
export function NiaLogo({ size = 'md', to = '/', showTagline = false, className = '' }: Props) {
  const { state } = useContent()
  const { siteName, tagline, logoImage } = state.settings
  const text = { sm: 'text-2xl', md: 'text-[30px]', lg: 'text-5xl' }[size]
  const mark = { sm: 15, md: 19, lg: 30 }[size]
  const content = (
    <span className={`inline-flex flex-col ${className}`}>
      <span className="inline-flex items-start gap-1.5">
        {logoImage ? (
          <img src={logoImage} alt="" className="mr-1 self-center rounded-md object-contain" style={{ height: mark * 1.8, width: mark * 1.8 }} />
        ) : null}
        <span className={`font-serif font-semibold italic leading-none tracking-tight text-ink ${text}`}>{siteName}</span>
        {!logoImage && <NiaMark size={mark} className="-mt-1 -ml-0.5 rotate-[-8deg]" />}
      </span>
      {showTagline && <span className="mt-2 text-[13px] text-ink-3">{tagline}</span>}
    </span>
  )
  return to ? (
    <Link to={to} aria-label={`${siteName}, inicio`} className="inline-flex rounded-md">
      {content}
    </Link>
  ) : content
}
