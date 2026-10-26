# Figma import notes

How the 20 templates were built, and what to know before importing more. Development-time only; the app never talks to Figma.

## Pipeline

| Step | Tool | Output |
|---|---|---|
| Inspect candidates | `figma_execute` (read-only) | `inventory/candidates.json` |
| Extract a frame | `scripts/figma/inspect/extract.js` (`__arnifiRunMany`) | spilled JSON: draft template + assets + report |
| Convert | `scripts/figma/convert/ingest.ts` | `src/data/templates/<id>.json`, `public/template-assets/**`, `inventory/raw/<id>.json` |
| Roles / groups / names | `convert/roles.ts` + `overrides/<id>.json` | layer roles, purpose-based groups (Footer, Button), readable names |
| Reference render | `__arnifiRefMany` + `inventory/save-ref.mjs` | `inventory/refs/<id>.png` |
| Verify | `validate/parity.ts` | `inventory/parity/<id>.png`, `-diff.png`, `results.json` |
| Thumbnails | `validate/thumbs.ts` | `public/thumbs/<id>.webp` (made from the app's own render) |
| Inventory | `inventory/build-inventory.ts` | `docs/template-inventory.md`, `inventory/inventory.json` |

## What is extracted

Text with every style run (family, weight, size, line height, letter spacing, colour, alignment, auto-resize), images (the original bytes of each image fill plus crop/scale mode), shapes (rectangles, ellipses, solid/gradient fills, strokes, corner radii, drop shadows), clipping frames, flips and rotations, visibility, opacity, layer order. Image fills are saved as JPG when they have no transparency, PNG otherwise.

## Things that were learnt the hard way

- **Figma's SVG export stalls the plugin** on some nodes (it blocked the whole sandbox). Small graphics are exported as 3× PNG instead of SVG, so logos are sharp raster images, not vectors.
- **MCP result limit**: an 8 MB cap per call. Frames with new photos go one per call; results over ~25k tokens are written to a file automatically (the extractor pads its return value to force that so photo bytes never enter the conversation).
- **Mirrored nodes** (negative scale) must be positioned from their bounding box and flagged `flipX/flipY`, otherwise they land off-canvas.
- **Masks**: a masked group is exported as one picture (the mask is a layer inside it).
- **Frosted glass** (`GLASS` effect) has no canvas equivalent. Cards use a custom `GlassRect` that blurs what is already painted underneath, at about half Figma's radius. Small glass icon tiles are baked into their picture.
- Figma's Inter is a slightly different build from the bundled one (about 0.4% wider), so wrapped text boxes get 0.6% tolerance to avoid new line breaks.
- Fabric 7 draws objects from their centre by default; the builder forces top-left origins. Fabric also places the first baseline differently from Figma's line box; `lib/canvas/builder.ts` corrects with the fonts' ascent/descent.

## Quality gate

`npm run figma:parity` must show every template within a few percent of its reference (currently 0.4%–3.4% mismatch; the remainder is text anti-aliasing, photo resampling and glass blur). A significant jump means a layout regression.
