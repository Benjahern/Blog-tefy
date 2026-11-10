import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: { alias: { '@': path.resolve(root, 'src') } },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.vitest.ts', 'tests/**/*.vitest.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
      reportsDirectory: 'coverage/vitest',
      include: [
        'src/components/admin/TaxonomyManager.tsx',
        'src/components/admin/RichTextEditor.tsx',
        'src/components/books/GenreCard.tsx',
        'src/components/layout/SearchOverlay.tsx',
        'src/components/layout/SiteHead.tsx',
        'src/components/layout/FallingPetals.tsx',
        'src/components/rating/RatingEditor.tsx',
        'src/components/ui/ImageUpload.tsx',
        'src/hooks/useContent.tsx',
        'src/lib/email.ts',
        'src/lib/format.ts',
        'src/lib/html.ts',
        'src/lib/text.ts',
        'src/pages/admin/SettingsPage.tsx',
        'src/pages/public/HomePage.tsx',
        'src/pages/public/ReviewDetailPage.tsx',
      ],
    },
  },
})
