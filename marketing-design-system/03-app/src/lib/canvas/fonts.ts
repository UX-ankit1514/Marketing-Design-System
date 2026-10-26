import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/lora/latin-400.css'
import '@fontsource/lora/latin-500.css'
import '@fontsource/lora/latin-600.css'
import '@fontsource/lora/latin-700.css'
import '@fontsource/lora/latin-400-italic.css'
import type { FontRef } from '../../types/template'

/** Families bundled with the app (OFL). Anything else is flagged as unavailable. */
export const BUNDLED_FAMILIES = ['Inter', 'Lora'] as const

export const fontStack = (family: string) =>
  `"${family}", ${family === 'Lora' ? 'Georgia, serif' : 'system-ui, -apple-system, "Segoe UI", sans-serif'}`

const fontSpec = (f: FontRef) => `${f.style === 'italic' ? 'italic ' : ''}${f.weight} 32px "${f.family}"`

/**
 * Loads every font a template uses and resolves with those that are not available, so the
 * editor can warn instead of silently claiming exact fidelity.
 */
export async function ensureFonts(fonts: readonly FontRef[]): Promise<FontRef[]> {
  const missing: FontRef[] = []
  await Promise.all(
    fonts.map(async (f) => {
      if (!(BUNDLED_FAMILIES as readonly string[]).includes(f.family)) return void missing.push(f)
      try {
        const loaded = await document.fonts.load(fontSpec(f), 'AaÀ')
        if (!loaded.length && !document.fonts.check(fontSpec(f))) missing.push(f)
      } catch {
        missing.push(f)
      }
    }),
  )
  await document.fonts.ready
  return missing
}
