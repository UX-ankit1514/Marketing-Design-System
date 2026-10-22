// Paste this whole file into figma_execute once per Figma session (the functions then stay registered in the
// plugin until Figma restarts). It is READ-ONLY: it never changes the Figma file.
// Then call, e.g.:  return await globalThis.__arnifiRunMany(['1:2349'], skipImageKeys)
//   __arnifiExtract(frameId, skip)  -> {template, assets, report} for one poster frame
//   __arnifiRunMany(ids, skip)      -> {results:[...], pad}   (pad forces the MCP to spill big results to a file)
//   __arnifiRefMany(ids)            -> {refs:[{id,w,h,ref(base64 PNG)}], pad}   Figma reference renders
// Notes learnt the hard way:
//  - Figma's SVG export stalls on some nodes, so small graphics are exported as 3x PNG instead.
//  - Keep one frame with new photos per call: the MCP refuses results over 8 MB.
//  - Masks are flattened with their group; mirrored nodes carry flipX/flipY.
const pad = 'x'.repeat(400000)
globalThis.__arnifiExtract = async function (FRAME_ID, SKIP) {
const FILE_KEY = 's2yQZ85TPB02pKuvfwTCgk'
const frame = await figma.getNodeByIdAsync(FRAME_ID)
const FX = frame.absoluteTransform[0][2]
const FY = frame.absoluteTransform[1][2]
const layers = []
const assets = {}
const fonts = {}
const report = { scaleModes: {}, effects: {}, masks: 0, flipped: 0, blend: {}, vectorsFlattened: 0, hidden: 0 }
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function b64(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2]
    s += B64[a >> 2] + B64[((a & 3) << 4) | ((b || 0) >> 4)]
    s += i + 1 < bytes.length ? B64[((b & 15) << 2) | ((c || 0) >> 6)] : '='
    s += i + 2 < bytes.length ? B64[c & 63] : '='
  }
  return s
}
const rnd = (v) => Math.round(v * 100) / 100
const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'layer'
let counter = 0
const nextKey = (base, ext) => slug(base) + '-' + ++counter + '.' + ext
function ap(m, x, y) { return [m[0][0] * x + m[0][1] * y + m[0][2], m[1][0] * x + m[1][1] * y + m[1][2]] }
function inv(m) {
  const det = m[0][0] * m[1][1] - m[0][1] * m[1][0]
  return [[m[1][1] / det, -m[0][1] / det, (m[0][1] * m[1][2] - m[0][2] * m[1][1]) / det], [-m[1][0] / det, m[0][0] / det, (m[0][2] * m[1][0] - m[0][0] * m[1][2]) / det]]
}
function geom(n) {
  const t = n.absoluteTransform
  const rot = (Math.atan2(t[1][0], t[0][0]) * 180) / Math.PI
  if (t[0][0] * t[1][1] - t[0][1] * t[1][0] < 0) report.flipped++
  const axis = Math.abs(t[0][1]) < 1e-6 && Math.abs(t[1][0]) < 1e-6
  if (axis && (t[0][0] < 0 || t[1][1] < 0)) {
    const fx = t[0][0] < 0, fy = t[1][1] < 0
    return { x: rnd(t[0][2] - FX - (fx ? n.width : 0)), y: rnd(t[1][2] - FY - (fy ? n.height : 0)), width: rnd(n.width), height: rnd(n.height), rotation: 0, flipX: fx, flipY: fy }
  }
  return { x: rnd(t[0][2] - FX), y: rnd(t[1][2] - FY), width: rnd(n.width), height: rnd(n.height), rotation: rnd(rot) }
}
function bbox(n) {
  const b = n.absoluteBoundingBox
  return b ? { x: b.x - FX, y: b.y - FY, width: b.width, height: b.height } : null
}
function fillOf(p) {
  if (p.visible === false) return null
  const opacity = p.opacity === undefined ? 1 : p.opacity
  if (p.type === 'SOLID') return { type: 'solid', color: hex(p.color), opacity }
  if (p.type === 'GRADIENT_LINEAR' || p.type === 'GRADIENT_RADIAL') {
    const stops = p.gradientStops.map((s) => ({ pos: rnd(s.position), color: hex(s.color), opacity: rnd(s.color.a === undefined ? 1 : s.color.a) }))
    const m = inv(p.gradientTransform)
    if (p.type === 'GRADIENT_LINEAR') {
      const a = ap(m, 0, 0.5), b = ap(m, 1, 0.5)
      return { type: 'linear', x1: rnd(a[0]), y1: rnd(a[1]), x2: rnd(b[0]), y2: rnd(b[1]), stops, opacity }
    }
    const c = ap(m, 0.5, 0.5), e = ap(m, 1, 0.5)
    return { type: 'radial', cx: rnd(c[0]), cy: rnd(c[1]), r: rnd(Math.hypot(e[0] - c[0], e[1] - c[1])), stops, opacity }
  }
  return null
}
function effectsOf(n) {
  const out = { shadow: undefined, flags: [] }
  const list = 'effects' in n && n.effects ? n.effects : []
  for (const e of list) {
    if (e.visible === false) continue
    report.effects[e.type] = (report.effects[e.type] || 0) + 1
    if (e.type === 'DROP_SHADOW' && !out.shadow) {
      out.shadow = { color: hex(e.color), opacity: rnd(e.color.a), offsetX: rnd(e.offset.x), offsetY: rnd(e.offset.y), blur: rnd(e.radius) }
    } else { out.flags.push('effect:' + e.type.toLowerCase()); if (e.type === 'GLASS') out.flags.push('glass-radius:' + rnd(e.radius)) }
  }
  if ('blendMode' in n && n.blendMode !== 'NORMAL' && n.blendMode !== 'PASS_THROUGH') {
    report.blend[n.blendMode] = (report.blend[n.blendMode] || 0) + 1
    out.flags.push('blend:' + n.blendMode.toLowerCase())
  }
  return out
}
function radiusOf(n) {
  if (!('cornerRadius' in n)) return 0
  if (n.cornerRadius === figma.mixed) return rnd(n.topLeftRadius || 0)
  return rnd(n.cornerRadius || 0)
}
function clipFor(ctx, box) {
  if (!ctx.clips.length || !box) return undefined
  let r = ctx.clips[0]
  for (const c of ctx.clips.slice(1)) {
    const x1 = Math.max(r.x, c.x), y1 = Math.max(r.y, c.y)
    const x2 = Math.min(r.x + r.width, c.x + c.width), y2 = Math.min(r.y + r.height, c.y + c.height)
    r = { x: x1, y: y1, width: Math.max(0, x2 - x1), height: Math.max(0, y2 - y1), radius: c.radius }
  }
  const inside = box.x >= r.x - 0.5 && box.y >= r.y - 0.5 && box.x + box.width <= r.x + r.width + 0.5 && box.y + box.height <= r.y + r.height + 0.5
  if (inside && !r.radius) return undefined
  return { x: rnd(r.x), y: rnd(r.y), width: rnd(r.width), height: rnd(r.height), radius: rnd(r.radius || 0) }
}
function common(n, ctx, extraFlags) {
  const g = geom(n)
  const fx = effectsOf(n)
  const box = Math.abs(g.rotation) > 0.01 ? bbox(n) : g
  const o = {
    name: n.name,
    visible: ctx.visible && n.visible !== false,
    ...g,
    opacity: rnd(ctx.opacity * ('opacity' in n ? n.opacity : 1)),
    groupId: ctx.group ? ctx.group.id : undefined,
    groupName: ctx.group ? ctx.group.name : undefined,
    clip: clipFor(ctx, box),
    shadow: fx.shadow,
    flags: fx.flags.concat(extraFlags || []),
    _hint: { node: n.id, path: ctx.path },
  }
  if (!o.visible) report.hidden++
  return o
}
function countVectors(n) {
  let v = 0, other = 0
  const walk = (x) => {
    if (['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'POLYGON', 'LINE'].includes(x.type)) v++
    else if ('children' in x) for (const c of x.children) walk(c)
    else other++
  }
  walk(n)
  return { v, other }
}
function hasTextOrImage(n) {
  if (n.type === 'TEXT') return true
  if ('fills' in n && Array.isArray(n.fills) && n.fills.some((f) => f.type === 'IMAGE' && f.visible !== false)) return true
  if ('children' in n) return n.children.some(hasTextOrImage)
  return false
}
function hasMaskChild(n) { return 'children' in n && n.children.some(function (c) { return c.isMask }) }
function isGraphicUnit(n) {
  if (hasTextOrImage(n)) return false
  return countVectors(n).v > 0
}

  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('export timeout')), ms))])
  async function safeExport(n, settings) {
    try { return await withTimeout(n.exportAsync(settings), 4000) } catch (_e1) {
      try { return await withTimeout(n.exportAsync(settings.format === 'PNG' ? settings : { format: 'SVG_STRING' }), 4000) } catch (_e2) {
        (report.retries = report.retries || []).push(n.id + ' ' + n.name)
        return await withTimeout(n.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } }), 6000)
      }
    }
  }
async function pushGraphic(n, ctx) {
  const { v } = countVectors(n)
  const rotated = Math.abs(geom(n).rotation) > 0.01
  const bb = bbox(n)
  if (!bb) return
  const flat = hasMaskChild(n) || v > 60 || ('effects' in n && n.effects.some((e) => e.visible !== false && e.type !== 'DROP_SHADOW'))
  const heavy = true
  let key, mime
  const settings = heavy
    ? { format: 'PNG', constraint: { type: 'SCALE', value: (bb.width > 600 || bb.height > 600) ? 1 : 3 }, useAbsoluteBounds: true }
    : { format: 'SVG_STRING', svgOutlineText: true, svgIdAttribute: false, useAbsoluteBounds: true }
  const data = heavy ? await safeExport(n, settings) : null
  if (heavy) {
    key = nextKey(n.name, 'png'); mime = 'image/png'
    assets[key] = { mime, b64: b64(data) }
    report.vectorsFlattened += v
  } else {
    key = nextKey(n.name, 'svg'); mime = 'image/svg+xml'
    assets[key] = { mime, pendingSvg: n.id }
  }
  const o = common(n, ctx, flat ? ['flattened:' + v + '-vectors'] : [])
  if (rotated) Object.assign(o, { x: rnd(bb.x), y: rnd(bb.y), width: rnd(bb.width), height: rnd(bb.height), rotation: 0 })
  layers.push({ type: 'graphic', src: key, naturalWidth: Math.round(bb.width), naturalHeight: Math.round(bb.height), ...o })
}
async function pushImage(n, paint, ctx) {
  const hash = paint.imageHash
  const img = figma.getImageByHash(hash)
  const size = await img.getSizeAsync()
  const bytes = await img.getBytesAsync()
  const ext = bytes[0] === 0x89 ? 'png' : bytes[0] === 0xff ? 'jpg' : bytes[0] === 0x47 ? 'gif' : 'bin'
  const key = 'img-' + hash.slice(0, 10) + '.' + ext
  if (!assets[key]) assets[key] = SKIP.some(function (k) { return key.indexOf(k) === 0 }) ? { skip: true } : { mime: 'image/' + ext, b64: b64(bytes) }
  report.scaleModes[paint.scaleMode] = (report.scaleModes[paint.scaleMode] || 0) + 1
  const w = n.width, h = n.height, iw = size.width, ih = size.height
  const o = common(n, ctx, paint.scaleMode === 'TILE' ? ['image-tiled'] : [])
  let fit = 'cover', crop
  if (paint.scaleMode === 'FIT') fit = 'contain'
  else if (paint.scaleMode === 'CROP' && paint.imageTransform) {
    const t = paint.imageTransform
    const a = ap(t, 0, 0), b = ap(t, 1, 1)
    crop = { x: rnd(a[0] * iw), y: rnd(a[1] * ih), width: rnd((b[0] - a[0]) * iw), height: rnd((b[1] - a[1]) * ih) }
  } else {
    const s = Math.max(w / iw, h / ih)
    const vw = w / s, vh = h / s
    crop = { x: rnd((iw - vw) / 2), y: rnd((ih - vh) / 2), width: rnd(vw), height: rnd(vh) }
  }
  if (paint.opacity !== undefined && paint.opacity < 1) o.opacity = rnd(o.opacity * paint.opacity)
  layers.push({ type: 'image', src: key, naturalWidth: iw, naturalHeight: ih, fit, crop, radius: radiusOf(n), ...o })
}
async function emitBody(n, ctx, isRoot) {
  const fills = n.fills === figma.mixed || !('fills' in n) ? [] : n.fills.filter((f) => f.visible !== false)
  const strokes = 'strokes' in n && n.strokes ? n.strokes.filter((s) => s.visible !== false && s.type === 'SOLID') : []
  const first = layers.length
  let run = []
  const kind = n.type === 'ELLIPSE' ? 'ellipse' : 'rect'
  const flushRun = () => {
    if (!run.length) return
    layers.push({ type: 'shape', shape: kind, fills: run, radius: radiusOf(n), ...common(n, ctx) })
    run = []
  }
  if (isRoot && fills.length === 1 && fills[0].type === 'SOLID' && (fills[0].opacity === undefined || fills[0].opacity === 1)) return hex(fills[0].color)
  for (const p of fills) {
    if (p.type === 'IMAGE') { flushRun(); await pushImage(n, p, ctx) }
    else {
      const f = fillOf(p)
      if (f) run.push(f)
      else { flushRun(); layers.push({ type: 'shape', shape: kind, fills: [], radius: radiusOf(n), ...common(n, ctx, ['unsupported-fill:' + p.type.toLowerCase()]) }) }
    }
  }
  flushRun()
  if (strokes.length && n.strokeWeight > 0) {
    const s = strokes[0]
    const stroke = { color: hex(s.color), width: rnd(n.strokeWeight), opacity: s.opacity === undefined ? 1 : s.opacity, align: n.strokeAlign === 'INSIDE' ? 'inside' : n.strokeAlign === 'OUTSIDE' ? 'outside' : 'center' }
    const last = layers[layers.length - 1]
    if (layers.length > first && last.type === 'shape') last.stroke = stroke
    else layers.push({ type: 'shape', shape: kind, fills: [], stroke, radius: radiusOf(n), ...common(n, ctx) })
  }
  if (layers.length === first && 'effects' in n && n.effects.some((e) => e.visible !== false) && !isRoot) {
    layers.push({ type: 'shape', shape: kind, fills: [], radius: radiusOf(n), ...common(n, ctx) })
  }
  return undefined
}
function emitText(n, ctx) {
  const segs = n.getStyledTextSegments(['fontName', 'fontSize', 'fontWeight', 'fills', 'letterSpacing', 'lineHeight', 'textDecoration', 'textCase'])
  const colorOf = (s) => {
    const p = (s.fills || []).find((f) => f.visible !== false)
    if (!p) return '#000000'
    if (p.type === 'SOLID') return hex(p.color)
    if (p.gradientStops) return hex(p.gradientStops[0].color)
    return '#000000'
  }
  const lhPx = (s) => (s.lineHeight.unit === 'PIXELS' ? s.lineHeight.value : s.lineHeight.unit === 'PERCENT' ? (s.lineHeight.value / 100) * s.fontSize : s.fontSize * 1.21)
  const lsPx = (s) => (s.letterSpacing.unit === 'PIXELS' ? s.letterSpacing.value : (s.letterSpacing.value / 100) * s.fontSize)
  const style = (s) => ({
    fontFamily: s.fontName.family,
    fontStyle: /italic/i.test(s.fontName.style) ? 'italic' : 'normal',
    fontWeight: s.fontWeight,
    fontSize: rnd(s.fontSize),
    color: colorOf(s),
    letterSpacing: rnd(lsPx(s)),
    underline: s.textDecoration === 'UNDERLINE',
    lineHeight: rnd(lhPx(s)),
    textCase: s.textCase,
  })
  let base = segs[0]
  for (const s of segs) if (s.end - s.start > base.end - base.start) base = s
  const b = style(base)
  const runs = []
  for (const s of segs) {
    const st = style(s)
    const diff = {}
    for (const k of ['fontFamily', 'fontStyle', 'fontWeight', 'fontSize', 'color', 'letterSpacing', 'underline']) if (st[k] !== b[k]) diff[k] = st[k]
    if (Object.keys(diff).length) runs.push({ start: s.start, end: s.end, ...diff })
    fonts[st.fontFamily + '|' + st.fontWeight + '|' + st.fontStyle] = { family: st.fontFamily, weight: st.fontWeight, style: st.fontStyle }
  }
  const opacity = (() => { const p = (base.fills || []).find((f) => f.visible !== false); return p && p.opacity !== undefined ? p.opacity : 1 })()
  const o = common(n, ctx)
  o.opacity = rnd(o.opacity * opacity)
  layers.push({
    type: 'text',
    text: n.characters,
    fontFamily: b.fontFamily, fontSize: b.fontSize, fontWeight: b.fontWeight, fontStyle: b.fontStyle, color: b.color,
    lineHeight: b.lineHeight, letterSpacing: b.letterSpacing,
    textAlign: n.textAlignHorizontal.toLowerCase(),
    textCase: b.textCase === 'UPPER' ? 'upper' : b.textCase === 'LOWER' ? 'lower' : b.textCase === 'TITLE' ? 'title' : 'none',
    underline: b.underline,
    runs,
    autoHeight: n.textAutoResize === 'HEIGHT' || n.textAutoResize === 'WIDTH_AND_HEIGHT',
    wrap: n.textAutoResize !== 'WIDTH_AND_HEIGHT',
    verticalAlign: n.textAlignVertical === 'CENTER' ? 'middle' : n.textAlignVertical === 'BOTTOM' ? 'bottom' : 'top',
    ...o,
  })
}
async function emit(n, ctx) {
  try { await emitInner(n, ctx) } catch (e) { (report.errors = report.errors || []).push(n.id + ' ' + n.name + ': ' + e.message) }
}
function emitLine(n, ctx) {
  const s = (n.strokes || []).find(function (x) { return x.visible !== false && x.type === 'SOLID' })
  if (!s) return
  const sw = Math.max(n.strokeWeight || 1, 1)
  const o = common(n, ctx)
  o.y = rnd(o.y - sw / 2); o.height = sw
  layers.push({ type: 'shape', shape: 'rect', fills: [{ type: 'solid', color: hex(s.color), opacity: s.opacity === undefined ? 1 : s.opacity }], radius: 0, ...o })
}
async function emitInner(n, ctx) {
  if (n.isMask) { report.masks++; return }
  switch (n.type) {
    case 'TEXT': return emitText(n, ctx)
    case 'RECTANGLE': case 'ELLIPSE': return void (await emitBody(n, ctx, false))
    case 'LINE': return emitLine(n, ctx)
    case 'VECTOR': case 'BOOLEAN_OPERATION': case 'STAR': case 'POLYGON':
      return pushGraphic(n, ctx)
    case 'FRAME': case 'GROUP': case 'INSTANCE': case 'COMPONENT': case 'COMPONENT_SET': {
      if (hasMaskChild(n) || isGraphicUnit(n)) return pushGraphic(n, ctx)
      const path = ctx.path.concat(n.name)
      const g = { id: n.id, name: n.name }
      const inner = { visible: ctx.visible && n.visible !== false, opacity: ctx.opacity * (n.opacity === undefined ? 1 : n.opacity), clips: ctx.clips, group: g, path }
      if (n.type !== 'GROUP') {
        await emitBody(n, { ...ctx, group: ctx.group, path }, false)
        if (n.clipsContent) {
          const bb = bbox(n)
          if (bb) inner.clips = ctx.clips.concat({ ...bb, radius: radiusOf(n) })
        }
      }
      for (const c of n.children) await emit(c, inner)
      return
    }
    default:
      return
  }
}
const rootCtx = { visible: true, opacity: 1, clips: [], group: null, path: [] }
const background = (await emitBody(frame, rootCtx, true)) || '#ffffff'
for (const c of frame.children) await emit(c, rootCtx)
return {
  template: {
    schemaVersion: 1,
    name: frame.name.trim(),
    source: { type: 'figma', fileKey: FILE_KEY, nodeId: frame.id, frameName: frame.name },
    canvas: { width: Math.round(frame.width), height: Math.round(frame.height), background },
    fonts: Object.values(fonts),
    layers,
  },
  assets,
  report,
}
}

globalThis.__arnifiRef = async function (id) {
  const n = await figma.getNodeByIdAsync(id)
  const bytes = await n.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1 } })
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let s = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2]
    s += B64[a >> 2] + B64[((a & 3) << 4) | ((b || 0) >> 4)] + (i + 1 < bytes.length ? B64[((b & 15) << 2) | ((c || 0) >> 6)] : '=') + (i + 2 < bytes.length ? B64[c & 63] : '=')
  }
  return { id, w: n.width, h: n.height, ref: s }
}

globalThis.__arnifiRunMany = async (ids, skip) => {
  const seen = (skip || []).slice();
  const results = [];
  for (const id of ids) {
    const r = await globalThis.__arnifiExtract(id, seen);
    for (const k of Object.keys(r.assets)) if (k.indexOf('img-') === 0 && !r.assets[k].skip) seen.push(k.replace(/\.[a-z]+$/, ''));
    results.push(r);
  }
  return { results, pad };
}

globalThis.__arnifiRefMany = async (ids) => { const refs = []; for (const id of ids) refs.push(await globalThis.__arnifiRef(id)); return { refs, pad }; }
