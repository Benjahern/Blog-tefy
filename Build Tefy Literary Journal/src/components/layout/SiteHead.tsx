import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useContent } from '@/hooks/useContent'
import { usePublishedReviews } from '@/hooks/useContent'

declare global {
  interface Window {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] }
    __APP_CONFIG__?: { siteUrl?: string; clarityId?: string }
  }
}

/** Keeps favicon and meta description in sync with admin settings; resets scroll on navigation. */
export function SiteHead() {
  const { state } = useContent()
  const { favicon, metaDescription } = state.settings
  const { pathname } = useLocation()
  const reviews = usePublishedReviews()
  const review = pathname.startsWith('/resenas/') ? reviews.find((item) => `/resenas/${item.review.slug}` === pathname) : undefined
  const description = review?.review.excerpt || metaDescription
  const title = review ? `${review.book.title} — reseña | Nia` : pathname === '/' ? 'Nia — reseñas literarias' : `${pathname.split('/').filter(Boolean).at(-1)?.split('-').join(' ') || 'Nia'} | Nia`
  const configuredSiteUrl = window.__APP_CONFIG__?.siteUrl
  const siteUrl = (configuredSiteUrl && !configuredSiteUrl.startsWith('$') ? configuredSiteUrl : window.location.origin).replace(/\/+$/, '')
  const canonical = `${siteUrl}${pathname}`
  const configuredClarityId = window.__APP_CONFIG__?.clarityId?.trim()
  const clarityId = configuredClarityId && !configuredClarityId.startsWith('$') ? configuredClarityId : ''
  const noIndex = pathname === '/admin' || pathname.startsWith('/admin/')

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  useEffect(() => {
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      window.clarity?.('consent', false)
      return
    }
    if (!clarityId) return
    if (window.clarity) {
      window.clarity('consent', true)
      return
    }
    const clarity = ((...args: unknown[]) => { clarity.q?.push(args) }) as NonNullable<Window['clarity']>
    clarity.q = []
    window.clarity = clarity
    const script = document.createElement('script')
    script.id = 'clarity-tag'
    script.async = true
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(clarityId)}`
    document.head.appendChild(script)
    window.clarity('consent', true)
  }, [clarityId, pathname])

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
    link.href = favicon || `${import.meta.env.BASE_URL}favicon.svg`
  }, [favicon])

  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta) }
    meta.content = metaDescription
  }, [metaDescription])

  useEffect(() => {
    document.title = title
    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector)
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.appendChild(element) }
      element.content = content
    }
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[name="robots"]', 'name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMeta('meta[property="og:type"]', 'property', 'og:type', review ? 'article' : 'website')
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = canonical
    let structured = document.head.querySelector<HTMLScriptElement>('#page-structured-data')
    if (review) {
      if (!structured) { structured = document.createElement('script'); structured.id = 'page-structured-data'; structured.type = 'application/ld+json'; document.head.appendChild(structured) }
      const data = { '@context': 'https://schema.org', '@type': 'Review', name: title, reviewBody: review.review.content.replace(/<[^>]*>/g, ' ').slice(0, 5000), datePublished: review.review.publishedAt, url: canonical, author: { '@type': 'Person', name: state.settings.profileName || 'Nia' }, itemReviewed: { '@type': 'Book', name: review.book.title, author: { '@type': 'Person', name: review.book.author } }, reviewRating: { '@type': 'Rating', ratingValue: review.review.rating, bestRating: 5 } }
      structured.textContent = JSON.stringify(data).replace(/</g, '\\u003c')
    } else structured?.remove()
  }, [canonical, description, noIndex, review, state.settings.profileName, title])

  return null
}
