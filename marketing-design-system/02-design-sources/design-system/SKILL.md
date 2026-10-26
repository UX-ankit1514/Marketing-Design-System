---
name: arnifi-design-system
description: Design or build any Arnifi screen, page, section, form or UI component so it follows the Arnifi Design System exactly — Lora/Inter type scale, Arnique/Dusk/Dawn color tokens, 12-col grids, component specs, shadows, motion and copy tone. Use whenever the user asks for an Arnifi screen/page/dashboard/landing section/form (in Figma or code) or says "use the design system", "follow the DS", "make it like the Design System file". Source of truth is the Figma file "Design System" (key ydWU7L8tpt5LQJg3cmnqHF). Not for slide decks — use arnifi-deck-design or arnifi-saas-slides for those.
---

# Arnifi Design System — screen builder

Extracted from the live Figma file **"Design System"** (`ydWU7L8tpt5LQJg3cmnqHF`) via the figma-console bridge
on 2026-10-13: 5 variable collections (837 vars), 138 text styles, 108 paint styles, 28 effect styles,
19 grid styles, ~30 pages. Changelog in file: v1.0.0, 10 Apr 2025.

Detail lives in `references/` — read the file for the thing you are building:

| Need | Read |
|---|---|
| Any color decision | `references/color.md` |
| Any text | `references/typography.md` |
| Buttons, inputs, alerts, cards, nav, etc. | `references/components.md` |
| Grid, spacing, section rhythm, page recipes | `references/layout-and-screens.md` |
| Shadows, radius, icons, motion | `references/effects-icons-motion.md` |
| Copy, tone, casing | `references/voice-and-copy.md` |
| Driving Figma from code, name lookups, gotchas | `references/figma-build-notes.md` |
| Where the file is inconsistent / open questions | `references/known-drift.md` |

## The system in one screen

**Brand feel:** deep indigo ("Arnique") on white, soft lavender tints, one serif voice (Lora) for headings,
Inter for everything functional. Near-square corners on CTAs, 4px on controls. Calm, trustworthy, friendly.

**Fonts:** Lora = headings/display (400/500/600). Inter = sub-headings, body, UI, labels (400/500/600/700).

**Primary color:** Arnique-900 `#2E2EA3` (`Brand/brand-primary`). Hover Arnique-1000 `#16167A`.
Heading text `Text/text-heading` = Arnique-1000. Body text `Text/text-default` = Dusk-1000 `#21272A`.
Neutrals: **Dusk** (cool gray, UI default), **Dawn** (warm gray, warm sections), **Ash Gray** (neutral).
Semantic: Ruby (error), Moss Green (success), Tang (warning/accent orange), True Blue (info), Jewel (caution),
Plum (undefined).

**Grid:** Laptop 1440 → 12 cols, 32 gutter, 160 margins (content 1120). Mobile 390 → 4 cols, 16 gutter, 24 margin.
**Spacing:** 2px base unit; scale 2/4/8/12/16/24/32/40/48/64/80/96/100/120/160/200.
**Radius:** CTA buttons ≈2 (sharp), controls 4, tiles 6, cards 8–10, pills/avatars fully round.
**Elevation:** use the named effect styles (`Outer Shadow/…`), never hand-rolled shadows.
**Motion:** Smart-Animate style, 0.3s hover, 1s linear loops, skeleton shimmer for loading.

## Rules (follow in this order)

1. **Tokens first, never raw values.** Every fill/stroke binds to a variable (`Color_tokens` semantic first,
   `Color_Variables` ramp second). Every text node gets a text style. Every shadow is an effect style.
   Every frame that is a page gets a grid style. If a value isn't in the system, stop and ask — don't invent.
2. **Use the scale, not the nearest number.** Font size/line-height only from the 138 styles. Spacing only
   from the spacing scale. If a layout "needs" 15px, it needs 16.
3. **Semantic over ramp.** `Border/border-default`, `Text/text-heading`, `Button/Primary/button-primary-hover`
   — not `Dusk-300`, `Arnique-1000` directly — whenever a semantic token exists. This is what makes dark mode work.
4. **Lora only for headings** (Display D1–D6, Large L1–L5). Never Lora for body, buttons, labels, inputs.
5. **Prefer existing components** (instances from the file) over rebuilding. Build to spec only when no
   component exists; then match `references/components.md` exactly.
6. **Auto layout everywhere.** The landing-page frames in the file are *not* auto-layout (groups) — don't copy that.
7. **Copy follows `voice-and-copy.md`** (simple, direct, friendly; CTAs Title Case; no jargon).
8. **Support dark mode** by using semantic tokens; if the screen is light-only say so explicitly.
9. **Accessibility baseline:** text ≥ 12px, contrast ≥ 4.5:1 body (Dusk-1000 on white ≈ 15:1; Dusk-500 `#A2A9B0`
   on white is only ~2.4:1 — placeholder/disabled use only), tap targets ≥ 40px, focus state always shown
   (`Border/border-focused` Arnique-500).

## Workflow for a new screen

1. Confirm: platform/breakpoint (Laptop 1440 / Tablet 960 / Mobile 390 / Monitor 1920), light/dark, target
   Figma file (new file vs this DS file), and the content. Ask only what's missing.
2. Look up what exists: `figma_search_components`, text styles by name, variables by name
   (`references/figma-build-notes.md` has the snippets and pitfalls).
3. Pick the page recipe from `layout-and-screens.md` (header → sections → footer rhythm) and the grid style.
4. Build top-down in auto layout: page frame (grid style) → sections (padding from scale) → content.
   Bind tokens as you create nodes — don't plan to "fix later".
5. Screenshot each section (`figma_take_screenshot`), compare against the spec, iterate (max 3 loops).
6. Run the audit checklist below; fix; screenshot again.

### Audit checklist (must pass before saying "done")

- [ ] No unbound fills/strokes (search for raw hex), no text without a text style
- [ ] Only scale spacing; section padding/gaps from the scale
- [ ] Headings Lora, everything else Inter; no stray fonts (the file has leaks of DM Sans, SF Pro — don't copy)
- [ ] Buttons per spec (height, padding, label style, hover/disabled/focus states exist)
- [ ] Inputs: label → field → helper/error stack, 10px gaps, error uses the Ruby token + icon
- [ ] Shadows are named effect styles; radii from the radius scale
- [ ] Grid style applied to page frames; content aligned to columns
- [ ] Copy checked: casing, no trailing full stops in headings/buttons, "&" without a preceding comma
- [ ] Dark-mode semantic mapping valid (or explicitly light-only)
- [ ] Open questions from `known-drift.md` either resolved with the user or noted in the handoff

## When the file and this skill disagree

The **Figma variables/styles are canonical**. The marketing landing-page frames in the file are a
*composition* reference and use off-token hex values (`#171752`, `#7070FF`, `#3939CC`, `#F7F7FD`…). When
building new screens bind the nearest token, and tell the user what you mapped (table in `known-drift.md`).
If the user says "match the live site", use the landing-page values *and* say they're off-token.

Re-sync: if the DS file changes, re-run the extraction (`figma_execute` snippets in `figma-build-notes.md`)
and update `references/`.
