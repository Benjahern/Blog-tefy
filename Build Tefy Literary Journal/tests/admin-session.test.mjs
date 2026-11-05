import test from 'node:test'
import assert from 'node:assert/strict'
import { authenticatedResponse } from '../src/lib/authenticatedResponse.mjs'

test('accepts only an explicit authenticated JSON response', () => {
  assert.equal(authenticatedResponse(200, 'application/json; charset=utf-8', { authenticated: true }), true)
})

test('rejects successful HTML fallback responses', () => {
  assert.equal(authenticatedResponse(200, 'text/html', '<html>blog</html>'), false)
})

test('rejects unauthenticated, malformed, and non-success responses', () => {
  assert.equal(authenticatedResponse(200, 'application/json', { authenticated: false }), false)
  assert.equal(authenticatedResponse(200, 'application/json', {}), false)
  assert.equal(authenticatedResponse(401, 'application/json', { authenticated: true }), false)
  assert.equal(authenticatedResponse(200, 'text/plain', { authenticated: true }), false)
})
