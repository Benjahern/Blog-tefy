import { useEffect } from 'react'
import { useContent } from './useContent'

export function useDocumentTitle(title?: string) {
  const { state } = useContent()
  const site = state.settings.siteName
  useEffect(() => {
    document.title = title ? `${title} · ${site}` : `${site} — ${state.settings.tagline}`
  }, [title, site, state.settings.tagline])
}
