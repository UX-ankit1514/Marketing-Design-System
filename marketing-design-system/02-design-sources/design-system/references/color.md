# Color

Two variable collections + paint styles. Always bind the **semantic** token (`Color_tokens`) when one exists;
fall back to the ramp (`Color_Variables`) only for illustration/decoration.

- `Color_Variables` — raw ramps. Single mode "Dark Mode" (the ramp names carry Light/Dark in the path for semantic hues).
- `Color_tokens` — 79 semantic tokens, **Light Mode / Dark Mode**, every value is an alias to a ramp (a few dark values are literal `#FFFFFF`).
- Paint styles mirror the ramps: `Primary/Arnique-900`, `Gray/Dusk/Dusk-300` (shown as `Dusk/Dusk-300`),
  `Surface Colors/Dawn/Dawn-200`, `Semantic Colors/Ruby/Ruby-700`, `Accent/Tang-500`, `Gray/Ash Gray-…`.

## Ramps (light values; step 100 lightest → 1000/1200 darkest)

**Arnique — primary brand (indigo/violet)** `Color/Arnique/Arnique-N`
100 `#F5F5FF` · 200 `#EBEBFF` · 300 `#D6D6FF` · 400 `#C7C7FF` · 500 `#A6A6F5` · 600 `#8282E0` · 700 `#6262CC` ·
800 `#4646B8` · **900 `#2E2EA3`** · 1000 `#16167A` · 1100 `#070752` · 1200 `#000029`

**Dusk — cool gray (default UI neutral)** `Color/Gray/Dusk/Dusk-N`
100 `#FFFFFF` · 200 `#F2F4F8` · 300 `#DDE1E6` · 400 `#C1C7CD` · 500 `#A2A9B0` · 600 `#878D96` · 700 `#697077` ·
800 `#4D5358` · 900 `#343A3F` · 1000 `#21272A` · 1100 `#121619` · 1200 `#000000`

**Dawn — warm gray (warm sections, text on warm)** `Color/Gray/Dawn/Dawn-N`
100 `#FFFFFF` · 200 `#F7F3F2` · 300 `#E5E0DF` · 400 `#CAC5C4` · 500 `#ADA8A8` · 600 `#8F8B8B` · 700 `#726E6E` ·
800 `#565151` · 900 `#3C3838` · 1000 `#272525` · 1100 `#171414` · 1200 `#000000`

**Ash Gray — neutral** `Color/Gray/Ash Gray/Ash Gray-N`
100 `#FFFFFF` · 200 `#F4F4F4` · 300 `#E0E0E0` · 400 `#C6C6C6` · 500 `#A8A8A8` · 600 `#8D8D8D` · 700 `#6F6F6F` ·
800 `#525252` · 900 `#393939` · 1000 `#262626` · 1100 `#161616` · 1200 `#000000`

**Tang — accent/warning orange** `Accent/Tang-N`
100 `#FFF7E6` · 200 `#FFE7BA` · 300 `#FFD591` · 400 `#FFC069` · 500 `#FFA940` · 600 `#FA8C16` · 700 `#D46B08` ·
800 `#AD4E00` · 900 `#873800` · 1000 `#612500`

**Semantic hues** (`Color/<Hue>/Light Mode/<Hue>-N`, `Color/<Hue>/Dark Mode/N`)
- Ruby (error): 100 `#FFF1F0` 200 `#FFCCC7` 300 `#FFA39E` 400 `#FF7875` 500 `#FF4D4F` 600 `#F5222D` **700 `#CF1322`** 800 `#A8071A` 900 `#820014` 1000 `#5C0011`
- Moss Green (success): 100 `#F6FFED` 200 `#D9F7BE` 300 `#B7EB8F` 400 `#95DE64` 500 `#73D13D` 600 `#52C41A` **700 `#389E0D`** 800 `#237804` 900 `#135200` 1000 `#092B00`
- True Blue (info/link): 100 `#E6F4FF` 200 `#BAE0FF` 300 `#91CAFF` 400 `#69B1FF` 500 `#4096FF` 600 `#1677FF` **700 `#0958D9`** 800 `#003EB3` 900 `#002C8C` 1000 `#001D66`
- Jewel (caution yellow): 100 `#FFFBE6` 200 `#FFF1B8` 300 `#FFE58F` 400 `#FFD666` 500 `#FFC53D` 600 `#FFC53D` 700 `#FAAD14` 800 `#AD6800` 900 `#874D00` 1000 `#613400`
- Plum (undefined/purple): 100 `#F6F2FF` 200 `#E8DAFF` 300 `#D4BBFF` 400 `#BE95FF` 500 `#A56EFF` 600 `#8A3FFC` 700 `#6929C4` 800 `#491D8B` 900 `#31135E` 1000 `#1C0F30`

Dark-mode ramps for the semantic hues (`…/Dark Mode/N`, 100→1000):
- Ruby `FAC8C3 F89F9A F37370 E84749 D32029 A61D24 791A1F 58181C 431418 2A1215`
- Moss `D5F2BB B2E58B 8FD460 6ABE39 49AA19 3C8618 306317 274916 1D3712 162312`
- Tang `FAE3B7 F8CF8D F3B765 E89A3C D87A16 AA6215 7C4A15 593815 442A11 2B1D11`
- True Blue `B7DCFA 8DC5F8 65A9F3 3C89E8 1668DC 1554AD 15417E 15325B 112545 111A2C`
- Jewel `FAEDB5 F8DF8B F3CC62 E8B339 D89614 AA7714 7C5914 594214 443111 2B2111`
- Plum `EBD7FA CDA8F0 AB7AE0 854ECA 642AB5 51258F 3E2069 301C4D 24163A 1A1325`

## Semantic tokens (`Color_tokens`) — Light → Dark

**Brand:** `brand-primary` Arnique-900 → Arnique-900 · `brand-secondary`/`brand-tertiary` `#FFFFFF`.

**Section backgrounds** (page/section fills)
| Token | Light | Dark |
|---|---|---|
| bg-blue-superlight | Arnique-100 | Arnique-1200 |
| bg-blue-light | Arnique-200 | Arnique-1100 |
| bg-blue-mediumlight | Arnique-300 | Arnique-1000 |
| bg-blue-medium | Arnique-800 | Arnique-500 |
| bg-blue-dark | Arnique-900 | Arnique-400 |
| bg-blue-extradark | Arnique-1000 | Arnique-300 |
| bg-cool-superlight | Dusk-100 (white) | Dusk-1100 |
| bg-cool-light | Dusk-200 | Dusk-1000 |
| bg-warm-superlight | Dawn-100 (white) | Dawn-900 |
| bg-warm-light | Dawn-200 | Dawn-1000 |

**Text**
| Token | Light | Dark |
|---|---|---|
| text-heading | Arnique-1000 | Arnique-400 |
| text-default | Dusk-1000 | Dusk-300 |
| text-secondary (inverse text on dark fills) | Dusk-100 | Dusk-1200 |
| text-disabled | Dusk-500 | Dusk-400 |
| text-link | True Blue-700 | True Blue-500 (dark) |
| text-cool-superlight→extradark | Dusk-600/700/800/900/1000/1200 | Dusk-600/300/400/300/200/100 |
| text-warm-superlight→extradark | Dawn-600/700/800/900/1000/1200 | Dawn-600/500/400/300/200/100 |
| text-blue-superlight→extradark | Arnique-700/800/900/1000/1100 (5 steps) | Arnique-500/700/300/200/100 |

> `text-secondary` is **not** "secondary text color" — it's the on-dark inverse (white in light mode). For
> muted/secondary body copy use `text-cool-light` (Dusk-700) or `text-cool-superlight` (Dusk-600).

**Border**
| Token | Light | Dark |
|---|---|---|
| border-default | Dusk-300 | Dusk-1000 |
| border-active | Dusk-300 | Dusk-300 |
| border-hover | Dusk-500 | Dusk-500 |
| border-focused | Arnique-500 | Arnique-500 |
| border-error | Ruby-500 | Ruby dark-500 |
| border-success | Moss-700 | Moss dark-500 |
| border-warning | Tang-500 | Tang dark-500 |
| border-disabled | Dusk-300 | Dusk-300 |

**Buttons** (fills)
| Token | Light | Dark |
|---|---|---|
| Primary active / focused | Arnique-900 | Arnique-900 |
| Primary hover | Arnique-1000 | Arnique-800 |
| Primary disabled | Dusk-300 | Dusk-800 |
| Secondary active / focused | Arnique-200 | Arnique-200 |
| Secondary hover | Arnique-300 | Arnique-300 |
| Secondary disabled | Dusk-300 | Dusk-300 |
| Tertiary active / focused | Dusk-100 (white) | Dusk-900 |
| Tertiary hover | Dusk-200 | Dusk-1000 |
| Tertiary disabled | Dusk-300 | Dusk-800 |
| Link active / focused | Arnique-900 | Arnique-100 / Dusk-200 |
| Link hover | Arnique-1000 | Arnique-200 |
| Link disabled | Dusk-300 | Dusk-700 |

**Icons** (dark mode: all `#FFFFFF`)
`icon-primary` Dusk-1000 · `icon-secondary` Dusk-800 · `icon-active` Arnique-900 · `icon-interactive` Arnique-1000 ·
`icon-accent` Tang-500 · `icon-alert` Ruby-700 · `icon-info` True Blue-600 · `icon-success` Moss-700 · `icon-disabled` Dusk-400

**Semantics (status fills):** `Error` Ruby-600 · `Success` Moss-600 · `Warning` Tang-600 · `Info` True Blue-600 ·
`Caution` Jewel-600 · `Undefined` Plum-dark-600. (Dark mode literal white — define per use.)

**Chips:** `chips-default` Ash Gray-100 · `-hover` Ash Gray-200 · `-selected` Arnique-900 · `-selected-hover` Arnique-1000 · `-disabled` Dusk-300.

## Usage rules

- **Page background:** white (`bg-cool-superlight`). Alternate sections with `bg-blue-superlight` (Arnique-100)
  or `bg-warm-light` (Dawn-200) — one tint per section, never stripes of three.
- **Dark sections:** `bg-blue-extradark`/Arnique-1100 + inverted button (light fill, dark label).
- **Accent color** is for one thing per view (a highlighted word, an eyebrow, a price). Tang is the accent
  (prices/warnings); Arnique-500–700 is the highlight for words/eyebrows.
- **Status color triplet:** solid fill at 700 (600 for Tang) with white text; outlined = 1px 700 border + 34px
  tile with 700 fill + white icon; subtle = Arnique-100.
- **Never** use Jewel/Plum as brand colors — status only.
- **On-screen opacity convention** (from landing page): primary text full strength, secondary text = same ink
  at **60% opacity**. Prefer the Dusk tokens (`text-cool-light`) in new work; if reproducing the landing page
  look, 60% ink is what it uses.
