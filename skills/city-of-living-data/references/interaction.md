# Interaction — everything answers

The rule of a City of Living Data: **every visible thing answers a hover and a click**. A building,
a car, a person, a key on a wall, a post-it, a tree. Data things open a page in the drawer; decor
reacts (wiggles, splashes, lifts) so nothing ever feels dead. The engine does all of this; the
world only has to give each entity something true to say.

## Contents
1. In the city · 2. Inside buildings · 3. Reactions · 4. Following and riding · 5. Keyboard and
touch · 6. Authoring rules

## 1. In the city

| object | hover (tooltip) | click | double-click |
|---|---|---|---|
| building (any mesh of a place, its sign, its crown) | name + card line, "2× enter" | building squashes, drawer opens on the place, camera flies to it | enters (enterable kinds) |
| floating card | building highlights | same as building | enters |
| ground of a block (sidewalk, lot) | the place | same as building | enters |
| street | "Street · N vehicles on the road" nearby | nothing else | zooms ×1.8 there |
| bay | "Bay 07 · free" or "Bay 03 · Ka · vehicle out" | opens that vehicle, or the place if free | – |
| vehicle (body, cabin, wheels) | name colour · state · place · `tip` | opens the vehicle; parked hops, moving brakes; bubble with a line; camera follows a moving one | – |
| driver inside a car | the person | opens the driver (`vehicle.driver`), selection ring on the car | – |
| alert pin over a car | the vehicle | opens the vehicle | – |
| person | name or role · `tip` | turns to you, waves, says a line; drawer opens; camera follows walkers | – |
| companion | name · relation | waves and says `greet` / `lines` | – |
| you | your name · role | your page (walk / fly buttons) | – |
| Scott | "Scott · …" | jumps and barks; his page | – |
| tree | "Tree" | wiggles | – |
| fountain | "Fountain" | splash ring | – |
| bench | "Bench" | a small bubble | – |
| traffic light | "Traffic light · green now / green in N s" | tooltip stays 2 s | – |
| gate arm | "Gate · place" | lifts | – |
| helicopter | "Helicopter" | page with "Fly the helicopter" | – |
| vault / gold bars | `vaultTitle` · `vaultText` | vault page (`vaultBlocks`) | – |
| dashed next floor | "Next floor · `nextFloor`" | page (`floorBlocks`) | – |
| empty ground (grass outside blocks) | nothing | nothing | zooms there |

Every row in the drawer is also a link: places, vehicles, people, actions, chips with `ref`,
breadcrumbs, KPIs with `ref`.

## 2. Inside buildings

| object | hover | click |
|---|---|---|
| wall screen, counter monitor, logo sign | place | place page |
| key board (wood) | "Keys" | place page |
| key (fob, ring, colour tag) | vehicle · "key on the board · Reserved" | vehicle page |
| orange tag on an empty hook | vehicle · "key out · on the road" | vehicle page |
| cork board note | the note's action | opens the action's target (the hit point on the texture picks the note) |
| cork board between notes | "To-do board" | place page, to-do tab |
| counter | "Counter · staff names" | first staff member |
| paper stack | `inbox.label` · count | `inbox.ref` (default: the place) |
| staff behind the counter, people on waiting chairs, people typing at desks | the person | person page + the figure turns and talks |
| empty desk | "Empty desk · name · no recent access" | that person's page |
| plaque (tower) | the shop | shop page |
| member grid on the tower wall | each square is one cluster member | that person; outside the grid → the cluster |
| vault | vault text | vault page |
| meeting table | "Meeting table · `meetingText`" | – |
| workshop door (shop) | "Workshop · `workshopText`" | – |
| plant | "Plant" | wiggles |
| floor | – | you walk there (ring marker) |
| door mat | "Exit" | back to the city (walking onto it also exits) |

Walls between the camera and the room fade so the room is always readable; rotate with Q/E or
right-drag and the other walls fade.

## 3. Reactions

- **People**: stop, turn toward the camera (or toward you when walking), wave for ~2.4 s, a speech
  bubble shows the next line. Seated or typing people only turn their head. Each click cycles
  `lines`; the drawer quote shows the last one; "Talk" says the next one.
- **Vehicles**: parked ones hop; moving ones brake for a moment; a bubble shows `lines` (moving cars
  fall back to the driver's first line, then the state label).
- **Buildings**: a short vertical squash, hover glow in brand colour, card lifts.
- **Scott**: jumps and barks (`pet.bark`). He follows you everywhere, waits at the pad while you fly.
- **Companions** greet you by themselves when you walk within 3 m.
- At most 4 bubbles at a time; they fade after ~3.6 s.

## 4. Following and riding

- Opening a moving vehicle, a walking person, a companion or Scott makes the camera follow it
  (drawer offset respected). "Follow / Stop following" toggles it; dragging the map stops it.
- "Ride along" on a moving vehicle switches to a chase camera behind it; drag to look around, Esc
  to come back.
- A selection ring pulses under the selected vehicle or person.

## 5. Keyboard and touch

| key | map | inside | walk | helicopter | tour |
|---|---|---|---|---|---|
| W A S D / arrows | pan | walk | move / turn | forward, back, turn | – |
| Q / E | rotate 90° | – | E: enter / open the place you stand in | – | – |
| + / − | zoom | zoom | – | – | – |
| Shift | – | – | run | down | – |
| Space / C | – | – | – | up / down | Space: next step |
| F | – | – | board the helicopter | land | – |
| ← / → | – | – | – | – | previous / next step |
| Esc | stop tour/replay → close drawer → leave building → back to map, in that order |

Mouse: left-drag pans, right-drag rotates, wheel zooms to the cursor. Touch: one finger pans, two
fingers zoom and rotate; walk and helicopter show an on-screen pad on touch or narrow screens.

## 6. Authoring rules

1. **No dead objects.** Every entity you add gets a `tip`, at least one line in `lines` and a
   `page` with something the reader can act on. If you can't write a true line for it, it doesn't
   belong in the city.
2. **Lines carry data, in the voice of the thing.** "Got the Ka until 18/12", "4 cars out today",
   "3 of 9 payments made" — not "Hello!". Two or three lines per entity, the most useful first.
3. **Pages answer "so what?"** Status, the numbers that explain it, the next step (a button with
   `ref` or `do`). Keep the hero subtitle to one line.
4. **Actions point somewhere.** Every action has a `target` or `place`; group repeats ("5 cars").
5. **Privacy.** Never put personal data in lines, tips or pages of a shareable city: no names of
   private people (drivers, customers, employees), no document numbers, plates, phones, e-mails,
   addresses. Mark company names that may be hidden on video with `private: true`. Use roles
   ("Driver", "Owner") and models/colours instead.
6. **Decor stays decor.** Trees, benches and the fountain only react; they never carry data. Data
   lives in buildings, vehicles, people, bays, screens, keys and notes.
