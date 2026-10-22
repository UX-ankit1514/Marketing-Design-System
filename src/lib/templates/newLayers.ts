import type { ImageLayer, Layer, ShapeLayer, TextLayer } from '../../types/layer'
import type { Project } from '../../types/project'
import { putAsset } from '../storage/db'
import { primeAsset } from '../storage/assets'
import { readImageSize } from './instantiate'

/** Next free id like `text-added-2`, so added layers never collide with template ids. */
export function nextId(project: Project, prefix: string) {
  let n = 1
  while (project.layers.some((l) => l.id === `${prefix}-${n}`)) n++
  return `${prefix}-${n}`
}

const common = (id: string, name: string, role: Layer['role']) => ({
  id,
  name,
  role,
  visible: true,
  removed: false,
  editable: true,
  rotation: 0,
  flipX: false,
  flipY: false,
  opacity: 1,
  flags: ['added'],
  x: 0,
  y: 0,
  width: 0,
  height: 0,
})

export function newTextLayer(project: Project): TextLayer {
  const w = Math.round(project.canvas.width * 0.7)
  const base = common(nextId(project, 'text-added'), 'New text', 'body')
  return ({
    ...base,
    type: 'text',
    text: 'Your text here',
    fontFamily: 'Inter',
    fontSize: Math.round(project.canvas.width / 18),
    fontWeight: 600,
    fontStyle: 'normal',
    color: '#ffffff',
    lineHeight: Math.round((project.canvas.width / 18) * 1.25),
    letterSpacing: 0,
    textAlign: 'left',
    textCase: 'none',
    underline: false,
    runs: [],
    autoHeight: true,
    wrap: true,
    verticalAlign: 'top',
    x: Math.round((project.canvas.width - w) / 2),
    y: Math.round(project.canvas.height * 0.4),
    width: w,
    height: Math.round((project.canvas.width / 18) * 1.25),
    // Readable on photos and light backgrounds alike until the person picks a colour.
    shadow: { color: '#000000', opacity: 0.45, offsetX: 0, offsetY: 2, blur: 12 },
  })
}

export async function newImageLayer(project: Project, file: File): Promise<ImageLayer> {
  const { width, height } = await readImageSize(file)
  const assetId = await putAsset(file, file.name)
  primeAsset(assetId, file)
  const k = Math.min((project.canvas.width * 0.7) / width, (project.canvas.height * 0.7) / height)
  const w = Math.round(width * k)
  const h = Math.round(height * k)
  return ({
    ...common(nextId(project, 'photo-added'), file.name.replace(/\.[^.]+$/, '').slice(0, 28) || 'Image', 'photo'),
    type: 'image',
    src: `idb:${assetId}`,
    naturalWidth: width,
    naturalHeight: height,
    fit: 'cover',
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
    radius: 0,
    replaceable: true,
    x: Math.round((project.canvas.width - w) / 2),
    y: Math.round((project.canvas.height - h) / 2),
    width: w,
    height: h,
  }) as ImageLayer
}

export function newLogoLayer(project: Project, variant: 'blue' | 'white'): Layer {
  const w = Math.round(Math.min(260, project.canvas.width * 0.22))
  const [src, nw, nh] = variant === 'blue' ? ['/brand/arnifi-logo.svg', 107, 30] : ['/brand/arnifi-logo-white.png', 450, 120]
  const h = Math.round((w * nh) / nw)
  return ({
    ...common(nextId(project, 'logo-added'), variant === 'blue' ? 'Arnifi logo (blue)' : 'Arnifi logo (white)', 'logo'),
    type: 'graphic',
    src,
    naturalWidth: nw,
    naturalHeight: nh,
    x: Math.round(project.canvas.width * 0.07),
    y: Math.round(project.canvas.width * 0.07),
    width: w,
    height: h,
  }) as Layer
}

export function newShapeLayer(project: Project): ShapeLayer {
  const w = Math.round(project.canvas.width * 0.4)
  return ({
    ...common(nextId(project, 'shape-added'), 'Rectangle', 'shape'),
    type: 'shape',
    shape: 'rect',
    fills: [{ type: 'solid', color: '#2e2ea3', opacity: 1 }],
    radius: 8,
    x: Math.round((project.canvas.width - w) / 2),
    y: Math.round(project.canvas.height * 0.6),
    width: w,
    height: Math.round(w * 0.3),
  }) as ShapeLayer
}
