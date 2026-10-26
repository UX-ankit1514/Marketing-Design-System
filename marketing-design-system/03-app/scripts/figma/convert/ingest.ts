/**
 * Turns one spilled figma_execute result (from scripts/figma/inspect/extract.js) into
 *   src/data/templates/<id>.json  +  public/template-assets/**
 *
 *   npx tsx scripts/figma/convert/ingest.ts <result-file> [--svgs <svg-file>]      (a __arnifiRunMany batch; metadata from manifest.json)
 *
 * Per-template fixes live in scripts/figma/convert/overrides/<id>.json:
 *   { "drop": [rawIndex], "set": { "<rawIndex>": { role, name, editable, replaceable, ... } } }
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { Template, TEMPLATE_SCHEMA_VERSION } from '../../../src/types/template'
import { inferRole, isEditableRole } from './roles'

const root = path.resolve(import.meta.dirname, '../../..')
const args = process.argv.slice(2)
const file = args[0]
const opt = (k: string) => {
  const i = args.indexOf('--' + k)
  return i >= 0 ? args[i + 1] : undefined
}
if (!file) throw new Error('usage: ingest.ts <result-file> [--svgs <svg-file>]')

const readResult = (f: string) => {
  const raw = JSON.parse(fs.readFileSync(f, 'utf8'))
  return raw.result ?? raw
}
const batch = readResult(file)
const results: any[] = batch.results ?? [batch]
const svgFile = opt('svgs')
const svgs: Record<string, string> = svgFile ? (readResult(svgFile).svgs ?? {}) : {}
const manifest: any[] = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'manifest.json'), 'utf8'))

const sharedDir = path.join(root, 'public/template-assets/_shared')
fs.mkdirSync(sharedDir, { recursive: true })

const LABEL: Record<string, string> = { icon: 'Icon', logo: 'Arnifi logo', photo: 'Photo', decoration: 'Decoration', shape: 'Shape', cta: 'Button', footer: 'Footer', badge: 'Badge' }

async function ingestOne(data: any, meta: any) {
  const { id } = meta
  const { template: draft, assets, report } = data as { template: any; assets: Record<string, any>; report: any }
  const ownDir = path.join(root, 'public/template-assets', id)
  fs.rmSync(ownDir, { recursive: true, force: true })
  fs.mkdirSync(ownDir, { recursive: true })

  // key (as extracted) -> public URL
  const urlOf: Record<string, string> = {}
  for (const [key, a] of Object.entries<any>(assets)) {
    const shared = key.startsWith('img-')
    const dir = shared ? sharedDir : ownDir
    const base = key.replace(/\.[a-z]+$/, '')
    if (a.skip) {
      const found = fs.readdirSync(sharedDir).find((f) => f.startsWith(base + '.'))
      if (!found) throw new Error(`asset ${key} was skipped but is not on disk`)
      urlOf[key] = `/template-assets/_shared/${found}`
      continue
    }
    if (a.pendingSvg) {
      const text = svgs[a.pendingSvg]
      if (!text) throw new Error(`asset ${key}: SVG for node ${a.pendingSvg} missing - pass --svgs <file>`)
      a.text = text
    }
    if (a.text !== undefined) {
      fs.writeFileSync(path.join(dir, key), a.text)
      urlOf[key] = `/template-assets/${id}/${key}`
      continue
    }
    const buf = Buffer.from(a.b64, 'base64')
    const img = sharp(buf)
    const m = await img.metadata()
    let outName = key
    let out: Buffer
    if (shared && !m.hasAlpha) {
      outName = base + '.jpg'
      out = await img.jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true }).toBuffer()
    } else {
      out = m.format === 'png' ? await img.png({ compressionLevel: 9 }).toBuffer() : buf
    }
    fs.writeFileSync(path.join(dir, outName), out)
    urlOf[key] = shared ? `/template-assets/_shared/${outName}` : `/template-assets/${id}/${outName}`
  }

  const overridePath = path.join(import.meta.dirname, 'overrides', `${id}.json`)
  const ov = fs.existsSync(overridePath) ? JSON.parse(fs.readFileSync(overridePath, 'utf8')) : {}
  const drop = new Set<number>(ov.drop ?? [])
  const canvas = draft.canvas
  const kept = (draft.layers as any[]).map((l, i) => ({ l, i })).filter(({ i }) => !drop.has(i))
  const counts: Record<string, number> = {}

  const cleanName = (l: any, role: string) => {
    if (l.type === 'text') {
      const t = String(l.text).replace(/\s+/g, ' ').trim()
      return t.length > 32 ? t.slice(0, 31) + '…' : t
    }
    const generic = /^(Frame|Group|Rectangle|Ellipse|Vector|Mask group|image|Line)\s*\d*$/i.test(String(l.name).trim())
    return generic || role === 'logo' || role === 'photo' ? LABEL[role] ?? 'Layer' : String(l.name)
  }

  const groupSize: Record<string, number> = {}
  for (const { l } of kept) if (l.groupId) groupSize[l.groupId] = (groupSize[l.groupId] ?? 0) + 1
  const all = kept.map(({ l }) => l)
  const layers = kept.map(({ l, i }) => {
    const set = ov.set?.[String(i)] ?? {}
    const role = set.role ?? inferRole(l, all, canvas)
    counts[role] = (counts[role] ?? 0) + 1
    const out: any = { ...l, ...set }
    delete out._hint
    out.role = role
    out.id = `${role}-${counts[role]}`
    out.name = set.name ?? cleanName(l, role)
    if (set.groupName) out.__fixedGroup = true
    if (set.name) out.__fixedName = true
    out.editable = set.editable ?? isEditableRole(role)
    if (out.textAlign === 'justified') out.textAlign = 'justify'
    if (l.type === 'image' || l.type === 'graphic') out.src = urlOf[l.src] ?? l.src
    if (l.type === 'image') out.replaceable = set.replaceable ?? role === 'photo'
    if (set.groupId === null || (set.groupId === undefined && (!l.groupId || groupSize[l.groupId] < 2))) {
      delete out.groupId
      delete out.groupName
    }
    for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k]
    return out
  })

  // Figma's nested groups are layout scaffolding, not something a marketer wants to see. Group by purpose instead.
  const box = (l: any) => ({ x: l.x, y: l.y, w: l.width, h: l.height })
  const inside = (l: any, b: { x: number; y: number; w: number; h: number }, pad = 0) => {
    const cx = l.x + l.width / 2, cy = l.y + l.height / 2
    return cx >= b.x - pad && cx <= b.x + b.w + pad && cy >= b.y - pad && cy <= b.y + b.h + pad
  }
  for (const l of layers) {
    if (!l.__fixedGroup) {
      delete l.groupId
      delete l.groupName
    }
  }
  const footerTexts = layers.filter((l) => l.role === 'footer' && l.type === 'text')
  if (footerTexts.length) {
    const fb = footerTexts.reduce((a, l) => ({ x: Math.min(a.x, l.x), y: Math.min(a.y, l.y), w: Math.max(a.x + a.w, l.x + l.width) - Math.min(a.x, l.x), h: Math.max(a.y + a.h, l.y + l.height) - Math.min(a.y, l.y) }), box(footerTexts[0]))
    for (const l of layers) {
      if (l.__fixedGroup) continue
      const near = l.role === 'footer' || (['icon', 'shape', 'decoration'].includes(l.role) && l.y > canvas.height * 0.8 && l.width < 160 && inside(l, { x: fb.x - 70, y: fb.y - 12, w: fb.w + 70, h: fb.h + 24 }))
      if (near) {
        l.groupId = 'footer'
        l.groupName = 'Footer'
        if (l.role !== 'footer' && l.role !== 'text') l.role = l.role === 'decoration' ? 'decoration' : 'icon'
      }
    }
  }
  const ctaShapes = layers.filter((l) => l.role === 'cta' && l.type === 'shape')
  ctaShapes.forEach((c, n) => {
    for (const l of layers) {
      if (l.__fixedGroup || l === c) continue
      if ((l.role === 'cta' || l.role === 'icon' || l.role === 'badge') && inside(l, box(c), 4) && !l.groupId) {
        l.groupId = `button-${n + 1}`
        l.groupName = ctaShapes.length > 1 ? `Button ${n + 1}` : 'Button'
      }
    }
    c.groupId = `button-${n + 1}`
    c.groupName = ctaShapes.length > 1 ? `Button ${n + 1}` : 'Button'
  })
  // Friendlier names for the pieces that only have scaffolding names.
  const texts = layers.filter((l) => l.type === 'text')
  const cardOf = (l: any) =>
    layers
      .filter((c) => c.type === 'shape' && c.role === 'shape' && c !== l && inside(l, box(c)) && c.width * c.height < canvas.width * canvas.height * 0.5)
      .sort((a, b) => a.width * a.height - b.width * b.height)[0]
  const textIn = (c: any) => texts.filter((t) => inside(t, box(c))).sort((a, b) => b.fontSize - a.fontSize)[0]
  const short = (t: any) => String(t.text).replace(/\s+/g, ' ').trim().slice(0, 22)
  for (const l of layers) {
    if (l.__fixedName) continue
    if (l.role === 'icon' && l.groupId === 'footer') l.name = 'Footer icon'
    else if (l.role === 'icon' && l.groupName?.startsWith('Button')) l.name = 'Button arrow'
    else if (l.role === 'icon') {
      const card = cardOf(l)
      const inCard = card && textIn(card)
      const beside = texts
        .filter((t) => t.x >= l.x + l.width - 4 && Math.abs(t.y + t.height / 2 - (l.y + l.height / 2)) < 60)
        .sort((a, b) => a.x - b.x)[0]
      const label = inCard || beside
      l.name = label ? `Icon · ${short(label)}` : 'Icon'
    } else if (l.role === 'shape') {
      const label = textIn(l)
      l.name = label ? `Card · ${short(label)}` : 'Shape'
    } else if (l.role === 'cta' && l.type === 'shape') l.name = 'Button background'
    else if (l.role === 'photo') l.name = l.width * l.height > canvas.width * canvas.height * 0.7 ? 'Background photo' : 'Photo'
    else if (l.role === 'decoration') l.name = l.type === 'shape' ? 'Overlay' : 'Illustration'
  }
  for (const l of layers) {
    delete l.__fixedGroup
    delete l.__fixedName
  }

  const limitations: string[] = []
  const flat = layers.filter((l) => (l.flags ?? []).some((f: string) => f.startsWith('flattened:')))
  if (flat.length) {
    const names = flat.slice(0, 3).map((l) => `"${l.name}"`).join(', ')
    limitations.push(`${flat.length} small graphic${flat.length > 1 ? 's' : ''} (${names}${flat.length > 3 ? ', …' : ''}) ${flat.length > 1 ? 'are' : 'is a'} single picture${flat.length > 1 ? 's' : ''}: ${flat.length > 1 ? 'they' : 'it'} move and resize, but ${flat.length > 1 ? 'their' : 'its'} parts can't be edited.`)
  }
  if (layers.some((l) => l.type === 'shape' && (l.flags ?? []).includes('effect:glass'))) limitations.push('Frosted-glass cards use a blurred-backdrop approximation of Figma’s glass effect, so the blur can differ slightly from the original.')
  for (const f of new Set(layers.flatMap((l) => l.flags ?? []))) {
    if (/^effect:(layer_blur|background_blur|inner_shadow)/.test(f)) limitations.push(`The "${f.slice(7).replace('_', ' ')}" effect is not reproduced.`)
    else if (f.startsWith('blend:')) limitations.push(`Blend mode "${f.slice(6)}" is not reproduced.`)
  }
  if (report?.errors?.length) limitations.push(`${report.errors.length} source layer(s) could not be read.`)

  const template = {
    schemaVersion: TEMPLATE_SCHEMA_VERSION,
    id,
    name: meta.name ?? draft.name,
    version: 1,
    category: meta.category ?? 'Campaign',
    tags: meta.tags ?? [],
    format: meta.format ?? `${canvas.width}×${canvas.height}`,
    source: draft.source,
    canvas,
    fonts: draft.fonts,
    layers,
    limitations: [...new Set(limitations)],
  }
  fs.mkdirSync(path.join(root, 'inventory/raw'), { recursive: true })
  fs.writeFileSync(path.join(root, 'inventory/raw', `${id}.json`), JSON.stringify({ result: { results: [{ ...data, pad: undefined }] } }))
  const parsed = Template.safeParse(template)
  if (!parsed.success) {
    for (const i of parsed.error.issues.slice(0, 8)) console.error(`INVALID ${id}`, i.path.join('.'), i.message)
    return false
  }
  const outFile = path.join(root, 'src/data/templates', `${id}.json`)
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(parsed.data, null, 2) + '\n')

  console.log(`OK ${id}  ${canvas.width}x${canvas.height} bg ${canvas.background}  ${layers.length} layers  fonts ${draft.fonts.map((f: any) => f.family + ' ' + f.weight).join(', ')}`)
  console.log('   report', JSON.stringify(report))
  if (args.includes('--list')) {
    layers.forEach((l, n) => {
      const bits = l.type === 'text' ? `"${String(l.text).slice(0, 26).replace(/\n/g, '⏎')}" ${l.fontFamily} ${l.fontWeight}/${l.fontSize}` : l.type === 'shape' ? `${l.shape} fills:${l.fills.length}` : String(l.src).split('/').pop()
      console.log(`   ${String(kept[n].i).padStart(2)} ${l.id.padEnd(13)} ${l.type.padEnd(7)} [${l.x},${l.y} ${l.width}x${l.height}]${l.rotation ? ' r' + l.rotation : ''}${l.visible ? '' : ' HIDDEN'}${l.clip ? ' clip' : ''}${l.shadow ? ' shadow' : ''} ${bits}${l.flags?.length ? ' !' + l.flags.join(',') : ''}${l.groupName ? ' <' + l.groupName + '>' : ''}`)
    })
  }
  return true
}

let ok = 0
for (const r of results) {
  if (!r.template) continue
  const meta = manifest.find((m) => m.nodeId === r.template.source.nodeId)
  if (!meta) {
    console.error(`no manifest entry for ${r.template.source.nodeId} (${r.template.name})`)
    continue
  }
  if (await ingestOne(r, meta)) ok++
}
console.log(`${ok}/${results.length} ingested`)
