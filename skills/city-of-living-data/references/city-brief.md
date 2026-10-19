# Phase 2 — Design the city (the City Brief)

Only after the user confirmed the Understanding Summary. The City Brief turns understanding into
decisions the user can approve in one read. Still no code — changing a table row now costs nothing;
changing it after the converter and data wiring costs a rebuild.

## How to design

1. **Start from the 5-second questions.** For each one, decide what on screen answers it: a KPI,
   a place card line, a badge, a halo, a pin over a car, the first rows of "Needs attention". If
   nothing answers it, the design is wrong — fix that first. These are the QA acceptance checks.
2. **Places with meaning.** Pick the `kind` by role, not by looks:
   | kind | use for | draws | inside |
   |---|---|---|---|
   | `shop` | a branch, store, customer company, warehouse — anything with a fleet or stock | building, sign, lot with `capacity` bays, gate | wall screen, key board (one hook per bay), to-do cork board, counter with staff, chairs for people waiting, papers (`inbox`) |
   | `office` | a service, a team, a department | 1–8 floors (`floors`), small lot if it has vehicles | desks: active people typing, empty desks for inactive ones |
   | `tower` | the HQ / the platform — the thing that grows | lobby + `floors`, dashed next floor (`nextFloor`), helipad, `vault` of gold bars | big screen (`screen.big`), plaques of the shops, wall grid of the cluster, desks, vault, meeting table |
   | `cluster` | the long tail: trials, small customers, freelancers | a row of small houses, a 4-bay lot | coworking: one desk per member, green screen when `done` |
   | `park` | the square: you, Scott and your companions | fountain, benches, flowers | — (added automatically if missing) |
   Max 12 places. Order matters: first places fill the front row; towers and offices go to the back.
3. **What moves.** Define `states` once: which are `moving` (drive the streets), which park in a
   bay, and their tone (`brand` · `blue` · `green` · `amber` · `red` · `muted`). A moving vehicle
   leaves a dashed bay behind and shows a driver inside.
4. **Who.** `roles` with a label and a shirt color; `state` per person: `wander`/`work` = active
   (walks outside, types at a desk inside), `idle` = inactive (stands still, empty desk), `wait` =
   waiting for a vehicle (by the bay with a phone, on a chair inside), `drive` = inside a moving
   vehicle, `away` = not drawn outside.
5. **Lines and pages.** For every entity type: the hover `tip`, the `lines` it says when clicked,
   and its `page.blocks`. Lines are short, first person, from real data. Pages start with the
   answer (status, numbers with comparisons), then the detail (timeline, kv).
6. **Actions** (Monitor/Both). Ranked list; each with `sev` (`red` today · `amber` this week ·
   `blue` info), a `title` that says *what* ("Contract not signed · 5 cars"), a `text` that says
   *why*, a `place`, and a `target` (`{t:'vehicle'|'person'|'place', id}`) the click flies to.
   Group repeated alerts ("· 5 cars") instead of listing them one by one. Max ~15.
7. **Journeys** (Explain/Both). 1–3 journeys of 3–8 steps. Each step: `title`, one or two
   sentences of `text`, optional `payload` (request/response), `move: {from, to, say}` to drive
   the courier, `fail: true` where a failure journey breaks (the place turns red for that step).
8. **Tour and replay.** The ▶ Present tour is automatic (overview → most urgent → each place →
   inside → HQ → square) unless you write `tour.steps`. If there's an event log, add a
   `timeline` ("Last 7 days" in 40–60 s).
9. **Privacy plan.** Which places/people are `private` (real names hidden by the toggle and
   replaced by `meta.alias.place` + number), what never appears (plates, document numbers, phones,
   e-mails, drivers' names), and whether a public video uses demo data.
10. **Deliverable.** Exactly what files the user gets and how to run them.

## Usefulness — the bar every city must clear
1. **Bound or quiet.** Every size, position and motion follows a data rule; decoration stays
   neutral (trees, fountain, groves). Good rules: rented car drives / available car parks in its
   bay · 1 bay = 1 slot of the plan · 1 person = 1 user, walking = active this week, standing =
   not · 1 floor = 1 plan's worth of revenue · 1 gold bar = 1 open deal · empty desk = no access in
   7 days. Write the rule in the page (`note` block or `sub`).
2. **Actions first.** The drawer's overview lists "Needs attention" right after the places; KPI
   "Needs attention" opens the full list; each row flies to its target.
3. **Compare, don't just count.** `x of y`, `+n this month`, vs goal. Vanity totals go nowhere.
4. **Time.** Monthly series as `spark` blocks; the tower grows with the core metric; the replay
   shows a week in a minute.
5. **Honest state.** `status: "none"` (grey) = no data, never an alert; test accounts stay out of
   money KPIs (and say so with a `note`); snapshots show "Snapshot of <date>".
6. **Explainable risk.** Additive score with named reasons; the reasons go in the action `text`.
7. **Funnels for trials/onboarding.** signed up → first record → active → paying, as a `funnel`
   block and on the tower screen — it tells you where people stop.
8. **Everything answers a click.** If something is drawn, its click must lead somewhere useful
   (a page, a line, a target). Decoration gets a small reaction (trees wiggle, fountain splashes).

## Template (fill it, show it, get a yes)

```markdown
# City Brief — <title>

**Goal:** <Explain | Monitor | Both | Other> · **Opens with:** <map | tour autoplay>
**Answers in 5 seconds:**
| question | answered by |
|---|---|
| Which branch needs me today? | red badge on the place card + first rows of Needs attention |
| How many cars are out? | KPI "Cars on the road 18 of 33" + cars driving |

**Places**
| id | name | kind | capacity / floors | private | screen inside |
|---|---|---|---|---|---|
| north | Harbor North | shop | 12 bays | yes | Today's board: on the road, pick-ups, revenue |
| hq | Harbor HQ | tower | 1 floor = $2k MRR, vault = open rentals | no | MRR + trial funnel + fleet per month |

**Vehicles:** source <table> · states: road (moving, brand) = rented · waiting (blue) = reserved · parked (green)
**People:** roles <role → label, color> · active = <rule> · lines: <role → example line>
**Pages:** place → <blocks> · vehicle → <blocks> · person → <blocks>
**Actions:** <rule → sev, title, target> (ranked by …)
**KPIs:** <label = value (comparison) → click opens …>
**Journeys / tour / timeline:** <…>
**Privacy:** <private places/people, alias, what never shows>
**Data:** <snapshot converter from … | live source … every … s>
**Deliverable:** <single HTML file | site | component in …> · <locale> · <palette + brand color>
```
