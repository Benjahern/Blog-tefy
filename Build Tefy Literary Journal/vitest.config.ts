import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: { alias: { '@': path.resolve(root, 'src') } },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.vitest.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
      reportsDirectory: 'coverage/vitest',
      include: ['src/components/admin/TaxonomyManager.tsx', 'src/components/layout/FallingPetals.tsx'],
    },
  },
})
