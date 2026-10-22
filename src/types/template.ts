import { z } from 'zod'
import { Layer } from './layer'

export const TEMPLATE_SCHEMA_VERSION = 1

export const TemplateCategory = z.enum([
  'Business setup',
  'Campaign',
  'Announcement',
  'Promotion',
  'Partnership',
  'Event',
  'Education',
])
export type TemplateCategory = z.infer<typeof TemplateCategory>

export const FontRef = z.object({ family: z.string(), weight: z.number(), style: z.enum(['normal', 'italic']).default('normal') })
export type FontRef = z.infer<typeof FontRef>

export const Template = z.object({
  schemaVersion: z.literal(TEMPLATE_SCHEMA_VERSION),
  id: z.string().min(1),
  name: z.string().min(1),
  /** Bumped when a template's layers change, so projects can tell. */
  version: z.number().int().positive(),
  category: TemplateCategory,
  tags: z.array(z.string()).default([]),
  /** Short format label shown on cards, e.g. "Story". */
  format: z.string(),
  source: z.object({
    type: z.literal('figma'),
    fileKey: z.string(),
    nodeId: z.string(),
    frameName: z.string(),
  }),
  canvas: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    background: z.string(),
  }),
  fonts: z.array(FontRef).default([]),
  /** Bottom-to-top paint order. */
  layers: z.array(Layer).min(1),
  /** Plain-language notes about anything that could not be rebuilt as an editable object. */
  limitations: z.array(z.string()).default([]),
})
export type Template = z.infer<typeof Template>

/** Library index entry (cards read this, not the full template). */
export const TemplateIndexEntry = z.object({
  id: z.string(),
  name: z.string(),
  category: TemplateCategory,
  format: z.string(),
  width: z.number(),
  height: z.number(),
  file: z.string(),
  thumbnail: z.string(),
})
export type TemplateIndexEntry = z.infer<typeof TemplateIndexEntry>
