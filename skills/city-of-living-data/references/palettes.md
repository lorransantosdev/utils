# Palettes and brand

Set `meta.palette` to a preset and `meta.brand.color` to the brand. Only the ground, roads,
walls, glass and the HUD background change; status colours are fixed (visual-style.md §7).

## Presets

| preset | feel | use for |
|---|---|---|
| `cream` (default) | warm paper, white buildings, green trees | admin views, demos, videos |
| `mint` | cool green-white | tech / health / logistics, explain-flow cities |
| `sunset` | peach ground, warm walls | consumer brands, hospitality |
| `night` | dark slab, glowing windows, dark HUD | wall screens, ops rooms, dramatic videos |

## Brand

```json
"meta": { "brand": { "name": "Harbor", "color": "#0E9F94", "logo": { "d": "M0 0h24v24H0z", "viewBox": "0 0 24 24" } } }
```
- `color` paints floor bands, signs, the rug, the dock's active buttons, KPI links, the drawer CTA,
  selection rings and the courier of journeys. A darker shade (−20%) is used for hover and text on
  tints; a 92% tint for pills.
- `logo` is a single SVG path. It appears in the brand box, on the tower, on the HQ card and the rug.
- Pick a brand colour with contrast ≥ 3:1 on white for large text (signs are white text on the
  brand colour). Very light brand colours (yellow, pastel) make signs unreadable — use a darker
  shade of the brand for `color` and keep the light one for nothing.
- Never reshape buildings to look like a brand; only colour and logo change.

## paletteOverrides

Any key of a preset can be overridden:

| key | what |
|---|---|
| `bg` | `[top, bottom]` page background gradient |
| `slab` | stone sides of the slab and room bases |
| `grass` | top of the slab |
| `road` | asphalt |
| `mark` | road markings and bay lines |
| `walk` | sidewalk blocks |
| `lot` | parking lots |
| `wall` | building walls |
| `trim` | roof caps and crown |
| `dark` | poles, frames, lamp posts |
| `glass` | window glass (on `night`: the window glow colour) |
| `park` | park lawn, groves |
| `path` | park paths |
| `water` | fountain water |
| `trees` | three crown greens |
| `floor` | room floor (shop, cluster) |
| `room` | room walls |
| `sun`, `hemi` | light intensities |
| `night` | `true` switches the dark HUD and glowing windows |

```json
"meta": { "palette": "cream", "paletteOverrides": { "grass": "#E4F0D8", "trees": ["#4CAF50", "#388E3C", "#66BB6A"] } }
```

## Contrast notes
- KPI and drawer text use the HUD tokens (`--ink`, `--muted`), which switch with `night`.
- Card text is always ink on white (or light ink on dark with `night`); don't put long text on
  brand colour except signs.
- Check both the default and `night` versions with screenshots if the city will run on a TV.
