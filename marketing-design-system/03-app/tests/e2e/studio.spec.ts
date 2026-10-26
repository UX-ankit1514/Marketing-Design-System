import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { countPixels, diffShare, exportAs, isMagentaish, isWhiteish, layerRow, openTemplate, selectLayer, solidPng } from './helpers'

const HEADING = /Expand Your Business/
const SUBHEAD = /Your Gateway/

test.describe('Template library (F02, FR-01)', () => {
  test('shows all 20 templates with real thumbnails, names and dimensions', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Create New Design' })).toBeVisible()
    await expect(page.getByTestId('template-card')).toHaveCount(20)
    await page.waitForFunction(() => Array.from(document.querySelectorAll<HTMLImageElement>('.card__thumb img')).every((i) => i.complete))
    const broken = await page.$$eval('.card__thumb img', (imgs) => imgs.filter((i) => (i as HTMLImageElement).naturalWidth === 0).length)
    expect(broken).toBe(0)
    const first = page.getByTestId('template-card').first()
    await expect(first).toContainText('Expand Your Business to the UAE')
    await expect(first).toContainText('1080×1080')
    for (const card of await page.getByTestId('template-card').all()) await expect(card).toContainText(/\d{3,4}×\d{3,4}/)
  })

  test('filters by category and search', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Announcement', exact: true }).click()
    await expect(page.getByTestId('template-card')).toHaveCount(2)
    await page.getByRole('button', { name: 'All', exact: true }).click()
    await page.getByLabel('Search templates').fill('japan')
    await expect(page.getByTestId('template-card')).toHaveCount(6)
    await page.getByLabel('Search templates').fill('zzzz-nothing')
    await expect(page.getByText('No templates match your search.')).toBeVisible()
  })

  test('a missing thumbnail shows an identifiable error, not an empty card', async ({ page }) => {
    await page.route('**/thumbs/flag-day-landmark.webp', (r) => r.abort())
    await page.goto('/')
    const card = page.locator('[data-template-id="flag-day-landmark"]')
    await expect(card.getByText('Preview missing')).toBeVisible()
    await card.getByRole('button', { name: /^Use template/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('the same template can be opened twice as separate projects', async ({ page }) => {
    await openTemplate(page, 'trusted-750-link', 'Copy A')
    await page.getByRole('link', { name: /Templates/ }).click()
    await page.locator('[data-template-id="trusted-750-link"]').getByRole('button', { name: /^Use template/ }).click()
    await page.getByLabel('Project name').fill('Copy B')
    await page.getByRole('button', { name: 'Create design' }).click()
    await expect(page.getByTestId('editor')).toBeVisible()
    await page.getByRole('link', { name: /Templates/ }).click()
    await expect(page.getByTestId('project-card').filter({ hasText: 'Copy A' })).toHaveCount(1)
    await expect(page.getByTestId('project-card').filter({ hasText: 'Copy B' })).toHaveCount(1)
  })
})

test.describe('Stakeholder demo (PRD section 21): edit, replace image, brand elements, preview, export', () => {
  test('creates a finished Dubai post from a template and downloads a correct PNG', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await openTemplate(page, 'expand-uae-square', 'Dubai business setup')

    // Baseline export of the untouched template.
    const before = await exportAs(page, 'png')
    expect([before.width, before.height]).toEqual([1080, 1080])

    // Step 4-5: headline and supporting text.
    await selectLayer(page, HEADING)
    await page.getByTestId('text-content').fill('Start your business in Dubai')
    await selectLayer(page, SUBHEAD)
    await page.getByTestId('text-content').fill('Company setup from AED 4,888')

    // Step 6: replace the photo (magenta so it is unmistakable in the export).
    await selectLayer(page, 'Background photo')
    await page.getByTestId('replace-image-input').setInputFiles({ name: 'office.png', mimeType: 'image/png', buffer: solidPng(900, 700, [255, 0, 255]) })
    await expect(page.getByTestId('image-error')).toHaveCount(0)

    // Step 7: move the heading up.
    await selectLayer(page, 'Start your business')
    const y = page.getByLabel('Y (px)')
    const y0 = Number(await y.inputValue())
    await y.fill(String(y0 - 30))
    await expect(y).toHaveValue(String(y0 - 30))

    // Step 8: footer hidden as a group, logo moved.
    await page.getByRole('button', { name: 'Hide all in Footer' }).click()
    await selectLayer(page, 'Arnifi logo')
    const x = page.getByLabel('X (px)')
    await x.fill('700')

    // Step 9: preview shows the finished design, no editing controls.
    await page.getByTestId('preview-button').click()
    await expect(page.getByRole('dialog').locator('[data-testid=preview] img')).toBeVisible()
    await expect(page.getByTestId('output-size')).toHaveText('1080 × 1080 px')
    await page.getByRole('button', { name: 'Back to editing' }).click()

    // Step 10: export PNG while a layer is still selected (handles must not appear in the file).
    await selectLayer(page, 'Start your business')
    const after = await exportAs(page, 'png')
    expect(after.fileName).toBe('arnifi-dubai-business-setup-1080x1080.png')
    expect([after.width, after.height, after.format]).toEqual([1080, 1080, 'png'])

    // The new photo is in the file (magenta in an untouched corner of the poster).
    expect(await countPixels(after.buffer, [900, 400, 1000, 500], isMagentaish)).toBeGreaterThan(5000)
    // The footer ("arnifi.com" + icon) is gone: near-white pixels vanish from its box.
    const footerBox: [number, number, number, number] = [84, 996, 270, 1044]
    expect(await countPixels(before.buffer, footerBox, isWhiteish)).toBeGreaterThan(300)
    expect(await countPixels(after.buffer, footerBox, isWhiteish)).toBeLessThan(30)
    // Headline, subhead and photo regions all changed.
    expect(await diffShare(before.buffer, after.buffer, [60, 90, 900, 300])).toBeGreaterThan(0.05)
    expect(await diffShare(before.buffer, after.buffer, [60, 310, 900, 380])).toBeGreaterThan(0.02)
    expect(await diffShare(before.buffer, after.buffer, [900, 400, 1080, 800])).toBeGreaterThan(0.5)
    // No selection handles: the heading's old top-left corner has no white handle dot.
    expect(await countPixels(after.buffer, [64, 80, 96, 112], isWhiteish)).toBeLessThan(20)
    expect(errors).toEqual([])
  })

  test('exports a JPG with the right size and file signature', async ({ page }) => {
    await openTemplate(page, 'trusted-750-link', 'Link post')
    const out = await exportAs(page, 'jpg')
    expect(out.fileName).toBe('arnifi-link-post-1080x566.jpg')
    expect([out.width, out.height, out.format]).toEqual([1080, 566, 'jpeg'])
    expect([...out.buffer.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff])
  })
})

test.describe('Editing (F05-F12)', () => {
  test('text edits show on the live canvas and the original template is untouched', async ({ page }) => {
    await openTemplate(page, 'expand-uae-square', 'Live edit')
    const canvas = page.locator('.stage__canvas')
    const before = await canvas.screenshot()
    await selectLayer(page, HEADING)
    await page.getByTestId('text-content').fill('Hello')
    await expect.poll(async () => (await canvas.screenshot()).equals(before), { timeout: 8000 }).toBe(false)
    // A brand-new project from the same template still has the original copy.
    await page.getByRole('link', { name: /Templates/ }).click()
    await page.locator('[data-template-id="expand-uae-square"]').getByRole('button', { name: /^Use template/ }).click()
    await page.getByRole('button', { name: 'Create design' }).click()
    await expect(layerRow(page, HEADING)).toBeVisible()
  })

  test('click selects, drag moves, properties follow, undo reverses the move as one step', async ({ page }) => {
    await openTemplate(page, 'expand-uae-square', 'Drag test')
    const zoom = parseInt((await page.getByTestId('zoom-label').innerText()).replace('%', ''), 10) / 100
    const box = (await page.locator('.stage__canvas').boundingBox())!
    // Click the "Company Formation" label (layer at x~164,y~459).
    const px = box.x + 200 * zoom
    const py = box.y + 475 * zoom
    await page.mouse.click(px, py)
    await expect(page.getByTestId('properties').getByRole('heading', { name: 'Company Formation' })).toBeVisible()
    const y = page.getByLabel('Y (px)')
    const y0 = Number(await y.inputValue())
    await page.mouse.move(px, py)
    await page.mouse.down()
    for (let i = 1; i <= 12; i++) await page.mouse.move(px, py + (i * 60 * zoom) / 12)
    await page.mouse.up()
    await expect.poll(async () => Number(await y.inputValue())).toBeGreaterThan(y0 + 40)
    await page.getByTestId('undo').click()
    await expect(y).toHaveValue(String(y0))
    await page.getByTestId('redo').click()
    await expect.poll(async () => Number(await y.inputValue())).toBeGreaterThan(y0 + 40)
  })

  test('font size, colour and alignment apply and survive undo/redo', async ({ page }) => {
    await openTemplate(page, 'expand-uae-story', 'Style test')
    await selectLayer(page, /Expand Your Business/)
    const size = page.getByLabel('Font size')
    await size.fill('60')
    await page.getByLabel('Align center').click()
    await page.getByLabel('Text colour', { exact: true }).fill('#ff0000')
    await page.getByLabel('Text colour', { exact: true }).press('Enter')
    await expect(page.getByLabel('Align center')).toHaveAttribute('aria-pressed', 'true')
    await page.getByTestId('undo').click()
    await page.getByTestId('redo').click()
    await expect(page.getByLabel('Text colour', { exact: true })).toHaveValue('#ff0000')
  })

  test('hide/show and remove/restore logo and footer; reset puts them back', async ({ page }) => {
    await openTemplate(page, 'one-partner-story', 'Brand test')
    await selectLayer(page, 'Arnifi logo')
    await page.getByRole('button', { name: 'Remove from this design' }).click()
    await expect(page.getByTestId('removed-layers')).toContainText('Arnifi logo')
    await expect(layerRow(page, 'Arnifi logo')).toHaveCount(0)
    await page.getByRole('button', { name: 'Restore Arnifi logo' }).click()
    await expect(layerRow(page, 'Arnifi logo')).toBeVisible()
    await page.getByRole('button', { name: 'Hide Arnifi logo' }).click()
    await expect(page.getByRole('button', { name: 'Show Arnifi logo' })).toBeVisible()
    await selectLayer(page, 'Arnifi logo').catch(() => undefined)
    await page.getByTestId('reset-template').click()
    await page.getByTestId('confirm-reset').click()
    await expect(page.getByRole('button', { name: 'Hide Arnifi logo' })).toBeVisible()
  })

  test('reset restores the template after confirmation and does not delete other projects', async ({ page }) => {
    await openTemplate(page, 'expand-uae-square', 'Keep me')
    await page.getByRole('link', { name: /Templates/ }).click()
    await openTemplate(page, 'expand-uae-square', 'Reset me')
    await selectLayer(page, HEADING)
    await page.getByTestId('text-content').fill('Temporary headline')
    await expect(layerRow(page, 'Temporary headline')).toBeVisible()
    await page.getByTestId('reset-template').click()
    await page.getByRole('button', { name: 'Keep my edits' }).click()
    await expect(layerRow(page, 'Temporary headline')).toBeVisible()
    await page.getByTestId('reset-template').click()
    await page.getByTestId('confirm-reset').click()
    await expect(layerRow(page, HEADING)).toBeVisible()
    await page.getByRole('link', { name: /Templates/ }).click()
    await expect(page.getByTestId('project-card').filter({ hasText: 'Keep me' })).toHaveCount(1)
    await expect(page.getByTestId('project-card').filter({ hasText: 'Reset me' })).toHaveCount(1)
  })

  test('long copy is flagged, never silently clipped', async ({ page }) => {
    await openTemplate(page, 'expand-uae-square', 'Overflow')
    await selectLayer(page, SUBHEAD)
    await page.getByTestId('text-content').fill('This is a deliberately very long supporting sentence that keeps going and going so it must wrap onto many lines and collide with the feature list underneath it on this square post')
    await expect(page.getByTestId('overflow-warning')).toBeVisible()
    await expect(page.getByTestId('text-content')).toHaveValue(/collide with the feature list/)
    await page.getByTestId('text-content').fill('')
    await expect(page.getByTestId('text-content')).toHaveValue('')
    await expect(page.getByTestId('editor')).toBeVisible()
  })

  test('a fixed-size text box reports real overflow but not the original design', async ({ page }) => {
    await openTemplate(page, 'sales-marathon', 'Fixed box')
    await selectLayer(page, 'Sales Marathon 2025!')
    await expect(page.getByTestId('overflow-warning')).toHaveCount(0)
    await page.getByTestId('text-content').fill('Sales Marathon 2025 with a much longer headline that cannot possibly stay on two lines in this box')
    await expect(page.getByTestId('overflow-warning')).toContainText(/Doesn't fit its box|runs off/)
  })

  test('replacing an image with an unsupported file explains why', async ({ page }) => {
    await openTemplate(page, 'expand-uae-square', 'Bad image')
    await selectLayer(page, 'Background photo')
    await page.getByTestId('replace-image-input').setInputFiles({ name: 'notes.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') })
    await expect(page.getByTestId('image-error')).toContainText(/isn't a supported image/)
  })

  test('add text, image, logo and shape; added layers can be deleted', async ({ page }) => {
    await openTemplate(page, 'trusted-750-link', 'Add things')
    await page.getByTestId('add-menu').click()
    await page.getByRole('menuitem', { name: 'Text' }).click()
    await expect(page.getByTestId('text-content')).toHaveValue('Your text here')
    await page.getByTestId('add-menu').click()
    await page.getByRole('menuitem', { name: 'Arnifi logo (white)' }).click()
    await expect(page.getByTestId('properties').getByRole('heading', { name: 'Arnifi logo (white)' })).toBeVisible()
    await page.getByTestId('add-menu').click()
    await page.getByRole('menuitem', { name: 'Rectangle' }).click()
    await page.getByTestId('add-image-input').setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: solidPng(300, 200, [0, 128, 255]) })
    await expect(page.getByTestId('properties').getByRole('heading', { name: 'p' })).toBeVisible()
    await page.getByTestId('delete-added').click()
    await expect(layerRow(page, /^p$/)).toHaveCount(0)
  })
})

test.describe('Persistence (F14, FR-10)', () => {
  test('edits and replaced images survive a refresh; the project reopens from the library', async ({ page }) => {
    await openTemplate(page, 'expand-uae-square', 'Persist me')
    await selectLayer(page, HEADING)
    await page.getByTestId('text-content').fill('Saved headline')
    await selectLayer(page, 'Background photo')
    await page.getByTestId('replace-image-input').setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: solidPng(800, 800, [255, 0, 255]) })
    await expect(page.getByTestId('save-status')).toHaveText('Saved on this computer')
    await page.reload()
    await expect(page.getByTestId('editor')).toBeVisible()
    await expect(layerRow(page, 'Saved headline')).toBeVisible()
    await expect(page.getByLabel('Project name')).toHaveValue('Persist me')
    const out = await exportAs(page, 'png')
    expect(await countPixels(out.buffer, [900, 400, 1000, 500], isMagentaish)).toBeGreaterThan(5000)
    await page.getByRole('link', { name: /Templates/ }).click()
    await page.getByTestId('project-card').filter({ hasText: 'Persist me' }).getByRole('link').click()
    await expect(layerRow(page, 'Saved headline')).toBeVisible()
  })

  test('opening a project that does not exist shows a clear message', async ({ page }) => {
    await page.goto('/edit/project-doesnotexist')
    await expect(page.getByRole('alert')).toContainText(/couldn't find that project/)
    await page.getByRole('link', { name: 'Back to templates' }).click()
    await expect(page.getByRole('heading', { name: 'Create New Design' })).toBeVisible()
  })
})

test.describe('Upload template (F04, Journey B)', () => {
  test('a PNG becomes a flat background with a clear explanation, and editable layers can be added on top', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Upload template' }).first().click()
    await page.getByTestId('upload-input').setInputFiles({ name: 'my-poster.png', mimeType: 'image/png', buffer: solidPng(800, 1000, [20, 90, 160]) })
    await expect(page.getByRole('status').filter({ hasText: 'flat background' })).toBeVisible()
    await page.getByRole('button', { name: 'Open in editor' }).click()
    await expect(page.getByTestId('editor')).toBeVisible()
    await expect(page.getByLabel('Poster canvas, 800 by 1000 pixels')).toBeVisible()
    await page.getByTestId('add-menu').click()
    await page.getByRole('menuitem', { name: 'Text' }).click()
    await page.getByTestId('text-content').fill('Over the upload')
    const out = await exportAs(page, 'png')
    expect([out.width, out.height]).toEqual([800, 1000])
    expect(await countPixels(out.buffer, [0, 0, 100, 100], (r, g, b) => Math.abs(r - 20) < 6 && Math.abs(g - 90) < 6 && Math.abs(b - 160) < 6)).toBeGreaterThan(9000)
  })

  test('unsupported and broken files are rejected with an explanation', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Upload template' }).first().click()
    const input = page.getByTestId('upload-input')
    await input.setInputFiles({ name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') })
    await expect(page.getByTestId('upload-error')).toContainText(/isn't a supported file/)
    await input.setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('not really a png') })
    await expect(page.getByTestId('upload-error')).toContainText(/readable image|supported/)
    await input.setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello": 1}') })
    await expect(page.getByTestId('upload-error')).toContainText(/wasn't saved by Arnifi/)
    await expect(page.getByRole('button', { name: 'Open in editor' })).toBeDisabled()
  })

  test('a saved project file re-opens with every layer still editable', async ({ page }) => {
    await openTemplate(page, 'one-partner-link', 'Round trip')
    await selectLayer(page, /One Partner/)
    await page.getByTestId('text-content').fill('Round trip headline')
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save file' }).click()])
    const file = path.join(test.info().outputDir, 'saved.project.json')
    fs.mkdirSync(path.dirname(file), { recursive: true })
    await download.saveAs(file)
    await page.getByRole('link', { name: /Templates/ }).click()
    await page.getByRole('button', { name: 'Upload template' }).first().click()
    await page.getByTestId('upload-input').setInputFiles(file)
    await expect(page.getByRole('status').filter({ hasText: 'layers stay editable' })).toBeVisible()
    await page.getByRole('button', { name: 'Open in editor' }).click()
    await expect(layerRow(page, 'Round trip headline')).toBeVisible()
    await selectLayer(page, 'Round trip headline')
    await expect(page.getByTestId('text-content')).toBeEditable()
  })
})

test.describe('Fidelity and reliability', () => {
  test('Inter and Lora are loaded before the editor draws', async ({ page }) => {
    await openTemplate(page, 'expand-uae-square', 'Fonts')
    const ok = await page.evaluate(() => ['400 20px Inter', '600 20px Inter', '400 20px Lora'].map((f) => document.fonts.check(f)))
    expect(ok).toEqual([true, true, true])
  })

  test('every template opens in the shared editor and exports at its own size', async ({ page }) => {
    test.setTimeout(10 * 60_000)
    const cards = await (async () => {
      await page.goto('/')
      return page.$$eval('[data-testid=template-card]', (els) => els.map((e) => ({ id: (e as HTMLElement).dataset.templateId!, text: e.textContent! })))
    })()
    expect(cards).toHaveLength(20)
    for (const c of cards) {
      const m = /(\d{3,4})×(\d{3,4})/.exec(c.text)!
      await openTemplate(page, c.id, `All ${c.id}`)
      await expect(page.getByTestId('layer-row').first()).toBeVisible()
      // An untouched template must never raise overflow or missing-image warnings.
      await expect(page.locator('.layer-row__warn'), `${c.id} shows warnings on its original content`).toHaveCount(0)
      await expect(page.getByTestId('missing-image-banner')).toHaveCount(0)
      const out = await exportAs(page, 'png')
      expect([out.width, out.height], c.id).toEqual([Number(m[1]), Number(m[2])])
    }
  })
})

test.describe('Direct manipulation on the canvas', () => {
  test('double-clicking text edits it in place', async ({ page }) => {
    await openTemplate(page, 'expand-uae-square', 'Inline edit')
    const zoom = parseInt((await page.getByTestId('zoom-label').innerText()).replace('%', ''), 10) / 100
    const box = (await page.locator('.stage__canvas').boundingBox())!
    // The "Your Gateway To Global Markets Starts Here" line sits at y~318-366.
    await page.mouse.dblclick(box.x + 300 * zoom, box.y + 342 * zoom)
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.type('Typed straight on the poster')
    // Leave editing by clicking an empty part of the stage.
    await page.mouse.click(box.x - 20, box.y + 200)
    await expect(layerRow(page, 'Typed straight on the poster')).toBeVisible()
    await layerRow(page, 'Typed straight on the poster').click()
    await expect(page.getByTestId('text-content')).toHaveValue('Typed straight on the poster')
  })

  test('arrow keys nudge the selected layer, Escape clears the selection', async ({ page }) => {
    await openTemplate(page, 'expand-uae-square', 'Nudge')
    await selectLayer(page, 'Arnifi logo')
    const x = page.getByLabel('X (px)')
    const x0 = Number(await x.inputValue())
    await page.locator('.stage__canvas').click({ position: { x: 5, y: 5 } }).catch(() => undefined)
    await selectLayer(page, 'Arnifi logo')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Shift+ArrowRight')
    await expect(x).toHaveValue(String(x0 + 11))
    await page.keyboard.press('Escape')
    await expect(page.getByText('Nothing selected')).toBeVisible()
  })

  test('zoom controls change the on-screen scale but never the export size', async ({ page }) => {
    await openTemplate(page, 'expand-uae-square', 'Zoom')
    const label = page.getByTestId('zoom-label')
    const before = await label.innerText()
    await page.getByRole('button', { name: 'Zoom in' }).click()
    await expect(label).not.toHaveText(before)
    await page.getByRole('button', { name: 'Fit to screen' }).click()
    await expect(label).toHaveText(before)
    await page.getByRole('button', { name: 'Zoom out' }).click()
    const out = await exportAs(page, 'png')
    expect([out.width, out.height]).toEqual([1080, 1080])
  })
})

test.describe('Accessibility basics', () => {
  test('library, editor and dialogs have no serious or critical axe violations', async ({ page }) => {
    const { default: AxeBuilder } = await import('@axe-core/playwright')
    const serious = async (label: string) => {
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(bad.map((v) => `${label}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`), label).toEqual([])
    }
    await page.goto('/')
    await expect(page.getByTestId('template-card')).toHaveCount(20)
    await serious('library')
    await page.locator('[data-template-id="expand-uae-square"]').getByRole('button', { name: /^Use template/ }).click()
    await serious('new-project dialog')
    await page.getByRole('button', { name: 'Create design' }).click()
    await expect(page.getByTestId('editor')).toBeVisible()
    await selectLayer(page, HEADING)
    await serious('editor')
    await page.getByTestId('preview-button').click()
    await expect(page.getByRole('dialog').locator('[data-testid=preview] img')).toBeVisible()
    await serious('preview dialog')
  })

  test('dialogs trap focus, close with Escape and return focus', async ({ page }) => {
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Upload template' }).first()
    await trigger.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    for (let i = 0; i < 8; i++) await page.keyboard.press('Tab')
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})

test.describe('Failure handling (PRD section 17)', () => {
  test('a storage failure is shown, and saving recovers on retry', async ({ page }) => {
    await openTemplate(page, 'expand-uae-square', 'Storage trouble')
    await page.evaluate(() => {
      const w = window as unknown as { __put?: typeof IDBObjectStore.prototype.put }
      w.__put = IDBObjectStore.prototype.put
      IDBObjectStore.prototype.put = function () {
        throw new DOMException('quota', 'QuotaExceededError')
      }
    })
    await selectLayer(page, HEADING)
    await page.getByTestId('text-content').fill('Will not save')
    await expect(page.getByTestId('save-error')).toContainText(/storage is full/i)
    await expect(page.getByTestId('save-status')).toHaveText('Not saved')
    await page.evaluate(() => {
      const w = window as unknown as { __put: typeof IDBObjectStore.prototype.put }
      IDBObjectStore.prototype.put = w.__put
    })
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByTestId('save-status')).toHaveText('Saved on this computer')
    await expect(page.getByTestId('save-error')).toHaveCount(0)
  })

  test('a failed export shows the reason and can be retried', async ({ page }) => {
    await openTemplate(page, 'trusted-750-link', 'Export trouble')
    await page.getByTestId('export-button').click()
    const dlg = page.getByRole('dialog')
    await expect(dlg.locator('[data-testid=preview] img')).toBeVisible()
    await page.evaluate(() => {
      const w = window as unknown as { __toBlob?: typeof HTMLCanvasElement.prototype.toBlob }
      w.__toBlob = HTMLCanvasElement.prototype.toBlob
      HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
        cb(null)
      }
    })
    await page.getByTestId('download-button').click()
    await expect(page.getByTestId('export-error')).toContainText(/Export failed/)
    await expect(page.getByTestId('download-button')).toContainText('Try again')
    await page.evaluate(() => {
      const w = window as unknown as { __toBlob: typeof HTMLCanvasElement.prototype.toBlob }
      HTMLCanvasElement.prototype.toBlob = w.__toBlob
    })
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-button').click()])
    expect(download.suggestedFilename()).toBe('arnifi-export-trouble-1080x566.png')
  })

  test('a missing uploaded image shows a red placeholder and an explanation instead of a blank poster', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Upload template' }).first().click()
    await page.getByTestId('upload-input').setInputFiles({ name: 'bg.png', mimeType: 'image/png', buffer: solidPng(400, 400, [10, 120, 80]) })
    await page.getByRole('button', { name: 'Open in editor' }).click()
    await expect(page.getByTestId('editor')).toBeVisible()
    await expect(layerRow(page, 'Uploaded background')).toBeVisible()
    // Lose the stored image (as if the browser cleared site data for it), then reload.
    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const open = indexedDB.open('arnifi-marketing-studio')
          open.onsuccess = () => {
            const tx = open.result.transaction('assets', 'readwrite')
            tx.objectStore('assets').clear()
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
          }
        }),
    )
    await page.reload()
    await expect(page.getByTestId('editor')).toBeVisible()
    await expect(page.getByTestId('missing-image-banner')).toContainText(/couldn't be loaded/)
    await layerRow(page, 'Uploaded background').click()
    await expect(page.getByTestId('image-error')).toContainText(/missing from this browser/)
    // Replacing the image fixes it.
    await page.getByTestId('replace-image-input').setInputFiles({ name: 'new.png', mimeType: 'image/png', buffer: solidPng(400, 400, [200, 30, 30]) })
    await expect(page.getByTestId('missing-image-banner')).toHaveCount(0)
  })
})
