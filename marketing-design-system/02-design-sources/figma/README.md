# Figma source

| | |
|---|---|
| File | "Untitled" (the marketing posters canvas you linked) |
| Link | https://www.figma.com/design/s2yQZ85TPB02pKuvfwTCgk/Untitled?node-id=0-1 |
| File key | `s2yQZ85TPB02pKuvfwTCgk` |
| Page | "Page 1" (`0:1`) |
| How it was read | Figma Desktop + the **Desktop Bridge** plugin through the `figma-console` MCP (read-only scripts; the file was never modified) |
| Candidates inspected | 58 frames (35 top-level on the page + 23 inside the section "UAE vs Japan") |
| Selected | 20 |
| Fonts in the file | Inter (Regular/Medium/Semi Bold/Bold), Lora (Regular) — nothing else |

The separate **Design System** Figma file (`ydWU7L8tpt5LQJg3cmnqHF`) was *not* connected during the build; the app's own interface follows the saved snapshot in `../design-system/`.

## Files here

- `candidates.json` — every frame that was inspected (node id, size, text/image/vector counts, fonts).
- `inventory.json` — the 20 selected templates with counts, complexity, pixel-match and limitations, plus the 38 not selected with reasons.
- `selected-templates-manifest.json` — the mapping used by the importer: Figma node → template id, name, category, format, tags.
- `reference-renders/` — one PNG per selected template, exported from Figma at 1× (the "ground truth" the app is compared with).

## The 20 selected frames

| Template id | Figma node | Size |
|---|---|---|
| expand-uae-square | 1:2349 | 1080×1080 |
| expand-uae-story | 1:2286 | 1080×1920 |
| start-aed-4888-square | 1:3091 | 1080×1080 |
| start-aed-4888-story | 1:2854 | 1080×1920 |
| business-setup-simplified | 4:782 | 1080×1350 |
| one-partner-story | 1:2505 | 1080×1920 |
| one-partner-link | 1:2632 | 1080×566 |
| trusted-750-story | 1:2764 | 1080×1920 |
| trusted-750-link | 1:3224 | 1080×566 |
| growth-opportunity-square | 1:2926 | 1080×1080 |
| growth-opportunity-story | 1:2698 | 1080×1920 |
| sales-marathon | 4:1956 | 1080×1350 |
| flag-day-skyline | 5:5592 | 1080×1350 |
| flag-day-landmark | 5:5519 | 1080×1350 |
| japan-cover-dark | 5:5754 | 1080×1350 |
| japan-cover-light | 5:6303 | 1080×1350 |
| japan-opportunities-dark | 5:5930 | 1080×1350 |
| japan-signpost-light | 5:5907 | 1080×1350 |
| japan-cards-dark | 5:6092 | 1080×1350 |
| japan-ai-handshake-dark | 5:6181 | 1080×1350 |

Not selected: 6 long checklist documents (800–920 px wide, not posters), near-identical variants of selected layouts, and three small card components. Reasons per frame are in `../../04-documentation/template-inventory.md`.

Node IDs are only meaningful inside this Figma file; if designers duplicate or rebuild frames the IDs change and `selected-templates-manifest.json` must be updated.
