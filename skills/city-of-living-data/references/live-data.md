# Live data — streaming, polling, transitions, replay

How the city behaves while data changes under it. Sources and security: data-sources.md.

## 1. Three ways in
| way | when | how |
|---|---|---|
| **Polling** | most admin screens (every 15–60 s) | `{ "type": "http" | "supabase", "intervalMs": 15000 }` — fetch, map, `update()` |
| **Streaming** | ops walls, events as they happen | `{ "type": "sse" | "ws", "url": … }` — every message is JSON, mapped and passed to `update()` |
| **From your app** | the city is a component in your product | keep a reference to the API and call `city.update(patch)` whenever your store changes |

A message/payload is either a world patch (`into: "world"`) or rows for one entity list
(`into: "vehicles"`, with `key`, `map`, `stateMap`). Keep messages small: send only what changed.

```jsonc
// SSE message: one car came back, KPIs moved, a new to-do
{ "vehicles": [{ "id": "v12", "state": "parked", "stateText": "back in the lot" }],
  "kpis": [{ "label": "Cars on the road", "value": 17, "format": "int", "sub": "of 33" }],
  "actions": [{ "sev": "red", "title": "Payment overdue · Corolla", "place": "north", "target": { "t": "vehicle", "id": "v7" } }] }
```
`kpis` and `actions` replace their whole list — always send them complete.

## 2. The live chip (top right)
| chip | when |
|---|---|
| grey **No data** | sources declared, no successful read yet |
| green **Live** | last read succeeded |
| amber **Data is late** | the last read failed, or nothing arrived for 3 × the largest `intervalMs` |
| **Snapshot of <date>** | no live sources; `meta.asOf` is shown |
Place-level honesty is your job: send `status: "none"` (grey card, grey mark) for a place whose
data you couldn't read, never `ok`.

## 3. What happens on screen when a vehicle changes state
- **parked → moving:** the car leaves its bay and joins the street nearest its place; its bay turns
  into a dashed outline (the slot is still theirs); a driver appears inside.
- **moving → parked:** it leaves the traffic (lane and junction locks are released) and appears in
  its bay; if it had none, it takes the first free bay of its place; with no free bay it's hidden.
- **color / name / page / lines:** update in place; the open page re-renders.
- Bays are repainted, place cards recount ("5 on the road · 6 in the lot · 11/15 bays").
- Rooms (interiors) are rebuilt the next time someone enters them.

## 4. What updates live vs on reload
| live | needs a reload (or a new snapshot) |
|---|---|
| vehicle state, color, page, lines, alert pins | new places |
| new vehicles (take a free bay) | drawing new people (they appear in lists, not as figures) |
| place status, card, page, screen text, sub | changing a place's kind, capacity bays, floors, vault size |
| KPIs, actions, `asOf` | roles, states definitions, palette, brand |
For a city that changes structure often, rebuild the snapshot periodically and reload the page
(e.g. every hour on a wall screen), keeping the live source for the minute-to-minute part.

## 5. Replay: a period in a minute (`timeline`)
An event log becomes a short film: the clock runs from `from` to `to` in `seconds`, cars leave and
come back, toasts show each event, amounts pop over the place, a running total sits on the clock.
At the end (or Esc / Stop) every vehicle goes back to its current state.

```jsonc
"timeline": {
  "label": "7 days in 60 s", "title": "Last 7 days", "from": "2026-10-12T05:40:00Z", "to": "2026-10-19T05:40:00Z", "seconds": 60,
  "events": [
    { "at": "2026-10-12T22:47:54Z", "place": "1", "vehicle": "c7", "from": "parked", "state": "waiting", "text": "New rental · Dolphin GS", "tone": "blue", "bubble": "New rental!" },
    { "at": "2026-10-12T22:48:11Z", "place": "1", "vehicle": "c7", "state": "road", "text": "Dolphin GS left" },
    { "at": "2026-10-13T12:00:00Z", "place": "3", "amount": 780, "text": "Payment · Mobi · $780", "tone": "green" }
  ]
}
```
| event field | effect |
|---|---|
| `vehicle` + `state` | the vehicle changes state at that moment (moves out / parks) |
| `from` | on the vehicle's **first** event: the state it starts the replay in |
| `text` + `tone` (`brand` · `green` · `blue` · `amber`) | a toast in the feed |
| `amount` | "+$780" floats over the place; added to the clock's running total |
| `bubble` | a custom floating text over the place instead of the amount |
Build events from your event log (rentals, departures, returns, payments, sign-ups); match each to
a vehicle id in the converter. Keep 20–80 events: more becomes noise.

## 6. Performance notes
- Vehicles, people, trees and pins are instanced: hundreds are fine. Patches are cheap; send them
  as often as the data really changes, not on a timer.
- One `update()` per message; batching several changes into one patch is better than many small ones.
- Hidden tabs keep polling; pause your own pushes when `document.hidden` if that matters to you.
