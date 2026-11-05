import forestMountain from '@/assets/forest-mountain.jpg'
import forestMeadow from '@/assets/forest-meadow.jpg'

export const defaultImages = {
  hero: forestMountain,
  meadow: forestMeadow,
  about: 'https://images.unsplash.com/photo-1595111633191-7a8c1b0f7f98?auto=format&fit=crop&w=900&q=70',
}

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=65`

/** Atmospheric photography for genre cards (Unsplash). */
export const genreImages: Record<string, string> = {
  'ciencia-ficcion': u('1707755939969-e9c1da71c5bb'),
  fantasia: u('1544039161-b0c20826c6f6'),
  romance: u('1711349171577-4d9bd1c219f8'),
  'literatura-juvenil': u('1524494860062-9442631ee30e'),
  misterio: u('1609523235355-82f40b23a6f2'),
  'literatura-general': u('1642022143908-fe7e3160a56e'),
}
