export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024

export const SUPPORTED_TEXT = 'PNG, JPG or WebP images (up to 25 MB), or a project file (.json) saved from this app.'

export type FileKind = 'image' | 'project' | 'unsupported'

export function classifyFile(f: File): FileKind {
  if ((IMAGE_TYPES as readonly string[]).includes(f.type)) return 'image'
  if (/\.(png|jpe?g|webp)$/i.test(f.name) && !f.type) return 'image'
  if (f.type === 'application/json' || /\.json$/i.test(f.name)) return 'project'
  return 'unsupported'
}

/** Returns a plain-language problem, or null when the image can be used. */
export function imageProblem(f: File): string | null {
  if (classifyFile(f) !== 'image') return `"${f.name}" isn't a supported image. Use ${SUPPORTED_TEXT.split(',')[0]}.`
  if (f.size > MAX_IMAGE_BYTES) return `"${f.name}" is ${(f.size / 1048576).toFixed(1)} MB. Images must be under 25 MB.`
  if (f.size === 0) return `"${f.name}" is empty.`
  return null
}
