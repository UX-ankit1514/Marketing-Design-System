# Known drift & open questions

The DS file is partly mid-migration. Canonical = variables, text/paint/effect/grid styles, token-bound components.
Everything below is a place where the file contradicts itself. **Never silently pick — tell the user which way you went.**

## 1. Off-token values on the landing-page screens → nearest token

| Landing page uses | Nearest token | Note |
|---|---|---|
| `#3939CC` primary button / logo | **Arnique-900 `#2E2EA3`** | The newer token-bound CTA frames use Arnique-900; `#3939CC` is not in any ramp |
| `#171752` headings/body ink (60% opacity for secondary) | `Text/text-heading` (Arnique-1000 `#16167A`) for headings; `Text/text-default` (Dusk-1000) for body; secondary = `text-cool-light` (Dusk-700) | `#171752` ≈ between Arnique-1000 and 1100 |
| `#7070FF` accent word / eyebrow / step circles / FAQ pill | Arnique-600 `#8282E0` (lighter) or Arnique-700 `#6262CC` (more contrast) | recommend 700 for text on white (contrast ≈ 5:1) |
| `#F7F7FD` tinted section | `bg-blue-superlight` (Arnique-100 `#F5F5FF`) | |
| `#F7F5F2` warm tint / currency chip / card footnote | `bg-warm-light` (Dawn-200 `#F7F3F2`) | |
| `#F2AB53` price/accent | Tang-500 `#FFA940` (or Tang-600 `#FA8C16` for contrast) | |
| `#EBEBFF` icon tile / highlight spans | Arnique-200 | exact match |
| `#D6D6FF` secondary button | Arnique-300 | exact match |
| `#0B0B29` button label ink | Arnique-1200/1100 ink | |
| `#66667A`, `#33333D`, `#8B8B9B`… grays | Dusk-700/900/600 | |
| DM Sans numerals (step circles), SF Pro (Ant tag demos) | Inter | fonts leak from pasted kits |
| Lora 36/50, Inter 14/21, 15/24, 13/auto, 18/28 variants | nearest style: Lora L3 32/40 (or hero L2 48/64); P3 14/20; P2 16/24; P4 12/18; P1 18/28 | scale has no 36/50 or 14/21 |

## 2. Component inconsistencies
- **Dropdown family** is bound to Carbon-style external tokens (`Field/field-01`, `Border/border-strong-01`, `label-01`, `AI layer`) —
  gray `#F4F4F4` field vs Arnifi's white field. Rebuilt triggers recommended; **ask** whether to keep Carbon look in product UI.
- **Text field Error state** keeps the neutral border in the sheet while `border-error` token (Ruby) exists. Skill follows the token.
- **Checkbox** checked fill is a true-blue in the sheet; radio is Arnifi indigo. Skill recommends Arnique-900 for both. **Ask.**
- **Buttons**: radius 1.5–2 (square) vs Units doc "4/8/16"; heights 20–64 vs Units doc "32/40". Skill follows measured buttons.
  The page is titled "In Progress"; old button sets use group layers and `#3939CC`.
- Text-style slips: `In-H2-600` tracking 0 (others -2%), `In-H7-500` line 68 (others 66), `In-P2-Strikethrough` uses Italic face.
- Field labels/helpers in the Text-field sheet reference `…-Underlined` style names even where no underline shows — treat as mis-assigned; use P3-500 label, P2/P4 helper.
- Semantic token names have typos in the doc frames ("semancitc-error", "semantic-caution"); variable names are correct (`Semantics/Error`).
- `Color_tokens` dark mode: Icon/Chips/Semantics tokens are literal `#FFFFFF` placeholders → dark-mode values for those are **undefined**; define per use or ask.
- `text-secondary` is the on-dark inverse, not "muted text".

## 3. Pages that are legacy/empty — don't build from them
`Bin` (old Layout Grids, Color Palette, Typography, CTAs sections), older Typography frames (Display 96px / Heading 48px 132% / Body / Label,
no styles attached), `Release Notes` frame on Changelog (copied from another product, "Reapit"), `Cards` (empty), `Switch` (stub), `Loading` (stub),
`CORE COMPONENTS` (empty). Colors page contains Ant Design test instances (Magenta tags) — ignore.

## 4. Missing from the system (need a decision before designing these)
No documented: logo usage rules, illustration/photography style, data-viz palette, table component, modal/dialog, toast, tooltip, tabs, side-nav,
top app bar (app), empty-state, stepper (beyond Progress Indicator), form layout patterns, switch/toggle, card component, dark-mode surface rules for
screens. When a screen needs one: compose from tokens per `components.md` "Composed patterns", and list what you invented in the handoff.

## 5. Questions to put to the user when they matter
1. Primary blue: tokens (`#2E2EA3`) or live site (`#3939CC`)? Accent: Arnique-700 or `#7070FF`?
2. Headlines: Title Case (written rule) or sentence case with accent word (live site)?
3. Dropdowns: keep Carbon look or Arnifi text-field look?
4. Checkbox fill: Arnique-900 (recommended) or the sheet's blue?
5. Is the screen light-only, or must dark mode work (several dark values are undefined)?
6. Should new work live in the DS file or a separate file linking it as a library?
