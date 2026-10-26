# Typography

Two families only. **Lora** (serif) = headings/display. **Inter** = sub-headings, body, UI, labels.
138 text styles exist; **apply the style, never override size/line-height/tracking**. The file's own rule:
"Don't UNBIND any pre-assigned value", "Don't override the type scales without approval from design",
"Maintain a proper hierarchy". Devs: use `rem` for font sizes (px below is the source of truth).

Naming: `<Family-abbr>-<token>-<weight>` e.g. `Lo-D1-400`, `In-H3-600`, `In-SH6-500`, `In-P2-400`, `In-SPH4-600`.
Style path in Figma: `Headings | Lora/Regular/Lo-D1-400`, `Sub headings | Inter/Medium/In-SH6-500`,
`Paragraphs | Inter/Regular/In-P2-400`, `Special Headings | Inter/Bold/In-SPH4-700`.
(Weight folders: `Regular`, `Medium`, `SemiBold`/`Semi Bold`, `Bold`.)

## Lora — headings (weights 400 / 500 / 600)

| Token | Size / Line | Tracking | Use |
|---|---|---|---|
| D1 | 140 / 148 | -3% | hero display (rare) |
| D2 | 120 / 132 | -3% | |
| D3 | 100 / 108 | -3% | |
| D4 | 80 / 88 | -3% | |
| D5 | 72 / 84 | -3% | |
| D6 | 64 / 76 | -2% | |
| L1 | 56 / 68 | -2% | page hero heading (desktop) |
| L2 | 48 / 64 | -2% | page/section heading |
| L3 | 32 / 40 | 0 | section heading (compact), mobile hero |
| L4 | 28 / 36 | 0 | card/section heading |
| L5 | 24 / 24 | 0 | small serif heading |

## Inter — headings (500 / 600 / 700) — product/dashboard hero scale

| Token | Size / Line | Tracking |
|---|---|---|
| H1 | 80 / 88 | -3% |
| H2 | 76 / 84 | -2% (600 variant: 0 — likely a file slip, use -2%) |
| H3 | 72 / 80 | -2% |
| H4 | 68 / 76 | -2% |
| H5 | 64 / 72 | -1% |
| H6 | 62 / 70 | -1% |
| H7 | 60 / 66 | -1% (500 variant line is 68) |

## Inter — sub-headings (400 / 500 / 600 / 700)

| Token | Size / Line | Tracking | Typical use |
|---|---|---|---|
| SH1 | 48 / 72 | -2% | |
| SH2 | 40 / 56 | -2% | |
| SH3 | 36 / 44 | -2% | |
| SH4 | 32 / 40 | 0 | page title (app) |
| SH5 | 28 / 36 | 0 | |
| SH6 | 24 / 32 | 0 | section title, avatar initials (40px avatar) |
| SH7 | 18 / 24 | 0 | card title, step title |
| SH8 | 14 / 20 | 0 | small title, table header |
| SH9 | 12 / 18 | 0 | caption |
| SH10 | 10 / 14 | 0 | micro label (use sparingly; below 12 only for badges) |

## Inter — paragraphs (400 / 500 / 600 + Underlined, Strikethrough, Italic)

| Token | Size / Line | Use |
|---|---|---|
| P1 | 18 / 28 | lead paragraph, subtitle, pagination numerals |
| P2 | 16 / 24 | default body, input text, helper/error text, labels (large), breadcrumbs, accordion body |
| P3 | 14 / 20 | secondary body, field labels, alert text, tables |
| P4 | 12 / 18 | captions, legal, helper microcopy |

Variants: `-400` Regular, `-500` Medium, `-600` SemiBold, `-Underlined` (Regular + underline, link/inline),
`-Strikethrough` (P2 uses Italic face — file slip), `-Italic` (Medium Italic).

## Inter — special headings (eyebrow / overline) (400 / 500 / 600 / 700)

| Token | Size / Line | Tracking |
|---|---|---|
| SPH1 | 20 / 30 | +10% |
| SPH2 | 18 / 28 | +10% |
| SPH3 | 16 / 24 | +10% |
| SPH4 | 14 / 20 | +10% (footer column heads use ≈6% in the landing page) |
| SPH5 | 12 / 18 | +12% |

The style does **not** force uppercase — set the text in UPPERCASE yourself ("ARNIFI SETUP"). Use for
eyebrows, footer column headings, table-group labels, tags above headings. Color: accent (Arnique-600/700).

## Pairing recipes

| Context | Heading | Sub / body |
|---|---|---|
| Marketing section | Lora `L3` (32/40) or the page's 36/50 (see drift) centered, **one word in accent** | Inter `P1` 400, secondary ink |
| Marketing hero | Lora `L1`/`L2` | Inter `P1` |
| App page title | Inter `SH4`/`SH5` 600 | Inter `P2`/`P3` 400 |
| Card | Inter `SH7` 600 (18/24) or `P2-600` | Inter `P3` 400 |
| Form | label `P3-500/600` → input `P2-400` → helper `P2`/`P4` | |
| Button label | Inter 500: XL `P2-500` (16/24), L/M `P3-500` (14/20), S `P4-500` (12/18) | |
| Eyebrow / overline | Inter `SPH4-500` uppercase | |
| Legal / footer | Inter `P3-400` / `P4-400` | |

## Rules

- ≥ 36px headings: tracking is negative (already in the style). Don't add letter-spacing.
- Max heading line length ≈ 18–22 words; centered headings only for ≤ 2 lines.
- Highlighting a word: same Lora style, color change only (Arnique-600/700, `#7070FF` on the live site) — never
  bold/italic inside a Lora heading.
- Don't mix Lora with Inter in the same text node. Don't use Inter H1–H7 and Lora D/L in the same view.
- Body copy lines 45–75 characters; paragraph max-width ≈ 560–640px.
- Weight ladder for emphasis: 400 → 500 (UI/labels) → 600 (titles) → 700 (rare; special headings).
- The doc's rem conversions on the Display frames use a 28px root (e.g. "140px / 5 rem"); the Units page says
  16px root. Treat px as truth; derive rem with 16.
