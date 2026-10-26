# Build log — how Arnifi Marketing Studio was made

All on **22 Oct 2026**. Written for someone (including future you) who needs to understand why the project looks the way it does.

## 1. Understanding the job
- Confirmed the Figma Desktop Bridge was connected (WebSocket, plugin 1.39.0, file "Untitled" `s2yQZ85TPB02pKuvfwTCgk`).
- Read the PRD (`01-requirements/`). Key rules: Figma is the source of truth, templates must be real editable layers (never a flattened picture), reuse the design system, no backend/auth/AI, build one template end to end before scaling.
- Scanned the Figma canvas read-only: 35 top-level frames + the "UAE vs Japan" section. Found six checklist documents (excluded), five campaigns in three sizes each, a family of near-identical Flag Day/skyline posters, Sales Marathon, and the UAE×Japan series. Only Inter and Lora fonts. Plan written and approved (`01-requirements/implementation-plan-approved.md`).

## 2. Proving the Figma pipeline (the risky part, done first)
- **Image bytes out of Figma:** `figma_execute` can return full-resolution image bytes (base64); results above the size limit are saved to a file by the MCP, so photos never pass through the conversation.
- Wrote the extractor (`scripts/figma/inspect/extract.js`): walks a frame and returns layers (text with style runs, image fills with crop, shapes with gradients/strokes/shadows, clipping, flips), plus assets.
- Wrote the importer (`scripts/figma/convert/ingest.ts`): validates with Zod, saves assets (photos → JPG when opaque), infers roles, groups by purpose (Footer, Button), names layers, writes limitations.
- Wrote the parity check (`scripts/figma/validate/parity.ts`): renders each template in headless Chromium and compares it pixel-by-pixel with Figma's own render.
- First template matched Figma at 98.9%.

## 3. Problems found and how each was solved

| Problem | Cause | Fix |
|---|---|---|
| Everything drawn shifted left/up | Fabric 7 positions objects from their **centre** by default | Force top-left origin on every object |
| Text baselines off by up to 5 px | Fabric and Figma place the first baseline differently | Compensate with each font's ascent/descent; don't re-centre auto-height text |
| Wrapped text broke differently | Browser Inter is ~0.4% wider than Figma's | 0.6% width tolerance on wrapped boxes |
| Two templates 60–90% wrong | **Mirrored** Figma nodes report their translation at the far edge | Position from bounding box and carry `flipX/flipY` |
| A dark diamond in the footer | A **mask** group: mask and masked content are siblings | Export a masked group as one picture |
| Figma plugin froze mid-run | **SVG export** stalls on some nodes and blocks the whole plugin | Export small graphics as 3× PNG instead; keep timeouts |
| "Result too large" errors | MCP caps one response at 8 MB | One frame with new photos per call; extractor pads results so they spill to a file |
| Frosted-glass cards looked flat | Canvas has no backdrop blur | Custom `GlassRect` that blurs what is already painted underneath |
| React StrictMode crashed Fabric | Fabric can't init twice on one `<canvas>` | The canvas element is created and disposed inside the effect |
| Typing didn't reach save/export | Fabric only ends editing when you click *its* canvas | Push every keystroke to the store; end editing on any outside click |
| Original templates showed "doesn't fit" errors | Figma boxes are often a few px short; a trailing empty line was counted | Judge overflow against how the original copy lays out; ignore trailing empty lines |
| Library cards had two identical buttons | Thumbnail and "Use template" both labelled | Thumbnail is a mouse-only shortcut (`aria-hidden`) |
| Axe: nested interactive elements, low contrast | Layer rows were options containing buttons; grey text too light | Rows are a select button + eye button; secondary text uses Dusk-700 |
| Test dev ports clash | Port 5173 belongs to the Creative Studio stack | This project uses 5180; processes are only ever stopped by exact PID |

## 4. Building the app
Store with undo/redo (drags coalesced into one step) → `Studio` controller keeping one stable Fabric canvas in sync with the project → layers panel (groups, visibility, removed/restore, warnings) → properties panel (text, image, shape, position, order) → toolbar → preview/export dialog (decodes the file to verify its size) → upload flow and project files → add text/image/logo/rectangle → autosave to IndexedDB with visible failure and retry.

## 5. Tests and checks
194 unit + 30 end-to-end tests; the end-to-end suite runs the PRD demo scenario against the production build and **decodes the downloaded PNG** to check size, filename, replaced photo, hidden footer and absence of selection handles. All 20 templates are opened and exported. An axe-core accessibility pass found and fixed real issues. Details: `test-report.md`.

## 6. Publishing
Committed once and pushed to https://github.com/UX-ankit1514/Marketing-Design-System (`main`, `d6c0ca8`). Not deployed. A `vercel.json` with the single-page-app rewrite is ready.

## 7. How to resume
1. `cd 03-app && npm install` (Node 22; on this Mac `export PATH="/opt/homebrew/opt/node@22/bin:$PATH"`).
2. `npm run dev -- --port 5180`.
3. To change templates: re-register `scripts/figma/inspect/extract.js` in Figma (Desktop Bridge running), follow `figma-import.md`.
4. Before any change is final: `npm run check`, `npm run test:e2e`, `npm run figma:parity`.

## 8. Suggested next steps
- Designers review the showcase templates; run real first-time-user tests (the PRD's 5-minute target).
- Decide on hosting (Vercel is ready).
- Optional: snap/alignment guides, drag-to-reorder layers, a crop tool, vector logos (if Figma's SVG export is fixed), re-checking the UI against the live Design System file.
