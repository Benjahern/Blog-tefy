import type { ContentState } from '@/types'
import { createSeedState } from '@/data/seed'

const emptyState = (): ContentState => ({ ...createSeedState(), books: [], reviews: [], genres: [], series: [] })
export const contentRepository = {
  empty: emptyState,
  async load(admin = false): Promise<ContentState> {
    const response = await fetch(`/api/v1/${admin ? 'admin' : 'public'}/content`, { credentials: 'include' })
    if (!response.ok) throw new Error('No se pudo cargar el contenido del servidor.')
    const remote = await response.json() as ContentState
    const defaults = emptyState()
    return { ...defaults, ...remote, settings: { ...defaults.settings, ...(remote.settings ?? {}), social: { ...defaults.settings.social, ...(remote.settings?.social ?? {}) } } }
  },
  async save(state: ContentState): Promise<void> {
    const token = document.cookie.split('; ').find((c) => c.startsWith('nia_csrf='))?.split('=')[1]
    const response = await fetch('/api/v1/admin/content', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { 'X-CSRF-Token': decodeURIComponent(token) } : {}) }, body: JSON.stringify(state) })
    if (!response.ok) throw new Error('No se pudo guardar el contenido.')
  },
}
