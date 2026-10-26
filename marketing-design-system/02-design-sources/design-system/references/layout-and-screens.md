# Layout, spacing and page recipes

## Grid styles (19 local grid styles — apply by name)

| Style | Columns | Gutter | Margin / col width | Align |
|---|---|---|---|---|
| `Monitor/default(1920px)` | 12 | 32 | margin 400 | stretch (content 1120) |
| `Monitor/left + right panel(1200px)` | 12 | 32 | margin 360 | stretch |
| `Monitor/right panel small(1512px)` / `large(1464px)` | 12 | 24 | col 104 / 100, offset 88 | min (right panel) |
| `Monitor/left panel small(1512px)` / `large(1464px)` | 12 | 24 | col 104 / 100, offset 88 | max (left panel) |
| **`Laptop/default(1440px)`** | 12 | 32 | margin **160** | stretch → **content 1120** |
| `Laptop/left + right panel(768px)` | 12 | 24 | margin 336 | stretch |
| `Laptop/right panel small(1112px)` / `large(1080px)` | 12 | 16 / 24 | col 78 / 68, offset 40 | min |
| `Laptop/left panel small(1112px)` / `large(1080px)` | 12 | 16 / 24 | col 78 / 68, offset 40 | max |
| `Tablet/default(960px)` | 8 | 24 | col 84 | center |
| `Tablet/left + right panel(688px)` | 8 | 16 | margin 136 | stretch |
| `Tablet/right panel large(696px / 680px)`, `left panel small(696px)/large(680px)` | 8 | 32 | col 59 / 57, offset 32 | min / max |
| **`Mobile/default(390px)`** | 4 | 16 | margin **24** | stretch |

"Panel" grids = a screen with a docked side panel (drawer/filters): grid sits in the remaining width.
Grid variables (`Grid Layout`): `Left-margin 32`, `Top-margin 24`, `Bottom-margin 20`, `Spacing 20`, `Tag-width 16`, `Tag-height 8`
(app-shell paddings; marketing pages use the 160 margin).
The Units page says "12 columns, 24px gutters, 16px margins" — the **styles above win** (32/160 at 1440).

Frame widths used: **1440** (laptop), 1920 (monitor), 960 (tablet), 390 (mobile). Page frames: auto layout vertical, gap 0,
sections stack; content max width 1120 at laptop.

## Spacing scale (base unit 2px)

| Token | px | rem | Typical use |
|---|---|---|---|
| Spacing-01 | 2 | 0.125 | hairline offsets |
| Spacing-02 | 4 | 0.25 | icon↔label, button inner gap |
| Spacing-03 | 8 | 0.5 | tight stacks, heading↔subtitle |
| Spacing-04 | 12 | 0.75 | inner padding small |
| Spacing-05 | 16 | 1 | card gap, gutter (mobile), field gaps |
| Spacing-06 | 24 | 1.5 | card padding, mobile margin |
| Spacing-07 | 32 | 2 | gutter, large card padding |
| Spacing-08 | 40 | 2.5 | |
| Spacing-09 | 48 | 3 | |
| Spacing-10 | 64 | 4 | section inner gaps |
| Spacing-11 | 80 | 5 | |
| Spacing-12 | 96 | 6 | |
| Spacing-13 | 100 | 6.25 | **section top padding** (live page) |
| Spacing-14 | 120 | 7.5 | |
| Spacing-15 | 160 | 10 | page margin (laptop) |
| Spacing-16 | 200 | 12.5 | |

Documented only (not variables) — apply as numbers. Other documented units: icon sizes 24/30; control heights
S 32 / M 44 / L 48 / XL 56 / 64; field heights 40/48/56; border widths 0.5/1/1.5/2/4; radius 2 (CTA), 4, 6, 8, 10, full.

## Radius scale

2 (CTA buttons, tags) · **4** (inputs, alerts, pagination, chips) · 6 (icon tiles, small cards, FAQ rows) · **8** (accordion, cards) ·
10 (large info cards) · 16 (modals/large surfaces) · full/100000 (avatars, pills, dots, eyebrow pill).

## Page recipe — marketing / landing (1440, from "Landing page | Default")

Frame 1440×auto, grid `Laptop/default(1440px)`, white. Stack (observed heights):

1. **Header** 110 — logo @160, nav, currency chip, primary CTA (arrow segment) right edge @1280.
2. **Announcement bar** 50 (optional) — `Arnique-100` fill, marquee text + underlined link.
3. **Hero** ≈ 790 — heading (Lora L1/L2, accent word), P1 subtitle, primary + secondary CTA, product visual.
4. **Content sections** 550–880 each. Every section: **100 top padding**, centered header block
   (Lora 36/50 *or* L3 32/40 + `P1` subtitle at secondary ink; heading→subtitle gap 8–16; header block → content 50–60), then content in
   the 1120 container, **100 bottom padding**. Alternate fills: white → `bg-blue-superlight` (`#F7F7FD` live ≈ Arnique-100) →
   `bg-warm-light`.
5. **Card grids**: 3-up = 3 × 363 + 2 × 16 gap (=1120); 2-up = 2 × 552 + 16; row gap 16. Equal heights per row.
   Mixed 3+2 rows are allowed (see "Why choose Arnifi").
6. **Steps** 4-up: columns every ~300, circle 50 + connector, title 18/24, body 16/24 muted.
7. **Testimonials** 3-up cards 360×425, gap 20, soft shadow.
8. **FAQ**: eyebrow pill → heading (second phrase muted) → 1px rule → accordion rows (68 high closed, gap 24) → "View more" text link.
9. **Footer** ≈ 700 — see components.

Section heading pattern: *Plain words* + **accent word(s)** — "Our **add-on** services", "Why choose **Arnifi**",
"Discover our **customer reviews**" (Lora, accent = lighter indigo). In the FAQ variant the accent phrase is *muted ink* instead.

## Page recipe — app / dashboard [infer — the file has no dashboard screens]

Use panel grids; shell paddings from `Grid Layout` vars (left 32, top 24, bottom 20); page title `In-SH4/SH5-600`;
cards `radius 8`, border `border-default`, padding 24, gap 16; tables with `In-SH8-600` headers on `bg-cool-light`, row dividers
`border-default`, row height 48–56; forms use Text-field anatomy in a 2-col layout (gutter 32), actions bottom-right
(Secondary + Primary, L size 48). Status via Badge/Alert tokens.

## Mobile recipe (390)

Margin 24, gutter 16, 4 cols. Section padding 48–64 vertical. Headings step down: Lora L3/L4, body `P2`. Buttons full width
56 high, 8 gap, 16 side padding in docks. Bottom CTA dock with 1px top divider. Tap targets ≥ 44. Respect safe areas (home indicator 34).

## Responsive stepping

Laptop 1440 → Tablet 960 (8 col, margins 24, 2-up cards) → Mobile 390 (4 col, 1-up). Heading steps: L2 → L3 → L4 (marketing);
SH4 → SH5 → SH6 (app). Never scale fonts with viewport width — switch styles at breakpoints.
