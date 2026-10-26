import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseTemplate } from '../../src/lib/validation'

const root = path.resolve(__dirname, '../..')
const dir = path.join(root, 'src/data/templates')
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scripts/figma/convert/manifest.json'), 'utf8')) as { nodeId: string; id: string }[]

describe('template library data', () => {
  it('has the 20 selected Figma templates', () => {
    expect(files).toHaveLength(20)
    expect(files.map((f) => f.replace('.json', '')).sort()).toEqual(manifest.map((m) => m.id).sort())
  })

  for (const f of files) {
    describe(f, () => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
      const r = parseTemplate(raw)
      it('passes the template schema', () => {
        expect(r.ok, r.ok ? '' : r.error).toBe(true)
      })
      if (!r.ok) return
      const t = r.value
      it('keeps a traceable Figma source', () => {
        expect(t.source.fileKey).toBe('s2yQZ85TPB02pKuvfwTCgk')
        expect(manifest.find((m) => m.id === t.id)?.nodeId).toBe(t.source.nodeId)
      })
      it('is genuinely layered, not one flat picture', () => {
        expect(t.layers.filter((l) => l.type === 'text' && l.editable).length).toBeGreaterThanOrEqual(2)
        expect(t.layers.some((l) => l.type === 'image' && l.replaceable) || t.layers.some((l) => l.role === 'photo')).toBe(true)
        expect(t.layers.length).toBeGreaterThanOrEqual(8)
      })
      it('has unique, stable layer ids', () => {
        const ids = t.layers.map((l) => l.id)
        expect(new Set(ids).size).toBe(ids.length)
      })
      it('only uses fonts the app bundles', () => {
        for (const font of t.fonts) expect(['Inter', 'Lora']).toContain(font.family)
      })
      it('points at assets that exist in the repo (no Figma URLs)', () => {
        for (const l of t.layers) {
          if (l.type === 'image' || l.type === 'graphic') {
            expect(l.src, l.id).toMatch(/^\/template-assets\//)
            expect(fs.existsSync(path.join(root, 'public', l.src)), `${l.id} -> ${l.src}`).toBe(true)
          }
        }
      })
      it('has a thumbnail', () => {
        expect(fs.existsSync(path.join(root, 'public/thumbs', `${t.id}.webp`))).toBe(true)
      })
      it('has a Figma reference screenshot at the right size', () => {
        expect(fs.existsSync(path.join(root, 'inventory/refs', `${t.id}.png`))).toBe(true)
      })
    })
  }
})
