# Decisions, assumptions and PRD traceability

Source: `Marketing-PRD-readable.txt` (original `Marketing-PRD-original.rtf`). Approved plan: `implementation-plan-approved.md`. Paths below are inside `../03-app/`.

## Decisions that shaped the build

| Decision | Why |
|---|---|
| **Fabric.js 7** as the canvas engine, no backend | The PRD asks for it and for a static, local-first MVP. Export has to happen in the browser, and a canvas exports reliably (an HTML/CSS renderer would not). Your earlier *Creative Studio* project used a DOM renderer plus a server; that doesn't fit here. |
| **Stack: Vite + React 19 + TypeScript, Zustand, idb (IndexedDB), Zod, Vitest, Playwright** | Straight from PRD section 12. |
| **Templates are data, not code** | One shared editor for all 20 (PRD rule 5). Templates are JSON validated by Zod; the master is never edited, a project is a copy with its own untouched `baseLayers`. |
| **Import happens at development time, never at runtime** | PRD 7.5/12.5: every template must render after a fresh build with no Figma. Assets are copied into `public/template-assets/`; the app has no Figma URL or token anywhere. |
| **20 templates, max two sizes per campaign** | Keeps variety (story / square / link / portrait, light and dark) without near-duplicates (PRD 6.3). 38 other frames were not selected, with reasons in the inventory. |
| **Flatten only what must be flattened** | Hundreds-of-vector skyline art, glass icon tiles, masked groups and small logos become single picture layers, logged per template (PRD 7.4). Text, photos, buttons, cards, footer and logo stay separate and editable. |
| **Small graphics exported as 3× PNG, not SVG** | Figma's SVG export froze the plugin repeatedly. |
| **Glass effect approximated** | Canvas has no backdrop blur; a custom `GlassRect` blurs what is already painted beneath it. |
| **Bundled fonts: Inter and Lora only** | They are the only fonts in the Figma file; loaded and awaited before anything is drawn or exported. |
| **App UI follows the `arnifi-design-system` snapshot** | PRD rule 2 (reuse the design system). The live Design System Figma file wasn't connected, so the UI was not re-verified against it. |
| **No deployment, no commit until asked** | Outward-facing actions. The code was pushed on request (`d6c0ca8`); nothing is hosted. |
| **Quality gate = pixel comparison + e2e on the built app** | PRD section 15/19. 96.6–99.6% pixel match per template; 194 unit + 30 browser tests. |

## Assumptions

- "Arnie" in conversation means **Arnifi**.
- The linked Figma file is the *only* source of posters; the PRD's "20" is a target, and exactly 20 suitable designs existed.
- Checklist documents (800–920 px wide) are not marketing posters and were excluded (PRD 6.2: not every frame is eligible).
- Local storage per browser is acceptable (PRD 12.4); there is no cross-device sync.

## PRD → where it lives → how it is tested

| PRD | Built in | Verified by |
|---|---|---|
| F01 Figma extraction | `scripts/figma/inspect/extract.js`, `scripts/figma/convert/ingest.ts` | `tests/unit/templates.test.ts` (schema, Figma source, assets exist) |
| F02 Template library (20) | `src/features/templates/TemplateLibrary.tsx`, `TemplateCard.tsx`, `src/lib/templates/registry.ts` | e2e *Template library* (20 cards, thumbnails, filters, missing-thumbnail error) |
| F03 Template selection → new project | `NewProjectDialog.tsx`, `src/lib/templates/instantiate.ts` | e2e *same template twice*; unit *project instances* |
| F04 Template upload | `src/features/upload/UploadTemplate.tsx`, `src/lib/upload/validate.ts`, `src/lib/storage/projectFile.ts` | e2e *Upload template*; unit *uploads*, *project files* |
| F05 Editable canvas | `src/lib/canvas/studio.ts`, `src/features/editor/EditorCanvas.tsx` | e2e *click selects, drag moves…* |
| F06 Text editor | `PropertiesPanel.tsx` (TextProps), `src/lib/canvas/runs.ts`, `measure.ts` | e2e *font size, colour, alignment*, *double-click edit*, *long copy flagged*; unit `runs.test.ts` |
| F07 Image editor | `PropertiesPanel.tsx` (ImageProps), `builder.ts` (`imageViewport`) | e2e *replace image*, *unsupported file* |
| F08 Logo controls | `LayersPanel.tsx`, `PropertiesPanel.tsx`, `editorStore.ts` (`setRemoved`) | e2e *hide/show and remove/restore*; unit *brand elements* |
| F09 Footer controls | footer group built in `ingest.ts`; group eye in `LayersPanel.tsx` | e2e demo scenario (footer hidden → pixels gone) |
| F10 Live preview | `Studio.sync()`, `src/features/export/ExportDialog.tsx` | e2e *text edits show on the live canvas* |
| F11 Undo / redo | `src/features/editor/editorStore.ts` | unit *undo / redo* (a drag = one step) |
| F12 Reset template | `editorStore.ts` (`resetAll`), `Toolbar.tsx` | e2e *reset … keeps other projects* |
| F13 Export PNG/JPG | `src/lib/export/exportService.ts`, `ExportDialog.tsx` | e2e: downloaded file decoded — size, filename, pixels, no handles |
| F14 Local persistence | `src/lib/storage/db.ts`, `useAutosave.ts` | e2e *survive a refresh*; unit storage round trip |
| P1 search/filter, zoom/fit, shortcuts, duplicate layer/project, save project file | `TemplateLibrary.tsx`, `EditorCanvas.tsx`, `useShortcuts.ts`, `ProjectsList.tsx`, `Toolbar.tsx` | e2e *filters*, *zoom*, *arrow keys*, *round trip* |
| P1 not done | snap/alignment guides, drag-reorder, free crop | listed in `04-documentation/known-limitations.md` |
| §14.4 content overflow | `src/lib/canvas/measure.ts` | e2e overflow tests; *original templates never warn* |
| §17 edge cases | font missing → banner (`fonts.ts`); image missing → red placeholder + banner; unsupported upload → message; export/storage failure → message + retry; same template twice → separate projects | e2e *Failure handling* |
| §15.3 quality gates A–D | ingest validation · `scripts/figma/validate/parity.ts` · e2e editing · e2e export decode | `04-documentation/test-report.md` |
| §16 accessibility | labelled controls, focus-trapped dialogs, no nested interactive elements, AA contrast | e2e axe-core test (no serious/critical violations) |
