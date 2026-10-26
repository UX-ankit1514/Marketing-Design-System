# Effects, icons, motion

## Effect styles (28 local — apply by name; note some names have a leading space after the slash)

Format: `layers (x, y, blur, spread, color@alpha)`.

**Outer Shadow** (resting → raised)
| Style | Layers |
|---|---|
| `Outer Shadow/Light Single Shadow` | 0,1,3 #000@.15 |
| `Outer Shadow/Medium Single Shadow` | 0,2,6 #000@.15 |
| `Outer Shadow/Heavy Single Shadow` | 0,4,8 #000@.20 |
| `Outer Shadow/Light Double Shadow` | 0,2,4 #000@.10 + 0,1,3 #000@.15 |
| `Outer Shadow/Medium Double Shadow` | 0,4,8 #000@.10 + 0,2,6 #000@.15 |
| `Outer Shadow/Heavy Double Shadow` | 0,6,12 #000@.15 + 0,4,8 #000@.20 |
| `Outer Shadow/ Neutral Subtle Shadow` | 0,4,8 #000@.10 + 0,2,4 #000@.15 |
| `Outer Shadow/ Cool Subtle Shadow` | 0,4,6 #4091F0@.15 + 0,2,4 #4091F0@.20 |
| `Outer Shadow/ Cool Subtle Shadow (Neutral)` | 0,4,6 #000@.15 + 0,2,4 #000@.20 |
| `Outer Shadow/ Warm Subtle Shadow` | 0,2,8 #F09140@.10 + 0,1,4 #F09140@.20 |
| `Outer Shadow/ Warm Subtle Shadow (Neutral)` | 0,2,8 #000@.10 + 0,1,4 #000@.20 |

**Inner Shadow** (inset fields, pressed): `Inner Shadow/ Neutral Subtle Shadow` 0,3,6 #808080@.10 · `/ Cool Subtle Shadow` #4D90FF@.15 ·
`/ Cool Subtle Shadow (neutral)` #000@.15 · `/Warm Subtle Shadow` #FFB64D@.15 · `/ Warm Subtle Shadow (neutral)` #000@.15 ·
`/ Light Double Shadow` · `/ Medium Double Shadow` · `/ Heavy Double Shadow`.

**Inner + outer** ("lifted/embossed"): `Inner shadow with outer shadow/` `Soft glow` · ` Minimal depth` · ` Subtle lift` · ` Medium softness` ·
` Elevated depth` · ` Clean contrast`.

**Color Shadow** (on tinted backgrounds, 3-layer): `Color Shadow/ Light` (y 4/2/1, #000 .10/.20/.30) ·
`Color Shadow/ Medium` (y 8/6/4) · `Color Shadow/Heavy` (y 14/10/8, .30/.40/.50).

**Elevation scale (recommended mapping [infer])**
| Level | Use | Style |
|---|---|---|
| 0 | flat, bordered cards | none + 1px `border-default` |
| 1 | resting cards, inputs focus | `Outer Shadow/Light Double Shadow` |
| 2 | hovered cards, dropdown menus, testimonial cards | `Outer Shadow/Medium Double Shadow` |
| 3 | popovers, sticky headers, date pickers | `Outer Shadow/Heavy Double Shadow` |
| 4 | modals, dialogs | `Outer Shadow/Heavy Double Shadow` + scrim 40% Dusk-1100 |
| tint | blue/warm surfaces | `Cool`/`Warm Subtle Shadow` to match the surface hue |
| inset | pressed buttons, read-only fields | `Inner Shadow/ Neutral Subtle Shadow` |

One shadow per element. Don't stack outer styles. Dark mode: prefer border + lighter surface over heavier shadows.

## Icons

- **General set** (page "Icons", `Icon/General`, ~33 category frames — Money, Arrow, Users, Files, Location, Search, Time,
  Security, Notifications, Settings, Emails/Messages, Business, Building …): Iconsax-style. Each icon is a component set with
  `Icon style` = **linear / bold / outline / twotone / bulk / broken** × `Icon size` = **18 / 20 / 24 / 28 / 40**. Names like
  `wallet-add`, `tick-square`, `tick-circle`, `info-circle`. Default for UI: **linear or outline, 24px** (20 inside inputs/alerts, 16 for chevrons).
- **UI arrows/chevrons** in buttons: `fi-rr-arrow-small-right` (Flaticon UIcons "Regular Rounded") 24px; chevrons 16–20.
- **Law Icons** (`Law Icons` frame): solid black glyph pack (scales, gavel, court, handcuffs…) for legal/compliance illustration — recolor, don't use as UI icons.
- **Social Media** frame: facebook, instagram, twitter/x, linkedin, link — 24px, `icon-secondary`.
- **Feature icons on cards**: duotone indigo glyph in a 40×40 tile (radius 6, Arnique-200).
- Color via tokens: `icon-primary` (Dusk-1000), `-secondary` (Dusk-800), `-active` (Arnique-900), `-interactive` (Arnique-1000),
  `-accent` (Tang-500), `-alert` (Ruby-700), `-info` (True Blue-600), `-success` (Moss-700), `-disabled` (Dusk-400). Dark mode = white.
- **Logo**: Arnifi primary logo (indigo star-mark + wordmark) in `Arnifi Primary Logo_Blue` (Motion page); header size ≈ 126×50; footer ≈ 144×40.
  The file has **no logo guideline frame** (clear space, min size, color rules) — only the blue logo as used in headers/footers. Ask before recoloring or resizing.
- **Flags**: `Currency flags` (24×18) and country `Flag icons` (197) on the Flags page.
- Mobile menu icon morph (hamburger ↔ close) and the 4-point **sparkle** (Arnique, "AI/new" marker) exist on the Motion page.

## Motion (page "Motion"; all prototypes use Smart Animate)

| Interaction | Trigger | Duration | Easing |
|---|---|---|---|
| Button hover micro-interaction (stripe → arrow segment) | On hover | **0.30s** | custom cubic-bezier (ease-out feel) |
| Hover variants explored | On hover | 0.30s linear / 0.42s "slow" / 1.25s slow | |
| Hover reset | After timeout 1ms | 0.15s | ease-out |
| Button loading spinner | After timeout, loops | **1s** | linear |
| Skeleton loader shimmer (`State=0% → 100%`) | After 0.8s loop | **1s** | linear gradient sweep |
| Domino loader (staggered dots) | After timeout, staggered +1s | **1.92s** | "gentle" |
| Page-load reveal (landing, components fade/slide in) | After ≈1.1s | **1.5s** | custom cubic-bezier |
| Click press (button loading → state) | On click | 0.30s | linear |

Rules [infer from the above]:
- UI feedback (hover/press/focus): **150–300ms**, ease-out. Page/section reveals: **600–1500ms**, ease-out/gentle, once, staggered.
- Loops (spinners, skeletons): linear, 1s. Never animate layout shift of text.
- **Skeleton on first load**: gray rounded rectangles (radius ≈ 8, `#F4F4F4` ≈ Ash Gray-200) mirroring the real layout
  (title bar, 2-line subtitle, hero block, 2×2 feature grid with 36px icon squares). Show skeleton, not spinner, for pages/sections;
  spinner only inside buttons/fields.
- Respect `prefers-reduced-motion` when building to code: replace slides/shimmer with a plain fade ≤ 150ms.
- Hover for cards: elevate one level (shadow Light→Medium) over 200ms; don't translate more than 2px.
