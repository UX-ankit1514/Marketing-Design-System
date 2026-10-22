import type { Project } from '../../types/project'
import { ensureFonts } from '../canvas/fonts'
import { renderStatic } from '../canvas/staticRender'
import { resolveSrc } from '../storage/assets'

export type ExportFormat = 'png' | 'jpg'

export const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'design'

export const exportFileName = (p: Pick<Project, 'name' | 'canvas'>, format: ExportFormat) =>
  `arnifi-${slug(p.name)}-${p.canvas.width}x${p.canvas.height}.${format}`

export interface ExportResult {
  blob: Blob
  fileName: string
  width: number
  height: number
  missingFonts: string[]
  failedLayers: string[]
}

/**
 * Renders the project at its original pixel size on a clean canvas (no handles, hidden/removed layers
 * skipped) after fonts and images are loaded, then verifies the decoded size before handing it back.
 */
export async function exportProject(project: Project, format: ExportFormat, quality = 0.95): Promise<ExportResult> {
  const missing = await ensureFonts(project.fonts)
  const { canvas, failures } = await renderStatic(project, resolveSrc)
  try {
    if (failures.length) {
      throw new Error(`These layers couldn't be drawn: ${failures.map((f) => `${f.layerId} (${f.error})`).join('; ')}. Nothing was exported.`)
    }
    const blob = await canvas.toBlob({ format: format === 'jpg' ? 'jpeg' : 'png', quality, multiplier: 1 })
    if (!blob) throw new Error('The browser could not create the image file.')
    const bmp = await createImageBitmap(blob)
    const { width, height } = bmp
    bmp.close()
    if (width !== project.canvas.width || height !== project.canvas.height) {
      throw new Error(`The file came out ${width}×${height} instead of ${project.canvas.width}×${project.canvas.height}.`)
    }
    return { blob, fileName: exportFileName(project, format), width, height, missingFonts: missing.map((f) => f.family), failedLayers: [] }
  } finally {
    canvas.dispose()
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
