import { describe, expect, it } from 'vitest'
import { adjustRuns, runsToFabricStyles } from '../../src/lib/canvas/runs'

const accent = (start: number, end: number) => ({ start, end, color: '#ffbb66' })

describe('adjustRuns (keeps coloured words attached while typing)', () => {
  const text = 'Expand Your Business to the UAE'
  const runs = [accent(12, 20)] // "Business"

  it('is a no-op for unchanged text', () => {
    expect(adjustRuns(text, text, runs)).toEqual(runs)
  })
  it('shifts runs that come after an edit', () => {
    const out = adjustRuns(text, 'Please ' + text, runs)
    expect(out).toEqual([accent(19, 27)])
  })
  it('keeps runs that come before an edit', () => {
    expect(adjustRuns(text, text + ' today', runs)).toEqual(runs)
  })
  it('stretches a run when text is typed inside it', () => {
    const out = adjustRuns(text, 'Expand Your Busin-ess to the UAE', runs)
    expect(out).toEqual([accent(12, 21)])
  })
  it('keeps the highlight when the highlighted word itself is replaced', () => {
    expect(adjustRuns(text, 'Expand Your Company to the UAE', runs)).toEqual([accent(12, 19)])
  })
  it('drops a run when the edit swallows it and more', () => {
    expect(adjustRuns(text, 'Expand X the UAE', runs)).toEqual([])
  })
  it('never produces ranges outside the text', () => {
    for (const next of ['', 'a', 'Expand', text.slice(5), text.repeat(2)]) {
      for (const r of adjustRuns(text, next, runs)) {
        expect(r.start).toBeGreaterThanOrEqual(0)
        expect(r.end).toBeLessThanOrEqual(next.length)
        expect(r.end).toBeGreaterThan(r.start)
      }
    }
  })
})

describe('runsToFabricStyles', () => {
  it('maps flat ranges to per-line, per-character styles', () => {
    const styles = runsToFabricStyles('ab\ncd', [accent(1, 4)])
    expect(styles[0][1]).toEqual({ fill: '#ffbb66' })
    expect(styles[1][0]).toEqual({ fill: '#ffbb66' })
    expect(styles[0][0]).toBeUndefined()
    expect(styles[1][1]).toBeUndefined()
  })
  it('returns nothing without runs', () => {
    expect(runsToFabricStyles('abc', [])).toEqual({})
  })
})
