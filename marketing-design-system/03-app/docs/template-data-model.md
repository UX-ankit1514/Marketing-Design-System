# Template data model

One shared model drives all 20 templates and everything users make. It is defined once, as Zod schemas, in `src/types/` (`layer.ts`, `template.ts`, `project.ts`) and checked whenever data enters the app (templates at load, saved projects at open, uploaded project files).

## Template (the master, never edited)

```jsonc
{
  "schemaVersion": 1,            // bump + migrate when the format changes
  "id": "expand-uae-square",     // stable
  "name": "Expand Your Business to the UAE",
  "version": 1,                  // bump when the layers change
  "category": "Business setup",  // Business setup | Campaign | Announcement | Promotion | Partnership | Event | Education
  "tags": ["uae", "instagram"],
  "format": "Square",
  "source": { "type": "figma", "fileKey": "s2yQZ85TPB02pKuvfwTCgk", "nodeId": "1:2349", "frameName": "v1" },
  "canvas": { "width": 1080, "height": 1080, "background": "#ffffff" },
  "fonts": [{ "family": "Lora", "weight": 400, "style": "normal" }],
  "layers": [ /* bottom -> top paint order */ ],
  "limitations": ["plain-language notes about anything not rebuilt as an editable object"]
}
```

## Layers

Every layer has: `id` (stable, e.g. `heading-1`), `name`, `role`, `visible`, `removed`, `editable`, `x`, `y`, `width`, `height`, `rotation`, `flipX/flipY`, `opacity`, optional `groupId/groupName`, optional parent `clip`, optional `shadow`, and `flags` (known fidelity gaps; `added` marks layers a user added).

`role` is what the layer is *for*: `heading`, `subheading`, `body`, `tagline`, `cta`, `logo`, `footer`, `photo`, `icon`, `badge`, `decoration`, `shape`. The panels use it (e.g. only photos have *Replace image*; logo/footer/icon/shape can be removed).

| `type` | Extra fields | Notes |
|---|---|---|
| `text` | `text`, `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`, `color`, `lineHeight` (px), `letterSpacing` (px), `textAlign`, `textCase`, `underline`, `runs[]`, `autoHeight`, `wrap`, `verticalAlign` | `runs` are per-range overrides (the coloured words in a heading). They follow the characters when the copy changes. |
| `image` | `src`, `naturalWidth/Height`, `fit` (cover/contain), `crop` (source px, from Figma), `offsetX/Y`, `zoom`, `radius`, `replaceable` | The box is the placeholder: replacing the picture keeps the box and covers it. `src` is `/template-assets/...` or `idb:<id>` (a user upload in IndexedDB). |
| `shape` | `shape` (rect/ellipse), `fills[]` (solid/linear/radial), `stroke`, `radius` | Frosted-glass cards carry a `glass-radius:N` flag. |
| `graphic` | `src`, `naturalWidth/Height` | Logos, icons and illustrations that were many Figma vectors, exported as one picture. |

## Project (a working copy)

`{ id, name, templateId, templateVersion, createdAt, updatedAt, canvas, fonts, layers, baseLayers }`

- `layers` is what the user edits. `baseLayers` is an untouched copy made at creation, so **Reset template** works without the master and the master is never mutated.
- Projects (and uploaded images) live in IndexedDB (`arnifi-marketing-studio`: stores `projects`, `assets`). Undo history is in memory only.
- **Save file** writes `{ kind: "arnifi-marketing-studio/project", version: 1, project, assets }` with images inlined as data URLs, so the file opens on any computer.

## Rules the code relies on

- Master templates are separate from projects; selecting a template copies it.
- Layer ids are stable; order is paint order; JSON round-trips exactly.
- Asset paths never point at Figma. Everything a template needs is under `public/template-assets/`.
