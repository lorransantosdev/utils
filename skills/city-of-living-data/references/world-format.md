# world.json — the format (v2)

One JSON file describes the whole city. The engine draws it as is: no coordinates, no code
changes. Full examples: `assets/examples/rental.world.json` (monitor a business) and
`assets/examples/microservices.world.json` (explain a flow with journeys).

## Contents
1. Layout rules · 2. Top level · 3. meta · 4. roles and states · 5. places · 6. vehicles
7. people · 8. actions · 9. kpis and home · 10. pages and blocks · 11. refs and `do`
12. player, pet, companions · 13. tour and journeys · 14. timeline (replay) · 15. data
16. Minimal example

## 1. Layout rules (automatic)
- Each place gets one block on a floating slab. The grid size comes from the number of places:
  1–3 → one row, 4 → 2×2, 5–6 → 3×2, 7–8 → 4×2, 9 → 3×3, 10–12 → 4×3. **12 places max**;
  group the rest into a `cluster`.
- Tall kinds (`tower`, `office`) go to the back rows, centre first; everything else fills from
  the front row, left to right, in array order. Force a slot with `"slot": { "row": 0, "col": 2 }`
  (row 0 = back).
- Empty blocks become small groves. If no `park` is listed, one is added (id `park`); the player,
  Scott and the companions live there.
- Roads between blocks are generated, with traffic lights at junctions of 3+ streets.
- The helicopter pad is next to the first `tower`; without a tower it goes to the park.

## 2. Top level

| key | what |
|---|---|
| `version` | `2` |
| `meta` | title, language, brand, palette… (§3) |
| `roles` | person roles → label + shirt colour (§4) |
| `states` | vehicle states → label, tone, `moving` (§4) |
| `places` | the buildings (§5) — required |
| `vehicles` | cars, vans, anything that parks or drives (§6) |
| `people` | everyone that is not you, Scott or a companion (§7) |
| `actions` | the ranked to-do list (§8) |
| `kpis` | numbers in the top bar (§9) |
| `home` | the overview page (§9) |
| `player`, `pet`, `companions` | you, Scott, your people (§12) |
| `tour`, `journeys`, `journeysTitle` | presentation and explained flows (§13) |
| `timeline` | events to replay (§14) |
| `data` | live sources (§15, details in data-sources.md) |

## 3. meta

| key | default | what |
|---|---|---|
| `title` | `City of Living Data` | brand box title, home title fallback, tour first step |
| `subtitle` | – | brand box second line |
| `purpose` | – | `monitor` · `explain` · `both` — informational (the goal chosen in Phase 1; `validate.py` relaxes the hide-names warning for `explain`) |
| `pageTitle` | `title` | the browser tab title used by `scaffold.py` |
| `locale` | `en` | `pt-BR` or `en` UI strings (any `pt*` → Portuguese); also number/date formatting |
| `currency` | BRL for pt, else USD | used by `format: currency` |
| `palette` | `cream` | `cream` · `mint` · `sunset` · `night` (palettes.md) |
| `paletteOverrides` | – | override single palette keys |
| `brand` | `{ name: title, color: '#F63B04' }` | `color` paints bands, signs, dock, drawer accents; `logo: { d, viewBox }` is one SVG path used in the brand box, tower signs, rug and HQ cards |
| `alias` | `Local`/`Place`, `Pessoa`/`Person` | what private names become when hidden: `{ place: 'Branch' }` → "Branch 1" |
| `hideNamesKey` | per title | localStorage key that remembers the hide-names toggle |
| `asOf` | – | ISO date; shown as "Snapshot of …" when there are no live sources |
| `autoplay` | – | `"tour"` starts the presentation 2.5 s after load |
| `fontDisplay`, `fontBody` | `Sora`, `DM Sans` | fonts used on canvas textures (signs, screens). The HUD fonts come from CSS |
| `text` | – | override any UI string, e.g. `{ "present": "Play" }` (keys in engine `STR`) |

The **hide names** button appears only when at least one place or person has `"private": true`.

## 4. roles and states

```jsonc
"roles": { "owner": { "label": "Owner", "color": "#10B981" }, "driver": { "label": "Driver", "color": "#3B82F6" } },
"states": {
  "road":    { "label": "On the road", "tone": "brand", "moving": true },
  "waiting": { "label": "Reserved",    "tone": "blue" },
  "parked":  { "label": "In the lot",  "tone": "green" }
}
```
Defaults exist for `owner`, `staff`, `driver`, `customer`, `family` and for the three states
above. `tone`: `brand` · `blue` · `green` · `amber` · `red` · `muted` (pill colour, key-tag colour
inside, screen tile colour). A state with `moving: true` drives on the roads; any other state parks
in a bay. Vehicles whose state is not listed show the raw state as label.

## 5. places

Common fields:

| field | what |
|---|---|
| `id` | unique; strings (numbers are converted) |
| `kind` | `shop` · `office` · `tower` · `cluster` · `park` (unknown → `shop`) |
| `name` | shown on sign, card, drawer |
| `private` | hide-names replaces it with `alias.place N` and the mark with `L1`-style initials |
| `mark` | 1–2 letters in the square badge (default: initials of the name) |
| `sub` | subtitle in the drawer and sign second line fallback |
| `signSub`, `signTitle` | sign second line (shop/office/cluster); tower sign text (default brand name) |
| `color` | band/sign colour (default brand; cluster default grey) |
| `card` | text under the name on the floating card (default: computed, e.g. "5 on the road · 6 in the lot · 11/15 bays") |
| `status` | `ok` · `warn` (amber halo + dot) · `down` (red halo, blinking dot, smoke) · `none` (grey mark = no data) |
| `enter` | `false` disables entering (shop, office, tower, cluster are enterable by default) |
| `enterHint` | second line of the "Go inside" button |
| `screen` | the wall screen inside (below) |
| `page` | `{ subtitle, blocks }` drawer content (§10) |
| `slot` | `{ row, col }` to force a block |

Per kind:

| kind | model | uses |
|---|---|---|
| `shop` | low building + lot with bays + gate | `capacity` (bays, 2–22; default = vehicle count), `inbox: { count, label, ref }` (paper stack on the counter), `workshopText` (workshop door tooltip) |
| `office` | 1–8 floor block, brand bands, small lot if it has vehicles; inside: desks, screen, meeting table | `floors`, `capacity`, `meetingText` (meeting table tooltip) |
| `tower` | lobby + `floors` (1–24), crown with logo, dashed next floor, helipad (first tower), optional vault | `floors`, `vault` (gold bars, number), `vaultTitle`, `vaultText`, `vaultBlocks`, `nextFloor` (text; `false` hides the dashed floor), `floorBlocks`, `meetingText` |
| `cluster` | row of six small houses + sign, 1-row lot if it has vehicles | members are its `people`; `grid` (array of booleans for the HQ wall, default: `done` or active), `gridNote` |
| `park` | square with fountain, flowers, benches | where the player, Scott and companions start |

`screen` has two layouts:
```jsonc
// tiles (shop, office, cluster): up to 4 tiles + one bar
"screen": { "title": "Today", "subtitle": "Harbor North", "tiles": [{ "label": "On the road", "value": "9/13", "tone": "brand" }], "bar": { "label": "Fleet in use", "value": 9, "max": 13 } }
// big number (tower): headline, a line, a 4-row funnel and a bar chart
"screen": { "title": "MRR", "big": "$8,420", "line": "3 branches · 24 trials", "funnel": [{ "label": "Trials", "value": 24 }, { "label": "Paying", "value": 3, "tone": "green" }], "spark": { "title": "Fleet", "items": [{ "label": "Jul", "value": 12 }] } }
```
Without `screen`, tiles are computed from vehicles, people and to-dos.

Inside, by kind: **shop** — screen, logo sign, key board (one hook per bay, max 20), cork board
(top 6 to-dos), counter with up to 3 staff (people not `wait`/`drive`/`away`), paper stack
(`inbox`), up to 10 chairs with people in state `wait`, workshop door, plants.
**office/tower** — wide screen, one desk per person (max 24; `wander`/`work` type at their desk,
others leave an empty desk), meeting table, plants; tower adds plaques of up to 5 `shop` places,
a wall grid of the first `cluster`'s members (max 40) and the vault. **cluster** — one desk per
member (max 40; `done` members get a green monitor), key board if it has vehicles.

## 6. vehicles

```jsonc
{ "id": "c9", "place": "1", "state": "road", "name": "Ka", "color": "#D33A2C", "colorName": "red",
  "driver": "d-c9", "alert": "red", "tip": "Contract not signed", "listSub": "on the road until 18/12",
  "stateText": "with a driver until 18/12", "lines": ["Bi-bi!"],
  "page": { "subtitle": "Ford · 2019", "blocks": [ … ] } }
```
| field | what |
|---|---|
| `place` | owner place; parked vehicles take its bays in order (non-moving first) |
| `state` | key of `states` |
| `color`, `colorName` | body colour (hex) and the word shown after the name |
| `driver` | person id; shown sitting in the car while it drives; clicking the figure opens the person |
| `alert` | `red` / `amber` floating pin; `blue` = no pin |
| `tip`, `listSub`, `stateText` | hover second line · drawer list line · text next to the state pill |
| `lines` | what the car "says" when clicked (cycled). Moving cars fall back to the driver's first line |
| `page` | drawer content |

A parked vehicle without a free bay is hidden (raise `capacity`).

## 7. people

```jsonc
{ "id": "o-1", "role": "owner", "place": "1", "state": "wander", "private": true, "name": "Ana",
  "vehicle": "c3", "done": true, "tip": "logged in this week", "listSub": "…",
  "lines": ["4 cars out today", "Need to sign 2 contracts"], "look": { "shirt": "#10B981", "skin": "#C68B64", "hair": "#2A1C14", "style": "long", "pants": "#3D4A5C", "scale": 1 },
  "page": { "subtitle": "…", "blocks": [ … ] } }
```
| state | in the city | inside |
|---|---|---|
| `wander`, `work` | walks around the place's front | types at a desk / stands at the counter |
| `idle` | stands still in the place's idle area | empty desk (office/tower/cluster) or counter |
| `wait` | stands next to its `vehicle`'s bay, on the phone | sits on a waiting chair (shop) |
| `drive` | inside its `vehicle` (also implied when the vehicle moves and `driver` is this id) | – |
| `away` | not drawn | empty desk |

`name` is optional — without it the role label is shown. `look` omitted = random skin/hair, shirt
= role colour. `style`: `short` · `long` · `bun`. `done` marks a cluster member as converted.

## 8. actions

```jsonc
{ "id": "a1", "sev": "red", "title": "Contract not signed · 5 cars", "text": "Cars are out without a contract.",
  "place": "1", "target": { "t": "vehicle", "id": "c7" } }
```
`sev`: `red` (counted as urgent, badge on the card) · `amber` · `blue` · `muted`. Clicking opens
`target` (or the place). An action belongs to a place when `place` matches or its target is a
vehicle/person of that place; the place's to-do tab and cork board show it. Sort and group
upstream ("5 cars" beats five rows).

## 9. kpis and home

```jsonc
"kpis": [{ "label": "MRR · 3 paying", "value": 239.7, "format": "currency2", "sub": "+12%", "tone": "red", "ref": { "t": "place", "id": "HQ" } }]
```
`format`: `int` (default when omitted) · `currency` · `currency2` · `pct` · anything else = 1
decimal. Numbers count up; strings are shown as is. With `ref` the KPI is a button.

`home`: `{ label, title, subtitle, blocks }` — the overview page (dock "Overview" button, first
crumb). Default blocks: list of places + top 4 actions.

## 10. pages and blocks

Every entity's drawer = hero (automatic) + `page.blocks` + automatic parts (enter button, capacity
bar and tabs for places; state pill and follow/ride for vehicles; quote and talk for people).

| type | fields |
|---|---|
| `stats` | `title?`, `items: [{ label, value, of?, sub?, tone? (red/green/amber) }]` — 2-column tiles |
| `bar` | `label`, `value`, `max`, `text?`, `tone?` (green/blue/amber/red) |
| `alerts` | `items: [{ sev, title, text }]` |
| `timeline` | `title`, `flag?`, `items: [{ label, state: done/gap/now/eta/todo, note }]` |
| `kv` | `title?`, `items: [[key, value], …]` |
| `funnel` | `title`, `items: [{ label, value, tone? }]`, `note?` |
| `spark` | `title`, `right?`, `items: [{ label, value }]`, `note?` (last bar highlighted) |
| `note` | `text` |
| `chips` | `title?`, `items: [{ label, color?, ref? }]` |
| `list` | `of: places/actions/vehicles/people`, `ids?`, `limit?`, `title` |
| `buttons` | `items: [{ label, icon?, ref? , do?, ghost? }]` |

Any block header accepts `title`, `flag` (red pill) and `right` (grey text on the right).

## 11. refs and `do`

A ref points at anything that can be opened: `{ "t": "home" }` · `{ "t": "actions" }` ·
`{ "t": "place", "id" }` · `{ "t": "vehicle", "id" }` · `{ "t": "person", "id" }` ·
`{ "t": "action", "id" }` (opens its target) · `{ "t": "companion", "i" }` · `{ "t": "me" }` ·
`{ "t": "pet" }` · `{ "t": "prop", "k": "heli" | "vault" | "ghost", "place" }`.

Button `do` strings: `enter:<placeId>` · `walk:<placeId>` · `mode:map|walk` · `heli` · `tour` ·
`journey:<index>` · `replay` · `ride:<vehicleId>` · `follow` · `talk` · `pet`.
Icons: `plus minus x rotl rotr home chev map walk heli alert check clock flag eye eyeOff car enter play stop replay video target user chat more building`.

## 12. player, pet, companions

```jsonc
"player": { "name": "You", "role": "admin", "label": "You", "shirt": "#151515", "skin": "#D4A07A", "hair": "#2A1C14", "style": "short", "cap": "#F63B04", "lines": ["Let's see the network"] },
"pet": { "label": "Scott", "coat": "#B9753F", "line": "Goes wherever you go.", "bark": "Woof!" },
"companions": [{ "name": "Mia", "rel": "sister", "greet": "Hi!", "lines": ["…"], "look": { "shirt": "#F59E0B", "style": "long" }, "page": { "blocks": [] } }]
```
**Scott is in every city and is always named Scott** — a tribute to the author's dog. `pet` only
changes the tag, coat, line and bark. Companions walk slowly in the park, carry name tags and greet
you (`greet`) when you walk past.

## 13. tour and journeys

```jsonc
"tour": { "label": "Presentation", "outro": "…", "steps": [ … ] },   // steps optional → automatic tour
"journeys": [{ "title": "Checkout", "steps": [
  { "place": "gateway", "title": "1 · The order arrives", "text": "…", "payload": "POST /orders {…}" },
  { "move": { "from": "gateway", "to": "orders", "say": "POST /orders", "color": "#6366F1" }, "title": "2 · Orders", "text": "…" },
  { "move": { "from": "orders", "to": "payments" }, "place": "payments", "fail": true, "title": "Declined", "text": "…" },
  { "ref": { "t": "home" }, "title": "Done", "dur": 4 },
  { "place": "orders", "enter": true, "title": "Inside Orders" }
]}],
"journeysTitle": "Journeys"
```
Step fields: `ref` or `place` (camera target; the step reacts), `move` (a courier car drives from
one place to the other through the streets and lights; the camera follows), `title`, `text`,
`payload` (string or object, shown as code), `fail` (red caption, target place shown `down` during
the step, red courier), `enter` (goes inside the place), `dur` (seconds; default 5, 7 with `move`).
Journeys appear as buttons on the home page. Without `tour.steps` the tour is built from the data:
overview → up to 2 urgent actions → shops/offices → inside the first one → inside the tower →
cluster → the park → overview.

## 14. timeline (replay)

```jsonc
"timeline": { "label": "7 days in 60 s", "title": "Last 7 days", "from": "2026-10-12T05:40:00Z", "to": "2026-10-19T05:40:00Z", "seconds": 60,
  "events": [{ "at": "2026-10-12T22:48:11Z", "place": "1", "vehicle": "c7", "state": "road", "from": "waiting", "text": "Dolphin left", "tone": "brand", "amount": 100, "bubble": "New rental!" }] }
```
The dock button uses `label`. During the replay every vehicle that has events starts in the
`from` of its first event; each event at its time sets `state`, shows `text` as a toast (`tone`:
brand/green/blue/amber) and a bubble over the place (`bubble`, or `+amount`). A clock and the
running sum of `amount` are shown. At the end every vehicle goes back to its real state.

## 15. data

`data.sources` makes the city live (polling, SSE, WebSocket, Supabase REST, static rows). Each
source either returns a world patch or rows mapped with `into` / `key` / `map` / `stateMap`.
Full reference and security rules: data-sources.md.

## 16. Minimal example

```json
{
  "version": 2,
  "meta": { "title": "Corner Bikes", "locale": "en", "brand": { "name": "Corner", "color": "#2563EB" } },
  "states": { "road": { "label": "Rented", "tone": "brand", "moving": true }, "parked": { "label": "Available", "tone": "green" } },
  "places": [
    { "id": "main", "kind": "shop", "name": "Main street", "capacity": 6 },
    { "id": "hq", "kind": "tower", "name": "HQ", "floors": 2, "vault": 5, "vaultText": "5 bars = 5 open rentals" }
  ],
  "vehicles": [
    { "id": "b1", "place": "main", "state": "road", "name": "City bike", "color": "#2F5FD0", "driver": "r1" },
    { "id": "b2", "place": "main", "state": "parked", "name": "Cargo bike", "color": "#E8B53A" }
  ],
  "people": [
    { "id": "r1", "role": "driver", "place": "main", "state": "drive", "vehicle": "b1", "lines": ["Back at 6 pm"] },
    { "id": "s1", "role": "staff", "place": "main", "state": "work", "lines": ["2 bikes out today"] }
  ],
  "actions": [{ "sev": "amber", "title": "Cargo bike needs a check", "place": "main", "target": { "t": "vehicle", "id": "b2" } }],
  "kpis": [{ "label": "Bikes out", "value": 1, "sub": "of 2" }]
}
```
