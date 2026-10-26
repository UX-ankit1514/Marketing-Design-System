# Test report

Generated 2026-10-22 on macOS, Node 22, Chromium (Playwright) at 1440×900.

## Summary

| Check | Result |
|---|---|
| Production build (`npm run build`) | Passes |
| Type check (`tsc -b`) | Passes |
| Lint (`oxlint`) | 0 errors, 6 warnings (React-compiler style hints, none affect behaviour) |
| Unit tests (Vitest) | **194 passed**, 0 failed (4 files) |
| End-to-end tests (Playwright, production build) | **30 passed**, 0 failed |
| Visual parity vs Figma, all 20 templates | **96.6% – 99.6%** of pixels match (see table) |
| Works without Figma/MCP at runtime | Yes: templates, fonts and assets are in the repo; the e2e suite runs with no Figma connection |

## What the tests prove

**Unit (194)**: all 20 template files pass the schema; each has a traceable Figma node, 2+ editable text layers, a swappable photo, unique layer ids, only bundled fonts, assets that exist on disk, a thumbnail and a reference render; master templates are never mutated; projects are independent copies; undo/redo/coalescing (a drag = one step); coloured words stay attached when copy changes; logo/footer hide/remove/restore/reset; layer order; IndexedDB round trip and damaged-project handling; project-file import errors; upload validation; export file naming.

**End-to-end (30)**, run against the built app:
- Library: 20 cards with working thumbnails, names and sizes; filter + search; a missing thumbnail shows an error card; same template twice = two projects.
- **PRD section 21 demo, start to finish**, then the *downloaded PNG is decoded and checked*: 1080×1080, filename `arnifi-dubai-business-setup-1080x1080.png`, the uploaded photo's colour present in the file, footer pixels gone, headline/subhead/photo regions changed versus an export of the untouched template, and no selection handles in the file.
- JPG export (size + file signature).
- Editing: live canvas updates; click-select + drag + undo/redo as one step; double-click inline text editing; font size/colour/alignment; arrow-key nudging; logo/footer hide/show/remove/restore/reset; reset with confirmation keeps other projects; long copy flagged; bad image rejected; add text/image/logo/shape and delete; zoom never changes export size.
- Persistence: edit + replace image, refresh, state and image restored, project reopens from the library; unknown project shows a clear message.
- Upload: PNG becomes a flat background and text can be added on it (export verified); PDF/fake PNG/foreign JSON rejected with explanations; saved project file re-opens with editable layers.
- Failures: storage full -> visible error and recovery; failed export -> reason + retry; missing uploaded image -> red placeholder, banner and explanation.
- **All 20 templates** open in the shared editor with no warnings on their original content, and export at their exact own dimensions. A fixed-size text box reports real overflow but not the original design.
- Accessibility: no serious/critical axe-core violations on the library, new-project dialog, editor and preview dialog; dialogs trap focus, close with Esc and return focus.

## Visual parity per template

Pixel comparison of the app's render with the Figma reference at native size (pixelmatch, threshold 0.12). Remaining differences are text anti-aliasing, photo resampling and the blurred-glass approximation, not layout.

| Template | Size | Pixels matching | Missing fonts | Layer build failures |
|---|---|---|---|---|
| Expand Your Business to the UAE (Square) | 1080×1080 | 98.9% | none | none |
| Expand Your Business to the UAE (Story) | 1080×1920 | 99.2% | none | none |
| One Partner. 15+ Global Jurisdictions (Story) | 1080×1920 | 98.9% | none | none |
| One Partner. 15+ Global Jurisdictions (Link post) | 1080×566 | 97.5% | none | none |
| Don't Miss Your Next Growth Opportunity (Story) | 1080×1920 | 96.6% | none | none |
| Don't Miss Your Next Growth Opportunity (Square) | 1080×1080 | 97.3% | none | none |
| Trusted by 750+ Businesses (Story) | 1080×1920 | 99.3% | none | none |
| Trusted by 750+ Businesses (Link post) | 1080×566 | 98.4% | none | none |
| Start Your UAE Business from AED 4,888 (Story) | 1080×1920 | 99.3% | none | none |
| Start Your UAE Business from AED 4,888 (Square) | 1080×1080 | 99.1% | none | none |
| Sales Marathon 2025 (Portrait) | 1080×1350 | 97.0% | none | none |
| Business Setup. Simplified. (Portrait) | 1080×1350 | 99.1% | none | none |
| UAE Annual Flag Day (Portrait) | 1080×1350 | 98.5% | none | none |
| 13th UAE Annual Flag Day (Portrait) | 1080×1350 | 98.9% | none | none |
| Business Opportunities with this Partnership (Portrait) | 1080×1350 | 99.5% | none | none |
| UAE x Japan: Deepen AI Collaboration (Portrait) | 1080×1350 | 99.2% | none | none |
| Business Opportunities with this Partnership (Portrait) | 1080×1350 | 99.6% | none | none |
| AI Is Creating New Possibilities (Portrait) | 1080×1350 | 99.0% | none | none |
| UAE x Japan: Deepen AI Collaboration (Portrait) | 1080×1350 | 99.4% | none | none |
| Opportunity for Tech Businesses (Portrait) | 1080×1350 | 99.4% | none | none |

Human review: *Expand Your Business to the UAE* (square), *One Partner* (story) and *Sales Marathon* were compared side by side with Figma by eye as well; the other 17 were reviewed through the pixel comparison and diff images only. Designers should still eyeball the showcase templates before the demo.
