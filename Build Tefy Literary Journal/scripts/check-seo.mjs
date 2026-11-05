import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const robots = readFileSync(join(dist, 'robots.txt'), 'utf8')
const checks = [
  [/<html lang="es">/.test(html), 'document language must be Spanish'],
  [html.includes('name="description"'), 'description meta is required'],
  [html.includes('rel="canonical" href="https://nia.hmx.cl/"'), 'canonical homepage URL is required'],
  [html.includes('property="og:title"'), 'Open Graph title is required'],
  [(html.match(/name="description"/g) ?? []).length === 1, 'description meta must not be duplicated'],
  [robots.includes('Allow: /'), 'robots must allow public pages'],
  [robots.includes('Disallow: /admin/'), 'robots must exclude admin'],
  [robots.includes('Disallow: /api/v1/') && robots.includes('Allow: /api/v1/public/sitemap.xml'), 'robots must exclude API routes and allow sitemap'],
  [robots.includes('https://nia.hmx.cl/api/v1/public/sitemap.xml'), 'robots must declare sitemap URL'],
]
const failed = checks.filter(([passed]) => !passed)
if (failed.length) {
  for (const [, message] of failed) console.error(`SEO check failed: ${message}`)
  process.exit(1)
}
