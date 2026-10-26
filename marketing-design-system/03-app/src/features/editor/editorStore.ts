import { create } from 'zustand'
import type { Layer, TextLayer } from '../../types/layer'
import type { Project } from '../../types/project'
import { adjustRuns } from '../../lib/canvas/runs'

const HISTORY_LIMIT = 100
const COALESCE_MS = 1200

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Snapshot {
  layers: Layer[]
  name: string
}

interface EditorState {
  project: Project | null
  selectedId: string | null
  past: Snapshot[]
  future: Snapshot[]
  saveStatus: SaveStatus
  saveError: string | null
  missingFonts: string[]
  notice: string | null
  layerErrors: Record<string, string>
  lastEdit: { key: string; at: number } | null

  load: (p: Project) => void
  select: (id: string | null) => void
  /** Patch one layer. Edits sharing `coalesce` within ~1s become one undo step (typing, sliders, drags). */
  patch: (id: string, patch: Partial<Layer>, opts?: { coalesce?: string }) => void
  setText: (id: string, text: string) => void
  rename: (name: string) => void
  reorder: (id: string, dir: 'up' | 'down') => void
  /** Appends a new layer on top and selects it. */
  addLayer: (layer: Layer) => void
  duplicate: (id: string) => void
  /** Permanently deletes a layer the user added (template layers are only ever hidden/removed). */
  deleteAdded: (id: string) => void
  setRemoved: (id: string, removed: boolean) => void
  resetLayer: (id: string) => void
  resetAll: () => void
  undo: () => void
  redo: () => void
  setSaveStatus: (s: SaveStatus, err?: string | null) => void
  setMissingFonts: (f: string[]) => void
  setNotice: (n: string | null) => void
  setLayerErrors: (e: Record<string, string>) => void
  /** Marks the project as changed without adding an undo step (used to retry a failed save). */
  touchProject: () => void
}

const touch = (p: Project, layers: Layer[], name = p.name): Project => ({ ...p, layers, name, updatedAt: Date.now() })

export const useEditor = create<EditorState>((set, get) => {
  /** Applies `next`, recording the previous state for undo unless this edit continues the last one. */
  const commit = (next: { layers?: Layer[]; name?: string }, coalesce?: string) => {
    const { project, past, lastEdit } = get()
    if (!project) return
    const now = Date.now()
    const continues = !!coalesce && lastEdit?.key === coalesce && now - lastEdit.at < COALESCE_MS
    const snapshot: Snapshot = { layers: project.layers, name: project.name }
    set({
      project: touch(project, next.layers ?? project.layers, next.name ?? project.name),
      past: continues ? past : [...past, snapshot].slice(-HISTORY_LIMIT),
      future: [],
      lastEdit: coalesce ? { key: coalesce, at: now } : null,
    })
  }

  return {
    project: null,
    selectedId: null,
    past: [],
    future: [],
    saveStatus: 'idle',
    saveError: null,
    missingFonts: [],
    notice: null,
    layerErrors: {},
    lastEdit: null,

    load: (project) => set({ project, selectedId: null, past: [], future: [], lastEdit: null, saveStatus: 'idle', saveError: null, notice: null, layerErrors: {} }),
    select: (id) => set({ selectedId: id }),

    patch: (id, patch, opts) => {
      const { project } = get()
      if (!project) return
      const layers = project.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l))
      commit({ layers }, opts?.coalesce)
    },

    setText: (id, text) => {
      const { project } = get()
      const l = project?.layers.find((x) => x.id === id)
      if (!project || !l || l.type !== 'text') return
      const next: TextLayer = { ...l, text, runs: adjustRuns(l.text, text, l.runs) }
      commit({ layers: project.layers.map((x) => (x.id === id ? next : x)) }, `text:${id}`)
    },

    rename: (name) => commit({ name: name.slice(0, 80) }, 'rename'),

    reorder: (id, dir) => {
      const { project } = get()
      if (!project) return
      const i = project.layers.findIndex((l) => l.id === id)
      const j = dir === 'up' ? i + 1 : i - 1
      if (i < 0 || j < 0 || j >= project.layers.length) return
      const layers = project.layers.slice()
      ;[layers[i], layers[j]] = [layers[j], layers[i]]
      commit({ layers })
    },

    addLayer: (layer) => {
      const { project } = get()
      if (!project) return
      commit({ layers: [...project.layers, layer] })
      set({ selectedId: layer.id })
    },

    duplicate: (id) => {
      const { project } = get()
      const src = project?.layers.find((l) => l.id === id)
      if (!project || !src) return
      const prefix = `${src.role}-added`
      let n = 1
      while (project.layers.some((l) => l.id === `${prefix}-${n}`)) n++
      const copy = { ...structuredClone(src), id: `${prefix}-${n}`, name: `${src.name} copy`.slice(0, 40), x: src.x + 24, y: src.y + 24, flags: [...new Set([...src.flags, 'added'])] } as Layer
      const i = project.layers.findIndex((l) => l.id === id)
      const layers = project.layers.slice()
      layers.splice(i + 1, 0, copy)
      commit({ layers })
      set({ selectedId: copy.id })
    },

    deleteAdded: (id) => {
      const { project } = get()
      const l = project?.layers.find((x) => x.id === id)
      if (!project || !l?.flags.includes('added')) return
      commit({ layers: project.layers.filter((x) => x.id !== id) })
      set({ selectedId: null })
    },

    setRemoved: (id, removed) => {
      const { project, selectedId } = get()
      if (!project) return
      commit({ layers: project.layers.map((l) => (l.id === id ? { ...l, removed } : l)) })
      if (removed && selectedId === id) set({ selectedId: null })
    },

    resetLayer: (id) => {
      const { project } = get()
      const base = project?.baseLayers.find((l) => l.id === id)
      if (!project || !base) return
      commit({ layers: project.layers.map((l) => (l.id === id ? structuredClone(base) : l)) })
    },

    resetAll: () => {
      const { project } = get()
      if (!project) return
      commit({ layers: structuredClone(project.baseLayers) })
      set({ selectedId: null })
    },

    undo: () => {
      const { project, past, future } = get()
      const prev = past.at(-1)
      if (!project || !prev) return
      set({
        project: touch(project, prev.layers, prev.name),
        past: past.slice(0, -1),
        future: [{ layers: project.layers, name: project.name }, ...future],
        lastEdit: null,
      })
    },

    redo: () => {
      const { project, past, future } = get()
      const next = future[0]
      if (!project || !next) return
      set({
        project: touch(project, next.layers, next.name),
        past: [...past, { layers: project.layers, name: project.name }],
        future: future.slice(1),
        lastEdit: null,
      })
    },

    setSaveStatus: (saveStatus, saveError = null) => set({ saveStatus, saveError }),
    setMissingFonts: (missingFonts) => set({ missingFonts }),
    setNotice: (notice) => set({ notice }),
    setLayerErrors: (layerErrors) => set({ layerErrors }),
    touchProject: () => {
      const { project } = get()
      if (project) set({ project: { ...project, updatedAt: Date.now() } })
    },
  }
})

export const canUndo = (s: EditorState) => s.past.length > 0
export const canRedo = (s: EditorState) => s.future.length > 0
