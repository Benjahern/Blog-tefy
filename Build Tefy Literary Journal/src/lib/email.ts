/** Validate optional contact email text without an unbounded backtracking regex. */
export function isValidOptionalEmail(value?: string): boolean {
  if (!value) return true
  const email = value.trim()
  const at = email.indexOf('@')
  if (at <= 0 || at !== email.lastIndexOf('@')) return false
  const domain = email.slice(at + 1)
  const dot = domain.lastIndexOf('.')
  if (dot <= 0 || dot === domain.length - 1) return false
  return !Array.from(email).some((character) => character.trim() === '')
}
