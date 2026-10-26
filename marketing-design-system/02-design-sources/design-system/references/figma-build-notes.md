# Driving Figma (figma-console MCP) — lookups, snippets, gotchas

File: **"Design System"**, key `ydWU7L8tpt5LQJg3cmnqHF`
(`https://www.figma.com/design/ydWU7L8tpt5LQJg3cmnqHF/Design-System`). Bridge: Desktop Bridge plugin, WebSocket (port 9223–9232 fallback).
Check with `figma_get_status {probe:true}` and `figma_list_open_files`. Building screens **in this file** reuses styles/variables directly;
for a **different** file the DS must be a connected library (enable it) — otherwise styles/variables will not exist and you'd have to recreate them
(use `figma_setup_design_tokens` / `figma_import_tokens` only if the user asks).

## Page map of the DS file
`Cover` · `Changelog and Versioning` (v1.0.0) · `Writing and Grammar` · `Typography` · `Colors` · `Flags` · `Icons` · `Layout` (Units,
Spacing, Grid layouts) · `Motion` (prototypes + landing page screens) · `Shadows` · `CORE COMPONENTS` (divider, empty) · component pages
(Accordian, Alerts, Avatars, Breadcrumbs, Buttons | In Progress, Cards [empty], Date and Time Picker, Check box, Badges, Divider, Dropdown,
Loading, Pagination, Progress Bar, Progress Indicator, Switch [stub], Text Fields, Text area) · `Bin` (legacy: old layout grids, color palette,
typography, CTAs — don't use). Pages named `____` are separators.
Reference screens: `Motion` page → `Landing page | Default` (many versions; `1906:4280` is the fullest, 1440×6982).

## Name lookups (don't hard-code IDs — they are per-session safe only within the file; re-resolve by name)

```js
// text styles: name looks like "Paragraphs | Inter/Regular/In-P2-400"
const ts = await figma.getLocalTextStylesAsync();
const style = n => ts.find(s => s.name.endsWith('/' + n));      // style('In-P2-400'), style('Lo-L3-400')
await textNode.setTextStyleIdAsync(style('In-P2-400').id);       // load the font first (Inter/Lora weights)

// paint/effect/grid styles
const ps = await figma.getLocalPaintStylesAsync();               // 'Primary/Arnique-900', 'Gray/Dusk/…'
const es = await figma.getLocalEffectStylesAsync();              // 'Outer Shadow/Light Double Shadow' (watch leading spaces: 'Outer Shadow/ Neutral Subtle Shadow')
const gs = await figma.getLocalGridStylesAsync();                // 'Laptop/default(1440px)'
await frame.setGridStyleIdAsync(gs.find(g=>g.name==='Laptop/default(1440px)').id);
await node.setEffectStyleIdAsync(es.find(e=>e.name==='Outer Shadow/Light Double Shadow').id);

// variables: collections 'Color_Variables', 'Color_tokens' (Light/Dark), 'Grid Layout', 'Typography Tokens', 'Font variables'
const vars = await figma.variables.getLocalVariablesAsync();
const v = name => vars.find(x => x.name === name);               // v('Text/text-heading'), v('Border/border-default')
const fill = figma.variables.setBoundVariableForPaint({type:'SOLID', color:{r:0,g:0,b:0}}, 'color', v('Text/text-heading'));
node.fills = [fill];                                             // same for strokes
```
Set a screen to dark mode: `frame.setExplicitVariableModeForCollection(colorTokensCollection, darkModeId)` (`102:6`; light `102:5`).

## Gotchas observed in this file
- The runtime is `documentAccess: dynamic-page`: use the `…Async` getters (`getLocalPaintStylesAsync`, `figma.loadAllPagesAsync()`).
- `figma.mixed` is a Symbol — string-concatenating a mixed `fontSize/cornerRadius/padding` throws "cannot convert symbol to string". Guard it.
- Some component sets throw `Component set has existing errors` on `componentPropertyDefinitions` (Check box labels) — wrap in try/catch.
- `figma_get_design_system_summary` / `GET_LOCAL_COMPONENTS` **time out** on this file (≈30k nodes, 27k icon components). Use targeted
  `findAllWithCriteria({types:['COMPONENT_SET']})` per page instead.
- Text styles bind **size, line-height, tracking** — applying a style then editing size detaches it. Set the style last.
- Page-size frames: create at 1440/960/390 wide and apply the grid style; layout via auto layout, not absolute positions.
- Fonts needed: Inter (400/500/600/700, Italic Medium), Lora (400/500/600). Landing frames also leak DM Sans and SF Pro — don't use.
- Take a screenshot after each section (`figma_take_screenshot`/`figma_capture_screenshot`), ≤3 refinement loops.
- Place new work in a Section/Frame on a dedicated page (e.g. `Screens – <name>`); don't scatter on the Cover/Colors pages. Check the page doesn't exist first.

## Re-extraction snippets (to refresh this skill if the file changes)
Text styles: `getLocalTextStylesAsync` → name | family style | size/line | letterSpacing. Paint: `getLocalPaintStylesAsync` → hex.
Effects: `getLocalEffectStylesAsync` → type/offset/radius/color. Grids: `getLocalGridStylesAsync`. Semantic tokens:
`Color_tokens` collection, resolve alias chains via `variables.getLocalVariablesAsync`. Component axes: per page
`findAllWithCriteria({types:['COMPONENT_SET']})` + `componentPropertyDefinitions`.

## Building in a product file that consumes the DS library (learned 2026-10-13, "Arnifi HQ | Working File")
Product file: **"Arnifi HQ | Working File"**, key `fHsDNV5y7ECYtKBNKbITav` (dashboard screens; dark Arnique-1200 sidebar).
- `figma.importStyleByKeyAsync` / `importComponentByKeyAsync` can **hang until timeout** here, and `importVariableByKeyAsync`
  rejects some keys. `teamLibrary.getVariablesInLibraryCollectionAsync` returned **empty** for Color_tokens/Color_Variables.
- What works: **reuse what's already in the file.** Scan existing frames for `textStyleId` / bound variable IDs and use those
  IDs directly (`getStyleByIdAsync('S:<key>,<node>')`, `getVariableByIdAsync('VariableID:<key>/<node>')`). For components,
  `instance.getMainComponentAsync()` → `createInstance()` (works for remote + local mains).
- Only `Text/text-default` and `Text/Cools/text-cool-superlight` semantic tokens are present in the product file; everything else
  is bound to `Color_Variables` ramps — bind the ramp that the semantic token maps to.
- Load fonts as plain `{family:'Inter', style:'Semi Bold'}`; passing a style's `fontName` (with `variationSettings`) took ~17s.
- Keep each `figma_execute` small: a timed-out script **keeps running in the plugin and lands later**, creating duplicates.
  After any timeout, list the target container before retrying and delete strays.
- Cloning a frame that contains the sidebar shifted the "HQ" logo text; clone the sidebar fresh from the source and use
  `resizeWithoutConstraints` (plain `resize` moves children by constraints).
- Gradient stops can be variable-bound: `gradientStops[i].boundVariables = {color: figma.variables.createVariableAlias(v)}`.
- Flags available locally: set `1:22821` (`Property 1=<Country>, Style=Rounded`) — UAE, KSA, Singapore, Oman, Qatar, USA, India.
  **No British Virgin Islands** (or UK) flag — placeholder used.

### More gotchas (2026-10-14, Home 2.0 build in the same product file)
- **`figma.loadFontAsync` can hang intermittently** (even plain `{family:'Inter',style}`), stalling a script until the bridge
  times out. Load Inter Regular/Medium/Semi Bold/Bold once per plugin session, then set `text.characters` directly inside
  `try/catch` and only call `loadFontAsync` in the catch.
- Helpers survive between `figma_execute` calls on `globalThis` (e.g. `globalThis.HQ = {V, S, paint, fr, tx, ...}`) until
  the plugin reloads — define them once, check `if(!globalThis.HQ)` before use.
- After `createInstance()`, append the instance to a container right away (a `_scratch` frame in a section) before editing it.
- DS button set "Buttons without interaction" (remote) works via `createInstance()`: Primary / Secondary 1 / Tertiary
  (text link + chevron, use for "View all"), sizes Small/Medium/Large. Its labels are Inter with `variationSettings`.
- Nav icon set "Component 153" (remote) has the sidebar icons (Home, Applications, Documents, Companies, Services,
  Compliance Calender, Resources, Support). They're light-gray + navy duotone for the dark sidebar; to use on white,
  clone the inner group into a local `Icon/*` component and map luminance > 0.5 → Arnique-300, else Arnique-900.
- `combineAsVariants` can rename variants to `Property 1=…, Property 2=…` if a script is interrupted; rename to `Prop=Value`.
- Setting `primaryAxisSizingMode='AUTO'` and then calling `resize()` fixes the size again; set the sizing mode *after* resize.
- Replacing `characters` on a text that has a red range makes the whole string red; reset fills, then `setRangeFills`.
