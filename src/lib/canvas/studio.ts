import { Canvas, FabricObject, Textbox, type TPointerEventInfo } from 'fabric'
import type { Layer } from '../../types/layer'
import { buildLayerObject, placeholderObject, type SrcResolver } from './builder'

export interface StudioHandlers {
  onSelect: (id: string | null) => void
  /** Move/resize finished. `kind` is 'drag' for plain moves (no rebuild needed) or 'resize'. */
  onGeometry: (id: string, patch: Partial<Layer>, kind: 'drag' | 'resize') => void
  onTextEdited: (id: string, text: string) => void
  /** Layer ids whose picture couldn't be loaded, with a reason. */
  onErrors: (errors: Record<string, string>) => void
}

export interface StudioCanvasMeta {
  width: number
  height: number
  background: string
}

interface Entry {
  obj: FabricObject
  sig: string
  /** Object position minus layer position at build time (stroke insets, text baseline shift...). */
  dx: number
  dy: number
  /** Object size minus layer size at build time. */
  dw: number
  dh: number
  sw: number
  sh: number
}

const ids = new WeakMap<FabricObject, string>()

// Brand-coloured selection handles (Arnique-900), round corners.
Object.assign(FabricObject.ownDefaults, {
  cornerColor: '#ffffff',
  cornerStrokeColor: '#2E2EA3',
  borderColor: '#2E2EA3',
  transparentCorners: false,
  cornerSize: 11,
  cornerStyle: 'circle',
  borderScaleFactor: 1.6,
  padding: 0,
  borderOpacityWhenMoving: 0.6,
})

const stable = (v: unknown): string =>
  JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x as object).sort(([a], [b]) => (a < b ? -1 : 1))) : x))

export class Studio {
  readonly canvas: Canvas
  private entries = new Map<string, Entry>()
  private layers = new Map<string, Layer>()
  private chain: Promise<void> = Promise.resolve()
  private version = 0
  private disposed = false
  private zoom = 1
  private meta: StudioCanvasMeta

  private resolve: SrcResolver
  private handlers: StudioHandlers

  constructor(el: HTMLCanvasElement, meta: StudioCanvasMeta, resolve: SrcResolver, handlers: StudioHandlers) {
    this.resolve = resolve
    this.handlers = handlers
    this.meta = meta
    this.canvas = new Canvas(el, {
      width: meta.width,
      height: meta.height,
      backgroundColor: meta.background,
      selection: false,
      preserveObjectStacking: true,
      stopContextMenu: true,
      renderOnAddRemove: false,
      enableRetinaScaling: true,
    })
    const c = this.canvas
    const pick = (selected: FabricObject[] | undefined) => {
      const o = selected?.[0]
      this.handlers.onSelect(o ? (ids.get(o) ?? null) : null)
    }
    c.on('selection:created', (e) => pick(e.selected))
    c.on('selection:updated', (e) => pick(e.selected))
    c.on('selection:cleared', () => this.handlers.onSelect(null))
    c.on('object:modified', (e) => this.onModified(e as unknown as { target: FabricObject; action?: string }))
    // Push every keystroke to the project so preview/export/save never miss text still being typed.
    c.on('text:changed', (e) => {
      const id = ids.get(e.target as FabricObject)
      if (id) this.handlers.onTextEdited(id, (e.target as Textbox).text)
    })
    c.on('text:editing:exited', (e) => {
      const id = ids.get(e.target as FabricObject)
      if (id) this.handlers.onTextEdited(id, (e.target as Textbox).text)
    })
    c.on('mouse:down', (e: TPointerEventInfo) => {
      if (!e.target) this.handlers.onSelect(null)
    })
  }

  setMeta(meta: StudioCanvasMeta) {
    this.meta = meta
    this.canvas.backgroundColor = meta.background
    this.applyZoom()
  }

  setZoom(z: number) {
    this.zoom = z
    this.applyZoom()
  }

  private applyZoom() {
    this.canvas.setZoom(this.zoom)
    this.canvas.setDimensions({ width: this.meta.width * this.zoom, height: this.meta.height * this.zoom })
    this.canvas.requestRenderAll()
  }

  /** Reconcile the canvas with the project's layers. Safe to call on every change; only the latest wins. */
  sync(all: readonly Layer[]) {
    const v = ++this.version
    this.chain = this.chain.then(() => (v === this.version && !this.disposed ? this.run(all) : undefined)).catch(() => undefined)
    return this.chain
  }

  private async run(all: readonly Layer[]) {
    const c = this.canvas
    const wanted = all.filter((l) => !l.removed)
    const wantedIds = new Set(wanted.map((l) => l.id))
    const errors: Record<string, string> = {}
    const active = c.getActiveObject()
    const activeId = active ? ids.get(active) : undefined

    for (const [id, e] of this.entries) {
      if (!wantedIds.has(id)) {
        c.remove(e.obj)
        this.entries.delete(id)
      }
    }

    await Promise.all(
      wanted.map(async (l) => {
        const have = this.entries.get(l.id)
        const sig = stable(l)
        this.layers.set(l.id, l)
        if (have && have.sig === sig) return
        if (have && (have.obj as Textbox).isEditing) return // never rebuild under the user's cursor
        let obj: FabricObject
        try {
          obj = await buildLayerObject(l, this.resolve)
        } catch (err) {
          errors[l.id] = err instanceof Error ? err.message : String(err)
          obj = placeholderObject(l)
        }
        if (this.disposed) return
        ids.set(obj, l.id)
        const entry: Entry = {
          obj,
          sig,
          dx: obj.left - l.x,
          dy: obj.top - l.y,
          dw: obj.getScaledWidth() - l.width,
          dh: obj.getScaledHeight() - l.height,
          sw: obj.getScaledWidth(),
          sh: obj.getScaledHeight(),
        }
        if (obj instanceof Textbox) {
          obj.set({ editable: l.editable && l.type === 'text' && l.textCase === 'none' })
          obj.setControlsVisibility({ mt: false, mb: false, tl: false, tr: false, bl: false, br: false, mtr: false })
        } else {
          obj.setControlsVisibility({ mtr: false })
          if (l.type === 'graphic') obj.set({ uniformScaling: true })
        }
        if (have) {
          const i = c.getObjects().indexOf(have.obj)
          c.remove(have.obj)
          c.insertAt(Math.max(0, i), obj)
        } else {
          c.add(obj)
        }
        this.entries.set(l.id, entry)
      }),
    )
    if (this.disposed) return

    // Paint order = layer order.
    wanted.forEach((l, i) => {
      const e = this.entries.get(l.id)
      if (e && c.getObjects().indexOf(e.obj) !== i) c.moveObjectTo(e.obj, i)
    })
    const reselect = activeId ? this.entries.get(activeId)?.obj : undefined
    if (reselect && c.getActiveObject() !== reselect && reselect.selectable && reselect.visible) c.setActiveObject(reselect)
    c.requestRenderAll()
    this.handlers.onErrors(errors)
  }

  /** Leaves in-place text editing (used when the user clicks anywhere outside the poster). */
  exitEditing() {
    const a = this.canvas.getActiveObject()
    if (a instanceof Textbox && a.isEditing) {
      a.exitEditing()
      this.canvas.requestRenderAll()
    }
  }

  select(id: string | null) {
    const c = this.canvas
    if (!id) {
      if (c.getActiveObject()) {
        c.discardActiveObject()
        c.requestRenderAll()
      }
      return
    }
    const o = this.entries.get(id)?.obj
    if (o && o.selectable && o.visible && c.getActiveObject() !== o) {
      c.setActiveObject(o)
      c.requestRenderAll()
    }
  }

  private onModified(e: { target: FabricObject; action?: string }) {
    const o = e.target
    const id = ids.get(o)
    const entry = id ? this.entries.get(id) : undefined
    const layer = id ? this.layers.get(id) : undefined
    if (!id || !entry || !layer) return
    const r = (n: number) => Math.round(n * 100) / 100
    const patch: Partial<Layer> = { x: r(o.left - entry.dx), y: r(o.top - entry.dy) }
    const moved = (e.action ?? 'drag') === 'drag'
    if (!moved) {
      if (o instanceof Textbox) {
        patch.width = r(Math.max(20, o.width * o.scaleX - entry.dw))
      } else {
        patch.width = r(Math.max(4, o.getScaledWidth() - entry.dw))
        patch.height = r(Math.max(4, o.getScaledHeight() - entry.dh))
      }
    } else {
      // A plain move needs no rebuild: record the new state so the next sync recognises it.
      entry.sig = stable({ ...layer, ...patch })
    }
    this.handlers.onGeometry(id, patch, moved ? 'drag' : 'resize')
  }

  thumbnail(maxWidth = 360) {
    const w = this.meta.width * this.zoom
    return this.canvas.toDataURL({ format: 'jpeg', quality: 0.72, multiplier: maxWidth / w })
  }

  dispose() {
    this.disposed = true
    void this.canvas.dispose()
  }
}
