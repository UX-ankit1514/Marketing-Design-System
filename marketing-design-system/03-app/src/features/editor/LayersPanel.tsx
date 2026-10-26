import { useMemo, useRef, useState } from 'react'
import { Icon, type IconName } from '../../components/common/Icon'
import { textOverflow } from '../../lib/canvas/measure'
import { imageProblem } from '../../lib/upload/validate'
import { newImageLayer, newLogoLayer, newShapeLayer, newTextLayer } from '../../lib/templates/newLayers'
import type { Layer } from '../../types/layer'
import { useEditor } from './editorStore'
import { layerLabel } from './layerLabel'

const iconFor = (l: Layer): IconName => (l.type === 'text' ? 'text' : l.type === 'image' ? 'image' : l.type === 'shape' ? 'shape' : l.role === 'logo' ? 'logo' : 'graphic')

type Block = { kind: 'layer'; layer: Layer } | { kind: 'group'; id: string; name: string; items: Layer[] }

function blocks(layers: Layer[]): Block[] {
  const out: Block[] = []
  const groups = new Map<string, Extract<Block, { kind: 'group' }>>()
  // Top of the panel = top of the stack.
  for (const l of [...layers].reverse()) {
    if (l.removed) continue
    if (!l.groupId) {
      out.push({ kind: 'layer', layer: l })
      continue
    }
    let g = groups.get(l.groupId)
    if (!g) {
      g = { kind: 'group', id: l.groupId, name: l.groupName ?? 'Group', items: [] }
      groups.set(l.groupId, g)
      out.push(g)
    }
    g.items.push(l)
  }
  return out
}

function AddMenu() {
  const [open, setOpen] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)
  const add = (l: Layer) => {
    useEditor.getState().addLayer(l)
    setOpen(false)
  }
  const project = () => useEditor.getState().project!
  function choose(label: 'Text' | 'Image…' | 'Arnifi logo (blue)' | 'Arnifi logo (white)' | 'Rectangle') {
    if (label === 'Text') add(newTextLayer(project()))
    else if (label === 'Image…') file.current?.click()
    else if (label === 'Rectangle') add(newShapeLayer(project()))
    else add(newLogoLayer(project(), label.includes('blue') ? 'blue' : 'white'))
  }
  async function onFile(f: File | undefined) {
    if (!f) return
    const bad = imageProblem(f)
    if (bad) return setProblem(bad)
    try {
      add(await newImageLayer(project(), f))
      setProblem(null)
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e))
    } finally {
      if (file.current) file.current.value = ''
    }
  }
  return (
    <div style={{ padding: '0 16px 8px', position: 'relative' }}>
      <button className="btn btn--secondary btn--sm" style={{ width: '100%' }} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} data-testid="add-menu">
        <Icon name="plus" /> Add to design
      </button>
      {open && (
        <div role="menu" style={{ position: 'absolute', left: 16, right: 16, top: 38, zIndex: 5, background: '#fff', border: '1px solid var(--border-default)', borderRadius: 4, boxShadow: 'var(--shadow-2)', padding: 4, display: 'grid' }}>
          {(['Text', 'Image…', 'Arnifi logo (blue)', 'Arnifi logo (white)', 'Rectangle'] as const).map((label) => (
            <button key={label} role="menuitem" className="btn btn--ghost" style={{ justifyContent: 'flex-start', height: 34 }} onClick={() => choose(label)}>
              {label}
            </button>
          ))}
        </div>
      )}
      <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Choose an image to add" data-testid="add-image-input" onChange={(e) => void onFile(e.target.files?.[0])} />
      {problem && (
        <div className="msg msg--error" role="alert" style={{ marginTop: 8 }} data-testid="add-image-error">
          {problem}
        </div>
      )}
    </div>
  )
}

export function LayersPanel() {
  const project = useEditor((s) => s.project)!
  const selectedId = useEditor((s) => s.selectedId)
  const errors = useEditor((s) => s.layerErrors)
  const { select, patch, setRemoved } = useEditor.getState()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const list = useMemo(() => blocks(project.layers), [project.layers])
  const removed = project.layers.filter((l) => l.removed)

  const flag = (l: Layer) => {
    if (errors[l.id]) return { level: 'error' as const, text: errors[l.id] }
    if (l.type === 'text') {
      const o = textOverflow(l, project.baseLayers.find((b) => b.id === l.id) as typeof l | undefined, project.canvas, project.layers)
      if (o.level !== 'none') return { level: o.level, text: o.message }
    }
    return null
  }

  const row = (l: Layer) => {
    const f = flag(l)
    const locked = !l.editable
    return (
      <div key={l.id} className="layer-row" data-selected={selectedId === l.id} data-hidden={!l.visible} data-locked={locked} data-testid="layer-row" data-layer-id={l.id}>
        <button
          className="layer-row__select"
          aria-current={selectedId === l.id ? 'true' : undefined}
          disabled={locked}
          onClick={() => select(l.id)}
          title={locked ? `${layerLabel(l)} (background art, not editable)` : layerLabel(l)}
        >
          <Icon name={iconFor(l)} className="icon layer-row__icon" style={{ width: 16, height: 16 }} />
          <span className="layer-row__name">{layerLabel(l)}</span>
          {f && <Icon name="warn" className={`icon layer-row__warn${f.level === 'error' ? ' layer-row__warn--error' : ''}`} role="img" aria-label={f.text} />}
        </button>
        <button
          className="btn btn--ghost btn--sm btn--icon"
          style={{ height: 28, width: 28 }}
          aria-label={l.visible ? `Hide ${layerLabel(l)}` : `Show ${layerLabel(l)}`}
          aria-pressed={!l.visible}
          onClick={() => patch(l.id, { visible: !l.visible })}
        >
          <Icon name={l.visible ? 'eye' : 'eye-off'} />
        </button>
      </div>
    )
  }

  return (
    <aside className="panel panel--left" aria-label="Layers">
      <div className="panel__head">Layers</div>
      <AddMenu />
      <div className="panel__scroll">
        {list.map((b) =>
          b.kind === 'layer' ? (
            row(b.layer)
          ) : (
            <div className="layer-group" key={b.id}>
              <div className="layer-group__head">
                <button className="layer-group__toggle" onClick={() => setCollapsed((c) => ({ ...c, [b.id]: !c[b.id] }))} aria-expanded={!collapsed[b.id]}>
                  <Icon name={collapsed[b.id] ? 'chevron' : 'chevron-down'} />
                  {b.name} ({b.items.length})
                </button>
                <button
                  className="btn btn--ghost btn--sm btn--icon"
                  style={{ height: 24, width: 24 }}
                  aria-label={b.items.every((l) => !l.visible) ? `Show all in ${b.name}` : `Hide all in ${b.name}`}
                  onClick={() => {
                    const show = b.items.every((l) => !l.visible)
                    b.items.forEach((l) => patch(l.id, { visible: show }))
                  }}
                >
                  <Icon name={b.items.every((l) => !l.visible) ? 'eye-off' : 'eye'} />
                </button>
              </div>
              {!collapsed[b.id] && <div className="layer-group__items">{b.items.map(row)}</div>}
            </div>
          ),
        )}
        {removed.length > 0 && (
          <div className="layers-removed" data-testid="removed-layers">
            <div className="label" style={{ padding: '0 6px 6px' }}>Removed from this design</div>
            {removed.map((l) => (
              <div className="layer-row" key={l.id} data-hidden="true" data-locked="true">
                <Icon name={iconFor(l)} className="icon layer-row__icon" style={{ width: 16, height: 16 }} />
                <span className="layer-row__name">{layerLabel(l)}</span>
                <button className="btn btn--tertiary btn--sm" onClick={() => setRemoved(l.id, false)} aria-label={`Restore ${layerLabel(l)}`}>
                  <Icon name="restore" /> Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
