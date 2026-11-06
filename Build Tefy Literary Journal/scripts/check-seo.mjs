import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const nginx = readFileSync(join(process.cwd(), 'nginx.conf'), 'utf8')
const checks = [
  [/<html lang="es">/.test(html), 'document language must be Spanish'],
  [html.includes('name="description"'), 'description meta is required'],
  [html.includes("canonicalLink.rel = 'canonical'"), 'canonical URL must be generated at runtime'],
  [html.includes('property="og:title"'), 'Open Graph title is required'],
  [(html.match(/name="description"/g) ?? []).length === 1, 'description meta must not be duplicated'],
  [html.includes('siteUrl: "${SITE_URL}"') && html.includes('clarityId: "${CLARITY_ID}"'), 'site URL and analytics ID must be runtime environment values'],
  [/location\s+\^~\s+\/api\/v1\//.test(nginx) && nginx.includes('proxy_pass ${API_UPSTREAM};'), 'API requests must proxy to the configured backend'],
  [/location\s*=\s*\/robots\.txt/.test(nginx) && nginx.includes('proxy_pass ${API_UPSTREAM}/robots.txt;'), 'robots.txt must use the backend route'],
]
const failed = checks.filter(([passed]) => !passed)
if (failed.length) {
  for (const [, message] of failed) console.error(`SEO check failed: ${message}`)
  process.exit(1)
}
