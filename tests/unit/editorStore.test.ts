import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEditor } from '../../src/features/editor/editorStore'
import { createProjectFromTemplate } from '../../src/lib/templates/instantiate'
import { getTemplate } from '../../src/lib/templates/registry'
import type { TextLayer } from '../../src/types/layer'

const template = getTemplate('expand-uae-square')!
const state = () => useEditor.getState()
const layer = (id: string) => state().project!.layers.find((l) => l.id === id)!

beforeEach(() => {
  state().load(createProjectFromTemplate(template, 'Test design'))
})

describe('project instances', () => {
  it('never mutates the master template', () => {
    const before = structuredClone(template)
    state().patch('heading-1', { x: 500 })
    state().setText('heading-1', 'Changed')
    state().resetAll()
    expect(template).toEqual(before)
  })
  it('creates independent projects from the same template', () => {
    const a = createProjectFromTemplate(template, 'A')
    const b = createProjectFromTemplate(template, 'B')
    expect(a.id).not.toBe(b.id)
    a.layers[0].x = 999
    expect(b.layers[0].x).not.toBe(999)
  })
  it('starts as an exact copy of the template layers', () => {
    expect(state().project!.layers).toEqual(template.layers)
  })
})

describe('undo / redo', () => {
  it('reverses and reapplies the last committed edit', () => {
    const y0 = layer('heading-1').y
    state().patch('heading-1', { y: y0 - 40 })
    expect(layer('heading-1').y).toBe(y0 - 40)
    state().undo()
    expect(layer('heading-1').y).toBe(y0)
    state().redo()
    expect(layer('heading-1').y).toBe(y0 - 40)
  })
  it('records a drag as one step, not one per intermediate position', () => {
    for (let i = 1; i <= 50; i++) state().patch('heading-1', { x: 80 + i }, { coalesce: 'geo:heading-1' })
    expect(state().past).toHaveLength(1)
    state().undo()
    expect(layer('heading-1').x).toBe(template.layers.find((l) => l.id === 'heading-1')!.x)
  })
  it('starts a new step after the coalescing window', () => {
    vi.useFakeTimers()
    state().patch('heading-1', { x: 1 }, { coalesce: 'k' })
    vi.advanceTimersByTime(3000)
    state().patch('heading-1', { x: 2 }, { coalesce: 'k' })
    expect(state().past).toHaveLength(2)
    vi.useRealTimers()
  })
  it('clears redo history after a new edit', () => {
    state().patch('heading-1', { x: 1 })
    state().undo()
    state().patch('heading-1', { x: 2 })
    expect(state().future).toHaveLength(0)
  })
  it('does nothing when there is nothing to undo or redo', () => {
    const p = state().project
    state().undo()
    state().redo()
    expect(state().project).toBe(p)
  })
})

describe('text editing', () => {
  it('keeps highlighted words highlighted when the copy changes', () => {
    const h = layer('heading-1') as TextLayer
    expect(h.runs.length).toBeGreaterThan(0)
    state().setText('heading-1', 'Please ' + h.text)
    const after = layer('heading-1') as TextLayer
    expect(after.runs[0].start).toBe(h.runs[0].start + 7)
  })
  it('survives empty text', () => {
    state().setText('heading-1', '')
    expect((layer('heading-1') as TextLayer).text).toBe('')
    expect(() => state().undo()).not.toThrow()
  })
})

describe('brand elements (logo / footer)', () => {
  it('hides, removes and restores without touching other layers', () => {
    const others = state().project!.layers.filter((l) => l.id !== 'logo-1')
    state().patch('logo-1', { visible: false })
    expect(layer('logo-1').visible).toBe(false)
    state().setRemoved('logo-1', true)
    expect(layer('logo-1').removed).toBe(true)
    state().setRemoved('logo-1', false)
    expect(layer('logo-1').removed).toBe(false)
    expect(state().project!.layers.filter((l) => l.id !== 'logo-1')).toEqual(others)
  })
  it('deselects a layer when it is removed', () => {
    state().select('logo-1')
    state().setRemoved('logo-1', true)
    expect(state().selectedId).toBeNull()
  })
  it('resets one layer to its original coordinates', () => {
    const orig = { ...layer('logo-1') }
    state().patch('logo-1', { x: 5, y: 5, width: 10 })
    state().resetLayer('logo-1')
    expect(layer('logo-1')).toEqual(orig)
  })
})

describe('reset template', () => {
  it('restores every layer and keeps the project', () => {
    const id = state().project!.id
    state().patch('heading-1', { x: 1 })
    state().setText('body-1', 'x')
    state().setRemoved('logo-1', true)
    state().resetAll()
    expect(state().project!.layers).toEqual(template.layers)
    expect(state().project!.id).toBe(id)
  })
})

describe('layer order', () => {
  it('moves a layer forward and back', () => {
    const order = () => state().project!.layers.map((l) => l.id)
    const [a, b] = order().slice(2, 4)
    state().reorder(a, 'up')
    expect(order().slice(2, 4)).toEqual([b, a])
    state().reorder(a, 'down')
    expect(order().slice(2, 4)).toEqual([a, b])
  })
})
