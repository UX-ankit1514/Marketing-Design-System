import type { Layer } from '../../types/layer'
import type { Project } from '../../types/project'
import type { Template } from '../../types/template'
import { newId, putAsset } from '../storage/db'
import { primeAsset } from '../storage/assets'

const clone = <T,>(v: T): T => structuredClone(v)

/** A project is a working copy: the master template is never referenced again except by id. */
export function createProjectFromTemplate(t: Template, name: string): Project {
  const layers = clone(t.layers) as Layer[]
  const now = Date.now()
  return {
    id: newId('project'),
    name: name.trim() || t.name,
    templateId: t.id,
    templateVersion: t.version,
    createdAt: now,
    updatedAt: now,
    canvas: { ...t.canvas },
    fonts: clone(t.fonts),
    layers,
    baseLayers: clone(layers),
  }
}

const MAX_SIDE = 4096

export interface ImageFileInfo {
  width: number
  height: number
}

export function readImageSize(blob: Blob): Promise<ImageFileInfo> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("That file isn't a readable image."))
    }
    img.src = url
  })
}

/** PNG/JPG/WebP upload becomes a background picture - never pretended to be layered. */
export async function createProjectFromImage(file: File, name: string): Promise<Project> {
  const { width, height } = await readImageSize(file)
  const k = Math.min(1, MAX_SIDE / Math.max(width, height))
  const w = Math.round(width * k)
  const h = Math.round(height * k)
  const assetId = await putAsset(file, file.name)
  primeAsset(assetId, file)
  const layer: Layer = {
    type: 'image',
    id: 'photo-1',
    name: 'Uploaded background',
    role: 'photo',
    visible: true,
    removed: false,
    editable: true,
    x: 0,
    y: 0,
    width: w,
    height: h,
    rotation: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    flags: [],
    src: `idb:${assetId}`,
    naturalWidth: width,
    naturalHeight: height,
    fit: 'cover',
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
    radius: 0,
    replaceable: true,
  }
  const now = Date.now()
  return {
    id: newId('project'),
    name: name.trim() || file.name.replace(/\.[^.]+$/, ''),
    templateId: 'upload',
    templateVersion: 1,
    createdAt: now,
    updatedAt: now,
    canvas: { width: w, height: h, background: '#ffffff' },
    fonts: [
      { family: 'Inter', weight: 400, style: 'normal' },
      { family: 'Inter', weight: 600, style: 'normal' },
      { family: 'Lora', weight: 400, style: 'normal' },
    ],
    layers: [layer],
    baseLayers: [clone(layer)],
  }
}
