# Known limitations, deferred items and honest notes

Everything the PRD marks P0 is built and tested. This page lists what is **not** done or only partly done, so nothing is overstated.

## Not built (PRD P1 nice-to-haves)
- **Snap-to-grid and alignment guides** while dragging. (Use the X/Y fields or arrow keys.)
- **Drag-to-reorder layers.** Reordering is done with *Forward / Backward* buttons.
- **Advanced image cropping.** Images support Fill/Fit, zoom and shift, and the frame can be resized, but there is no free crop tool.

## Partly done
- **Groups** (Footer, Button) can be shown/hidden together but not moved as one block; move their layers individually.
- **Rotation** of layers is turned off in the UI (templates that are rotated in Figma keep their rotation).
- **Per-word colour**: coloured words from the template (e.g. the orange in a heading) follow the text when it is edited and have their own *Second colour* control, but you can't select a new arbitrary word and colour it.
- **Frosted-glass cards**: Figma's glass effect has no browser equivalent. The cards use a blurred-backdrop approximation, so the blur looks close but not identical (visible on *One Partner*, *Don't Miss Your Next Growth Opportunity*, *Expand Your Business*).
- **Icons, logos and illustrations are pictures, not vectors.** Figma's SVG export repeatedly froze the plugin, so small graphics are exported as 3× PNG (sharp at the template's size, soft if zoomed far past 100%). Illustrations that were hundreds of Figma vectors (the Dubai skyline) are single picture layers by design (PRD 7.4); 5 small icon/footer graphics per template are likewise single pictures. Each template's limitations are listed in `docs/template-inventory.md`.
- **Visual fidelity** is 96.6%–99.6% pixel match to Figma. Text can differ by 1–3 px because Figma's Inter build is ~0.4% narrower than the bundled one, and photos are resampled differently. These are tolerances, not exact copies.

## Scope kept out on purpose (PRD section 5.3 / V2)
No Figma sync or login, no AI image/copy generation, no accounts or sharing, no cloud storage, no publishing to Instagram/LinkedIn, no collaboration.

## Things to know when using it
- Projects are saved **in this browser on this computer** (IndexedDB). Clearing site data, private windows and other computers don't see them; use **Save file** to move or back up a design. Undo history is lost on refresh (the design itself is kept).
- Only **Inter** and **Lora** are offered (the only fonts in the Figma file). Both are bundled.
- Desktop-first: below ~900 px wide the editor shows a "use a larger screen" message. The library still works on small screens.
- Only the original 20 poster sizes are offered; there is no "custom size" canvas (uploads use the image's own size, capped at 4096 px on the long side).

## Not verified (honest gaps)
- Tested in **Chromium on macOS** only. Safari, Firefox and Windows were not run.
- **Performance** was not measured on a typical laptop; dragging feels instant on this Mac, including the glass cards, but that is one machine.
- The PRD's **"under 5 minutes for a first-time user"** target needs real user testing; it can't be claimed from automated tests.
- **Design-system fidelity of the app's own UI** follows the saved `arnifi-design-system` snapshot of 13 Oct 2026 (Arnique/Dusk colours, Lora headings, Inter UI, 2 px CTA / 4 px control radii). The live "Design System" Figma file was not connected, so the UI was not re-checked against it.
- **Human visual review** was done side by side for 3 templates; the others were checked by pixel comparison. Designers should look over the showcase templates before the demo.
- **Not deployed.** It builds and previews locally; publishing is a deliberate next step (see README).
- The Figma REST token configured for the MCP is expired; it wasn't needed because the Desktop Bridge gave full access.
