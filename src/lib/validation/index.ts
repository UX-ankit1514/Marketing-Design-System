import type { z } from 'zod'
import { Project, ProjectFile } from '../../types/project'
import { Template } from '../../types/template'

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string }

function run<S extends z.ZodType>(schema: S, input: unknown): ParseResult<z.infer<S>> {
  const r = schema.safeParse(input)
  if (r.success) return { ok: true, value: r.data }
  const issue = r.error.issues[0]
  const path = issue?.path.join('.') || 'file'
  return { ok: false, error: `${path}: ${issue?.message ?? 'invalid'}` }
}

export const parseTemplate = (input: unknown) => run(Template, input)
export const parseProject = (input: unknown) => run(Project, input)
export const parseProjectFile = (input: unknown) => run(ProjectFile, input)
