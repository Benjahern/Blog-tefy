export const MAX_UPLOAD_MB = 8
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export class ImageError extends Error {}

/** Validates and downsizes an uploaded image to a compact JPEG data URL for prototype storage. */
export async function fileToCompressedDataUrl(file: File, maxSize = 1200, quality = 0.82): Promise<string> {
  if (!ACCEPTED.includes(file.type)) throw new ImageError('Usa una imagen JPG, PNG, WEBP o GIF.')
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new ImageError(`La imagen pesa más de ${MAX_UPLOAD_MB} MB. Prueba con una más liviana.`)
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new ImageError('No pudimos leer esa imagen.'))
      i.src = url
    })
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImageError('No pudimos procesar esa imagen.')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}
