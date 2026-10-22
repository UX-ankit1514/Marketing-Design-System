/** Makes library thumbnails from the app's own render of each template (what you see is what you get). */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '../../..')
const src = path.join(root, 'inventory/parity')
const out = path.join(root, 'public/thumbs')
fs.mkdirSync(out, { recursive: true })
let n = 0
for (const f of fs.readdirSync(src)) {
  if (!f.endsWith('.png') || f.endsWith('-diff.png')) continue
  await sharp(path.join(src, f)).resize({ width: 520 }).webp({ quality: 82 }).toFile(path.join(out, f.replace('.png', '.webp')))
  n++
}
console.log(`${n} thumbnails -> public/thumbs`)
