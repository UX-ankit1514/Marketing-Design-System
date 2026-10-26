import { z } from 'zod'

/** What a layer is *for*. Drives the layers panel, the properties panel and brand controls. */
export const LayerRole = z.enum([
  'heading',
  'subheading',
  'body',
  'tagline',
  'cta',
  'logo',
  'footer',
  'photo',
  'icon',
  'badge',
  'decoration',
  'shape',
])
export type LayerRole = z.infer<typeof LayerRole>

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected #rrggbb')

export const Stop = z.object({ pos: z.number().min(0).max(1), color: hex, opacity: z.number().min(0).max(1) })

/** Gradient endpoints are normalised (0..1) to the layer's own box. */
export const Fill = z.discriminatedUnion('type', [
  z.object({ type: z.literal('solid'), color: hex, opacity: z.number().min(0).max(1).default(1) }),
  z.object({
    type: z.literal('linear'),
    x1: z.number(),
    y1: z.number(),
    x2: z.number(),
    y2: z.number(),
    stops: z.array(Stop).min(2),
    opacity: z.number().min(0).max(1).default(1),
  }),
  z.object({
    type: z.literal('radial'),
    cx: z.number(),
    cy: z.number(),
    r: z.number(),
    stops: z.array(Stop).min(2),
    opacity: z.number().min(0).max(1).default(1),
  }),
])
export type Fill = z.infer<typeof Fill>

export const Shadow = z.object({
  color: hex,
  opacity: z.number().min(0).max(1),
  offsetX: z.number(),
  offsetY: z.number(),
  blur: z.number().min(0),
})
export type Shadow = z.infer<typeof Shadow>

export const Clip = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  radius: z.number().default(0),
})
export type Clip = z.infer<typeof Clip>

const base = {
  id: z.string().min(1),
  name: z.string(),
  role: LayerRole,
  visible: z.boolean().default(true),
  /** Taken out of the project by the user (logo/footer/etc). Restorable; never rendered or exported. */
  removed: z.boolean().default(false),
  /** false = shown but not selectable (pure decoration). */
  editable: z.boolean().default(true),
  x: z.number(),
  y: z.number(),
  width: z.number().min(0),
  height: z.number().min(0),
  rotation: z.number().default(0),
  flipX: z.boolean().default(false),
  flipY: z.boolean().default(false),
  opacity: z.number().min(0).max(1).default(1),
  /** Layers that belong together in the panel (e.g. a footer block). */
  groupId: z.string().optional(),
  groupName: z.string().optional(),
  /** Parent frame clipping, in artboard coordinates. */
  clip: Clip.optional(),
  shadow: Shadow.optional(),
  /** Known fidelity gaps recorded by the importer, e.g. "glass-effect". */
  flags: z.array(z.string()).default([]),
}

export const TextRun = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  color: hex.optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.number().optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
  letterSpacing: z.number().optional(),
  underline: z.boolean().optional(),
})
export type TextRun = z.infer<typeof TextRun>

export const TextLayer = z.object({
  ...base,
  type: z.literal('text'),
  text: z.string(),
  fontFamily: z.string(),
  fontSize: z.number().positive(),
  fontWeight: z.number(),
  fontStyle: z.enum(['normal', 'italic']).default('normal'),
  color: hex,
  /** Line height in px (not a multiplier) so Figma values carry over exactly. */
  lineHeight: z.number().positive(),
  /** Letter spacing in px. */
  letterSpacing: z.number().default(0),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).default('left'),
  textCase: z.enum(['none', 'upper', 'lower', 'title']).default('none'),
  underline: z.boolean().default(false),
  /** Per-range overrides (coloured words in a heading, etc.). */
  runs: z.array(TextRun).default([]),
  /** true: box grows with the text (Figma "auto height"). false: fixed box, overflow is warned. */
  autoHeight: z.boolean().default(true),
  /** false = Figma "auto width": the text never wraps on its own, only at explicit line breaks. */
  wrap: z.boolean().default(true),
  verticalAlign: z.enum(['top', 'middle', 'bottom']).default('top'),
})
export type TextLayer = z.infer<typeof TextLayer>

export const ImageLayer = z.object({
  ...base,
  type: z.literal('image'),
  /** Asset path under /template-assets, or `idb:<assetId>` for a user upload. */
  src: z.string().min(1),
  naturalWidth: z.number().positive(),
  naturalHeight: z.number().positive(),
  fit: z.enum(['cover', 'contain']).default('cover'),
  /** Visible region of the source image, in source pixels (Figma crop). Overrides `fit` when present. */
  crop: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }).optional(),
  /** Offset of the image inside its box, in box px, set when the user drags it. */
  offsetX: z.number().default(0),
  offsetY: z.number().default(0),
  /** Extra zoom applied on top of `fit`/`crop`. 1 = original. */
  zoom: z.number().positive().default(1),
  radius: z.number().default(0),
  /** User can swap this image (photos, not logos). */
  replaceable: z.boolean().default(true),
})
export type ImageLayer = z.infer<typeof ImageLayer>

export const ShapeLayer = z.object({
  ...base,
  type: z.literal('shape'),
  shape: z.enum(['rect', 'ellipse']),
  fills: z.array(Fill).default([]),
  stroke: z
    .object({
      color: hex,
      width: z.number().positive(),
      opacity: z.number().min(0).max(1).default(1),
      align: z.enum(['inside', 'center', 'outside']).default('center'),
    })
    .optional(),
  radius: z.number().default(0),
})
export type ShapeLayer = z.infer<typeof ShapeLayer>

/** A flattened vector group or illustration shipped as one SVG/PNG (logo, icon, skyline art). */
export const GraphicLayer = z.object({
  ...base,
  type: z.literal('graphic'),
  src: z.string().min(1),
  naturalWidth: z.number().positive(),
  naturalHeight: z.number().positive(),
})
export type GraphicLayer = z.infer<typeof GraphicLayer>

export const Layer = z.discriminatedUnion('type', [TextLayer, ImageLayer, ShapeLayer, GraphicLayer])
export type Layer = z.infer<typeof Layer>
export type LayerType = Layer['type']
