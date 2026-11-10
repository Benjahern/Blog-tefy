import { stripHtmlTags } from './text'

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Round to one decimal without floating point drift (e.g. 4.300000001 -> 4.3). */
export const round1 = (v: number) => Math.round((v + Number.EPSILON) * 10) / 10

export const formatRating = (v: number) => round1(v).toFixed(1).replace('.', ',')

export const formatDate = (iso?: string) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}

export const formatShortDate = (iso?: string) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

export const slugify = (s: string) =>
  trimHyphens(
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-'),
  ) || 'resena'

function trimHyphens(value: string): string {
  let start = 0
  let end = value.length
  while (value[start] === '-') start += 1
  while (end > start && value[end - 1] === '-') end -= 1
  return value.slice(start, end)
}

export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`

export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const readingMinutes = (html: string) => {
  const words = stripHtmlTags(html).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}
