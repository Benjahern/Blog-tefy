export const REVIEW_FONTS = [
  { id: 'default', label: 'Predeterminada', family: 'inherit' },
  { id: 'times-new-roman', label: 'Times New Roman', family: '"Times New Roman", Times, serif' },
  { id: 'arial', label: 'Arial', family: 'Arial, Helvetica, sans-serif' },
  { id: 'georgia', label: 'Georgia', family: 'Georgia, serif' },
  { id: 'verdana', label: 'Verdana', family: 'Verdana, sans-serif' },
  { id: 'tahoma', label: 'Tahoma', family: 'Tahoma, sans-serif' },
  { id: 'trebuchet-ms', label: 'Trebuchet MS', family: '"Trebuchet MS", sans-serif' },
  { id: 'courier-new', label: 'Courier New', family: '"Courier New", monospace' },
  { id: 'palatino', label: 'Palatino', family: 'Palatino, "Book Antiqua", serif' },
  { id: 'garamond', label: 'Garamond', family: 'Garamond, serif' },
  { id: 'inter', label: 'Inter', family: 'Inter, sans-serif' },
  { id: 'cormorant-garamond', label: 'Cormorant Garamond', family: '"Cormorant Garamond", serif' },
] as const

export type ReviewFontId = (typeof REVIEW_FONTS)[number]['id']
export const isReviewFontId = (value: string): value is ReviewFontId => REVIEW_FONTS.some((font) => font.id === value)

export function reviewFontIdFromFace(face: string): ReviewFontId {
  const normalized = face.replace(/["']/g, '').split(',')[0].trim().toLowerCase()
  return REVIEW_FONTS.find((font) => font.id !== 'default' && font.label.toLowerCase() === normalized)?.id ?? 'default'
}
