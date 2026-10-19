# Where it runs — single file, static site, inside an app

The engine is one ES module (`assets/engine/city-of-living-data.js`) plus one stylesheet
(`city-of-living-data.css`). It needs `three` (0.169) and draws everything — city, HUD, drawer —
inside the element you give it. `scripts/scaffold.py` produces each target below.

```js
import { createCity } from './city-of-living-data.js';
const city = createCity(element, world, { seed, reducedMotion, preserveDrawingBuffer });
// … city.open(ref) · city.update(patch) · city.on('open', fn) · city.destroy()
```
Rules for every target:
- **The container must have a size** (`position: fixed; inset: 0`, or a height). The engine fills it
  and adapts its HUD to the container width (narrow layout under 760 px, via container queries).
- Import the CSS once. Fonts: DM Sans + Sora from Google Fonts (optional; system fallbacks work).
- Call `destroy()` when the element goes away (removes listeners, timers, WebGL context, rooms).
- Browser only: never render it on the server (SSR). Lazy-load it on the client.

## 1. Single HTML file
`scaffold.py --target single --world world.json --out city.html`
The world JSON, the CSS and the engine are inlined; `three` comes from jsDelivr through an import
map. Double-click to open, e-mail it, host it anywhere. Best for snapshots and videos.

## 2. Static site
`scaffold.py --target vanilla --world world.json --out ./city`
Writes `index.html` (from `assets/template/index.html`), `city-of-living-data.js`,
`city-of-living-data.css` and `world.json`. Serve the folder with any static server
(`npx serve city`, `python3 -m http.server`) — `fetch('./world.json')` doesn't work from `file://`.
Replace `world.json` to update the city; add `data.sources` for live data.

## 3. Installing `three` in an app
```bash
npm i three@0.169.0
```
Copy `city-of-living-data.js` and `.css` into the app (e.g. `src/city/`); the engine's imports
(`three`, `three/addons/...`) resolve from `node_modules` with any bundler (Vite, webpack, Next,
Angular CLI). Without a bundler, use the import map from the single-file template instead.

## 4. React / Next.js — `assets/integrations/react/CityView.tsx`
Props: `world` (the world object), optional `options`, optional `onReady(api)`; `className`/`style`
for the size. It creates the city in an effect on a `ref` and destroys it on unmount.
```tsx
import CityView from './city/CityView';
<CityView world={world} onReady={(city) => (window.city = city)} style={{ position: 'fixed', inset: 0 }} />
```
Next.js (App Router): the component file starts with `'use client'`; load it without SSR:
```tsx
const CityView = dynamic(() => import('./city/CityView'), { ssr: false });
```
To push live data from your state, keep the API from `onReady` and call `city.update(patch)` in an
effect. Changing the `world` prop re-creates the city (use it for structural changes only).

## 5. Vue 3 / Nuxt — `assets/integrations/vue/CityView.vue`
Props: `world`, `options`; emits `ready` with the API. Created in `onMounted`, destroyed in
`onBeforeUnmount`.
```vue
<CityView :world="world" @ready="(city) => (cityApi = city)" style="position: fixed; inset: 0" />
```
Nuxt: wrap it in `<ClientOnly>`.

## 6. Angular — `assets/integrations/angular/city-view.component.ts`
Standalone component `<app-city-view [world]="world" [options]="opts" (ready)="city = $event">`. A new `world` or `options` input rebuilds the city.
It creates the city in `ngAfterViewInit` inside `NgZone.runOutsideAngular` (the render loop must
not trigger change detection) and destroys it in `ngOnDestroy`. Add the CSS to `styles` in
`angular.json` (or import it in the global stylesheet). Give the host element a size with CSS.

## 7. Svelte / SvelteKit
```svelte
<script>
  import { onMount } from 'svelte';
  import '../city/city-of-living-data.css';
  export let world; let el, city;
  onMount(() => {
    let alive = true;
    import('../city/city-of-living-data.js').then(({ createCity }) => { if (alive) city = createCity(el, world); });
    return () => { alive = false; city?.destroy(); };   // onMount must return the cleanup synchronously
  });
</script>
<div bind:this={el} style="position: fixed; inset: 0"></div>
```
SvelteKit: the dynamic import inside `onMount` keeps it off the server.

## 8. Wall screens and kiosks
- `meta.autoplay: "tour"` starts the presentation 2.5 s after load; arrow keys / space advance it.
- For a still ops wall, don't autoplay; keep live sources on and reload the page on a schedule if
  the structure changes (new places).
- Video recordings: `city.video(true)` (or the dock's phone icon) frames the city 9:16 with the
  phone layout; record at 1080 × 1920.

## 9. Several cities on one page
Each `createCity` call is independent (its own renderer, HUD and state). Keyboard shortcuts only
act on cities that are visible. Remember: one WebGL context per city — keep it to two or three.
