# Stakeholder demo checklist

About 5 minutes. Run `npm run dev` (or `npm run build && npm run preview`) and open the address in Chrome. Have a business photo ready on the desktop (any PNG/JPG). Start with a clean browser profile or just expect your earlier projects under "Your projects".

## Before you start
- [ ] App opens to **Create New Design** with 20 templates visible and thumbnails loaded.
- [ ] Internet and Figma are **not** needed. (You can switch Wi-Fi off to prove it.)
- [ ] A photo to upload is on the desktop.

## The script (PRD section 21)

| # | Do | Say |
|---|---|---|
| 1 | Show the library. Type "UAE" in search, click the *Business setup* chip. | "This is the central library: 20 approved posters, all rebuilt from our Figma file." |
| 2 | Click **Use template** on *Expand Your Business to the UAE (Square)*. Name it "Dubai business setup". | "Designers made this in Figma. Starting a design never changes the original." |
| 3 | Editor opens. Point at the Layers list and the poster. | "Every piece is its own layer: headline, photo, icons, button, footer, logo. It's not a flattened picture." |
| 4 | Select the headline. Replace it with **Start your business in Dubai**. | "The orange highlight stays where it was. No design skills needed." |
| 5 | Select the line under it, type **Company setup from AED 4,888**. Paste a very long sentence to show the warning, then undo (Ctrl+Z). | "If copy is too long the tool warns you instead of cutting it off." |
| 6 | Select **Background photo** → **Replace image** → pick your photo. Try *Zoom*. | "New photo drops into the same frame." |
| 7 | Click the headline on the poster and drag it up a little; use ← → to nudge. | "Drag on the poster or use exact numbers on the right." |
| 8 | Hide the **Footer** group (eye icon), move the **Arnifi logo**, then show the footer again. | "Logo and footer are adjustable, hideable and restorable." |
| 9 | Click **Undo** twice, **Redo** once. Click **Reset template** → *Keep my edits*. | "Mistakes are safe." |
| 10 | Click **Preview**. | "This is the exact final design with no editing handles. Output size is 1080 × 1080." |
| 11 | Click **Export**, choose **PNG**, **Download PNG**. Open the file. | "Brand-consistent, original size, ready to post." |
| 12 | Refresh the browser (F5). | "Everything is still here. Projects are saved on this computer." |

Closing line from the PRD: *"Previously, creating or modifying these posts required repeated involvement from the design team. With Arnifi Marketing Studio, the marketing team can use approved templates, edit the content independently, and export a brand-consistent creative in minutes."* Time savings are a hypothesis until measured in user testing.

## Bonus (if asked)
- **Upload template**: drop a PNG, show it opens as a flat background you can add text over; the app says text inside the picture can't be edited.
- **Save file** → **Upload template** with the `.project.json`: layers come back fully editable.
- Open a *story* (1080×1920) and a *link post* (1080×566) template to show other formats.

## If something goes wrong
- Blank screen on a template: refresh once; if it persists, note which template and tell the developer (the library shows a red message for any template that fails validation).
- "Not saved" in the top bar: the browser's storage is full or blocked (private window). Use **Save file** to keep your work.
- Fonts look different: a yellow notice appears if Inter/Lora can't be loaded.
