# City of Living Data — engine source

The skill ships one built file, `skills/city-of-living-data/assets/engine/city-of-living-data.js`.
It is made from the parts in `engine/parts/` (one closure, concatenated in file order):

| part | what |
|---|---|
| 00-head | strings (pt-BR, en), palettes, helpers, `normalize()` (world defaults) |
| 10-setup | DOM shell, renderer, cameras, lights, geometry helpers, canvas textures |
| 20-world | entities, auto layout, slab, roads, trees, traffic lights |
| 30-places | shop · cluster · tower · office · park builders, bays, groves |
| 40-vehicles | instanced fleet, pins, traffic (lanes, junction locks, lights), journeys' courier |
| 50-people | articulated instanced crowd, steering, placement, companions, you, Scott |
| 60-heli-cards-camera | helicopter, place cards, status halos, camera moves |
| 70-ui | KPIs, dock, drawer pages and blocks |
| 80-interact | open/react/speech, picking, hover/click, walk, helicopter, ride along |
| 90-rooms | interiors: screens, key board, cork board, counter, desks, vault… |
| 95-tour-data-loop | tour, journeys, replay, live data, render loop, public API |

```bash
python3 dev/city-of-living-data/build.py      # rebuild the engine + example worlds into the skill
```
Keep three.js as the only dependency, keep the world format backwards compatible, and run the
QA in `skills/city-of-living-data/references/qa-checklist.md` before tagging a release.
