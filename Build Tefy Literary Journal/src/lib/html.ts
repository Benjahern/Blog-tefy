import { isReviewFontId, reviewFontIdFromFace } from './reviewFonts'

/** Small allowlist sanitizer for review HTML. Runs in the browser via DOMParser. */
const ALLOWED = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'H2', 'H3', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'A', 'IMG', 'FIGURE', 'FIGCAPTION', 'DIV', 'SPAN', 'FONT'])
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'svg', 'SVG'])

const safeUrl = (url: string, forImage = false) => {
  const u = url.trim()
  if (forImage) return /^(https:\/\/|data:image\/(png|jpe?g|webp|gif);)/i.test(u) || u.startsWith('/') ? u : ''
  return /^(https?:\/\/|mailto:|\/)/i.test(u) ? u : ''
}

function clean(node: Node, doc: Document): Node[] {
  if (node.nodeType === Node.TEXT_NODE) return [doc.createTextNode(node.textContent ?? '')]
  if (node.nodeType !== Node.ELEMENT_NODE) return []
  const el = node as Element
  const tag = el.tagName.toUpperCase()
  if (DROP.has(tag)) return []
  const children = Array.from(el.childNodes).flatMap((c) => clean(c, doc))
  // Normalise legacy tags from contentEditable.
  const mapped = tag === 'B' ? 'STRONG' : tag === 'I' ? 'EM' : tag === 'H1' ? 'H2' : tag === 'H4' || tag === 'H5' || tag === 'H6' ? 'H3' : tag === 'FONT' ? 'SPAN' : tag
  if (!ALLOWED.has(mapped)) return children
  if (mapped === 'DIV' && !el.hasAttribute('data-spoiler')) {
    const p = doc.createElement('p')
    children.forEach((c) => p.appendChild(c))
    return [p]
  }
  const out = doc.createElement(mapped.toLowerCase())
  if (mapped === 'SPAN') {
    const fontId = tag === 'FONT' ? reviewFontIdFromFace(el.getAttribute('face') ?? '') : el.getAttribute('data-font') ?? ''
    if (isReviewFontId(fontId) && fontId !== 'default') out.setAttribute('data-font', fontId)
    else return children
  }
  if (mapped === 'A') {
    const href = safeUrl(el.getAttribute('href') ?? '')
    if (!href) return children
    out.setAttribute('href', href)
  }
  if (mapped === 'IMG') {
    const src = safeUrl(el.getAttribute('src') ?? '', true)
    if (!src) return []
    out.setAttribute('src', src)
    out.setAttribute('alt', el.getAttribute('alt') ?? '')
    return [out]
  }
  if (mapped === 'DIV') out.setAttribute('data-spoiler', 'true')
  children.forEach((c) => out.appendChild(c))
  return [out]
}

export function sanitizeHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return html
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const container = doc.createElement('div')
  Array.from(doc.body.childNodes)
    .flatMap((n) => clean(n, doc))
    .forEach((n) => container.appendChild(n))
  return container.innerHTML
}

/** Plain text without spoiler blocks — safe to use for previews and excerpts. */
export function textWithoutSpoilers(html: string): string {
  if (typeof DOMParser === 'undefined') return html.replace(/<[^>]+>/g, ' ')
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  doc.querySelectorAll('[data-spoiler], figcaption').forEach((n) => n.remove())
  doc.querySelectorAll('p, h2, h3, li, blockquote').forEach((n) => n.append(' '))
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

export function autoExcerpt(html: string, max = 180) {
  const text = textWithoutSpoilers(html)
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

export const hasText = (html: string) => textWithoutSpoilers(html).length > 0 || /data-spoiler/.test(html)
