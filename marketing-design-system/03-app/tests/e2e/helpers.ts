import { expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import { PNG } from 'pngjs'
import sharp from 'sharp'

export function solidPng(w: number, h: number, [r, g, b]: [number, number, number]) {
  const png = new PNG({ width: w, height: h })
  for (let i = 0; i < w * h; i++) {
    png.data[i * 4] = r
    png.data[i * 4 + 1] = g
    png.data[i * 4 + 2] = b
    png.data[i * 4 + 3] = 255
  }
  return PNG.sync.write(png)
}

export async function openTemplate(page: Page, id: string, name = 'My design') {
  await page.goto('/')
  await page.locator(`[data-template-id="${id}"]`).getByRole('button', { name: /^Use template/ }).click()
  await page.getByLabel('Project name').fill(name)
  await page.getByRole('button', { name: 'Create design' }).click()
  await expect(page.getByTestId('editor')).toBeVisible()
  await expect(page.locator('.stage__canvas canvas').first()).toBeVisible()
  // First paint of the poster (fonts + images) has finished once layer rows exist and the canvas has settled.
  await expect(page.getByTestId('layer-row').first()).toBeVisible()
  await page.waitForTimeout(600)
}

export const layerRow = (page: Page, text: string | RegExp) => page.getByTestId('layer-row').filter({ hasText: text }).first()

export async function selectLayer(page: Page, text: string | RegExp) {
  await layerRow(page, text).click()
  await expect(page.getByTestId('properties')).toBeVisible()
}

export interface Exported {
  buffer: Buffer
  fileName: string
  width: number
  height: number
  format: string
}

export async function exportAs(page: Page, format: 'png' | 'jpg'): Promise<Exported> {
  await page.getByTestId('export-button').click()
  const dlg = page.getByRole('dialog')
  await expect(dlg.locator('[data-testid=preview] img')).toBeVisible()
  await dlg.getByRole('button', { name: format.toUpperCase(), exact: true }).click()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-button').click()])
  const buffer = fs.readFileSync((await download.path())!)
  await expect(page.getByTestId('export-done')).toBeVisible()
  await dlg.getByRole('button', { name: 'Back to editing' }).click()
  const meta = await sharp(buffer).metadata()
  return { buffer, fileName: download.suggestedFilename(), width: meta.width!, height: meta.height!, format: meta.format! }
}

/** Count of pixels in a box that satisfy a predicate (box in output px). */
export async function countPixels(buffer: Buffer, box: [number, number, number, number], pred: (r: number, g: number, b: number) => boolean) {
  const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let n = 0
  for (let y = box[1]; y < box[3]; y++) {
    for (let x = box[0]; x < box[2]; x++) {
      const i = (y * info.width + x) * 3
      if (pred(data[i], data[i + 1], data[i + 2])) n++
    }
  }
  return n
}

/** Share of pixels that differ noticeably between two exports of the same size, inside a box. */
export async function diffShare(a: Buffer, b: Buffer, box: [number, number, number, number]) {
  const [A, B] = await Promise.all([sharp(a).removeAlpha().raw().toBuffer({ resolveWithObject: true }), sharp(b).removeAlpha().raw().toBuffer({ resolveWithObject: true })])
  let diff = 0
  let total = 0
  for (let y = box[1]; y < box[3]; y++) {
    for (let x = box[0]; x < box[2]; x++) {
      const i = (y * A.info.width + x) * 3
      total++
      if (Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]) > 60) diff++
    }
  }
  return diff / total
}

export const isWhiteish = (r: number, g: number, b: number) => r > 225 && g > 225 && b > 225
export const isMagentaish = (r: number, g: number, b: number) => r > 90 && b > 90 && g < 60 && Math.abs(r - b) < 70
