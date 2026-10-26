import type { Layer, TextLayer } from '../../types/layer'
import { textBox } from './builder'

export interface TextMetrics {
  lines: number
  /** Height of the text block as Figma would lay it out (lines x line height). */
  height: number
}

export function measureText(l: TextLayer): TextMetrics {
  const t = textBox(l)
  const all = (t as unknown as { _textLines: unknown[][] })._textLines
  // A trailing empty line (Figma text often ends with a line break) takes no visible space.
  let lines = all.length
  while (lines > 1 && all[lines - 1].length === 0) lines--
  return { lines, height: lines * l.lineHeight }
}

export interface Overflow {
  level: 'none' | 'warn' | 'error'
  message: string
}

const OBSTACLES = new Set(['heading', 'subheading', 'body', 'tagline', 'cta', 'logo', 'footer', 'icon', 'badge'])
const hits = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

/**
 * Tells the user when pasted copy no longer fits, instead of silently clipping it:
 * a fixed box that is too small, text that runs off the poster, or text that grows into its neighbours.
 */
export function textOverflow(l: TextLayer, base: TextLayer | undefined, canvas: { height: number }, others: readonly Layer[]): Overflow {
  if (!l.text.trim()) return { level: 'none', message: '' }
  const { height } = measureText(l)
  // Judge against how the *original* copy lays out here, not against Figma's box: designers often leave
  // fixed boxes a few pixels short, and that must not read as a problem the user caused.
  const baseHeight = base ? measureText(base).height : l.height
  if (!l.autoHeight) {
    if (height > Math.max(l.height, baseHeight) + 2) return { level: 'error', message: `Doesn't fit its box (${Math.round(height)}px of text in ${Math.round(l.height)}px). Make the box taller or the text smaller.` }
    return { level: 'none', message: '' }
  }
  const bottom = l.y + height
  if (bottom > canvas.height) return { level: 'error', message: 'This text runs off the bottom of the poster. Shorten it or reduce the font size.' }
  const grown = height - baseHeight > l.lineHeight * 0.5
  if (!grown) return { level: 'none', message: '' }
  const me = { x: l.x, y: l.y, w: l.width, h: height }
  for (const o of others) {
    if (o.id === l.id || !o.visible || o.removed || !OBSTACLES.has(o.role)) continue
    if (hits(me, { x: o.x, y: o.y, w: o.width, h: o.height }) && !(base && hits({ x: base.x, y: base.y, w: base.width, h: base.height }, { x: o.x, y: o.y, w: o.width, h: o.height }))) {
      return { level: 'warn', message: `Longer than the original, so it now overlaps "${o.name}". Move things apart or shorten it.` }
    }
  }
  return { level: 'warn', message: 'Longer than the original, so it grows downward. Check the spacing.' }
}
