# QA checklist

Nothing ships without looking at it. Run the checks below with `scripts/screenshot.mjs`
(headless Chromium + Playwright), open every PNG, fix, re-shoot.

## 1. Shots to take

| shot | command steps | look for |
|---|---|---|
| desktop overview | `--size 1440x900 --steps map,home` | whole slab framed, cards readable, KPIs not overlapping the brand box |
| each place | `place:<id>` for every place | drawer content, camera centred in the free area, dock not under the camera stack |
| inside | `enter:<id>` for every enterable place | room fully visible under the top bar, screen legible, keys, notes, people seated/typing |
| a vehicle and a person | `vehicle:<id>`, `person:<id>` | bubble with a real line, selection ring, follow works |
| walk / helicopter | `walk`, `heli`, `map` | avatar, Scott, companions, name tags; no camera inside a building |
| tour | `tour`, `next`, `next` | caption, courier moving (journeys), fail step red |
| replay | `replay`, `wait:8000` | clock, toasts, cars leaving/returning, sum of amounts |
| video | `video` | 9:16 frame, phone layout inside it |
| phone | `--size 390x844 --steps map,place:<id>,enter:<id>` | bottom sheet, no horizontal scroll, dock icons only |
| hide names | click the eye (or `localStorage` key) | every private name replaced on signs, cards, drawer, rooms |
| night | `meta.palette: "night"` copy | contrast of HUD and signs |

The script prints page errors, `city.state()` (mode, draw calls) and horizontal overflow. Expect
`errors []`, overflow `0`, ~50–70 draw calls in the city.

## 2. Everything answers a click

Probe a grid of points and count what each one hits:
```js
// in the page, after load (or inside a room after city.enter(id))
const kinds = {};
for (let y = 80; y < innerHeight - 80; y += 7) for (let x = 20; x < innerWidth - 20; x += 7) {
  const h = city.pick(x, y); const k = h ? h.t + (h.k ? ':' + h.k : '') : 'none';
  (kinds[k] ??= { n: 0, example: h?.tip }).n++;
}
console.table(kinds);
```
`scripts/screenshot.mjs --probe` runs this for the city and every room. Expect places, vehicles,
people, bays, props (trees, lights, vault…) in the city; screens, keys, actions (notes), people,
door, plants inside. `none` should only be grass outside blocks, the sky and room floors. Read the
example tooltips: every one must say something true.

## 3. Traffic

`city.sim(120)` → `minD` > 3.5 (no overlapping cars) and `maxStuck` < 15 s (no deadlock).

## 4. The 5-second questions

For each question in the City Brief, look at the overview shot only and answer it in 5 seconds.
If you can't, the design is wrong: add a KPI, a card line, a status, an action — not decoration.

## 5. Data honesty
- Grey (`status: "none"`) where there is no data; never green by default.
- Every number on screen has a source in the brief; demo numbers are labelled as demo.
- The snapshot/live chip shows the right time; live sources show "Data is late" when they stop.
- Test/trial accounts are out of money KPIs.

## 6. Privacy (before anything is shared)
- No personal names of private people, document numbers, plates, phones, e-mails or addresses in
  `lines`, `tip`, `listSub`, pages or room textures. Search the built HTML for them.
- No secrets in the page: no `service_role` keys, DB URLs or passwords; only read-only anon keys
  with RLS, or a read-only server (data-sources.md).
- Customer-facing cities filter the tenant from the auth token / RLS, never from a URL parameter.
- With hide names on, signs, cards, plaques, the drawer and room screens show only aliases.

## 7. Accessibility and motion
- `prefers-reduced-motion` disables flights and fades (screenshots use it).
- Every HUD button has a title/aria-label; drawer text ≥ 11 px; focus rings visible.

## 8. What you see → what to do
Most problems are fixed by stating what is on screen, in plain words, and checking the right file.

| what you see | likely cause / what to do |
|---|---|
| a blank page or a console error | open the page through a server (`node sync.mjs --serve 3000`), not `file://`; check the three.js import map; run `validate.py` |
| the chip stays grey "No data" | the first request never succeeded: URL (relative to the page), CORS, auth; Supabase: RLS or anon key |
| the chip is amber "Data is late" | the sync stopped or failed: read `sync.log`, fix the key or the query, make the script survive that failure next time |
| a number is wrong | compare the converter / `toPatch` rule with the source's own dashboard ("this month only?", "net of refunds?"), fix it, show the new figure next to the source's |
| clicking something does nothing | it has no `tip`/`lines`/`page` → add them; run `screenshot.mjs --probe` to list what answers a click |
| a card covers the thing it is about | the drawer flies the camera so the subject stays beside it; if a custom page is huge, split it into blocks |
| it looks plain | more `lines` with numbers, `status` on places, `alert` pins, a tower with `floors`/`vault` rules — not more decoration |
| it doesn't feel like the business | brand color + logo path, `signSub`, place names and kinds, the roles' labels; the look itself stays the engine's |
| slow or jumpy on a phone | fewer places (group into a `cluster`), fewer people per place, `pixelRatio: 1` |
