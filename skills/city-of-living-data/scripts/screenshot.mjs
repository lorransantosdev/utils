#!/usr/bin/env node
// Visual QA for a city: drives the page through a list of steps and saves a PNG after each.
//
//   node scripts/screenshot.mjs --page city.html --out shots
//   node scripts/screenshot.mjs --page city.html --out shots --size 390x844 --steps map,home,place:north,enter:north
//   node scripts/screenshot.mjs --page city.html --out shots --probe            # what answers a click, per kind
//   node scripts/screenshot.mjs --url http://localhost:8080 --out shots --mock "/api/city=./sample.json"
//
// Steps: map · home · actions · place:ID · vehicle:ID · person:ID · enter:ID · exit · walk · heli ·
//        tour · next · replay · video · names (toggle hide-names) · zoom:F · close · wait:MS
// Needs Playwright (`npm i -D playwright` in some folder, pass it with --playwright <dir>) and a Chromium.
// Offline: --three ./node_modules/three serves three.js locally instead of the CDN.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => { if (x.startsWith('--')) a.push([x.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]); return a; }, []));
if (!args.page && !args.url) { console.log(fs.readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 14).join('\n').replace(/^\/\/ ?/gm, '')); process.exit(1); }
const req = createRequire(path.resolve(args.playwright ?? '.', 'package.json'));
let pw; try { pw = req('playwright'); } catch { try { pw = req('playwright-core'); } catch { console.error('Playwright not found: npm i -D playwright (or pass --playwright <dir with node_modules>)'); process.exit(1); } }
const [W, H] = String(args.size ?? '1440x900').split('x').map(Number);
const out = args.out ?? 'shots'; fs.mkdirSync(out, { recursive: true });
const steps = String(args.steps ?? 'map,home,tour').split(',');
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] };
if (args.chromium) launch.executablePath = args.chromium; // otherwise Playwright's own Chromium
const browser = await pw.chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.emulateMedia({ reducedMotion: 'reduce' }); // instant camera moves = deterministic shots
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
if (args.three) await page.route(/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.*)$/, (r) => r.fulfill({ path: path.join(path.resolve(args.three), r.request().url().replace(/^.*\/npm\/three@[^/]+\//, '')), contentType: 'text/javascript' }));
for (const m of [].concat(args.mock ?? [])) { const [u, f] = String(m).split('='); await page.route((url) => url.pathname === u || url.href.includes(u), (r) => r.fulfill({ path: path.resolve(f), contentType: 'application/json' })); }
for (const m of [].concat(args.fail ?? [])) await page.route((url) => url.href.includes(String(m)), (r) => r.fulfill({ status: 503, body: 'down' }));
await page.goto(args.url ?? 'file://' + path.resolve(args.page));
await page.waitForFunction(() => window.city?.open, null, { timeout: 30000 }); await page.waitForTimeout(+(args.wait ?? 6000));

if (args.probe) { // every visible thing should answer a pick; this lists what answers, by kind
  const res = await page.evaluate(([w, h]) => { const k = {}; for (let y = 80; y < h - 80; y += 8) for (let x = 16; x < w - 16; x += 8) { const p = city.pick(x, y), key = p ? p.t + (p.k ? ':' + p.k : '') : '(nothing)'; (k[key] ??= { n: 0, ex: p?.tip }).n++; } return k; }, [W, H]);
  for (const [k, v] of Object.entries(res).sort((a, b) => b[1].n - a[1].n)) console.log(k.padEnd(20), String(v.n).padStart(6), ' ', (v.ex ?? '').slice(0, 80));
  for (const id of await page.evaluate(() => city.world.places.filter((p) => p.enterable).map((p) => p.id))) {
    await page.evaluate((x) => city.enter(x), id); await page.waitForTimeout(1500);
    const r2 = await page.evaluate(([w, h]) => { const k = {}; for (let y = 80; y < h - 80; y += 10) for (let x = 16; x < w - 16; x += 10) { const p = city.pick(x, y), key = p ? p.t + (p.k ? ':' + p.k : '') : '(floor)'; k[key] = (k[key] ?? 0) + 1; } return k; }, [W, H]);
    console.log(`inside ${id}:`, Object.entries(r2).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · '));
    await page.evaluate(() => city.exit()); await page.waitForTimeout(1200);
  }
}
for (const st of steps) {
  const [k, a] = st.split(':');
  const run = (fn, x) => page.evaluate(fn, x);
  if (k === 'wait') { await page.waitForTimeout(+a); continue; }
  if (k === 'home') await run(() => city.open({ t: 'home' }));
  if (k === 'actions') await run(() => city.open({ t: 'actions' }));
  if (['place', 'vehicle', 'person'].includes(k)) await run(([t, id]) => city.open({ t, id }), [k, a]);
  if (k === 'enter') await run((id) => { city.close(); city.enter(id); }, a);
  if (k === 'exit') await run(() => city.exit());
  if (k === 'walk' || k === 'heli' || k === 'map') await run((m) => { city.close(); city.setMode(m); }, k);
  if (k === 'tour') await run(() => city.tour());
  if (k === 'next') await run(() => city.next());
  if (k === 'replay') await run(() => city.replay());
  if (k === 'video') await run(() => city.video(true));
  if (k === 'names') await page.click('[data-names]');
  if (k === 'zoom') await run((f) => city.zoomBy(+f), a);
  if (k === 'close') await run(() => city.close());
  await page.waitForTimeout(+(args.settle ?? 4000));
  const file = path.join(out, `${st.replace(/[:/]/g, '-')}-${W}x${H}.png`);
  await page.screenshot({ path: file }); console.log('shot', file);
}
const state = await page.evaluate(() => city.state());
console.log(`errors: ${errors.length ? errors.join(' | ') : 'none'} · draw calls ${state.calls} · horizontal overflow ${await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)}px`);
await browser.close();
process.exit(errors.length ? 1 : 0);
