# Arnifi Marketing Studio — build plan

## Context
The user pasted a PRD (`~/Documents/Marketing prd.rtf`, "Arnifi Marketing Studio", MVP 1.0) and wants the product built as a web app, end to end. It is a template-first poster editor: pick one of ~20 approved Figma posters, edit text/images/logo/footer, preview, export PNG/JPG. The templates must come from the Figma canvas the user linked (`s2yQZ85TPB02pKuvfwTCgk`, Page 1), which is already connected through the Desktop Bridge. The PRD forbids flattened posters, an invented design language, backend, auth and AI features, and requires every template to render with no Figma connection at runtime.

This is a new product, separate from `arnifi-creative-studio` (Firestore/Vercel dashboard) and `mvp` (Next 16 prototype). Neither is touched.

## What the Figma scan found (read-only, done)
Page 1 has 35 top-level frames plus a section "UAE vs Japan" (24 frames). Fonts across the whole file: **Inter** (Regular/Medium/Semi Bold/Bold) and **Lora** (Regular) only. Image layers are rectangles with image fills (AI-generated backgrounds, oversized and clipped by the frame). Text uses per-run fills (rich text, e.g. coloured words in headings). Effects seen: drop shadow, gradients, and a Figma `GLASS` effect (no CSS/canvas equivalent).

| Family | Count | Size | Notes |
|---|---|---|---|
| Checklists (UAE/Abu Dhabi/Jersey/ADGM) | 6 | 800–920 × 1500–1700 | Forms, not social posters. **Excluded** (PRD: not every frame is eligible). |
| Campaign sets (Expand to UAE, One Partner 15+, Don't Miss, Trusted by 750+, From AED 4,888) | 5 × 3 sizes | 1080×1920 story, 1080×1080, 1080×566 | Clean layered structure, best fidelity candidates |
| Flag Day / "Business Setup. Simplified." skyline series | ~11 | 1080×1350 | Near-identical variants; skyline art is 800+ vectors, so flatten that one group only |
| Sales Marathon 2025 | 1 | 1080×1350 | 26 layers, 9 image fills |
| UAE × Japan (dark V1 + light V2, 3 slides each, plus card components) | ~20 | 1080×1350 | Cover / cards / handshake layouts |

Proposed 20 (final list and scores come out of the Phase 2 inventory): 8 campaign designs across story/square/link (max 2 sizes per campaign, so all three ratios are covered), 3 Flag Day/skyline, Sales Marathon, DIR, and 7 UAE × Japan covers/slides (dark and light). Report the real count if fewer pass.

## Decisions (defaults — user can override at approval)
- **Stack:** follow the PRD: Vite + React + TypeScript, **Fabric.js**, Zustand, IndexedDB (`idb`), Zod, Vitest, Playwright. No backend, so export must be client-side — Fabric's canvas export fits that; an HTML/CSS renderer would not.
- **Location:** new folder `~/Desktop/files/arnifi-marketing-studio`, using the PRD §13 structure. Node via `/opt/homebrew/opt/node@22` (default Homebrew node is broken on this Mac).
- **App chrome / design system:** use the saved `arnifi-design-system` skill (Arnique indigo, Lora/Inter, 4px control radius, spacing scale). The real "Design System" Figma file is not connected, so the skill is a condensed snapshot. If the user opens it with the plugin I can sync tokens.
- **Fonts:** bundle Inter and Lora via `@fontsource` (OFL), loaded and awaited before render/export. Warn on any layer whose font is missing.
- **Complex art:** flatten only the skyline group / `GLASS` surfaces as individual raster layers, logged in the inventory. Text, logos, CTAs, shapes and photos stay separate objects.
- **Deploy:** local run + passing production build only. No Vercel push unless the user asks (outward-facing).

## Pipeline (PRD §6–7, `scripts/figma/*`)
1. **Inspect:** read-only `figma_execute` dumps per candidate frame: node ID, size, layer tree, fonts, effects, hidden layers. Output goes to `inventory/candidates.json`.
2. **Reference shots:** `figma_capture_screenshot` per selected frame at 1x → `inventory/refs/<id>.png` (used for the parity check).
3. **Convert:** per frame → Template JSON (PRD §11): canvas, ordered layers (`text` with styled runs, `image`, `shape`, `group`), roles (`heading`, `body`, `cta`, `logo`, `footer`, `photo`, `decoration`), defaults, `source {fileKey,nodeId}`, `version`. Validated by a Zod schema; stable layer IDs.
4. **Assets:** photos, logos (SVG) and flattened art saved into `public/template-assets/`. **First spike:** prove the cheapest route for pulling full-resolution image bytes out of Figma — (a) MCP screenshot files already written to disk, (b) a fresh `FIGMA_ACCESS_TOKEN` and REST `/images`, (c) chunked plugin export. Pick one before scaling.
5. **Validate:** render each template in the app headless, pixel-compare to its reference (`pixelmatch`), record a score and a `validated` flag per template.

## App modules (PRD §9–13)
- `features/templates`: library grid (thumbnail, name, size, **Use template**), Upload Template, opens a *copy* as a project (master data never mutated).
- `features/editor`: `EditorCanvas` (one stable Fabric instance, driven by the store), `LayersPanel` (select, show/hide, order), `PropertiesPanel` (text: content/font/size/weight/colour/align/position/box; image: replace, cover/contain, position/size; logo/footer: show/hide/remove/restore/reset), `Toolbar` (name, undo, redo, reset, preview, export), overflow warning on text, double-click to edit text.
- `lib/canvas`: template → Fabric builder, text-run mapping, clipping to artboard, font gating.
- `editorStore` (Zustand): history as committed actions (a drag = one entry), reset-to-master, dirty tracking.
- `lib/storage`: IndexedDB for projects and uploaded images, autosave, visible error on storage failure.
- `features/export`: PNG/JPG at the template's native size (Fabric `multiplier` for pixel-exact output), no handles/hidden layers, filename `arnifi-<project>-<w>x<h>.png`, retry on failure.
- `features/upload`: PNG/JPG becomes a background image with an honest "pixels are not editable" note; native project JSON re-imports with layers; invalid files rejected with a clear message.
- P1 once P0 passes: search/category filter, zoom/fit, keyboard shortcuts, duplicate project, duplicate/reorder layers, save project file, snap guides.

## Order of work (PRD §24 — one template end to end before scaling)
1. Scaffold, tooling, fonts, tokens, schema, tests wiring.
2. Inventory + selection of the 20, asset spike.
3. Converter + renderer, then one hero template (a campaign story) validated pixel-wise.
4. Editor P0 + persistence + export on that template (full demo scenario from PRD §21 passing).
5. Convert and validate the remaining templates in batches; fix per-family issues (fonts, rich text, clipping).
6. Upload flow, P1 items, polish, desktop-width and "use a desktop" notice.
7. QA, README, demo checklist, report.

## Verification
- `vitest`: schema validation, builder output, store undo/redo/reset, storage round-trip, export naming.
- `playwright`: PRD §21 scenario (open → pick template → edit heading/body → replace image → move heading → hide footer / move logo → preview → export PNG and JPG), refresh-restores-project, invalid upload, long-text overflow warning.
- Parity: per-template render vs Figma reference, results saved to the inventory; the 3–5 showcase templates also reviewed by eye.
- Export checks: decode the downloaded file and assert exact pixel size, no selection handles, hidden layers absent, fonts rendered.
- `npm run build` passes and the built app works with the Figma bridge disconnected.
- Final report: working app, inventory, data model, test results, known limitations, plain-language run steps, demo checklist, and any incomplete/deferred requirements stated explicitly.

## Risks to watch
- Image bytes out of Figma (spike in step 2). Figma `GLASS` and blend effects (flatten only those). Fabric vs Figma line-height/letter-spacing metrics on large Lora headings (tune per template, compare visually). Hidden layers present in some frames (carry `visible:false` through, exclude on export).
