// node scripts/figma/inventory/pending-svgs.mjs <spilled __arnifiRunMany result>
// Prints the JSON array of node ids whose SVGs still have to be exported (call __arnifiSvgsRun with it).
import fs from 'node:fs'
const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const r = raw.result ?? raw
const ids = (r.results ?? [r]).flatMap((x) => Object.values(x.assets).map((a) => a.pendingSvg).filter(Boolean))
console.log(JSON.stringify([...new Set(ids)]))
console.error(`${(r.results ?? [r]).length} frames, ${ids.length} svgs, errors: ${JSON.stringify((r.results ?? [r]).map((x) => x.report.errors).flat().filter(Boolean))}`)
