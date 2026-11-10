import { afterEach, describe, expect, it, vi } from 'vitest'
import { isValidOptionalEmail } from '../src/lib/email'
import { readingMinutes, slugify } from '../src/lib/format'
import { autoExcerpt, textWithoutSpoilers } from '../src/lib/html'
import { stripHtmlTags, trimTrailingSlashes, truncateAtWordBoundary } from '../src/lib/text'

describe('text utilities', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('strips complete tags in linear scans while preserving words and incomplete markup', () => {
    expect(stripHtmlTags('<p>uno</p><p>dos</p>')).toBe(' uno  dos ')
    expect(stripHtmlTags('visible <unfinished')).toBe('visible <unfinished')
    expect(readingMinutes('<p>una palabra</p><p>otra palabra</p>')).toBe(1)
  })

  it('truncates on word boundaries and removes trailing slashes', () => {
    expect(truncateAtWordBoundary('uno dos tres', 8)).toBe('uno dos')
    expect(truncateAtWordBoundary('extraordinario', 5)).toBe('extra')
    expect(trimTrailingSlashes('https://example.test///')).toBe('https://example.test')
    expect(trimTrailingSlashes('///')).toBe('')
  })

  it('creates readable slugs and spoiler-free excerpts', () => {
    expect(slugify('  La canción del mar!  ')).toBe('la-cancion-del-mar')
    expect(slugify('!!!')).toBe('resena')
    expect(textWithoutSpoilers('<p>Texto público</p><p data-spoiler>Secreto</p>')).toBe('Texto público')
    expect(autoExcerpt('<p>uno dos tres cuatro</p>', 8)).toBe('uno dos…')
  })

  it('uses the server-safe plain-text fallback when DOMParser is unavailable', () => {
    vi.stubGlobal('DOMParser', undefined)
    expect(textWithoutSpoilers('<p>Texto</p>   plano')).toBe('Texto plano')
  })

  it('validates optional email addresses without accepting malformed input', () => {
    expect(isValidOptionalEmail()).toBe(true)
    expect(isValidOptionalEmail('')).toBe(true)
    expect(isValidOptionalEmail(' nia@example.cl ')).toBe(true)
    expect(isValidOptionalEmail('nia@@example.cl')).toBe(false)
    expect(isValidOptionalEmail('nia example@example.cl')).toBe(false)
    expect(isValidOptionalEmail('nia@example')).toBe(false)
  })
})
