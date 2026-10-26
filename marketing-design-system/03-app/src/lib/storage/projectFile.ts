import type { Layer } from '../../types/layer'
import { PROJECT_FILE_KIND, type Project, type ProjectFile } from '../../types/project'
import { parseProjectFile } from '../validation'
import { getAsset, putAsset } from './db'
import { primeAsset } from './assets'

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })

/** Serialises a project with its uploaded images inlined so the file works on any computer. */
export async function projectToFile(project: Project): Promise<ProjectFile> {
  const assets: Record<string, string> = {}
  for (const l of [...project.layers, ...project.baseLayers]) {
    if ('src' in l && l.src.startsWith('idb:') && !assets[l.src]) {
      const rec = await getAsset(l.src.slice(4))
      if (rec) assets[l.src] = await toDataUrl(rec.blob)
    }
  }
  return { kind: PROJECT_FILE_KIND, version: 1, project, assets }
}

/** Reads a saved project file, restoring its images into this browser. Throws a readable message. */
export async function projectFromText(text: string): Promise<Project> {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error("That file isn't valid JSON, so it can't be a project file.")
  }
  if (typeof raw !== 'object' || raw === null || (raw as { kind?: string }).kind !== PROJECT_FILE_KIND) {
    throw new Error("That JSON file wasn't saved by Arnifi Marketing Studio.")
  }
  const parsed = parseProjectFile(raw)
  if (!parsed.ok) throw new Error(`The project file is damaged (${parsed.error}).`)
  const { project, assets } = parsed.value
  const remap = new Map<string, string>()
  for (const [oldSrc, dataUrl] of Object.entries(assets)) {
    const blob = await (await fetch(dataUrl)).blob()
    const id = await putAsset(blob, 'imported image')
    primeAsset(id, blob)
    remap.set(oldSrc, `idb:${id}`)
  }
  const fix = (l: Layer): Layer => ((l.type === 'image' || l.type === 'graphic') && remap.has(l.src) ? { ...l, src: remap.get(l.src)! } : l)
  return { ...project, layers: project.layers.map(fix), baseLayers: project.baseLayers.map(fix), id: `project-${crypto.randomUUID().slice(0, 8)}` }
}
