import { z } from 'zod'
import { Layer } from './layer'
import { Template } from './template'

export const PROJECT_FILE_KIND = 'arnifi-marketing-studio/project'

/** A user's working copy. The master template is never touched. */
export const Project = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Template it started from, or 'upload' for a user-supplied background. */
  templateId: z.string(),
  templateVersion: z.number().int().positive(),
  createdAt: z.number(),
  updatedAt: z.number(),
  canvas: Template.shape.canvas,
  fonts: Template.shape.fonts,
  layers: z.array(Layer).min(1),
  /** Untouched copy of the starting layers, so Reset works without the master template. */
  baseLayers: z.array(Layer).min(1),
})
export type Project = z.infer<typeof Project>

/** Portable file for "Save project" / re-import (layers stay editable). Images are inlined as data URLs. */
export const ProjectFile = z.object({
  kind: z.literal(PROJECT_FILE_KIND),
  version: z.literal(1),
  project: Project,
  assets: z.record(z.string(), z.string()).default({}),
})
export type ProjectFile = z.infer<typeof ProjectFile>
