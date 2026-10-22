import { FabricImage, Gradient, Rect, Ellipse, Shadow, Textbox, classRegistry, type FabricObject } from 'fabric'
import type { Fill, GraphicLayer, ImageLayer, Layer, ShapeLayer, TextLayer } from '../../types/layer'
import { fontStack } from './fonts'
import { runsToFabricStyles } from './runs'

/** Resolves `idb:<id>` image sources to a loadable URL. Plain paths pass through. */
export type SrcResolver = (src: string) => Promise<string> | string

// Fabric's text box geometry (Text.mjs): line pitch = fontSize * 1.13 * lineHeight,
// first baseline = fontSize * 1.13 * (1 - 0.222).
const FABRIC_MULT = 1.13
const FABRIC_FRACTION = 0.222
// Ascent/descent per em (hhea) so first-line baselines line up with Figma's line boxes.
const METRICS: Record<string, { a: number; d: number }> = {
  Inter: { a: 0.96875, d: 0.2412 },
  Lora: { a: 1.006, d: 0.274 },
}

// Fabric 7 defaults to a centre origin; our layer coordinates (and Figma's) are top-left.
const TL = { originX: 'left', originY: 'top' } as const

const withAlpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

export function fillToFabric(f: Fill, w: number, h: number): string | Gradient<'linear'> | Gradient<'radial'> {
  if (f.type === 'solid') return f.opacity >= 1 ? f.color : withAlpha(f.color, f.opacity)
  const colorStops = f.stops.map((s) => ({ offset: s.pos, color: withAlpha(s.color, s.opacity * f.opacity) }))
  if (f.type === 'linear') {
    return new Gradient({ type: 'linear', gradientUnits: 'pixels', coords: { x1: f.x1 * w, y1: f.y1 * h, x2: f.x2 * w, y2: f.y2 * h }, colorStops }) as Gradient<'linear'>
  }
  return new Gradient({ type: 'radial', gradientUnits: 'pixels', coords: { x1: f.cx * w, y1: f.cy * h, r1: 0, x2: f.cx * w, y2: f.cy * h, r2: f.r * w }, colorStops }) as Gradient<'radial'>
}

/**
 * Figma's "glass" effect = frosted backdrop. Canvas has no backdrop-filter, so this rect blurs whatever
 * was already painted underneath it (only its own bounding box, to stay cheap while dragging).
 */
export class GlassRect extends Rect {
  static override type = 'GlassRect'
  blurRadius = 24

  override _render(ctx: CanvasRenderingContext2D) {
    const m = ctx.getTransform()
    const w = this.width, h = this.height
    const r = Math.min(this.rx || 0, w / 2, h / 2)
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(-w / 2, -h / 2, w, h, r)
    ctx.clip()
    const scale = Math.hypot(m.a, m.b)
    const blur = this.blurRadius * scale
    const pad = Math.ceil(blur * 2)
    const corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f])
    const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1])
    const cw = ctx.canvas.width, ch = ctx.canvas.height
    const sx = Math.max(0, Math.floor(Math.min(...xs) - pad)), sy = Math.max(0, Math.floor(Math.min(...ys) - pad))
    const ex = Math.min(cw, Math.ceil(Math.max(...xs) + pad)), ey = Math.min(ch, Math.ceil(Math.max(...ys) + pad))
    if (ex > sx && ey > sy) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.filter = `blur(${blur}px)`
      ctx.drawImage(ctx.canvas, sx, sy, ex - sx, ey - sy, sx, sy, ex - sx, ey - sy)
    }
    ctx.restore()
    super._render(ctx)
  }
}
classRegistry.setClass(GlassRect)

const glassRadius = (l: Layer) => {
  const f = l.flags.find((x) => x.startsWith('glass-radius:'))
  return f ? Number(f.slice(13)) : l.flags.includes('effect:glass') ? 60 : 0
}

const shadowOf = (l: Layer) =>
  l.shadow ? new Shadow({ color: withAlpha(l.shadow.color, l.shadow.opacity), blur: l.shadow.blur, offsetX: l.shadow.offsetX, offsetY: l.shadow.offsetY }) : undefined

/** Clip in artboard coordinates (so it ignores the object's own transform). */
function clipOf(l: Layer): Rect | undefined {
  if (!l.clip) return undefined
  return new Rect({ ...TL, left: l.clip.x, top: l.clip.y, width: l.clip.width, height: l.clip.height, rx: l.clip.radius, ry: l.clip.radius, absolutePositioned: true })
}

function applyCommon(obj: FabricObject, l: Layer) {
  obj.set({
    ...TL,
    opacity: l.opacity,
    visible: l.visible,
    selectable: l.editable,
    evented: l.editable,
    hasControls: l.editable,
    objectCaching: false,
    angle: l.rotation,
    flipX: l.flipX,
    flipY: l.flipY,
    shadow: shadowOf(l),
  })
  const clip = clipOf(l)
  if (clip) obj.clipPath = clip
  return obj
}

const caseText = (t: string, c: TextLayer['textCase']) => (c === 'upper' ? t.toUpperCase() : c === 'lower' ? t.toLowerCase() : c === 'title' ? t.replace(/\b\w/g, (m) => m.toUpperCase()) : t)

export function textBox(l: TextLayer): Textbox {
  const m = METRICS[l.fontFamily] ?? METRICS.Inter
  // Browser Inter is ~0.4% wider than Figma's, so wrapped boxes get a hair of tolerance (and unwrapped ones a lot).
  const slack = l.wrap ? l.width * 0.006 + 1 : Math.max(24, l.fontSize * 0.7)
  const left = l.textAlign === 'center' ? l.x - slack / 2 : l.textAlign === 'right' ? l.x - slack : l.x
  const figmaBaseline = (l.lineHeight - (m.a + m.d) * l.fontSize) / 2 + m.a * l.fontSize
  const fabricBaseline = l.fontSize * FABRIC_MULT * (1 - FABRIC_FRACTION)
  const text = caseText(l.text, l.textCase)
  const t = new Textbox(text, {
    ...TL,
    left,
    top: l.y + (figmaBaseline - fabricBaseline),
    width: l.width + slack,
    fontFamily: fontStack(l.fontFamily),
    fontSize: l.fontSize,
    fontWeight: l.fontWeight,
    fontStyle: l.fontStyle,
    fill: l.color,
    lineHeight: l.lineHeight / (l.fontSize * FABRIC_MULT),
    charSpacing: (l.letterSpacing / l.fontSize) * 1000,
    textAlign: l.textAlign,
    underline: l.underline,
    styles: l.textCase === 'none' ? runsToFabricStyles(l.text, l.runs) : {},
    splitByGrapheme: false,
    lockScalingFlip: true,
    editable: l.editable,
  })
  if (!l.autoHeight && l.verticalAlign !== 'top') {
    const lines = (t as unknown as { _textLines: unknown[] })._textLines.length
    const free = l.height - lines * l.lineHeight
    if (l.verticalAlign === 'middle') t.top += free / 2
    else t.top += free
  }
  applyCommon(t, l)
  // Textbox corner/edge controls: only horizontal resize (width), height follows the text.
  t.setControlsVisibility({ mt: false, mb: false, tl: false, tr: false, bl: false, br: false })
  return t
}

function shapeObject(l: ShapeLayer): FabricObject {
  const sw = l.stroke?.width ?? 0
  const inset = !l.stroke ? 0 : l.stroke.align === 'inside' ? sw / 2 : l.stroke.align === 'outside' ? -sw / 2 : 0
  const w = Math.max(0, l.width - 2 * inset - sw)
  const h = Math.max(0, l.height - 2 * inset - sw)
  const make = (fill: Fill | undefined) => {
    const common = {
      ...TL,
      left: l.x + inset + sw / 2,
      top: l.y + inset + sw / 2,
      fill: fill ? fillToFabric(fill, w, h) : 'rgba(0,0,0,0)',
      stroke: l.stroke ? withAlpha(l.stroke.color, l.stroke.opacity) : undefined,
      strokeWidth: sw,
      strokeUniform: true,
    }
    if (l.shape === 'ellipse') return new Ellipse({ ...common, rx: w / 2, ry: h / 2 })
    const rect = { ...common, width: w, height: h, rx: Math.max(0, l.radius - inset), ry: Math.max(0, l.radius - inset) }
    const glass = glassRadius(l)
    if (!glass) return new Rect(rect)
    // Figma's glass radius is a lens size, far larger than a plain gaussian; ~half reads the same.
    const g = new GlassRect({ ...rect, stroke: l.stroke ? rect.stroke : 'rgba(255,255,255,0.22)', strokeWidth: l.stroke ? sw : 1.2 })
    g.blurRadius = Math.max(6, glass * 0.5)
    return g
  }
  const obj = make(l.fills[0])
  return obj
}

/** Visible stand-in for a layer whose image can't be loaded, so nothing silently disappears. */
export function placeholderObject(l: Layer): FabricObject {
  const r = new Rect({ ...TL, left: l.x, top: l.y, width: Math.max(l.width, 24), height: Math.max(l.height, 24), fill: 'rgba(207,19,34,0.08)', stroke: '#CF1322', strokeWidth: 2, strokeDashArray: [10, 8], strokeUniform: true })
  return applyCommon(r, { ...l, shadow: undefined, rotation: 0, flipX: false, flipY: false, opacity: 1 } as Layer)
}

export async function buildLayerObject(l: Layer, resolve: SrcResolver): Promise<FabricObject> {
  let obj: FabricObject
  if (l.type === 'text') return textBox(l)
  if (l.type === 'shape') {
    obj = shapeObject(l)
  } else if (l.type === 'image') {
    obj = await imageObject(l, resolve)
  } else {
    obj = await graphicObject(l, resolve)
  }
  return applyCommon(obj, l)
}

const imageElements = new Map<string, Promise<HTMLImageElement>>()

/** Decoded images are shared between rebuilds so sliders (zoom, size) don't re-decode photos. */
function loadElement(url: string): Promise<HTMLImageElement> {
  let p = imageElements.get(url)
  if (!p) {
    p = new Promise((resolve, reject) => {
      const el = new Image()
      el.crossOrigin = 'anonymous'
      el.onload = () => resolve(el)
      el.onerror = () => {
        imageElements.delete(url)
        reject(new Error(`image failed to load: ${url.startsWith('blob:') ? 'uploaded image' : url}`))
      }
      el.src = url
    })
    imageElements.set(url, p)
  }
  return p
}

async function load(src: string, resolve: SrcResolver) {
  return new FabricImage(await loadElement(await resolve(src)))
}

async function graphicObject(l: GraphicLayer, resolve: SrcResolver) {
  const img = await load(l.src, resolve)
  img.set({ ...TL, left: l.x, top: l.y, scaleX: l.width / (img.width || l.naturalWidth), scaleY: l.height / (img.height || l.naturalHeight) })
  return img
}

/**
 * The visible slice of the source image for this layer, in source px.
 * Starts from the Figma crop (or the whole image), then covers the *current* box so resizing the
 * frame crops instead of squashing, and finally applies the user's zoom and drag offset.
 */
export function imageViewport(l: ImageLayer, iw: number, ih: number) {
  const base = l.crop ?? { x: 0, y: 0, width: iw, height: ih }
  const s = Math.max(l.width / base.width, l.height / base.height) * l.zoom
  const cw = l.width / s
  const ch = l.height / s
  const cx = base.x + base.width / 2 - l.offsetX / s
  const cy = base.y + base.height / 2 - l.offsetY / s
  const x = Math.min(Math.max(cx - cw / 2, 0), Math.max(0, iw - cw))
  const y = Math.min(Math.max(cy - ch / 2, 0), Math.max(0, ih - ch))
  return { x, y, width: Math.min(cw, iw), height: Math.min(ch, ih) }
}

async function imageObject(l: ImageLayer, resolve: SrcResolver) {
  const img = await load(l.src, resolve)
  const iw = img.width || l.naturalWidth
  const ih = img.height || l.naturalHeight
  if (l.fit === 'contain' && !l.crop) {
    const s = Math.min(l.width / iw, l.height / ih) * l.zoom
    img.set({ ...TL, left: l.x + (l.width - iw * s) / 2 + l.offsetX, top: l.y + (l.height - ih * s) / 2 + l.offsetY, scaleX: s, scaleY: s })
  } else {
    const v = imageViewport(l, iw, ih)
    img.set({ ...TL, left: l.x, top: l.y, cropX: v.x, cropY: v.y, width: v.width, height: v.height, scaleX: l.width / v.width, scaleY: l.height / v.height })
  }
  if (l.radius > 0 && !l.clip) {
    img.clipPath = new Rect({ ...TL, left: l.x, top: l.y, width: l.width, height: l.height, rx: l.radius, ry: l.radius, absolutePositioned: true })
  }
  return img
}
