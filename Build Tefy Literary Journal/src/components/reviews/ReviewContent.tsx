import { createElement, useMemo, type ReactNode } from 'react'
import { sanitizeHtml } from '@/lib/html'
import { SpoilerBlock } from './SpoilerBlock'
import { isReviewFontId } from '@/lib/reviewFonts'

const TAGS = new Set(['p', 'strong', 'em', 'u', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'figure', 'figcaption', 'br'])

function toReact(node: Node, key: string): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent
  if (node.nodeType !== Node.ELEMENT_NODE) return null
  const el = node as Element
  const tag = el.tagName.toLowerCase()
  const kids = Array.from(el.childNodes).map((c, i) => toReact(c, `${key}.${i}`))
  if (tag === 'div' && el.hasAttribute('data-spoiler')) return <SpoilerBlock key={key}>{kids}</SpoilerBlock>
  if (tag === 'img') return <img key={key} src={el.getAttribute('src') ?? ''} alt={el.getAttribute('alt') ?? ''} loading="lazy" decoding="async" />
  if (tag === 'a') {
    const href = el.getAttribute('href') ?? '#'
    const external = /^https?:/.test(href)
    return <a key={key} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{kids}</a>
  }
  if (tag === 'span') {
    const font = el.getAttribute('data-font')
    return <span key={key} {...(font && isReviewFontId(font) && font !== 'default' ? { 'data-font': font } : {})}>{kids}</span>
  }
  if (TAGS.has(tag)) return createElement(tag, { key }, tag === 'br' ? undefined : kids)
  return <span key={key}>{kids}</span>
}

/** Renders stored review HTML safely, swapping spoiler markers for interactive SpoilerBlocks. */
export function ReviewContent({ html, className = '', style }: { html: string; className?: string; style?: React.CSSProperties }) {
  const nodes = useMemo(() => {
    const doc = new DOMParser().parseFromString(`<body>${sanitizeHtml(html)}</body>`, 'text/html')
    return Array.from(doc.body.childNodes).map((n, i) => toReact(n, String(i)))
  }, [html])
  return <div className={`tefy-prose ${className}`} style={style}>{nodes}</div>
}
