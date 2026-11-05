export function authenticatedResponse(status, contentType, payload) {
  return status === 200
    && /^application\/json(?:\s*;|$)/i.test(contentType)
    && payload !== null
    && typeof payload === 'object'
    && !Array.isArray(payload)
    && payload.authenticated === true
}
