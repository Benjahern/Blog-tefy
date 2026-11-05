import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { authenticatedResponse } from '@/lib/authenticatedResponse.mjs'

type Session = { active: boolean; loading: boolean; error?: string; enter: (username: string, password: string) => Promise<boolean>; leave: () => Promise<void> }
const SessionContext = createContext<Session | null>(null)
const API = '/api/v1'

async function csrfToken() {
  const response = await fetch(`${API}/auth/csrf`, { credentials: 'include' })
  if (!response.ok) throw new Error('No se pudo iniciar una sesión segura.')
  const result: unknown = await response.json()
  if (!result || typeof result !== 'object' || !('token' in result) || typeof result.token !== 'string' || !result.token) throw new Error('Token CSRF inválido.')
  return result.token
}

async function confirmsAuthentication(response: Response) {
  let payload: unknown
  try { payload = await response.json() } catch { return false }
  return authenticatedResponse(response.status, response.headers.get('content-type') ?? '', payload)
}

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  useEffect(() => {
    let alive = true
    fetch(`${API}/auth/session`, { credentials: 'include' }).then(async (response) => {
      const authenticated = await confirmsAuthentication(response)
      if (alive) {
        setActive(authenticated)
        if (authenticated) window.dispatchEvent(new CustomEvent('tefy:session', { detail: true }))
      }
    }).catch(() => { if (alive) setActive(false) }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])
  const enter = useCallback(async (username: string, password: string) => {
    setError(undefined)
    try {
      const token = await csrfToken()
      const response = await fetch(`${API}/auth/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: JSON.stringify({ username, password }) })
      if (!(await confirmsAuthentication(response))) { setError(response.status === 401 ? 'Usuario o contraseña incorrectos.' : 'No pudimos iniciar sesión. Inténtalo nuevamente.'); return false }
      setActive(true); window.dispatchEvent(new CustomEvent('tefy:session', { detail: true })); return true
    } catch { setError('No pudimos conectar con el servidor.'); return false }
  }, [])
  const leave = useCallback(async () => {
    try { const token = await csrfToken(); await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': token } }) } finally { setActive(false); window.dispatchEvent(new CustomEvent('tefy:session', { detail: false })) }
  }, [])
  return <SessionContext.Provider value={{ active, loading, error, enter, leave }}>{children}</SessionContext.Provider>
}

export function useAdminSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useAdminSession must be used inside AdminSessionProvider')
  return ctx
}
