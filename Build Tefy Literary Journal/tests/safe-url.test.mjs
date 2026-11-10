import test from 'node:test'
import assert from 'node:assert/strict'
import { safeUrl } from '../src/lib/safeUrl.mjs'

test('allows safe web, mail and same-site links', () => {
  assert.equal(safeUrl('https://example.com/path'), 'https://example.com/path')
  assert.equal(safeUrl('mailto:hello@example.com'), 'mailto:hello@example.com')
  assert.equal(safeUrl('/resenas/libro'), '/resenas/libro')
})

test('rejects script and protocol-relative URLs', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '')
  assert.equal(safeUrl('//evil.example/path'), '')
  assert.equal(safeUrl('/\\evil.example/path'), '')
})

test('allows only HTTPS, safe data image URLs and same-site paths for images', () => {
  assert.equal(safeUrl('https://example.com/cover.jpg', true), 'https://example.com/cover.jpg')
  assert.equal(safeUrl('data:image/png;base64,abc', true), 'data:image/png;base64,abc')
  assert.equal(safeUrl('/covers/book.jpg', true), '/covers/book.jpg')
  assert.equal(safeUrl('http://example.com/cover.jpg', true), '')
  assert.equal(safeUrl('data:text/html,hello', true), '')
})
