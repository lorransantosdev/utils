#!/usr/bin/env node
// sync.mjs — the "no backend" loop: pull the latest numbers (read-only) → write data.json → the city polls it.
//
//   node sync.mjs                 one sync, then exit
//   node sync.mjs --every 5m      keep syncing every 5 minutes
//   node sync.mjs --serve 3000    also serve this folder on http://127.0.0.1:3000 (the page needs a server to read data.json)
//   node sync.mjs --demo          no keys: generates demo numbers, so you can see the loop working first
//
// Keys live in .env (never in this file, never in the page, never printed). Copy .env.example → .env and fill it in.
// Totals and counts only: never write names, e-mails, addresses, card data or ids of real people into data.json.
// On failure the last good data.json stays as it was and the error goes to sync.log; the city shows "Data is late".
import { readFileSync, writeFileSync, appendFileSync, existsSync, createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const DIR = new URL('.', import.meta.url).pathname;
const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] ?? true : null; };
const DEMO = args.includes('--demo'), OUT = join(DIR, 'data.json'), LOG = join(DIR, 'sync.log');

// ---------------------------------------------------------------- .env (no dependency on dotenv)
const ENV = { ...process.env };
if (existsSync(join(DIR, '.env'))) for (const line of readFileSync(join(DIR, '.env'), 'utf8').split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !m[1].startsWith('#')) ENV[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
const need = (k) => { if (!ENV[k]) throw new Error(`${k} is empty in .env`); return ENV[k]; };
const log = (msg) => { const line = `${new Date().toISOString()} ${msg}`; console.log(line); try { appendFileSync(LOG, line + '\n'); } catch {} };
const redact = (s) => String(s).replace(/(sk_|rk_|shpat_|EAAA|Bearer )[A-Za-z0-9_-]+/g, '$1…');

// ---------------------------------------------------------------- fetchers (read-only, totals only)
// Each returns plain numbers. Add or remove the ones you use. Periods: today / week / month.
const since = (days) => Math.floor((Date.now() - days * 864e5) / 1000);
const F = {
  // Stripe — restricted key with READ on Charges and Customers (Dashboard → Developers → API keys → Create restricted key)
  async stripe() {
    const key = need('STRIPE_KEY'), get = async (path) => { const r = await fetch(`https://api.stripe.com/v1/${path}`, { headers: { Authorization: `Bearer ${key}` } }); if (!r.ok) throw new Error(`stripe ${r.status}`); return r.json(); };
    const month = await get(`charges?limit=100&created[gte]=${since(30)}`), today = month.data.filter((c) => c.created >= since(1));
    const sum = (l) => l.filter((c) => c.paid && !c.refunded).reduce((a, c) => a + c.amount, 0) / 100;
    const customers = await get('customers?limit=1');
    return { revenue_month: sum(month.data), revenue_today: sum(today), payments_today: today.length, customers_total: customers.total_count ?? null };
  },
  // Shopify — custom app with read_orders, read_products, read_inventory
  async shopify() {
    const store = need('SHOPIFY_STORE'), tok = need('SHOPIFY_TOKEN'), get = async (path) => { const r = await fetch(`https://${store}/admin/api/2024-10/${path}`, { headers: { 'X-Shopify-Access-Token': tok } }); if (!r.ok) throw new Error(`shopify ${r.status}`); return r.json(); };
    const o = await get(`orders.json?status=any&created_at_min=${new Date(Date.now() - 30 * 864e5).toISOString()}&limit=250&fields=id,created_at,total_price,fulfillment_status`);
    const today = o.orders.filter((x) => Date.now() - +new Date(x.created_at) < 864e5);
    const p = await get('products/count.json');
    return { orders_month: o.orders.length, orders_today: today.length, revenue_month: o.orders.reduce((a, x) => a + +x.total_price, 0), unfulfilled: o.orders.filter((x) => x.fulfillment_status !== 'fulfilled').length, products: p.count };
  },
  // Square — production access token, read-only scopes
  async square() {
    const tok = need('SQUARE_TOKEN'), r = await fetch('https://connect.squareup.com/v2/payments?begin_time=' + new Date(Date.now() - 30 * 864e5).toISOString() + '&limit=100', { headers: { Authorization: `Bearer ${tok}`, 'Square-Version': '2024-10-17' } });
    if (!r.ok) throw new Error(`square ${r.status}`); const j = await r.json(), pay = j.payments ?? [];
    const today = pay.filter((x) => Date.now() - +new Date(x.created_at) < 864e5), sum = (l) => l.reduce((a, x) => a + (x.amount_money?.amount ?? 0), 0) / 100;
    return { sales_month: sum(pay), sales_today: sum(today), payments_today: today.length };
  },
  // Google Sheets — File → Share → Publish to web → CSV. First row = headers. Returns the rows.
  async sheet() {
    const r = await fetch(need('SHEET_CSV_URL')); if (!r.ok) throw new Error(`sheet ${r.status}`);
    return csv(await r.text());
  },
};
function csv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean), split = (l) => { const out = []; let c = '', q = false; for (const ch of l) { if (q) { if (ch === '"') q = false; else c += ch; } else if (ch === '"') q = true; else if (ch === ',') { out.push(c); c = ''; } else c += ch; } out.push(c); return out; };
  const head = split(lines.shift()).map((h) => h.trim());
  return lines.map((l) => Object.fromEntries(split(l).map((v, i) => [head[i], v !== '' && !isNaN(v) ? +v : v.trim()])));
}

// ---------------------------------------------------------------- numbers → world patch
// This is the only part that is yours: turn the raw numbers into what the city shows. Keep every number
// traceable to a source, and give each KPI a comparison. The shape is a world patch (data-sources.md §3).
function toPatch(raw, prev) {
  const kpis = [
    { label: 'Revenue this month', value: raw.stripe?.revenue_month ?? raw.shopify?.revenue_month ?? 0, format: 'currency', sub: `today ${fmt(raw.stripe?.revenue_today ?? 0)}` },
    { label: 'Orders today', value: raw.shopify?.orders_today ?? raw.stripe?.payments_today ?? 0, format: 'int', sub: `${raw.shopify?.orders_month ?? 0} this month` },
    { label: 'To ship', value: raw.shopify?.unfulfilled ?? 0, format: 'int', tone: (raw.shopify?.unfulfilled ?? 0) > 20 ? 'red' : undefined, ref: { t: 'place', id: 'warehouse' } },
  ];
  // rows from the sheet become vehicles / people / places by id (example: one row per van)
  const vehicles = (raw.sheet ?? []).filter((r) => r.van).map((r) => ({ id: String(r.van), place: 'warehouse', name: `Van ${r.van}`, state: r.status === 'out' ? 'road' : 'parked', stateText: r.status === 'out' ? `${r.parcels} parcels on board` : 'at the dock' }));
  const actions = [];
  if ((raw.shopify?.unfulfilled ?? 0) > 20) actions.push({ sev: 'amber', title: `${raw.shopify.unfulfilled} orders to ship`, text: 'Older than 24 h first.', place: 'warehouse' });
  return { kpis, vehicles, actions, asOf: new Date().toISOString() };
}
const fmt = (v) => new Intl.NumberFormat('en', { style: 'currency', currency: ENV.CURRENCY || 'USD', maximumFractionDigits: 0 }).format(v);

// ---------------------------------------------------------------- demo numbers (no keys needed)
function demo(prev) {
  const n = (prev?.kpis?.[1]?.value ?? 40) + Math.floor(Math.random() * 3);
  return { stripe: { revenue_month: 18420 + n * 37, revenue_today: 640 + n * 9, payments_today: n, customers_total: 1284 }, shopify: { orders_month: 912 + n, orders_today: n, revenue_month: 18420 + n * 37, unfulfilled: 12 + (n % 15), products: 48 },
    sheet: [{ van: 1, status: 'out', parcels: 23 }, { van: 2, status: 'out', parcels: 17 }, { van: 3, status: n % 2 ? 'out' : 'in', parcels: 9 }, { van: 4, status: 'in', parcels: 0 }] };
}

// ---------------------------------------------------------------- one sync
async function sync() {
  const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null;
  try {
    const raw = {};
    if (DEMO) Object.assign(raw, demo(prev));
    else for (const [k, fn] of Object.entries(F)) { const envKeys = { stripe: 'STRIPE_KEY', shopify: 'SHOPIFY_TOKEN', square: 'SQUARE_TOKEN', sheet: 'SHEET_CSV_URL' }; if (ENV[envKeys[k]]) raw[k] = await fn(); }
    if (!Object.keys(raw).length) throw new Error('no source configured — fill .env or run with --demo');
    const patch = toPatch(raw, prev);
    writeFileSync(OUT, JSON.stringify(patch, null, 1));
    log(`ok sources=${Object.keys(raw).join(',')} kpis=${patch.kpis?.length ?? 0} vehicles=${patch.vehicles?.length ?? 0} actions=${patch.actions?.length ?? 0}`);
    return patch;
  } catch (e) { log(`fail ${redact(e.message)} — keeping the last good data.json${prev?.asOf ? ` (${prev.asOf})` : ''}`); }
}

// ---------------------------------------------------------------- tiny static server (GET only, this folder only)
function serve(port) {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
  createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, ''), file = join(DIR, path === '/' ? 'city.html' : path);
    if (!file.startsWith(DIR) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    req.method === 'HEAD' ? res.end() : createReadStream(file).pipe(res);
  }).listen(port, '127.0.0.1', () => log(`serving http://127.0.0.1:${port}/`));
}

const every = flag('--every'), port = flag('--serve');
await sync();
if (port) serve(+port);
if (every) { const ms = /^(\d+)\s*(s|m|h)?$/.exec(every); if (!ms) throw new Error('--every 5m / 90s / 1h'); const n = +ms[1] * ({ s: 1e3, m: 6e4, h: 36e5 }[ms[2] ?? 'm']); log(`syncing every ${every}`); setInterval(sync, n); }
else if (!port) process.exit(0);
