/**
 * Renders templates in the real app (headless Chromium) and compares them with their Figma reference.
 *   npx tsx scripts/figma/validate/parity.ts [templateId ...]        (default: every template in src/data/templates)
 * Writes inventory/parity/<id>.png (our render), <id>-diff.png and inventory/parity/results.json.
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { createServer } from 'vite'

const root = path.resolve(import.meta.dirname, '../../..')
const ids = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(root, 'src/data/templates')).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''))
const outDir = path.join(root, 'inventory/parity')
fs.mkdirSync(outDir, { recursive: true })

const server = await createServer({ root, logLevel: 'error', server: { port: 5199, strictPort: true } })
await server.listen()
const browser = await chromium.launch()
const results: Record<string, unknown> = fs.existsSync(path.join(outDir, 'results.json')) ? JSON.parse(fs.readFileSync(path.join(outDir, 'results.json'), 'utf8')) : {}

for (const id of ids) {
  const tpl = JSON.parse(fs.readFileSync(path.join(root, 'src/data/templates', `${id}.json`), 'utf8'))
  const { width, height } = tpl.canvas
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(`http://localhost:5199/dev/parity/${id}`)
  try {
    await page.waitForSelector('#parity-root[data-state="ready"]', { timeout: 30000 })
  } catch {
    console.log(`${id}: NOT READY. page errors: ${errors.join(' | ') || 'none'}`)
    await page.close()
    continue
  }
  const rootEl = page.locator('#parity-root')
  const missing = await rootEl.getAttribute('data-missing-fonts')
  const failures = await rootEl.getAttribute('data-failures')
  const shot = await page.locator('#parity-root').screenshot()
  fs.writeFileSync(path.join(outDir, `${id}.png`), shot)
  await page.close()
  const refPath = path.join(root, 'inventory/refs', `${id}.png`)
  let mismatch: number | null = null
  if (fs.existsSync(refPath)) {
    const a = PNG.sync.read(fs.readFileSync(refPath))
    const b = PNG.sync.read(shot)
    if (a.width !== b.width || a.height !== b.height) {
      console.log(`${id}: size differs ref ${a.width}x${a.height} vs ${b.width}x${b.height}`)
    } else {
      const diff = new PNG({ width: a.width, height: a.height })
      const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.12, includeAA: false })
      mismatch = Math.round((n / (a.width * a.height)) * 10000) / 100
      fs.writeFileSync(path.join(outDir, `${id}-diff.png`), PNG.sync.write(diff))
    }
  }
  results[id] = { mismatchPercent: mismatch, missingFonts: missing || '', failures: failures || '', errors, at: new Date().toISOString() }
  console.log(`${id}: mismatch ${mismatch ?? 'n/a (no ref)'}%${missing ? ' missing-fonts:' + missing : ''}${failures ? ' FAILURES:' + failures : ''}${errors.length ? ' errors:' + errors.slice(0, 2).join(' | ') : ''}`)
}
fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2))
await browser.close()
await server.close()
