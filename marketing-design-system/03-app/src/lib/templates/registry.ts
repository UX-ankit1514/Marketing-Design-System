import { parseTemplate } from '../validation'
import type { Template } from '../../types/template'

export interface TemplateLoadIssue {
  file: string
  error: string
}

const modules = import.meta.glob('../../data/templates/*.json', { eager: true, import: 'default' }) as Record<string, unknown>

function load() {
  const templates: Template[] = []
  const issues: TemplateLoadIssue[] = []
  for (const [file, raw] of Object.entries(modules)) {
    const r = parseTemplate(raw)
    // A broken template is reported, never allowed to take the library down.
    if (r.ok) templates.push(r.value)
    else issues.push({ file: file.split('/').pop() ?? file, error: r.error })
  }
  templates.sort((a, b) => (ORDER.get(a.id) ?? 999) - (ORDER.get(b.id) ?? 999) || a.name.localeCompare(b.name))
  return { templates, issues }
}

/** Library order (curated). Unlisted templates sort after these. */
const ORDER = new Map<string, number>(
  [
    'expand-uae-square',
    'expand-uae-story',
    'start-aed-4888-square',
    'start-aed-4888-story',
    'business-setup-simplified',
    'one-partner-story',
    'one-partner-link',
    'trusted-750-story',
    'trusted-750-link',
    'growth-opportunity-square',
    'growth-opportunity-story',
    'sales-marathon',
    'flag-day-skyline',
    'flag-day-landmark',
    'japan-cover-dark',
    'japan-cover-light',
    'japan-opportunities-dark',
    'japan-signpost-light',
    'japan-cards-dark',
    'japan-ai-handshake-dark',
  ].map((id, i) => [id, i]),
)

const loaded = load()
export const templates: readonly Template[] = loaded.templates
export const templateIssues: readonly TemplateLoadIssue[] = loaded.issues
export const getTemplate = (id: string) => templates.find((t) => t.id === id)
export const thumbnailUrl = (id: string) => `/thumbs/${id}.webp`
