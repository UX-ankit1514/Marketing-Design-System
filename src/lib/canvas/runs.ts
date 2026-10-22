import type { TextRun } from '../../types/layer'

/**
 * Keep per-range styling (e.g. the orange words in a heading) attached to the right characters
 * when the text changes. Works on the common prefix/suffix of old and new text:
 * runs before the edit stay, runs after it shift, runs the edit lies inside grow or shrink with it.
 */
export function adjustRuns(oldText: string, newText: string, runs: readonly TextRun[]): TextRun[] {
  if (oldText === newText) return runs.map((r) => ({ ...r }))
  let pre = 0
  const maxPre = Math.min(oldText.length, newText.length)
  while (pre < maxPre && oldText[pre] === newText[pre]) pre++
  let suf = 0
  while (suf < oldText.length - pre && suf < newText.length - pre && oldText[oldText.length - 1 - suf] === newText[newText.length - 1 - suf]) suf++
  const oldEnd = oldText.length - suf // exclusive end of changed region in old text
  const delta = newText.length - oldText.length
  const out: TextRun[] = []
  for (const r of runs) {
    let { start, end } = r
    if (end <= pre) {
      // entirely before the edit
    } else if (start >= oldEnd) {
      start += delta
      end += delta
    } else if (start <= pre && end >= oldEnd) {
      // edit sits inside this run: it stretches
      end += delta
    } else if (start < pre) {
      end = pre // run overlaps the start of the edit: keep the part before it
    } else if (end > oldEnd) {
      start = pre + (newText.length - pre - suf) // overlaps the end: keep the part after it
      end += delta
    } else {
      continue // run was inside the replaced region
    }
    start = Math.max(0, Math.min(start, newText.length))
    end = Math.max(0, Math.min(end, newText.length))
    if (end > start) out.push({ ...r, start, end })
  }
  return out
}

/** Fabric keeps styles per text line / per char; convert from our flat run ranges. */
export function runsToFabricStyles(text: string, runs: readonly TextRun[]): Record<number, Record<number, Record<string, unknown>>> {
  const styles: Record<number, Record<number, Record<string, unknown>>> = {}
  if (!runs.length) return styles
  const lines = text.split('\n')
  let offset = 0
  lines.forEach((line, li) => {
    for (let ci = 0; ci < line.length; ci++) {
      const idx = offset + ci
      let merged: Record<string, unknown> | undefined
      for (const r of runs) {
        if (idx >= r.start && idx < r.end) {
          merged ??= {}
          if (r.color) merged.fill = r.color
          if (r.fontFamily) merged.fontFamily = r.fontFamily
          if (r.fontSize) merged.fontSize = r.fontSize
          if (r.fontWeight) merged.fontWeight = r.fontWeight
          if (r.fontStyle) merged.fontStyle = r.fontStyle
          if (r.underline !== undefined) merged.underline = r.underline
        }
      }
      if (merged) (styles[li] ??= {})[ci] = merged
    }
    offset += line.length + 1
  })
  return styles
}
