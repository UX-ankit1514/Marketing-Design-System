import { describe, expect, it } from 'vitest'
import { exportFileName, slug } from '../../src/lib/export/exportService'
import { deleteProject, getProject, listProjects, saveProject } from '../../src/lib/storage/db'
import { projectFromText } from '../../src/lib/storage/projectFile'
import { createProjectFromTemplate } from '../../src/lib/templates/instantiate'
import { getTemplate, templateIssues, templates } from '../../src/lib/templates/registry'
import { classifyFile, imageProblem } from '../../src/lib/upload/validate'

const tpl = getTemplate('one-partner-story')!

describe('local project storage', () => {
  it('round-trips a project through IndexedDB with edits intact', async () => {
    const p = createProjectFromTemplate(tpl, 'Saved one')
    p.layers = p.layers.map((l) => (l.id === 'heading-1' && l.type === 'text' ? { ...l, text: 'Edited heading' } : l))
    await saveProject({ id: p.id, name: p.name, templateId: p.templateId, updatedAt: p.updatedAt, project: p })
    const back = await getProject(p.id)
    expect(back?.project.layers.find((l) => l.id === 'heading-1')).toMatchObject({ text: 'Edited heading' })
    expect((await listProjects()).some((m) => m.id === p.id)).toBe(true)
    await deleteProject(p.id)
    expect(await getProject(p.id)).toBeUndefined()
  })
  it('refuses a damaged saved project with a readable message', async () => {
    const p = createProjectFromTemplate(tpl, 'Broken')
    await saveProject({ id: p.id, name: p.name, templateId: p.templateId, updatedAt: 1, project: { ...p, layers: [] } as never })
    await expect(getProject(p.id)).rejects.toThrow(/damaged/i)
  })
})

describe('project files', () => {
  it('rejects non-JSON, foreign JSON and damaged project files', async () => {
    await expect(projectFromText('not json')).rejects.toThrow(/valid JSON/)
    await expect(projectFromText('{"hello":1}')).rejects.toThrow(/wasn't saved by Arnifi/)
    await expect(projectFromText('{"kind":"arnifi-marketing-studio/project","version":1,"project":{}}')).rejects.toThrow(/damaged/)
  })
  it('re-imports a saved project as a new, independent project with editable layers', async () => {
    const p = createProjectFromTemplate(tpl, 'Portable')
    const file = { kind: 'arnifi-marketing-studio/project', version: 1, project: p, assets: {} }
    const imported = await projectFromText(JSON.stringify(file))
    expect(imported.id).not.toBe(p.id)
    expect(imported.layers).toEqual(p.layers)
    expect(imported.layers.some((l) => l.type === 'text' && l.editable)).toBe(true)
  })
})

describe('uploads', () => {
  const f = (name: string, type: string, size = 10) => new File([new Uint8Array(size)], name, { type })
  it('classifies files', () => {
    expect(classifyFile(f('a.png', 'image/png'))).toBe('image')
    expect(classifyFile(f('a.JPG', 'image/jpeg'))).toBe('image')
    expect(classifyFile(f('a.json', 'application/json'))).toBe('project')
    expect(classifyFile(f('a.pdf', 'application/pdf'))).toBe('unsupported')
    expect(classifyFile(f('a.svg', 'image/svg+xml'))).toBe('unsupported')
  })
  it('explains why an image is rejected', () => {
    expect(imageProblem(f('a.gif', 'image/gif'))).toMatch(/isn't a supported image/)
    expect(imageProblem(f('big.png', 'image/png', 26 * 1048576))).toMatch(/under 25 MB/)
    expect(imageProblem(f('empty.png', 'image/png', 0))).toMatch(/empty/)
    expect(imageProblem(f('ok.png', 'image/png'))).toBeNull()
  })
})

describe('export naming', () => {
  it('follows arnifi-<project>-<w>x<h>.<ext>', () => {
    expect(exportFileName({ name: 'Dubai Business Setup!', canvas: { width: 1080, height: 1350, background: '#fff' } }, 'png')).toBe('arnifi-dubai-business-setup-1080x1350.png')
    expect(exportFileName({ name: '   ', canvas: { width: 1080, height: 566, background: '#fff' } }, 'jpg')).toBe('arnifi-design-1080x566.jpg')
    expect(slug('Çafé & Crème')).toBe('cafe-creme')
  })
})

describe('registry', () => {
  it('loads every template without validation issues', () => {
    expect(templateIssues).toEqual([])
    expect(templates).toHaveLength(20)
  })
})

describe('broken data never throws into the library', () => {
  it('reports a clear problem for invalid templates', async () => {
    const { parseTemplate } = await import('../../src/lib/validation')
    for (const bad of [{}, null, 'x', { schemaVersion: 1 }, { ...tpl, layers: [] }, { ...tpl, canvas: { width: -1, height: 5, background: '#fff' } }]) {
      const r = parseTemplate(bad)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error.length).toBeGreaterThan(0)
    }
  })
})
