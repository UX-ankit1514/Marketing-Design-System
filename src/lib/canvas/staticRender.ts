import { StaticCanvas } from 'fabric'
import type { Layer } from '../../types/layer'
import { buildLayerObject, type SrcResolver } from './builder'

export interface RenderSource {
  canvas: { width: number; height: number; background: string }
  layers: readonly Layer[]
}

export interface BuildFailure {
  layerId: string
  error: string
}

/**
 * Renders a template/project to an offscreen canvas at its native size: no handles, no selection,
 * hidden layers skipped. Used by export, thumbnails and the parity check.
 */
export async function renderStatic(src: RenderSource, resolve: SrcResolver, el?: HTMLCanvasElement) {
  const c = new StaticCanvas(el, { width: src.canvas.width, height: src.canvas.height, backgroundColor: src.canvas.background, renderOnAddRemove: false })
  const failures: BuildFailure[] = []
  const objs = await Promise.all(
    src.layers.map(async (l) => {
      if (!l.visible || l.removed) return null
      try {
        return await buildLayerObject(l, resolve)
      } catch (e) {
        failures.push({ layerId: l.id, error: e instanceof Error ? e.message : String(e) })
        return null
      }
    }),
  )
  for (const o of objs) if (o) c.add(o)
  c.renderAll()
  return { canvas: c, failures }
}
