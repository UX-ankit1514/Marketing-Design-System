import { useRef, useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { textOverflow } from '../../lib/canvas/measure'
import { readImageSize } from '../../lib/templates/instantiate'
import { primeAsset } from '../../lib/storage/assets'
import { putAsset } from '../../lib/storage/db'
import { imageProblem, SUPPORTED_TEXT } from '../../lib/upload/validate'
import type { ImageLayer, Layer, ShapeLayer, TextLayer } from '../../types/layer'
import { useEditor } from './editorStore'
import { layerLabel } from './layerLabel'

const FAMILIES = ['Inter', 'Lora']
const WEIGHTS = [400, 500, 600, 700]
const WEIGHT_NAMES: Record<number, string> = { 400: 'Regular', 500: 'Medium', 600: 'Semi Bold', 700: 'Bold' }

function Num({ label, value, onChange, min, max, step = 1, suffix, id }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string; id: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {suffix ? ` (${suffix})` : ''}
      </label>
      <input
        id={id}
        className="input"
        type="number"
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (Number.isFinite(v)) onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v)))
        }}
      />
    </div>
  )
}

function ColorField({ label, value, onChange, id }: { label: string; value: string; onChange: (v: string) => void; id: string }) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = (v: string) => {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v.trim())
    if (m) {
      const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1]
      onChange(`#${h.toLowerCase()}`)
    }
    setDraft(null)
  }
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="color">
        <input type="color" aria-label={`${label} picker`} value={value} onChange={(e) => onChange(e.target.value)} />
        <input id={id} className="input" value={draft ?? value} onChange={(e) => setDraft(e.target.value)} onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commit((e.target as HTMLInputElement).value)} aria-label={label} spellCheck={false} />
      </div>
    </div>
  )
}

function Slider({ label, value, min, max, step = 1, onChange, format, id }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string; id: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="slider">
        <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
        <span className="hint" style={{ textAlign: 'right' }}>{format ? format(value) : value}</span>
      </div>
    </div>
  )
}

export function PropertiesPanel() {
  const project = useEditor((s) => s.project)!
  const selectedId = useEditor((s) => s.selectedId)
  const errors = useEditor((s) => s.layerErrors)
  const { patch, setText, setRemoved, resetLayer, reorder, duplicate, deleteAdded } = useEditor.getState()
  const layer = project.layers.find((l) => l.id === selectedId && !l.removed)

  if (!layer) {
    return (
      <aside className="panel panel--right" aria-label="Properties">
        <div className="panel__head">Properties</div>
        <div className="empty-props">
          <Icon name="shape" style={{ width: 28, height: 28, color: 'var(--dusk-500)' }} />
          <strong>Nothing selected</strong>
          <span className="hint">Click something on the poster, or pick a layer on the left, to change it.</span>
        </div>
      </aside>
    )
  }

  const set = (p: Partial<Layer>, key: string) => patch(layer.id, p, { coalesce: `p:${layer.id}:${key}` })
  const base = project.baseLayers.find((b) => b.id === layer.id)
  const added = layer.flags.includes('added')
  const removable = !added && (['logo', 'footer', 'icon', 'badge', 'shape', 'cta'].includes(layer.role) || layer.type === 'graphic')
  const idp = `prop-${layer.id}`

  return (
    <aside className="panel panel--right" aria-label="Properties" data-testid="properties">
      <div className="panel__head">Properties</div>
      <div className="panel__body">
        <div className="props__title">
          <h3 title={layerLabel(layer)}>{layerLabel(layer)}</h3>
          <span className="badge" style={{ marginLeft: 'auto' }}>{layer.role}</span>
        </div>

        {layer.type === 'text' && <TextProps l={layer} set={set} setText={(t) => setText(layer.id, t)} idp={idp} base={base as TextLayer | undefined} />}
        {layer.type === 'image' && <ImageProps l={layer} set={set} idp={idp} error={errors[layer.id]} />}
        {layer.type === 'shape' && <ShapeProps l={layer} set={set} idp={idp} />}
        {layer.type === 'graphic' && errors[layer.id] && <div className="msg msg--error" role="alert"><Icon name="warn" />{errors[layer.id]}</div>}

        <div className="props__group">
          <div className="label">Position & size</div>
          <div className="row">
            <Num id={`${idp}-x`} label="X" suffix="px" value={layer.x} onChange={(x) => set({ x }, 'x')} />
            <Num id={`${idp}-y`} label="Y" suffix="px" value={layer.y} onChange={(y) => set({ y }, 'y')} />
            <Num
              id={`${idp}-w`}
              label="Width"
              suffix="px"
              min={4}
              value={layer.width}
              onChange={(width) => set(layer.type === 'graphic' && layer.width ? { width, height: Math.round(((layer.height * width) / layer.width) * 100) / 100 } : { width }, 'w')}
            />
            {layer.type !== 'text' && (
              <Num
                id={`${idp}-h`}
                label="Height"
                suffix="px"
                min={4}
                value={layer.height}
                onChange={(height) => set(layer.type === 'graphic' && layer.height ? { height, width: Math.round(((layer.width * height) / layer.height) * 100) / 100 } : { height }, 'h')}
              />
            )}
          </div>
          <Slider id={`${idp}-op`} label="Opacity" value={Math.round(layer.opacity * 100)} min={0} max={100} format={(v) => `${v}%`} onChange={(v) => set({ opacity: v / 100 }, 'opacity')} />
        </div>

        <div className="props__group">
          <div className="label">Layer</div>
          <div className="row">
            <button className="btn btn--tertiary btn--sm" onClick={() => patch(layer.id, { visible: !layer.visible })} aria-pressed={!layer.visible}>
              <Icon name={layer.visible ? 'eye-off' : 'eye'} /> {layer.visible ? 'Hide' : 'Show'}
            </button>
            <button className="btn btn--tertiary btn--sm" onClick={() => resetLayer(layer.id)} disabled={!base} title="Put this layer back exactly as in the template">
              <Icon name="reset" /> Reset layer
            </button>
            <button className="btn btn--tertiary btn--sm" onClick={() => reorder(layer.id, 'up')} aria-label="Bring forward">
              <Icon name="up" /> Forward
            </button>
            <button className="btn btn--tertiary btn--sm" onClick={() => reorder(layer.id, 'down')} aria-label="Send backward">
              <Icon name="down" /> Backward
            </button>
          </div>
          <button className="btn btn--tertiary btn--sm" onClick={() => duplicate(layer.id)}>
            <Icon name="copy" /> Duplicate
          </button>
          {added && (
            <button className="btn btn--danger btn--sm" onClick={() => deleteAdded(layer.id)} data-testid="delete-added">
              <Icon name="trash" /> Delete
            </button>
          )}
          {removable && (
            <button className="btn btn--danger btn--sm" onClick={() => setRemoved(layer.id, true)}>
              <Icon name="trash" /> Remove from this design
            </button>
          )}
          {removable && <span className="hint">Removing only affects this project. You can bring it back from the Layers list.</span>}
        </div>
      </div>
    </aside>
  )
}

type SetFn = (p: Partial<Layer>, key: string) => void

function TextProps({ l, set, setText, idp, base }: { l: TextLayer; set: SetFn; setText: (t: string) => void; idp: string; base?: TextLayer }) {
  const project = useEditor((s) => s.project)!
  const over = textOverflow(l, base, project.canvas, project.layers)
  const accent = l.runs.find((r) => r.color)?.color
  return (
    <>
      <div className="props__group">
        <div className="field">
          <label htmlFor={`${idp}-text`}>Text</label>
          <textarea id={`${idp}-text`} className="textarea" value={l.text} onChange={(e) => setText(e.target.value)} rows={Math.min(6, Math.max(3, l.text.split('\n').length + 1))} data-testid="text-content" />
          {l.textCase !== 'none' && <span className="hint">This text is shown in {l.textCase}case.</span>}
        </div>
        {over.level !== 'none' && (
          <div className={`msg msg--${over.level === 'error' ? 'error' : 'warn'}`} role="alert" data-testid="overflow-warning">
            <Icon name="warn" />
            <span>{over.message}</span>
          </div>
        )}
      </div>
      <div className="props__group">
        <div className="label">Style</div>
        <div className="row">
          <div className="field">
            <label htmlFor={`${idp}-font`}>Font</label>
            <select id={`${idp}-font`} className="select" value={l.fontFamily} onChange={(e) => set({ fontFamily: e.target.value }, 'font')}>
              {[...new Set([...FAMILIES, l.fontFamily])].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${idp}-weight`}>Weight</label>
            <select id={`${idp}-weight`} className="select" value={l.fontWeight} onChange={(e) => set({ fontWeight: Number(e.target.value) }, 'weight')}>
              {[...new Set([...WEIGHTS, l.fontWeight])].sort().map((w) => (
                <option key={w} value={w}>
                  {WEIGHT_NAMES[w] ?? w}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Slider id={`${idp}-size`} label="Font size" value={l.fontSize} min={8} max={240} format={(v) => `${Math.round(v)}px`} onChange={(fontSize) => set({ fontSize, lineHeight: Math.round(((l.lineHeight * fontSize) / l.fontSize) * 100) / 100 }, 'size')} />
        <div className="row">
          <ColorField id={`${idp}-color`} label="Text colour" value={l.color} onChange={(color) => set({ color }, 'color')} />
          {accent && <ColorField id={`${idp}-accent`} label="Second colour" value={accent} onChange={(c) => set({ runs: l.runs.map((r) => (r.color ? { ...r, color: c } : r)) }, 'accent')} />}
        </div>
        <div className="field">
          <span className="label" id={`${idp}-align`}>Alignment</span>
          <div className="seg" role="group" aria-labelledby={`${idp}-align`}>
            {(['left', 'center', 'right'] as const).map((a) => (
              <button key={a} aria-pressed={l.textAlign === a} aria-label={`Align ${a}`} onClick={() => set({ textAlign: a }, 'align')}>
                <Icon name={`align-${a}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <Num id={`${idp}-lh`} label="Line height" suffix="px" min={8} step={1} value={l.lineHeight} onChange={(lineHeight) => set({ lineHeight }, 'lh')} />
          <Num id={`${idp}-ls`} label="Letter spacing" suffix="px" step={0.1} value={l.letterSpacing} onChange={(letterSpacing) => set({ letterSpacing }, 'ls')} />
        </div>
      </div>
    </>
  )
}

function ImageProps({ l, set, idp, error }: { l: ImageLayer; set: SetFn; idp: string; error?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function replace(file: File | undefined) {
    if (!file) return
    setProblem(null)
    const bad = imageProblem(file)
    if (bad) return setProblem(`${bad} ${SUPPORTED_TEXT.split(' (')[0]} are supported.`)
    setBusy(true)
    try {
      const { width, height } = await readImageSize(file)
      const id = await putAsset(file, file.name)
      primeAsset(id, file)
      // Keep the placeholder's box, cover it by default, and forget the old crop.
      useEditor.getState().patch(l.id, { src: `idb:${id}`, naturalWidth: width, naturalHeight: height, crop: undefined, offsetX: 0, offsetY: 0, zoom: 1, fit: 'cover' } as Partial<Layer>)
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="props__group">
      <div className="label">Image</div>
      {(error || problem) && (
        <div className="msg msg--error" role="alert" data-testid="image-error">
          <Icon name="warn" />
          <span>{problem ?? error}</span>
        </div>
      )}
      {l.replaceable ? (
        <>
          <button className="btn btn--secondary" onClick={() => input.current?.click()} disabled={busy}>
            <Icon name="upload" /> {busy ? 'Loading…' : 'Replace image'}
          </button>
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Replace image file" data-testid="replace-image-input" onChange={(e) => void replace(e.target.files?.[0])} />
        </>
      ) : (
        <span className="hint">This picture is part of the template's branding and can't be swapped.</span>
      )}
      <div className="field">
        <span className="label" id={`${idp}-fit`}>Fit</span>
        <div className="seg" role="group" aria-labelledby={`${idp}-fit`}>
          <button aria-pressed={l.fit === 'cover'} onClick={() => set({ fit: 'cover', crop: undefined, offsetX: 0, offsetY: 0 } as Partial<Layer>, 'fit')}>Fill (crop)</button>
          <button aria-pressed={l.fit === 'contain'} onClick={() => set({ fit: 'contain', crop: undefined, offsetX: 0, offsetY: 0 } as Partial<Layer>, 'fit')}>Fit inside</button>
        </div>
      </div>
      <Slider id={`${idp}-zoom`} label="Zoom" value={Math.round(l.zoom * 100)} min={100} max={400} format={(v) => `${v}%`} onChange={(v) => set({ zoom: v / 100 }, 'zoom')} />
      <div className="row">
        <Num id={`${idp}-ox`} label="Shift left/right" suffix="px" value={l.offsetX} onChange={(offsetX) => set({ offsetX }, 'ox')} />
        <Num id={`${idp}-oy`} label="Shift up/down" suffix="px" value={l.offsetY} onChange={(offsetY) => set({ offsetY }, 'oy')} />
      </div>
      <span className="hint">The frame keeps its size; drag its handles on the poster to change it.</span>
    </div>
  )
}

function ShapeProps({ l, set, idp }: { l: ShapeLayer; set: SetFn; idp: string }) {
  const first = l.fills[0]
  return (
    <div className="props__group">
      <div className="label">Shape</div>
      {first?.type === 'solid' && <ColorField id={`${idp}-fill`} label="Fill colour" value={first.color} onChange={(color) => set({ fills: [{ ...first, color }, ...l.fills.slice(1)] }, 'fill')} />}
      {l.shape === 'rect' && <Slider id={`${idp}-radius`} label="Corner radius" value={Math.round(l.radius)} min={0} max={200} format={(v) => `${v}px`} onChange={(radius) => set({ radius }, 'radius')} />}
    </div>
  )
}
