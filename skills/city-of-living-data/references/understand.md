# Phase 1 — Understand (no building yet)

You can't design a good city for a system you don't understand, for a person whose goal you
haven't heard. This phase ends with an **Understanding Summary** the user confirms. Until then:
no world.json, no converter, no code.

## Contents
1. How to run this phase · 2. Step 1 — the goal (always first) · 3. Step 2 — the system
4. Step 3 — the data · 5. Step 4 — the people who will use it · 6. Step 5 — what happens on click
7. The Understanding Summary (gate) · 8. When the user isn't around

## 0. Before you start (for a Monitor city on real data)
Tick these with the user before Phase 1 goes deep; each missing one becomes a question:
- ☐ an **empty folder** for the project (everything happens there; `.env` and `data.json` stay git-ignored);
- ☐ **read-only access** to each source (data-sources.md §12): a restricted key, a read-only DB role, a sheet published as CSV. Read-only = the city can look at numbers, never change anything or move money;
- ☐ **Node.js** if the no-backend loop will be used (`sync.mjs`); say what will be installed and ask before installing;
- ☐ optional: a photo or a few sentences about the place — it decides the brand color, the sign subtitles, what the places are called and which kinds they get (the look itself stays the engine's).

## 1. How to run this phase
- **Look before you ask.** Read what's available first: attached files, the repository in the
  workspace (`python3 <skill>/scripts/discover.py <repo> -o discovery.json --draft world.draft.json`),
  connected tools (database tools: list tables and a few sample rows, read-only; docs tools;
  observability tools), screenshots of their current dashboard. Then ask only what the evidence
  doesn't answer.
- **Prefer confirming over asking.** "I found 3 branches, 33 cars, 24 trial accounts and a team of
  8 — is that the whole picture?" beats "what are your entities?".
- **Rounds of ≤ 4 questions**, multiple choice when possible, recommended option first. Free text
  only for things only the user knows (one-sentence description, journeys, thresholds, lines).
- Ask in the user's language. The wording below is a guide, not a script.
- Keep a running list of **unknowns**; they go in the summary instead of being guessed silently.

## 2. Step 1 — the goal (always the first question, exactly these 4 options)

> **What should this city be for?**
> 1. **Explain flows** — help people understand how a system or process works (onboarding, docs, demos, content)
> 2. **Monitor data** — show the live state of a system or business (ops, admin, wall screen)
> 3. **Both** — explain the flows on top of live data
> 4. **Other** — describe it

PT-BR: *"Para que serve essa cidade? 1) Explicar fluxos · 2) Monitorar dados · 3) As duas · 4) Outro (descreva)"*

| | Explain flows | Monitor data | Both |
|---|---|---|---|
| Opens with | `tour` / a journey ready to play (`meta.autoplay: "tour"` for kiosks) | the map + KPIs + "Needs attention" | the map; journeys one click away |
| Must have | `journeys` (happy path + main failure) with courier moves, payloads and `fail` steps; a short `page.blocks` note per place saying what it does and why | real data (snapshot converter or `data.sources`), `actions`, KPIs with comparisons, `status` per place | all of both |
| Data | demo (fake but believable) | real | real |
| Typical audience | new hires, customers, students, viewers | owners, admins, ops, on-call | team leads, onboarding of on-call people |
| Questions next | Step 2 (deep) → 4 → 5 | Step 2 (light) → **3** → 4 → 5 | all |

"Other": ask one follow-up — *"What should someone be able to do or know after using it?"* — and
map it to the closest column.

## 3. Step 2 — the system

Goal: be able to explain the system back to the user in plain words, in the city's vocabulary.

| # | Ask (only if evidence doesn't answer) | Turns into |
|---|---|---|
| S1 | "In one sentence: what does it do, and for whom?" | `meta.title`, `meta.subtitle`, `home.subtitle` |
| S2 | **Where** — "What are the places?" Show the discovered list and confirm. One place per *branch / store / customer company / service / team / warehouse*. Max 12; the long tail (trials, small customers) becomes one `cluster`. | `places[]`, `kind` (shop · office · tower · cluster · park) |
| S3 | **What moves** — "Is there something that leaves and comes back, or travels between places?" (cars rented, vans delivering, requests between services) | `vehicles[]` + `states` (which states are `moving`) or journeys' courier |
| S4 | **Who** — "Which kinds of people are in this business?" (owners, staff, drivers, customers, trial users, your team) and which of them are active | `roles` (label + color), `people[]` with `state` |
| S5 | **What grows** — "Which number, if it went up, would make you proud?" (MRR, deals, customers) | tower `floors` (1 floor = a unit of it), `vault` bars, `nextFloor` text |
| S6 | "Walk me through the 1–3 journeys that matter most, step by step." Offer a draft from discovered calls. | `journeys[].steps` with `move: {from, to}` (Explain/Both) |
| S7 | "What goes wrong most often, or worries you most?" | `actions`, `status`, a failure journey with `fail: true` |
| S8 | "Is there a capacity?" (bays per plan, desks, docks) | `capacity` → painted bays, "x of y" bars, key board hooks |

Stop when you could draw the city on a whiteboard and narrate its main journey.

## 4. Step 3 — the data (Monitor / Both — mandatory)

A monitoring city without a real data plan is just a demo. Get a concrete answer for every
number that will appear on screen. Never invent a source: if the user can't tell where a number
lives, it goes to the unknowns list and ships in demo mode, labeled.

| # | Ask | Turns into |
|---|---|---|
| D1 | "Where does this data live today?" → *database (Postgres/Supabase/MySQL…)* · *an HTTP API* · *metrics (Prometheus, Datadog, CloudWatch)* · *a stream* · *spreadsheet* | converter input or `data.sources[].type` |
| D2 | "How can we read it **read-only**? Who can grant that?" | read-only role / view / local read-only server (data-sources.md) |
| D3 | "Which 2–4 numbers matter most at a glance?" — each with a comparison (`x of y`, vs last month, vs goal) | `kpis[]` with `sub` |
| D4 | "When is a place *worth a look* (amber) and when is it *in trouble* (red)?" Confirm units on a sample row (0.05 vs 5 %). | `status: ok · warn · down · none`, `alert` on vehicles, action `sev` |
| D5 | "What's the state of each thing?" Map raw values to states: `RENTED → road`, `RESERVED → waiting`, else `parked`. | `states`, `stateMap` |
| D6 | "How fresh must it be?" → *real time* · *every minute* · *every 15 min* · *a daily snapshot is fine* | snapshot vs `intervalMs` vs SSE/WS |
| D7 | "Is there an event log?" (rentals, returns, payments, sign-ups with timestamps) | `timeline.events` → "7 days in 60 s" replay |
| D8 | "Who will see this, and what is sensitive?" (customer names, money, personal data; internal vs public video) | `private: true`, hide-names toggle, aggregation, demo data for public recordings |

## 5. Step 4 — the people who will use it

| # | Ask | Turns into |
|---|---|---|
| U1 | "Who will look at it?" → *new team members* · *owner / admins* · *ops / on-call* · *customers* · *social media audience* | tone, depth of pages, modes |
| U2 | **"What must they answer in 5 seconds?"** Examples: Explain → "where does a payment go after checkout?"; Monitor → "which branch needs me today?", "how many cars are out?" | KPIs, card text, badges, halos — the acceptance test in QA |
| U3 | **"What should they DO today?"** (call a customer, sign contracts, chase trials, fix a service) and what makes it urgent | `actions[]` with `sev` and a `target` that flies to the car / person / place |
| U4 | "What does growth look like over time?" (per month) | `spark` blocks, tower screen `spark`, `floors` |
| U5 | "What counts as risk?" — signals and weights | an explainable reason in the action `text` and the place page |
| U6 | "Where will it run?" → *single HTML file* · *static site* · *inside an app (React / Next / Vue / Angular)* · *wall TV* · *screen recording (9:16 video mode)* | scaffold target, `meta.autoplay`, video mode |
| U7 | "Language and look?" — UI language, brand color + logo SVG path, palette (cream · mint · sunset · night) | `meta.locale`, `meta.brand`, `meta.palette` |
| U8 | "Will customers see their own city one day?" | multi-tenant rules (data-sources.md §7) |

## 6. Step 5 — what happens on click (everything is interactive)

Every place, vehicle, person, prop and interior object answers a click: it reacts (people turn,
wave and talk; cars hop or brake and honk; buildings bounce) and opens a page. Decide what they say.

| # | Ask | Turns into |
|---|---|---|
| I1 | "When someone clicks a **person** of each role, what should they say?" Lines come from real data ("Got the Kicks until Nov 30", "4 cars out today", "Signed up, never came back"). | `people[].lines` (cycled on each click), `tip` (hover line) |
| I2 | "And a **vehicle**?" (parked: "ready to rent · 42k km"; on the road: the driver speaks) | `vehicles[].lines`, `stateText`, `listSub` |
| I3 | "What should each **page** show?" per entity type: numbers, a progress bar, a timeline of steps, alerts, details | `page.blocks` (stats, bar, alerts, timeline, kv, funnel, spark, list, chips, note, buttons) |
| I4 | "Inside each building, what's on the wall screen? What sits on the counter?" | `screen` (tiles or big number), `inbox` (papers to sign), `workshopText`, `meetingText` |
| I5 | "Who are *you* in the city, and who walks with you?" (avatar name, cap color; companions in the square). Scott, the dog, is always there. | `player`, `companions`, `pet.line` |

## 7. The Understanding Summary (gate)

Write this back in the user's language, short and scannable, and ask: *"Did I get it right? Correct
anything before I design the city."* Do not move to Phase 2 without a yes (or corrections applied).

```markdown
## What I understood
**Goal:** Monitor data (+ explain the checkout journey)
**The system:** <one sentence>
**Who will use it:** <audience> — in 5 s they must answer: <q1>, <q2>
**What they do today:** <actions, ranked by> · **Growth:** <monthly series> · **Risk:** <signals>
**Places (N):** <list> → <kind each>; long tail grouped into <cluster>
**What moves:** <vehicles> — states: <road = …, waiting = …, parked = …>
**Who:** <roles with colors> — active = walks / works, inactive = stands still / empty desk
**What grows:** <1 floor = …> · <1 gold bar = …>
**When clicked:** <person → line from …> · <vehicle → …> · <page shows …>
**Journeys:** 1) <a → b → c> 2) <failure: … breaks at …>
**Data:** <number> ← <source> (<refresh>), bad when <threshold>   (one line each)
**Privacy:** <names private / hide-names toggle / demo data for public video>
**Where it runs:** <single file | site | React app | …>, <language>, <palette + brand>
**Still unknown:** <list, with what I'll assume if you don't know>
```

## 8. When the user isn't around
Take the most reasonable reading, write the summary with every assumption marked, and continue —
except for data sources: without a real, readable source, build the monitoring parts from a
`static` source or demo values and say clearly in the handover which numbers are not real yet.
Never guess personal data; leave lines generic ("Driver · Corolla") rather than invent names.
