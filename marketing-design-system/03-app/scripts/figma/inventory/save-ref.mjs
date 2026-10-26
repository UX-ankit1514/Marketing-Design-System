// node scripts/figma/inventory/save-ref.mjs <spilled __arnifiRefMany result>
// Saves each Figma reference render to inventory/refs/<templateId>.png (ids come from convert/manifest.json).
import fs from 'node:fs'
import path from 'node:path'
const here = import.meta.dirname
const manifest = JSON.parse(fs.readFileSync(path.join(here, '../convert/manifest.json'), 'utf8'))
const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const r = raw.result ?? raw
const outDir = path.resolve(here, '../../../inventory/refs')
fs.mkdirSync(outDir, { recursive: true })
for (const x of r.refs ?? [r]) {
  const meta = manifest.find((m) => m.nodeId === x.id)
  if (!meta) { console.log(`no manifest entry for ${x.id}`); continue }
  fs.writeFileSync(path.join(outDir, `${meta.id}.png`), Buffer.from(x.ref, 'base64'))
  console.log(`ref ${meta.id} ${x.w}x${x.h}`)
}
