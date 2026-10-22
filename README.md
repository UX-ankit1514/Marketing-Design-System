# Arnifi Marketing Studio

Create on-brand Arnifi marketing posts without Figma. Pick an approved template, change the words and pictures, move things around, and download a finished PNG or JPG.

This is the MVP described in the *Arnifi Marketing Design System* PRD. It runs entirely in the browser: no accounts, no server, no database. Everything you make is saved on the computer you made it on.

## Start it (3 steps)

You need **Node.js 22** (check with `node -v`).

```bash
cd ~/Desktop/files/arnifi-marketing-studio
npm install        # first time only
npm run dev        # then open the address it prints, usually http://localhost:5173
```

> **Mac note:** on this Mac the default Homebrew `node` is broken. Use the working one first:
> `export PATH="/opt/homebrew/opt/node@22/bin:$PATH"`

If port 5173 is busy (another project is using it), run `npm run dev -- --port 5180`.

To run the finished, optimised version instead: `npm run build && npm run preview`.

## How to use it

1. **Pick a template** on the first screen. Use the search box or category chips to narrow the 20 templates. Click **Use template**, name your design, and the editor opens. (Opening the same template twice gives you two separate designs.)
2. **Change the words.** Click a layer in the list on the left (or click the text on the poster), then type in the **Text** box on the right. Double-click text on the poster to type directly. Font, size, colour, alignment and spacing are on the right too. If your text is longer than the original, you get a warning instead of silently losing words.
3. **Change the picture.** Select **Background photo**, press **Replace image**, choose a PNG/JPG/WebP. Use *Fill* or *Fit inside*, *Zoom* and *Shift* to frame it.
4. **Move things.** Drag on the poster, drag the round handles to resize, use the X/Y/Width fields, or the arrow keys (Shift = 10 px).
5. **Logo and footer.** Hide or show them with the eye icon (the footer is a group, so one click hides all of it). **Remove from this design** takes a layer out of this design only; bring it back from *Removed from this design* in the list.
6. **Add things.** *Add to design* adds text, an image, the Arnifi logo (blue or white) or a rectangle. This is also how you build on an uploaded image.
7. **Undo / Redo / Reset template** are in the top bar (or Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z). Reset asks first and only affects the open design.
8. **Preview** shows the clean poster exactly as it will export. **Export** lets you choose PNG or JPG and downloads `arnifi-<name>-<width>x<height>.png` at the template's real pixel size, with no handles, no watermark and hidden layers left out.

Your work saves automatically ("Saved on this computer"). Refresh the page or come back tomorrow: your designs are listed under **Your projects** on the first screen. Projects live in *this browser on this computer*; to move one, use **Save file** (a `.project.json`) and load it again with **Upload template**.

### Upload template
- **PNG / JPG / WebP** becomes a flat background. You can add text, images, logos and shapes on top. Text that is part of the picture can't be edited, and the app says so.
- **Project file (`.json`)** saved from this app re-opens with every layer still editable.
- Anything else is rejected with a plain explanation.

### Keyboard shortcuts
Ctrl/Cmd+Z undo · Ctrl/Cmd+Shift+Z or Ctrl+Y redo · arrows nudge · Shift+arrows nudge 10 px · Delete removes the selected logo/footer/shape (or deletes an added layer) · Esc deselects · Ctrl/Cmd +/−/0 zoom.

## What is in the box

- **20 templates**, every one rebuilt from a real frame in the Figma file `s2yQZ85TPB02pKuvfwTCgk` (see [docs/template-inventory.md](docs/template-inventory.md) for the frame IDs, why each was chosen and why 38 other frames were not).
- A shared editor: the same canvas, layer, undo, save and export code serves every template. Nothing is hard-coded per poster.
- Fonts **Inter** and **Lora** bundled with the app. The app does not need Figma, the internet, or any API key to run.

## Checking that it works

```bash
npm run check        # type check + lint + 194 unit tests
npm run test:e2e     # real-browser tests of the PRD demo scenario, export files, persistence, uploads, failures, accessibility
npm run figma:parity # redraws all 20 templates and compares them pixel-by-pixel with the Figma originals
```

Results from the last full run are in [docs/test-report.md](docs/test-report.md). Things that are not finished or are deliberately left out are in [docs/known-limitations.md](docs/known-limitations.md). A script for demoing to stakeholders is in [docs/demo-checklist.md](docs/demo-checklist.md).

## Putting it online

It is a static site. On Vercel: import the folder, framework *Vite*, build `npm run build`, output `dist` (already set in `vercel.json`, including the rewrite that lets `/edit/...` links work after a refresh). Any static host works the same way. Nothing secret is needed, and no Figma credential is ever in the app.

## Adding or updating templates (for the person doing the Figma import)

Templates are produced during development, never at runtime. The short version:

1. Open the Figma file with the **Figma Desktop Bridge** plugin running and the figma-console MCP connected.
2. Paste `scripts/figma/inspect/extract.js` into `figma_execute` once, then run `__arnifiRunMany([frameId], skip)` for each poster. Large results spill to a file.
3. Add the frame to `scripts/figma/convert/manifest.json` (id, name, category, format, tags).
4. `npm run figma:ingest -- <spilled-file>` converts it to `src/data/templates/<id>.json` + assets (a copy of the raw extraction is kept in `inventory/raw/`). Per-template fixes go in `scripts/figma/convert/overrides/<id>.json`.
5. Save its reference render with `__arnifiRefMany` + `node scripts/figma/inventory/save-ref.mjs`, then `npm run figma:parity <id>` and `npm run figma:thumbs`.
6. `npm run figma:inventory` refreshes the inventory document.

Details and gotchas: [docs/figma-import.md](docs/figma-import.md). The data format: [docs/template-data-model.md](docs/template-data-model.md).

## Folder map

```
src/
  app/routes/            QA-only route that draws a template 1:1 (used by the parity check)
  components/            header, dialog, icons
  features/templates/    library, cards, "name your design", your projects
  features/editor/       editor page, canvas, layers panel, properties panel, toolbar, store (undo/redo)
  features/export/       preview + export dialog
  features/upload/       upload template flow
  lib/canvas/            template -> Fabric objects, fonts, text runs, static (export) renderer
  lib/storage/           IndexedDB projects + images, project files
  lib/templates/         template registry, project creation, "add" layers
  types/                 Zod schemas: layer, template, project
  data/templates/        the 20 templates (JSON)
public/template-assets/  photos and graphics for the templates (no Figma URLs anywhere)
scripts/figma/           import + parity tooling (development only)
inventory/               Figma reference renders, parity results, candidate list, raw extractions
docs/                    inventory, data model, import notes, demo checklist, limitations, test report
tests/                   unit (Vitest) and e2e (Playwright)
```
