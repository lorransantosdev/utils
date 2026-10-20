# Use cases — recipes

Each recipe says which place kinds, what moves, who walks, what grows, and what the pages and
actions should be. Copy the closest one into the City Brief and adapt.

## 1. SaaS admin: a network of customers (Monitor) — `assets/examples/rental.world.json`
Born as the admin city of a real car-rental SaaS: every customer company is a building, every car
in their fleet is a car in the city, every user is a person.
- **Places:** each paying customer = `shop` with `capacity` = plan limit (bays painted green when
  free); trials = one `cluster` (one desk per account, green screen = reached the first milestone);
  your company = `tower` (floors = MRR / plan price, `vault` = open deals, `nextFloor` = what the
  next customer adds); `park` with you, Scott and your companions.
- **Vehicles:** the customers' records that come and go — rented cars drive (`road`, moving),
  reserved ones wait in the bay (`waiting`) with the driver standing next to them, available ones
  park (`parked`). Real model and color, never plates.
- **People:** owners/managers wander by the door; drivers sit in their cars or wait by the bay;
  trial users stand still when inactive; your team types at desks in the tower (empty desk = no
  access in 7 days).
- **Pages:** place → stats (on the road x of y, revenue this month, overdue), tabs vehicles/people/to-dos;
  vehicle → contract bar, payments bar, alerts, rental timeline (reserved → signed → inspection →
  on the road → 1st payment → return, with skipped steps in red), details; person → their line +
  the car they drive/wait for.
- **Actions:** grouped per customer and rule ("Contract not signed · 5 cars", "Payment overdue ·
  Corolla"), red first, target = the first car; platform-level insights target the tower.
- **KPIs:** MRR (with paying count), cars on the road `x of y`, weekly contracted value, needs
  attention `n (k urgent)`.
- **Timeline:** rentals, departures, returns and payments of the last 7 days → replay in 60 s,
  "+$780" pops over the branch on each payment.
- **Privacy:** customer names `private: true` + "Hide names" for recordings; no driver names.

## 2. Microservices — how an order travels (Explain) — `assets/examples/microservices.world.json`
- **Places:** each service = `office` (floors ≈ size or traffic), the warehouse/fulfilment =
  `shop` (its vans are the deliveries), shared infra = `tower` (vault = deploys this week),
  a `park` for lunch.
- **People:** engineers per service (`work` = on call / active), lines like "On call for Payments".
- **Status:** `warn`/`down` from health (p95, error rate); the card says why ("p95 820 ms · PSP slow").
- **Journeys:** *Checkout* — gateway → orders → payments → warehouse → notifications, each step a
  `move` with `say` (the request name) and a `payload`; *Card declined* — same start, `fail: true`
  at payments (it turns red for the step), then the customer message.
- **Tour:** set `tour.steps` to the main journey so ▶ Present plays it; `meta.autoplay: "tour"`
  for a lobby screen.

## 3. Logistics / delivery
- **Places:** hubs and depots = `shop` (capacity = docks or vans), regions' offices = `office`,
  HQ = `tower` (floors = deliveries per day / 1k), small partners = `cluster`.
- **Vehicles:** vans/trucks — `road` = out for delivery, `waiting` = loading, `parked` = at the
  dock, `service` (amber, not moving) = in maintenance.
- **People:** couriers (`drive` while out), dock staff (`work`), customers waiting at a counter
  (`wait`, chairs inside).
- **Actions:** late deliveries, vans overdue for service, a hub over capacity.
- **Timeline:** scans of the day → replay the morning wave.

## 4. Education / onboarding — "learn how X works by walking through it"
- One city per concept: how a web request works (DNS → CDN → server → DB), how a card payment
  settles, how the company's departments hand work to each other.
- Each place's page = what it does, why it exists, who owns it (`note` + `kv`); people's lines are
  tips or quiz questions; journeys are the lessons; companions can be the "mentors".
- Demo data; `meta.autoplay: "tour"` for a self-running intro.

## 5. Retail chain / franchise
- **Places:** stores = `shop` (capacity = checkouts or delivery bikes), regional office = `office`,
  HQ = `tower` (floors = monthly revenue units), new/onboarding franchisees = `cluster`.
- **Vehicles:** delivery bikes/cars (out / waiting / parked); **people:** store managers, staff on
  shift (`work`), customers in line (`wait`).
- **Pages:** sales today vs same day last week, stock alerts, staff on shift; screen inside =
  today's board. **Actions:** stores below target, stock-outs, missing closing reports.

## 6. Support / ops wall screen (Monitor, TV)
- **Places:** each queue or product area = `office` (people = agents, active = online), escalations
  = `shop` with tickets as "vehicles" only if they really move between places; otherwise keep
  tickets as numbers on screens and pages.
- **Status:** `warn` when the queue is over SLA, `down` when the oldest ticket breaches; halos and
  smoke make it visible from across the room. Live source every 15–60 s; the chip turns amber when
  data is late.
- Keep the camera still (no tour); big KPIs; video mode off.

## 7. Content / social media demo
- 5–8 places, everything moving, Scott in frame, companions with names, one journey or the replay.
- Record in **video mode (9:16)**: the dock's phone icon, or `city.video(true)`; ▶ Present runs the
  camera for you; arrow keys skip steps.

## Quick map by business type
Starting points for the City Brief: what each business becomes, and what each click shows. Swap in
the user's own objects and numbers; every number must exist in the data (§D1–D3 of understand.md).

| business | the city | click it to see |
|---|---|---|
| Online store | warehouse (`shop`, vans = deliveries), customer homes (`cluster`), the office (`tower`) | revenue and orders; stock per product; parcels out; new vs returning customers |
| Coffee shop / restaurant | the shop (`shop`, counter + queue inside), kitchen (`office`), delivery scooters as vehicles | sales today; items made; best sellers; busiest hour; covers tonight; table turn time |
| Gym / studio | rooms (`office` each), front desk (`shop`), members walking = checked in this week | check-ins today; class bookings; new members; cancellations |
| Salon / clinic | chairs or rooms (`office` each, one desk per chair), reception (`shop`), waiting chairs | appointments today; revenue per chair; rebooking rate; no-shows |
| Agency / services | one `office` per client, HQ `tower`, a cork board of projects inside | projects on time; hours used vs budget; invoices due; pipeline |
| Trades (builders, plumbers) | depot (`shop`), vans on the road = jobs in progress, job sites (`cluster`) | jobs today; quotes waiting; jobs booked this month; revenue |
| Real estate | a street of houses (`cluster`, done = sold), the agency (`office`) | listings live; inspections booked; offers; days on market |
| SaaS | one building per customer (see §1), trials as a `cluster`, your HQ `tower` | MRR, usage this week, overdue invoices, who needs a call |

## Sizing rules
| what | limit | if you have more |
|---|---|---|
| places | 12 (grid up to 4 × 3) | group the long tail into one `cluster`; split into several cities by domain |
| people per place shown | ~40 (cluster/office desks), 3 at a counter, 10 on waiting chairs | show active ones + a count in the page; the rest are rows in the People tab |
| vehicles per shop | ≤ `capacity` (max 22 bays) | extra parked vehicles get no bay (hidden); keep moving ones on the road |
| actions | ~15 | group by rule ("· 5 cars"), keep the rest in pages |
| journeys | 1–3, 3–8 steps each | one city per domain |
