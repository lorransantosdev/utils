# Engine API

`assets/engine/city-of-living-data.js` is one ES module that needs only `three@0.169` (import map
for `three` and `three/addons/`). `city-of-living-data.css` styles the HUD; everything is scoped
under `.cold`, so it can live inside any app.

```js
import { createCity, VERSION } from './city-of-living-data.js';
const city = createCity(document.getElementById('city'), world, { seed: 20261019 });
```

The host element must have a size (e.g. `position: fixed; inset: 0` or a sized container). The
engine fills it with the canvas and the HUD and adds the classes `cold` (and `cold-night` for the
night palette) to it.

## Options

| option | default | what |
|---|---|---|
| `seed` | `20261019` | random seed: tree placement, skin/hair, traffic start. Same seed = same city |
| `reducedMotion` | from `prefers-reduced-motion` | `true` = instant camera moves, no fades (used by screenshot tests) |
| `preserveDrawingBuffer` | `false` | set `true` to read pixels from the canvas (thumbnails) |

## Returned object

| member | what |
|---|---|
| `world` | the normalised world (defaults filled in) |
| `open(ref, { fly = true, react = true })` | open anything in the drawer (refs: world-format.md §11); flies the camera and plays the reaction |
| `close()` | close the drawer |
| `enter(placeId)` / `exit()` | go inside an enterable place / back to the city |
| `setMode('map' \| 'walk' \| 'heli')` | camera mode. Ride-along is started with the `ride:<vehicleId>` action from a vehicle page |
| `viewAll(sec?)` | frame the whole slab |
| `rotateBy(rad)` / `zoomBy(factor)` | animated camera moves (Q/E use ±π/2) |
| `update(patch)` | live data: merge `places`, `vehicles`, `people` by id; replace `kpis`, `actions`; set `asOf` (see below) |
| `tour(steps?, label?)` | start the presentation, or play any list of steps (a journey) |
| `stopTour()` / `next()` | stop / jump to the next step |
| `replay()` / `stopReplay()` | play `world.timeline` / stop and restore |
| `video(on)` | 9:16 frame for recording vertical videos |
| `on(event, fn)` | subscribe; returns an unsubscribe function |
| `state()` | `{ mode, view, inside, touring, replaying, calls, tris }` |
| `pick(x, y)` | what is under a point (pixels, relative to the canvas) + its tooltip text — for tests |
| `sim(seconds)` | run the traffic for N seconds off-screen; returns `{ minD, maxStuck }` (closest two cars, longest stop) |
| `destroy()` | stop the loop, remove listeners and sources, dispose GPU memory, empty the host |

### Events

| event | payload |
|---|---|
| `open` | the ref that was opened |
| `close` | – |
| `mode` | `'map' \| 'walk' \| 'heli' \| 'ride'` |
| `enter` / `exit` | place id |
| `tour` / `replay` | `true` when it starts, `false` when it ends |
| `update` | the patch that was applied |

### update(patch)

```js
city.update({
  vehicles: [{ id: 'c7', state: 'parked' }, { id: 'c99', place: '2', state: 'road', name: 'Mobi', color: '#C3C8CF' }],
  places: [{ id: 'payments', status: 'down', card: 'error rate 7%' }],
  kpis: [ … ], actions: [ … ], asOf: new Date().toISOString(),
});
```
- A vehicle that switches between a moving and a parked state leaves its bay for the road or comes
  back to it; bays repaint; cards, drawer and signs refresh.
- New vehicles get a free bay of their place (or join the traffic if moving).
- New people are stored but drawn only after a reload; changed rooms are rebuilt on the next entry.

## Keyboard

Map: Q/E rotate · +/− zoom · WASD/arrows pan · Esc closes. Inside: WASD walks · Esc leaves.
Walk: WASD · Shift run · E enter · F helicopter. Helicopter: W/S · A/D · Space up · C/Shift down ·
F land. Tour: → or Space next · ← previous · Esc stop. Full table: interaction.md §5.

## Language

UI strings exist in `pt-BR` and `en` (`meta.locale`; any `pt*` uses Portuguese). Override single
strings with `meta.text`, e.g. `{ "present": "Play the tour", "overview": "Network" }`. Numbers and
dates use `meta.locale` and `meta.currency`. World content (names, lines, pages) is written in the
user's language by whoever builds the world.

## Framework use

The module has no global state: several cities can live on one page and SPAs must call
`destroy()` on unmount. Wrappers for React, Vue and Angular are in `assets/integrations/` (see
framework-integration.md).
