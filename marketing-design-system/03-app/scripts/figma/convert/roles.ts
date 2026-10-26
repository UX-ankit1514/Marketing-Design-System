import type { Layer, LayerRole } from '../../../src/types/layer'

type Draft = Record<string, any>

const area = (l: Draft) => l.width * l.height

/** Best-guess role for a raw extracted layer. Overrides in scripts/figma/convert/overrides/<id>.json win. */
export function inferRole(l: Draft, all: Draft[], canvas: { width: number; height: number }): LayerRole {
  const path = ((l._hint?.path as string[]) ?? []).join('/').toLowerCase()
  const name = String(l.name ?? '').toLowerCase()
  const canvasArea = canvas.width * canvas.height
  if (l.type === 'text') {
    const t = String(l.text).trim().toLowerCase()
    if (t === 'arnifi.com' || /footer/.test(path)) return 'footer'
    if (/business setup\.?\s*simplified/.test(t) || /fast\.\s*digital/.test(t)) return /fast/.test(t) ? 'footer' : 'tagline'
    const siblings = all.filter((x) => x.type === 'text')
    const biggest = Math.max(...siblings.map((x) => x.fontSize))
    const inCta = all.some((x) => x.type === 'shape' && x.groupId && x.groupId === l.groupId && x.width > l.width && x.height < 120)
    if (/button|cta/.test(path + name) || (inCta && t.split(/\s+/).length <= 6 && l.fontSize <= 30)) return 'cta'
    if (l.fontSize >= biggest * 0.9 && l.fontSize >= 40) return 'heading'
    if (l.fontSize >= 34) return 'heading'
    if (l.fontSize >= 26) return 'subheading'
    return 'body'
  }
  if (l.type === 'graphic') {
    // The wordmark: a wide, short picture sitting in a top or bottom corner band.
    const ratio = l.width / l.height
    const inBand = l.y < canvas.height * 0.14 || l.y > canvas.height * 0.8
    if (/logo/.test(path + name) || (ratio >= 2.4 && ratio <= 4.8 && l.width >= 120 && l.width <= 260 && l.height >= 30 && l.height <= 80 && inBand)) return 'logo'
    if (/vuesax|icon|arrow|chevron/.test(path + name) || (l.width <= 120 && l.height <= 120)) return 'icon'
    if (l.y > canvas.height * 0.88 && l.width < canvas.width * 0.4) return 'footer'
    return 'decoration'
  }
  if (l.type === 'image') return area(l) >= canvasArea * 0.12 ? 'photo' : 'icon'
  if (l.type === 'shape') {
    if (/button|cta/.test(path + name)) return 'cta'
    return area(l) >= canvasArea * 0.6 ? 'decoration' : 'shape'
  }
  return 'decoration'
}

export const isEditableRole = (r: LayerRole) => r !== 'decoration'
export type { Layer }
