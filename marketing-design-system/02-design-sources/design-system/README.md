# Arnifi design-system snapshot

Copied from the `arnifi-design-system` skill (`~/.claude/skills/arnifi-design-system/`), which was extracted on **13 Oct 2026** from the Figma file "Design System" (`ydWU7L8tpt5LQJg3cmnqHF`): 5 variable collections, 138 text styles, 108 paint styles, 28 effect styles, 19 grid styles.

It is a **condensed snapshot**, not the whole file, and it is a copy: if the skill is updated later this folder will not follow.

Used for the app's own interface (not the posters, which come straight from Figma):

- Colours: Arnique (primary indigo `#2E2EA3`, hover `#16167A`), Dusk (cool greys), Ruby/Tang/Moss for error/warning/success → `src/styles/global.css` custom properties.
- Type: **Lora** for the page heading only; **Inter** for everything else.
- Controls: 2 px radius on primary buttons, 4 px on inputs and small controls, 8 px on cards; 32/40/48 px control heights; focus ring Arnique-500.
- Light mode only.

Start with `SKILL.md`, then `references/color.md`, `typography.md`, `components.md`. `references/known-drift.md` lists where the Figma file itself is inconsistent.
