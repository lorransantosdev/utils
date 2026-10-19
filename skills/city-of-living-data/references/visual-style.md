# Visual style

The look is fixed; that's what makes these cities recognisable. Colours, content and data change;
the geometry, camera and motion don't.

## Contents
1. Camera and scene · 2. Models · 3. People · 4. Traffic · 5. Interiors · 6. HUD · 7. Colour
8. Performance budget · 9. Adding a new place kind

## 1. Camera and scene
- **Orthographic isometric diorama.** Fixed polar angle (0.96 rad), starts at 45°, rotates in 90°
  steps (Q/E) or freely with right-drag, zooms to the cursor. Pan is clamped to the slab.
- The city sits on a **floating slab** with rounded stone sides and a soft grass top, a ring of
  trees around the edge and a light radial background — a toy on a table.
- Walk, helicopter and ride-along switch to a perspective camera (55° FOV) behind the subject.
- Soft directional sun with PCF shadows, hemisphere fill, a room environment map for gentle
  reflections on glass and car paint. Neutral tone mapping.

## 2. Models
- Everything is **rounded boxes, cylinders and low-poly spheres**, matte, no textures except
  canvas-drawn signs and screens.
- Static geometry of each place is merged into one **vertex-coloured batch** (+ one glass batch);
  dark glass bands mark windows. Brand-coloured bands sit at each floor line; light roof caps.
- Signs are planes with canvas text (Sora/DM Sans, auto-fitted). The tower carries the logo.
- Vehicles: one instanced body (paint colour per instance), cabin glass, wheels/lights detail,
  soft blob shadow. Drivers (head + torso) appear only while moving.
- Data-bound geometry only: bays = capacity, floors = a metric, gold bars = a count, dashed next
  floor = what it takes to grow, empty bay dashed in brand = vehicle out.

## 3. People
- Instanced, **articulated** figures: two legs with shoes, torso, two arms and hands, head with
  eyes and nose, hair cap plus optional long hair or bun. One crowd = 9 draw calls.
- Limbs are composed per frame from pivots (hip, shoulder, neck). Poses: stand, phone, sit, type,
  wave, point. Idle people look around.
- **Walking physics**: seek with gentle arrival, personal-space separation, acceleration limit,
  collision with buildings; the gait phase advances with the distance actually moved (no sliding).
- Status by shirt colour (role), never by icons over heads.

## 4. Traffic
- Right-hand lanes on every directed street segment, stop lines, Bézier turns at junctions.
- Traffic lights alternate x/z streets on a 12 s cycle; one car inside a junction at a time
  (junction lock); cars keep a 6.6 m gap. No deadlocks by construction (check with `city.sim(120)`).
- Bodies **roll** in turns (yaw rate × speed) and **pitch** when braking/accelerating.

## 5. Interiors
- A separate scene per room, built lazily on first entry. **Cut-away**: walls whose outside faces
  the camera disappear, leaving a low stub, so the room reads like a dollhouse.
- Rooms reuse the city's language: same people, same brand band at the skirting, same signs.
  Content comes from data (screen, keys, notes, desks, chairs, vault).
- A short white veil hides the switch between the city and a room.

## 6. HUD
- Frosted glass panels (blur 14px), 16px radius, DM Sans for text, Sora for numbers and titles.
- Top: brand box · KPI strip (centre) · hide-names and snapshot/live chip (right).
- Bottom: the dock (modes · overview · present · replay · video). Right: camera stack.
- **Drawer** opens from the right (bottom sheet on narrow screens) and closes to the right; the
  camera aims at the free part of the screen. Breadcrumbs on top, one page at a time.
- Floating cards over each place (name, one data line, red badge); they fade when you zoom in.
- Speech bubbles, name tags, tooltips are HTML, never 3D text.
- Narrow layouts use container queries, so the 9:16 video frame looks like a phone.

## 7. Colour
- Brand colour (meta.brand.color) only on bands, signs, rug, dock highlights and accents.
- **Status colours never change**: red `#E5484D` urgent/down · amber `#F59E0B` attention/warn ·
  green `#10B981` fine/free · blue `#3B82F6` scheduled/reserved · grey = no data.
- Palettes change ground, roads, walls and glass (palettes.md). Night makes windows glow.

## 8. Performance budget
- A 6-place city with ~30 vehicles and ~60 people renders in **~50–70 draw calls**. Keep merged
  batches per place, instancing for vehicles, people, trees, pins and bays.
- Max 12 places, 22 bays per shop, 24 desks per office, 40 per cluster, 64 gold bars.
- Canvas textures are created once; rooms are disposed and rebuilt when their data changes.

## Non-negotiables
- **Scott, the dog, is in every city**, always named Scott (a tribute to the author's dog).
- Original cities only: no other company's logo, mascot or product UI.
- Motion is calm and purposeful; respect `prefers-reduced-motion`.

## 9. Adding a new place kind
1. Write `buildX(p)` next to the other builders (engine part `30-places.js`): use a `Batch` for
   opaque parts, one for glass, `placeMat(p)` for the hover glow, `addPickMeshes(p, …)` so every
   mesh answers clicks, push `colliders` for anything people must walk around.
2. Set `p.anchor` (card position), `p.door`, `p.gate` (nearest street), `p.roof` (smoke height),
   `p.hang` (rectangle where its people wander) and optionally `p.idleSpot(k, n)`.
3. Bind size to data (count → bays, metric → floors), never to taste.
4. Add it to `buildPlaces()`, to `ENTERABLE` if it has a room, and write a room builder in
   `90-rooms.js` that reuses `roomShell`, `screenOnBackWall`, `keyBoard`, `corkBoard`, `desks`.
5. Every new object gets a `userData.pick` (see interaction.md). Rebuild with `build.py` and probe
   it with `city.pick`.
