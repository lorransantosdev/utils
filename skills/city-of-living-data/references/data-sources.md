# Data — how to feed the city

The engine draws whatever `world.json` says. There are two ways to fill it, and most real cities use
both: a **snapshot converter** that builds the whole world from your data, and optional **live
sources** that patch it while the page is open.

## Contents
1. Snapshot converter (recommended start) · 2. Live sources (`data.sources`) · 3. `update(patch)`
4. Shaping the data (SQL views) · 5. Supabase · 6. Local read-only server · 7. Multi-tenant
8. Privacy · 9. Workflow · 10. Troubleshooting · 11. The no-backend loop (sync script → data.json)
12. Where the numbers come from (Stripe, Shopify, Square, Sheets…) · 13. Keep it running · 14. Online for a team
15. A daily summary banner

## 1. Snapshot converter (recommended start)
A small script reads rows and writes `world.json`; the scaffold turns it into a page. It's where
the business rules live (what is an alert, how to group to-dos, what each person says), so the
engine stays generic. Pattern (Node or Python, ~200 lines):

```js
// build-world.mjs  —  rows (JSON exported from a read-only query) → world.json
const D = JSON.parse(readFileSync('data.json'));
const vehicles = D.cars.map((c) => ({
  id: c.id, place: String(c.branch), name: c.model, color: paint(c.color), colorName: c.color,
  state: c.status === 'RENTED' ? 'road' : c.reservation ? 'waiting' : 'parked',
  alert: c.overdue ? 'red' : null, tip: c.overdue ? `${c.overdue} payment(s) overdue` : undefined,
  lines: c.status === 'RENTED' ? undefined : [`${c.model} ready to rent`],
  page: { subtitle: `${c.brand} · ${c.year}`, blocks: [ /* bars, alerts, timeline, kv */ ] },
}));
// people: one driver per rented/reserved car (state drive / wait, vehicle: car id), owners, team…
// actions: group alerts per place and rule → { sev, title: 'Contract not signed · 5 cars', place, target }
// places, kpis, home, timeline (from the event log)…
writeFileSync('world.json', JSON.stringify({ version: 2, meta, roles, states, places, vehicles, people, actions, kpis, home, timeline }));
```
Then `python3 <skill>/scripts/scaffold.py --target single --world world.json --out city.html`.
Run it on a schedule (cron, CI) for a daily snapshot; the HUD chip says "Snapshot of <meta.asOf>".

## 2. Live sources (`data.sources`)
Declared in `world.json`; the engine polls or listens and merges what arrives with `update()`.

```jsonc
"data": { "sources": [
  // a world-shaped patch from your endpoint: { vehicles: [...], kpis: [...], actions: [...] }
  { "id": "live", "type": "http", "url": "/api/city", "intervalMs": 15000, "into": "world" },
  // rows mapped to entities, no code
  { "id": "cars", "type": "supabase", "url": "https://xyz.supabase.co", "anonKey": "<anon key>",
    "table": "city_vehicles", "select": "id,status,model",
    "into": "vehicles", "key": "id",
    "map": { "state": "status", "name": "model", "stateText": "{model} · {status}" },
    "stateMap": { "RENTED": "road", "RESERVED": "waiting", "*": "parked" } },
  { "id": "feed", "type": "sse", "url": "/api/city/stream", "into": "world" }
] }
```

| field | meaning |
|---|---|
| `type` | `http` (GET JSON; `headers`, `credentials` default `same-origin`) · `csv` (GET a CSV, first row = headers, numbers parsed — a Google Sheet "published to the web") · `supabase` (REST: `url/rest/v1/<table>?select=<select>` with the anon key) · `sse` / `ws` (each message is JSON) · `static` (`rows` or `patch` inline — for tests and public demos) |
| `intervalMs` | polling period for `http`/`supabase` (default 15000) |
| `into` | `world` (payload is already a patch) or `places` / `vehicles` / `people` (payload is rows, an array or `{ rows: [...] }`) |
| `key` | row field used as the entity `id` (default `id`) |
| `map` | entity field ← row column, or a `"{template}"` with `{column}` placeholders |
| `stateMap` | rewrites the mapped `state`; `"*"` is the fallback |

The live chip: green "Live · 2 min ago" after the first success (the age comes from the patch's
`asOf`, so put the sync time in it); amber "Data is late" when a request failed, nothing arrived for
3 × the largest `intervalMs`, or `asOf` is older than `data.staleAfterMs` (default 30 min); grey
"No data" until the first success. Chip and banner never show secrets: there are none in the page.

## 3. `update(patch)` — the one way data changes
`city.update(patch)` (also what sources call) merges by `id`:

| key | behaviour |
|---|---|
| `places: [{ id, ...fields }]` | merges into existing places (status, card, page, screen, sub…); **new places need a reload** |
| `vehicles: [{ id, ...fields }]` | merges; a change between moving and parked moves the car (leaves its bay for the street or comes back); unknown ids are **added** (they take a free bay of their place) |
| `people: [{ id, ...fields }]` | merges fields (lines, page, state text); new people are listed but drawn after a reload |
| `kpis: [...]` | replaces the KPI bar |
| `actions: [...]` | replaces the to-do list |
| `asOf` | the time the numbers were read (ISO); feeds "updated x min ago" and the late/stale check |
| `banner` | a slim line under the header: a string, or `{ text, label, tone: green·amber·red·blue, at }`; `null` removes it (§15) |
After a patch the cards, bays, open page and signs refresh; rooms rebuild next time you enter.

## 4. Shaping the data (recommended)
Don't point the city at raw production tables. Give it a few small read-only shapes:

```sql
-- one row per vehicle, only what the city shows
create view city_vehicles as
select v.id, v.branch_id as place, v.model, v.color,
       case when r.status = 'ACTIVE' then 'road' when r.status = 'RESERVED' then 'waiting' else 'parked' end as state,
       r.end_date, (select count(*) from charges ch where ch.rental_id = r.id and ch.status = 'OVERDUE') as overdue
from vehicles v left join rentals r on r.vehicle_id = v.id and r.status in ('ACTIVE', 'RESERVED');

-- one row per place with the numbers its page needs
create view city_places as
select b.id, b.name, b.plan_limit as capacity,
       count(*) filter (where r.status = 'ACTIVE') as on_road, sum(p.amount) filter (where p.paid_at >= date_trunc('month', now())) as paid_month
from branches b left join vehicles v on v.branch_id = b.id left join rentals r on r.vehicle_id = v.id left join payments p on p.rental_id = r.id
group by b.id;

-- the event log for the replay
create view city_events as
select created_at as at, branch_id as place, vehicle_id as vehicle, kind, amount
from rental_events where created_at > now() - interval '7 days';
```
**Endpoints that make a city useful:** `actions` (ranked to-dos with a target), `series` (one row per
month: revenue, deals, signups, fleet), `places` (one row each with health + risk reasons), `kpis`
(totals with comparisons), `events` (the last 7 days). Risk is additive and explainable — e.g. idle
days ×2 (max 40) + nobody logged in 7 days (+20) + < 30 % of fleet in use (+20) + customers owing
(+15); the action text lists the reasons that fired.

Metrics (Prometheus, Datadog, CloudWatch): a tiny backend endpoint runs the queries server-side and
returns a world patch (statuses + cards); credentials never reach the browser.

## 5. Supabase
Only the **anon key** in the browser, only views, only `select`, RLS on:
```sql
alter view city_vehicles set (security_invoker = on);
grant select on city_vehicles, city_places to anon;   -- views only, never base tables
```
If the data is not meant for everyone with the key, don't use the anon key: use the local
read-only server (§6) or an authenticated endpoint.

## 6. Local read-only server (admin cities)
The proven shape for an owner's live city: a Node `http` server on **127.0.0.1** that answers
`GET /api/city` with a world patch.
- Bind to 127.0.0.1, reject other `Host` headers (DNS rebinding), **GET/HEAD only**.
- Every request inside `BEGIN READ ONLY` with `SET LOCAL statement_timeout = '5s'`.
- Generic errors to the page; secrets only in a git-ignored `.env`.
- Connect as a dedicated least-privilege role with **column** grants:
```sql
CREATE ROLE city_reader LOGIN PASSWORD '…' NOINHERIT;
ALTER ROLE city_reader SET default_transaction_read_only = on;
ALTER ROLE city_reader SET statement_timeout = '5s';
ALTER ROLE city_reader CONNECTION LIMIT 3;
GRANT USAGE ON SCHEMA public TO city_reader;
GRANT SELECT (id, branch_id, model, color, status) ON public.vehicles TO city_reader;  -- columns, not tables
CREATE POLICY city_reader_select ON public.vehicles FOR SELECT TO city_reader USING (true);  -- works with RLS on
```
Never grant document numbers, phones, e-mails, addresses, plates, payloads or gateway keys.

## 7. Multi-tenant (each customer sees only its own city)
- The tenant comes from the **auth token / RLS** (`tenant_id = auth.jwt() ->> 'tenant_id'`),
  never from a URL parameter or a field the page sends.
- No cross-tenant numbers (no platform MRR, other tenants' counts, global queues or errors); no
  tower of *your* company — their HQ is their own office.
- Gateway failure reasons and internal errors stay out.

## 8. Privacy
- The city never needs personal data: no plates, document numbers, phones, e-mails, addresses,
  customer or driver names. People are their role ("Driver · Corolla").
- Company/customer names are fine for an internal admin view — mark them `private: true`. The
  "Hide names" button swaps them for `meta.alias.place` + number ("Branch 2") everywhere: cards,
  signs, pages, rooms. Use it for recordings.
- Public videos and demos: `static` sources or demo values, never production data. Snapshots to
  share are built from rows with names hidden by default (names only behind an explicit flag).
- All strings are escaped by the engine; no HTML in data.

## 9. Workflow
1. Export 5–20 real sample rows (read-only) → write the converter → open the page.
2. Check the 5-second questions with real numbers; fix rules and wording.
3. If it needs to be live, add `data.sources` with the same shapes (or `static` first, then swap
   `type` to `http`/`supabase`/`sse` keeping the `id`).
4. Run QA (qa-checklist.md), including "source down" and "names hidden".

## 10. Troubleshooting
| Symptom | Likely cause |
|---|---|
| A car never moves | its `state` isn't in `states` with `moving: true`, or `stateMap` didn't match |
| A car is missing | parked with no free bay (`capacity` too small) or `place` doesn't match a place id |
| Chip stays grey "No data" | the first request never succeeded: URL, CORS, auth; Supabase: RLS or anon key |
| Chip amber "Data is late" | a request failed or nothing arrived for 3 × `intervalMs` |
| KPIs don't change | sources must send the whole `kpis` array (it replaces the bar) |
| Person added live isn't drawn | new people/places are drawn on reload; merge-only fields update live |

## 11. The no-backend loop (sync script → data.json → page)
For an owner's dashboard that must run on a laptop with no server to deploy, three small pieces
work as a loop — the city never talks to Stripe or your database itself:

1. **`sync.mjs`** (template in `assets/template/`) asks each source for the latest numbers,
   read-only, every N minutes, and writes **`data.json`** as a world patch (`kpis`, `vehicles`,
   `actions`, `asOf`…). On failure it keeps the last good file and writes the reason to `sync.log`.
2. **`data.json`** holds totals and counts only — never names, e-mails, addresses or card data.
3. **The city polls it**: `"data": { "sources": [{ "id": "file", "type": "http", "url": "data.json", "intervalMs": 60000, "into": "world" }] }`.
   Browsers refuse to read a file next to an opened `.html`, so serve the folder: `node sync.mjs --serve 3000`.

```bash
cp <skill>/assets/template/{sync.mjs,.env.example,.gitignore} .   # then: cp .env.example .env and fill it in yourself
node sync.mjs --demo                 # first run with demo numbers: see the loop work before any key exists
node sync.mjs --every 5m --serve 3000   # the real thing: http://127.0.0.1:3000/city.html
```
Keys live only in `.env` (git-ignored). Never ask the user to paste a key into the chat: tell them
how to open `.env` and fill it in. The script never prints keys (errors are redacted). The only part
to edit is `toPatch(raw)`: numbers in, world patch out — every number traceable to a source, every
KPI with a comparison, alerts as `actions` with a target. Check 2–3 numbers against the source's own
dashboard before building anything on them ("this month only?", "net of refunds?").

## 12. Where the numbers come from
One app rarely has everything: payments in one, stock in another, bookings in a sheet.

| source | gives | read-only access |
|---|---|---|
| Stripe | revenue, payments, refunds, customers, products | Dashboard → Developers → API keys → **Create restricted key**, Read on what you need |
| Shopify | orders, products, stock levels | Settings → Apps and sales channels → Develop apps → app with **read_** scopes only → install → token |
| Square | sales, items, stock counts, customers | Developer Console → app → Credentials → production token, read scopes |
| Google Sheets | anything else: stock, deliveries, bookings, targets | File → Share → **Publish to web → CSV** (`type: "csv"` in the page, or `SHEET_CSV_URL` in sync.mjs) |
| your database | everything | a read-only role / views (§4–§6) |
| any other app | deliveries, bookings, staff | its API if it has one; else export to a Sheet |

Keys are passwords: never in a chat, a screenshot or the page. Totals and counts only.

## 13. Keep it running
The loop is live only while the sync keeps going. Put it on a timer and make it survive a reboot:
- **macOS**: a `launchd` agent (`~/Library/LaunchAgents/com.<name>.city.plist`, `RunAtLoad`,
  `KeepAlive`) running `node sync.mjs --every 5m --serve 3000`.
- **Linux**: a user `systemd` service (`Restart=always`), or `@reboot` in `crontab -e`.
- **Windows**: Task Scheduler → run at log-on, `node.exe sync.mjs --every 5m --serve 3000`.
Write a short README for the owner: how to open the city, stop/restart the sync, and check
`sync.log`. Every 5 minutes is far below any provider's rate limit; every minute is fine too.
Check it's really live: the chip's "x min ago" resets after each sync; change a cell in the sheet
and watch the card change without a reload; reboot and open the link again.

## 14. Online for a team
When the city must stay up with the laptop off, host it (Vercel, Netlify, Cloudflare…):
- the page is static; a tiny serverless function answers `GET /api/city` with the world patch,
  running the same fetchers with keys from the **host's private environment settings**, cached
  for ~2 minutes (`Cache-Control: s-maxage=120`) so it's live without a schedule;
- the page uses `{ "type": "http", "url": "/api/city", "intervalMs": 60000, "into": "world" }`;
- protect it: password (basic auth in the function + page), or the host's access control. Share
  the link only with the team — it shows real revenue;
- the user creates the hosting account; walk them through it one step at a time.

## 15. A daily summary banner
A scheduled task (e.g. a Claude Code scheduled run every morning) can read today's `data.json`,
compare it with a kept copy of the last 7 days and write three lines into `summary.json`:
```json
{ "banner": { "label": "Today", "text": "Orders +12 % vs the 7-day average · 31 parcels to ship, 9 older than 24 h · no payment failures", "tone": "green", "at": "2026-10-20T07:00:00Z" } }
```
Add it as one more source (`{ "type": "http", "url": "summary.json", "intervalMs": 300000, "into": "world" }`)
or merge it into `data.json`; the city shows it as a slim line under the header (hidden in video and
presentation modes). Keep a copy of each day's numbers (`history/2026-10-20.json`) so the comparison
has something to compare with.
