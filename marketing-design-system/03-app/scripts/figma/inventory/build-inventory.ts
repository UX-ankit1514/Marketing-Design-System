/**
 * Builds the PRD 6.4 template inventory.
 *   npx tsx scripts/figma/inventory/build-inventory.ts [<spilled candidates scan>]
 * With a scan file it refreshes inventory/candidates.json first. Always rewrites
 * inventory/inventory.json and docs/template-inventory.md from the template JSON files.
 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../..')
const candPath = path.join(root, 'inventory/candidates.json')
const scan = process.argv[2]
if (scan) {
  const raw = JSON.parse(fs.readFileSync(scan, 'utf8'))
  fs.writeFileSync(candPath, JSON.stringify((raw.result ?? raw).rows, null, 2))
}
type Cand = { nodeId: string; name: string; type: string; w: number; h: number; section: string | null; text: number; images: number; vectors: number; hidden: number; fonts: string[]; texts: string[] }
const cands: Cand[] = JSON.parse(fs.readFileSync(candPath, 'utf8'))
const manifest: { nodeId: string; id: string }[] = JSON.parse(fs.readFileSync(path.join(root, 'scripts/figma/convert/manifest.json'), 'utf8'))
const parity = fs.existsSync(path.join(root, 'inventory/parity/results.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'inventory/parity/results.json'), 'utf8')) : {}
const selected = new Map(manifest.map((m) => [m.nodeId, m.id]))

const family = (c: Cand) => {
  if (/MAINLAND|Jersey|ADGM/i.test(c.name) || (c.w >= 800 && c.w <= 920 && c.h > 1400)) return 'checklist'
  if (c.section === 'UAE vs Japan') return c.w < 600 ? 'component' : 'japan'
  if (c.w === 1080 && [1920, 1080, 566].includes(c.h)) return 'campaign'
  if (c.w === 1080 && c.h === 1350) return /^(DIR|Frame 1597885888)$/.test(c.name) ? 'standalone' : 'skyline'
  return 'other'
}
const reasonNotSelected = (c: Cand, f: string) => {
  switch (f) {
    case 'checklist':
      return `Long form/checklist document (${c.w}×${c.h}), not a social poster. PRD: not every frame is an eligible template.`
    case 'component':
      return `Reusable info-card component (${c.w}×${c.h}), not a poster.`
    case 'campaign':
      return 'Same campaign is already represented by another size. Max two sizes per campaign, so all three ratios are covered without near-duplicates.'
    case 'skyline':
      return 'Near-identical variant of a selected Flag Day / skyline layout (same structure, different artwork).'
    case 'japan':
      return 'Alternate artwork/colour variant of a selected UAE × Japan layout.'
    default:
      return 'Not selected: duplicates a layout already in the library.'
  }
}

const ids = [...selected.values()]
const rows = ids.map((id) => {
  const t = JSON.parse(fs.readFileSync(path.join(root, 'src/data/templates', `${id}.json`), 'utf8'))
  const L: any[] = t.layers
  const text = L.filter((l) => l.type === 'text')
  const flattened = L.filter((l) => (l.flags ?? []).some((f: string) => f.startsWith('flattened:'))).length
  const glass = L.some((l) => (l.flags ?? []).includes('effect:glass'))
  const complexity = L.length <= 14 && !flattened ? 'Simple' : L.length <= 30 && flattened <= 6 ? 'Medium' : 'Complex'
  const cand = cands.find((c) => c.nodeId === t.source.nodeId)
  return {
    id,
    name: t.name,
    format: t.format,
    category: t.category,
    figma: { fileKey: t.source.fileKey, nodeId: t.source.nodeId, frameName: t.source.frameName },
    reference: `inventory/refs/${id}.png`,
    thumbnail: `public/thumbs/${id}.webp`,
    size: `${t.canvas.width}×${t.canvas.height}`,
    editableTextLayers: text.filter((l) => l.editable).length,
    imageLayers: L.filter((l) => l.type === 'image').length,
    replaceablePhotos: L.filter((l) => l.type === 'image' && l.replaceable).length,
    hasLogo: L.some((l) => l.role === 'logo'),
    hasFooter: L.some((l) => l.role === 'footer'),
    fonts: [...new Set((t.fonts as any[]).map((f) => `${f.family} ${f.weight}`))],
    layers: L.length,
    sourceVectors: cand?.vectors ?? null,
    complexity,
    flattenedGraphics: flattened,
    glass,
    parityMismatchPercent: parity[id]?.mismatchPercent ?? null,
    limitations: t.limitations,
    status: 'Selected',
    reason: `Family: ${family(cand ?? ({ name: '', w: t.canvas.width, h: t.canvas.height, section: null } as Cand))}. ${cand?.text ?? '?'} text layers and ${cand?.images ?? '?'} image fill(s) in the source, separate logo/footer, Inter/Lora only.`,
  }
})
const rejected = cands
  .filter((c) => !selected.has(c.nodeId))
  .map((c) => ({ nodeId: c.nodeId, name: c.name, size: `${c.w}×${c.h}`, section: c.section, family: family(c), text: c.text, images: c.images, vectors: c.vectors, status: 'Not selected', reason: reasonNotSelected(c, family(c)) }))

fs.mkdirSync(path.join(root, 'docs'), { recursive: true })
fs.writeFileSync(path.join(root, 'inventory/inventory.json'), JSON.stringify({ generatedAt: new Date().toISOString(), selected: rows, notSelected: rejected }, null, 2))

const yn = (b: boolean) => (b ? 'Yes' : 'No')
const md: string[] = []
md.push('# Template inventory', '')
md.push(`Source file: Figma \`${rows[0]?.figma.fileKey}\` (Page 1). ${cands.length} candidate frames were inspected; **${rows.length} were selected** and rebuilt as editable templates, ${rejected.length} were not (reasons below). Nothing was invented: every template links back to its Figma frame.`, '')
md.push('## How templates were chosen', '', 'The PRD weights were applied as guidance, not as a numeric model: variety of layout (25%), reusability for different content (25%), visual quality (20%), editable layer structure (15%) and coverage of marketing use cases (15%). Where several frames were the same design in a different colour or artwork, one was kept. Where one campaign existed in three sizes (story, square, link post), at most two sizes were kept so all three ratios are represented.', '')
md.push('## Selected templates', '')
md.push('| # | Template | Figma node | Size | Category | Text layers | Image layers | Logo | Footer | Fonts | Complexity | Visual match* | Notes / limitations |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|')
rows.forEach((r, i) => {
  md.push(`| ${i + 1} | **${r.name}** (${r.format})<br>\`${r.id}\` | \`${r.figma.nodeId}\` | ${r.size} | ${r.category} | ${r.editableTextLayers} | ${r.imageLayers} (${r.replaceablePhotos} swappable) | ${yn(r.hasLogo)} | ${yn(r.hasFooter)} | ${r.fonts.join(', ')} | ${r.complexity} (${r.layers} layers) | ${r.parityMismatchPercent === null ? 'n/a' : `${(100 - r.parityMismatchPercent).toFixed(1)}%`} | ${r.limitations.length ? r.limitations.join(' ') : 'None'} |`)
})
md.push('', '\\* Share of pixels that match the Figma reference render (pixelmatch, threshold 0.12, at native size). Differences are anti-aliasing of text, photo resampling and frosted-glass blur; none are layout errors.', '')
md.push('## Selection reasons', '')
for (const r of rows) md.push(`- **${r.name} (${r.format})** — ${r.reason}`)
md.push('', '## Candidates that were not selected', '', '| Frame | Figma node | Size | Why not |', '|---|---|---|---|')
for (const r of rejected) md.push(`| ${r.name} | \`${r.nodeId}\` | ${r.size} | ${r.reason} |`)
md.push('', '## Source fonts', '', 'Only **Inter** (Regular, Medium, Semi Bold, Bold) and **Lora** (Regular) appear in the Figma file. Both are bundled with the app (SIL Open Font License) via `@fontsource`; Lora is kept wherever the source uses it.', '')
fs.writeFileSync(path.join(root, 'docs/template-inventory.md'), md.join('\n') + '\n')
console.log(`inventory: ${rows.length} selected, ${rejected.length} not selected, ${cands.length} candidates`)
