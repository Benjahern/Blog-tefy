const isSiteRelative = (value) => value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')

export function safeUrl(url, forImage = false) {
  const value = url.trim()
  if (isSiteRelative(value)) return value
  if (forImage) return /^(https:\/\/|data:image\/(png|jpe?g|webp|gif);)/i.test(value) ? value : ''
  return /^(https?:\/\/|mailto:)/i.test(value) ? value : ''
}
