# Components

Measured from the file. `[obs]` = read directly from component nodes; `[doc]` = stated in token/doc frames;
`[infer]` = my recommendation where the file is silent. Pages: Accordian, Alerts, Avatars, Breadcrumbs,
Buttons | In Progress, Date and Time Picker, Check box, Badges, Divider, Dropdown, Loading, Pagination,
Progress Bar, Progress Indicator, Switch, Text Fields, Text area. **Cards page is empty. Switch page has no
component set yet.** For those, compose from tokens (see "Composed patterns" at the end).

---
## Buttons (page "Buttons | In Progress")

The page is marked *in progress*. Two generations exist:
- **Old** (`Old Buttons`, 50 component sets `Primary- XL- With Icon` …) — group-based layers, fill `#3939CC`. Don't copy the structure.
- **Current CTA pattern** (`Primary CTA with bg`, `Secondary CTA with bg`, `Frame 1597886470`) — auto-layout,
  token-bound. **Use this.**

**Sizes [obs]** (height × label style): Extra XL (Right icon) 64 · **XL 56** (Inter Medium 16/24, pad 16/20, gap 4) ·
**L 48** (Inter Medium 14/20) · **M 44** (14/20 pad 12/20 in CTA frames; 12/18 in old comps) · **S 32** (12/18).
Text-only tertiary: XL 27 · L 24 · M 22 · S 20 tall. XL min width 118, max 320.
**Radius [obs]: 1.5–2px** (visually square). Never pill. (Units doc says 4/8/16 — buttons are the exception.)

**Anatomy:** label + optional **icon segment** — a separate block on the right: XL 64×56, L 50×48, M 46×44,
24px arrow icon (`fi-rr-arrow-small-right` / arrow-up-right), padding 16/20, fill **one step darker** than the body.
On hover the collapsed 7px stripe at the right edge expands to the full icon segment (Smart Animate, ~0.3s).
Variants named `Default / Hover 1 / Hover 2`; `(DB)` = dark-background variant.

**Types & tokens**
| Type | Fill (default) | Label | Hover | Disabled |
|---|---|---|---|---|
| Primary | Arnique-900 `#2E2EA3`; icon segment Arnique-1000 | white, Inter Medium | Arnique-1000 | Dusk-300 fill, Dusk-500 label |
| Secondary | Arnique-200/100 (`#EBEBFF`/`#F5F5FF`); segment Arnique-300 `#D6D6FF` | `#0B0B29` (≈Arnique-1200 ink) | Arnique-300 | Dusk-300 |
| Secondary 2 | white, label SemiBold `#0B0B29`; hover shows a 7px Arnique-200 edge | | | |
| Dark / "Become a Partner" | warm black `#1F1D1A`, white label, hover edge `#464645` | | | |
| Tertiary | white + 1px Dusk-300, label Dusk-1000 | | Dusk-200 | Dusk-300 |
| Link | text Arnique-900 + chevron 16px | | Arnique-1000 | Dusk-300 |

On colored sections the matrix in the file (`Primary CTA with bg`, 7 backgrounds × states) shows: light/tint
backgrounds → Primary stays indigo; **dark/black backgrounds → inverted button (Arnique-100 fill, dark label)**.
Focus [doc]: `button-*-focused` tokens + `border-focused` ring Arnique-500. Always render a focus state.
Mobile "Button dock": full-width 343–358 × 56 buttons, 16px side gutters, 8 gap, home-indicator safe area.
(That dock uses a third-party base kit with 8px radius and `#E8E8E8/#000` fills — not Arnifi tokens; use the CTA pattern.)
Loading button: states with 1s linear spinner (`Button loading animation`).

---
## Text fields (page "Text Fields") — `Text Fields`, 90 variants

Axes: Size `Small/Medium/Large` · State `Default/Hover/Active/Focus/Error/Warning/Disabled/Loading` ·
Helper Text · Label · Icon (leading/trailing) · Inline vs stacked.
- Stack: **Label → Field → Helper**, vertical gap **10**.
- Field **height 40 (S) / 48 (M) / 56 (L)**; width 440 (S/M), 400 (L) in the sheet; padding **14 / 20**; radius **4**;
  fill white; border **1.5px `border-default` (Dusk-300)**.
- Label: `In-P3` (14/20) Dusk-1000. Input text `In-P2` (16/24); placeholder Dusk-500. Helper `In-P2`/`P4` Dusk-600.
- Hover: border → `border-hover` (Dusk-500). Focus: border `border-focused` Arnique-500 + fill Dusk-200 [obs].
- Error [doc]: border `border-error` (Ruby-500), message row = 20px info-circle icon + text, **Ruby-700**, gap 6.
  (The Error variant in the sheet keeps the neutral border — follow the token doc: red border + red message.)
- Warning: border Tang-500, message + triangle icon in Tang-700. Disabled: label/helper/placeholder `text-disabled`, border `border-disabled`.
- Loading: 20px spinner trailing, field stays Dusk-300.
- Text area: same anatomy; min/max height variants; character count text right-aligned under field.

---
## Dropdown family (page "Dropdown") ⚠ not Arnifi-native

Sets: Default (Fixed/Inline), Fluid, Combo box, Multi-select, Filterable multi-select, Parent (option rows), Accordion.
Sizes Large/Medium/Small; states Enabled/Hover/Focus/Disabled/Error/Warning/Skeleton/Read-only.
These are bound to **Carbon-style tokens** (`Field/field-01` `#F4F4F4`, `Border/border-strong-01`,
`label-01`, `helper-text-01`, `AI layer/…`). Trigger 288×40, padding 11/16, gap 8.
**Recommendation [infer]:** build dropdown triggers with the Text-field anatomy above (white fill, 1.5px
Dusk-300, radius 4, 14/20 padding, chevron 20px) and option rows from `Parent components` (checkbox/radio/leading
icon/flag variants). Flag to the user when you do this — see `known-drift.md`.

---
## Alerts (page "Alerts") — 576 variants

Axes: Text Size `18px-16px / 16px-14px / 14px-12px` · Type `Basic/Detailed` · Category `Filled/Outlined` ·
State `Error / Neutral / Information / Success / Warning / Subtle` · Leading icon · Closing icon · Icon background.
- **Filled:** fill = status 700 (Error Ruby-700 `#CF1322`, Success Moss-700 `#389E0D`, Warning Tang-600 `#FA8C16`,
  Information True Blue-700 `#0958D9`, Neutral Dusk-700 `#697077`, Subtle Arnique-100 `#F5F5FF`); text white
  (Subtle: dark), Inter Medium 14/16; padding 8/10 (basic), gap 10; radius **4**; close icon 10px in a 26px hit area.
- **Outlined:** white, **1px** border in status 700; 34×34 icon tile radius 5 filled status 700 with 24px white icon;
  Detailed = title `In-P3-400` + description 16/14 Medium, padding 12/12/12/14, text Dusk-1200.
- Width fills container (sheet: 576). Place at the top of the content they refer to; one alert per issue.

---
## Accordion (page "Accordian")

Axes: Size `Large 1120 / Medium 500 / Small 342` · State `Default/Hover/Focus/Disabled` · Expanded · Icon.
Container radius **8**, padding **22/24**, gap 16, fill white, border **1px Arnique-600** (open) / Dusk-300 (closed) [obs/infer].
Header: title `In-P3-600` Ash Gray-1000 + 24px chevron, gap 40; divider 1px Dusk-300; body `In-P1-500` Ash Gray-600.
Live FAQ list: items stack with 24 gap, radius 6, 1px border; open item border accent, chevron flips.

---
## Avatars / Badges / Chips

- **Avatar** axes: Shape `Circular/Rounded/Square` · Size `18/20/24/28/40` · Content `Icon/Image/Text` · Status
  `None/Offline/Online/Notification/Message Indicator`. Fill Dusk-200, initials `In-SH6-600` (40px). Circular radius fully round. Add-icon variant for upload.
- **Badge** (`Badges - Simple`): Dot sizes 4/6/8/10 with **1px white ring**, colors Success Moss-700 / Neutral / Warning /
  Error / Primary (Arnique); Message badges 18-10, 22-12, 30-15 (counter pills, Error/Message-Indicator).
- **Tags/chips** on the live page: Inter Medium 13, ink on `#E8E8F0`-ish, radius 2, padding ≈ 8/12 (off-token).
  Token set for chips: `chips-default` (+hover/selected/disabled). Chip radius not specified — use 4 [infer].
  (A "*Tag* / Colorful" instance on the Colors page is from the Ant Design library — ignore.)

## Pagination / Breadcrumbs / Progress / Divider / Checkbox

- **Pagination**: numeric buttons **40×40** (M), radius 4, pad 10, label `In-P1-500`; default white + 1px Dusk-300 + Ash Gray-800 text;
  **selected: fill Arnique-800 `#4646B8`, white text**; prev/next buttons; states Default/Hover/Focus/Disabled/Selected; sizes L/M/S; overflow "…".
  Table bar: `Unbound / Simple / Advanced`.
- **Breadcrumbs**: sizes 12/14/16, items `In-P2-600` Dawn-800, 16px chevron, gap 8; categories Default/Extended/Max items/Overflow/Icon before/after/Truncated.
- **Progress bar**: track **6px** (Large "8px", Small "4px") radius 4, fill Dusk-200 track / progress color by state
  (Active, Error, Success); label `In-P2-400`, helper `In-P2-500` Dusk-600; Inline alignment option; Indeterminate state.
- **Progress indicator** (stepper): elements `Complete/Incomplete/Current/Error/Disabled`, Large/Small; "Advanced – Double label".
- **Divider**: Solid/Dashed/Dotted × 0.5/1/2/4px; horizontal with label Left/Centre/Right (+ icons), label `In-P2-600` Ash Gray-800; vertical variant. Color Dusk-300.
- **Checkbox/Radio**: sizes 18/20/24; Default / Nested (indeterminate) / Radio; states default, hover, focus (tinted
  fill chip behind), disabled, error (Ruby), required (red asterisk). Checked checkbox renders a blue fill in the sheet while radio
  uses Arnique — **verify with user** which should be the brand fill (Arnique-900 recommended).
- **Date/time picker**: calendar day cells (Default/Hover/Focus/Selected/Today/In-range/First/End/Prev-Next month/Disabled/priority dots),
  small & large calendars, month pagination, date editor, time picker (S/M/L), timezone & AM/PM pickers,
  "Date picker – Simple" field (Large/Medium/Small × Default/Hover/Typing/Focus/Error/Warning/Disabled). Same field anatomy as text fields.
- **Skeleton loaders**: `Skeleton Loader - Content` (0%→100% linear gradient shimmer, 1s linear loop), `Domino`
  (staggered fade, "gentle" ~1.9s), `Button loading`.
- **Flags**: `Currency flags` set (51, 24×18), `Flag icons` (197 country flags), per-country sets.

---
## Composed patterns (no component yet — build from tokens)

**Card** (marketing, from landing page): white, radius 6–10, padding 24–30, border 1px `border-default` *or*
soft shadow (`Outer Shadow/Light Double Shadow`); title `In-SH7-600`/`P2-600`; body `P3-400` secondary ink;
icon tile 40×40 radius 6 fill Arnique-200 with duotone Arnique icon; internal gap 12–16. Footnote band: warm-light
fill (`bg-warm-light` Dawn-200) full-bleed at card bottom, padding 10/30/20/30, `P3`.
**Testimonial card**: white, radius 4–8, shadow Medium Double, quote `P1-400`, key phrases highlighted with
Arnique-200 background spans (radius 4), author `P2-600`, role `P2-600` muted, tag chips.
**Step item**: 50px circle (accent fill `#7070FF`≈Arnique-600/700) numeral white `SH6`-ish, connector bar 10px high
radius full `#EFEFEA`-like (Dawn-200/300), title `SH7-500`, body `P2-400` muted.
**Header** (110 tall): logo left @ x160; nav `Inter Medium 15/24` ink @40%; currency chip (Dawn-200 fill, 1px border, radius 4);
primary CTA with arrow segment right-aligned @ x1280. Optional 50px announcement bar under it
(Arnique-100 fill, `Inter Medium 16` Arnique-600 text + underlined link).
**Footer**: logo, address `P1`, contacts, payment-method row; 3 link columns with SPH eyebrow heads (uppercase, accent) and
`P2-500` links ink; bottom bar 1px divider + `P3` legal links + 24px social icons; section padding 40/59/30/59 (live) — use 80/160 on grid.
**Eyebrow pill**: height 40, radius full, fill accent, white `Inter Medium 14`, 16px sparkle icon, gap 8.
