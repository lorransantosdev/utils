---
name: city-of-living-data
description: Turns a business, a SaaS or a software system into a living 3D isometric city (three.js) where everything is clickable — places are buildings you can walk into, vehicles drive when they are in use, every person is a little figure that waves and talks with real numbers, and a side panel shows what needs attention. Use it to MONITOR data (admin view of customers, branches, fleet, team, revenue), to EXPLAIN flows (journeys where a courier drives a request between services), to PRESENT (auto tour, a week replayed in a minute, 9:16 video mode), or all of these. First understands the system and the goal, then designs, then generates. Use whenever someone wants a "city of my data", a "living dashboard", a dashboard turned into a game, an isometric or 3D city of a system, visual onboarding of a flow, an admin view to record a video, "cidade 3D", "dashboard em jogo", even without mentioning three.js.
---

# City of Living Data

## What it generates
A **toy-like isometric diorama that runs in the browser**: a floating slab of city blocks, one
place per block (shop with a parking lot, office, HQ tower, row of small houses, a square), cars
that drive real streets with lanes and traffic lights, articulated people that walk with physics,
your avatar with Scott the dog — all drawn from **one `world.json`**. Every building can be
entered, and every object in the city and inside answers a click.

| Goal | The user gets |
|---|---|
| **Monitor** | Places, vehicles and people bound to real data: a car on the road = in use, a reserved car with its driver waiting next to it, a tower that gains a floor per revenue step, a vault with one gold bar per open deal, people walking = active this week. KPIs with comparisons, a ranked **"Needs attention"** list (each item flies to what it is about), a page for every entity, live updates or a snapshot, "Hide names" for recordings. |
| **Explain** | **Journeys**: step-by-step captions while a courier car drives the request from place to place, with payload examples and failure steps that turn a place red. |
| **Present** | ▶ Present (an automatic tour built from the data), a timeline replay ("7 days in 60 s"), a 9:16 frame for vertical video. |
| **Other** | Whatever the user described, mapped to the closest of these. |

Delivered as **one HTML file**, a **static site**, or a **component** (React/Next, Vue/Nuxt,
Angular; Svelte snippet). The look is fixed (that's what makes it recognisable); content, brand
color, palette and language change.

## Make it useful, not decorative
1. **Bound or quiet.** Size, height, color and motion follow a data rule the user can repeat
   ("1 bay = 1 car of the plan", "1 floor = 1 plan of MRR", "walking = used it this week").
2. **Actions first.** The panel opens with what to do today, ranked, each pointing at a vehicle,
   person or place. KPIs carry a comparison ("of 22", "+8% vs last week").
3. **Everything answers a click** (references/interaction.md). Every person and vehicle gets
   `lines` with real numbers ("Got the Ka until 18/12", "4 cars out today"), a `tip` and a `page`.
   Nothing visible is dead.
4. **Honest and private.** Grey = no data. No documents, plates, phones, e-mails or private
   people's names in the world; real customer names only with `private: true` (the "Hide names"
   button swaps them for "Branch 1, 2…").

## Ground rule: understand → design → generate
Don't write world.json or touch code until the user confirmed **what you understood** (Phase 1)
and **approved the design** (Phase 2). If the user is away, follow understand.md §"not around"
and list every assumption.

## Phase 1 — Understand (references/understand.md)
1. **Goal first, exactly 4 options:** Monitor data · Explain flows · Both · Other (describe).
2. **Look before you ask:** read attachments; for a repo run
   `python3 <skill>/scripts/discover.py <repo> -o discovery.json --draft world.draft.json`; use
   connected database/docs tools **read-only**. Ask only the gaps: what each place is, what moves
   (vehicles and their states), who (roles), what grows, what goes wrong.
3. **Monitor/Both — the data:** for every number on screen, where it lives and how to read it
   read-only, refresh, thresholds, sensitivity. Never invent a source; unknowns stay demo, labeled.
4. **People:** who looks, the 5-second questions, what they must DO today, where it runs
   (file, site, framework, wall TV, video), language — and what each person/car should say.
5. **Gate:** the Understanding Summary (template in understand.md) and a yes.
Write Phase 1 and 2 documents in the user's language.

## Phase 2 — Design (references/city-brief.md)
A one-page **City Brief**: each part → place kind (shop / office / tower / cluster / park),
capacity, vehicle states, roles and colors, lines per entity type, page blocks, the actions rule,
KPIs, journeys (Explain), tour and timeline (Present), privacy plan, deliverable. Domain recipes:
references/use-cases.md. **Gate:** the user approves.

## Phase 3 — Generate
1. **Write the world** (references/world-format.md). For real data, write a small **converter**
   that turns rows into world.json (pattern in data-sources.md §1) instead of hand-typing. Start
   from `assets/examples/rental.world.json` (monitor) or `microservices.world.json` (explain).
2. **Validate** — 0 errors, read every warning (interactivity, privacy, comparisons):
   ```bash
   python3 <skill>/scripts/validate.py world.json
   ```
3. **Wire data** if live (references/data-sources.md, live-data.md): `data.sources` (http,
   supabase with anon key + RLS, sse, ws, static) mapped with `into/key/map/stateMap`, or push
   `city.update(patch)` from the app. Read-only always; no secrets in the browser; tenant from
   auth/RLS, never from the URL. For a copy to share: `scripts/snapshot.py` → static world.
4. **Scaffold** where it runs (references/framework-integration.md):
   ```bash
   python3 <skill>/scripts/scaffold.py --target single  --world world.json --out city.html
   python3 <skill>/scripts/scaffold.py --target vanilla --world world.json --out ./city
   python3 <skill>/scripts/scaffold.py --target react   --world world.json --out ./src/components/city   # vue | angular
   ```
5. **Verify, then iterate** (references/qa-checklist.md):
   ```bash
   node <skill>/scripts/screenshot.mjs --page city.html --out shots --steps map,home,place:<id>,enter:<id>,tour
   node <skill>/scripts/screenshot.mjs --page city.html --out shots --size 390x844 --steps map,place:<id>
   node <skill>/scripts/screenshot.mjs --page city.html --out shots --probe          # what answers a click, city + every room
   ```
   (needs Playwright: `npm i -D playwright`, pass `--playwright <dir>`; `--three ./node_modules/three` offline.)
   Open the PNGs, check the 5-second questions, the drawer, a room, the phone layout. Fix, re-shoot.
   No browser available? Say so and give the commands.
6. **Hand over** in a few lines: what was generated, how to open it, what is real vs demo, one next step.

## What the engine already does (don't rebuild it)
`assets/engine/city-of-living-data.js` (ES module, three.js r169 only) — `createCity(host, world)`:
- auto layout of up to 12 places, roads with lanes, junction locks and timed lights, cars that
  lean in turns and dip when braking, bays painted free / out;
- articulated instanced people (steering, personal space, stride-matched gait; stand, phone, sit,
  type, wave, point poses); companions with name tags who greet you; Scott follows you;
- interiors generated from the data: wall screen, key board (one key per vehicle), cork board
  (each note opens its action), counter with staff, papers, waiting chairs, desks (empty desk =
  inactive person), plaques, member grid, vault, meeting table; walls facing the camera fade;
- drawer pages for home, actions, places (tabs: vehicles / people / to do), vehicles, people,
  props; breadcrumbs; KPI bar with count-up; hide-names; live chip (live / late / no data);
- reactions, speech bubbles, follow, ride along, walk (WASD), helicopter, tour, journeys with a
  courier, timeline replay, 9:16 video frame, phone bottom sheet, reduced motion, `destroy()`.
API: references/engine-api.md. Extend it in its own style (references/visual-style.md).

## Style non-negotiables
**Scott, the dog, is in every city** — always created, always named Scott (a tribute to the
author's dog); `pet` only changes his label, line and coat. Isometric orthographic camera with
90° snaps · rounded matte shapes, no textures except screens and signs · brand color only on
bands, signs and accents · red / amber / green / blue are reserved for status · glass HUD,
drawer from the right (bottom sheet on phones). Make original cities — never recreate another
company's product UI, logo or mascot.

## Reference map
| need | read |
|---|---|
| Phase 1 questions, summary template | references/understand.md |
| Phase 2 City Brief, usefulness rules | references/city-brief.md |
| every world.json field | references/world-format.md |
| what every object does on hover/click, lines, reactions | references/interaction.md |
| converters, data sources, SQL, Supabase, read-only server, privacy | references/data-sources.md |
| live updates, streams, timeline events | references/live-data.md |
| recipes: SaaS admin, microservices, logistics, education, retail, ops wall, video | references/use-cases.md |
| look, adding a place kind | references/visual-style.md |
| palettes and brand | references/palettes.md |
| React / Next / Vue / Nuxt / Angular / Svelte | references/framework-integration.md |
| JS API, events, keyboard | references/engine-api.md |
| final checks | references/qa-checklist.md |
