
  // ============================================================================ presentation tour
  // ▶ Present: a guided camera walk for demos and videos. Steps come from world.tour, or are built
  // from the data: overview → the most urgent things → each place → inside the first place → HQ → the square.
  function autoTour() {
    const st = [{ ref: { t: 'home' }, title: W.meta.title, text: W.home.subtitle ?? W.meta.subtitle ?? '', dur: 5 }];
    for (const a of sortActs(ACTS).filter((x) => x.sev === 'red' && actRef(x) && actRef(x).t !== 'place').slice(0, 2)) st.push({ ref: actRef(a), title: a.title, text: a.text, dur: 5.5 });
    const shops = PLACES.filter((p) => p.kind === 'shop' || p.kind === 'office').slice(0, 4);
    for (const p of shops) st.push({ ref: { t: 'place', id: p.id }, title: p.shown, text: autoCard(p), dur: 4.5 });
    const first = shops.find((p) => p.enterable); if (first) st.push({ ref: { t: 'place', id: first.id }, enter: true, title: first.shown, text: first.enterHint ?? T.enterHint, dur: 7 });
    const tower = PLACES.find((p) => p.kind === 'tower' && p.enterable); if (tower) st.push({ ref: { t: 'place', id: tower.id }, enter: true, title: tower.shown, text: tower.sub ?? '', dur: 7 });
    const cl = PLACES.find((p) => p.kind === 'cluster'); if (cl) st.push({ ref: { t: 'place', id: cl.id }, title: cl.shown, text: autoCard(cl), dur: 4.5 });
    if (COMPANIONS.length) st.push({ ref: { t: 'companion', i: 0 }, title: park.shown, text: W.companions.map((c) => c.name).join(' · '), dur: 5 });
    st.push({ ref: { t: 'home' }, title: W.meta.title, text: W.tour?.outro ?? '', dur: 4 });
    return st;
  }
  function startTour(stepsIn, label) {
    stopReplay(); stopTour(true); if (mode !== 'map') setMode('map'); if (view) { view = null; app.classList.remove('open'); }
    const steps = (Array.isArray(stepsIn) ? stepsIn : W.tour?.steps ?? autoTour()).map((s) => ({ dur: s.move ? 7 : 5, ...s }));
    tour = { steps, i: -1, t: 0, label: (typeof label === 'string' && label) || W.tour?.label || T.tour }; app.classList.add('touring'); nextStep(); emit('tour', true);
  }
  function nextStep() {
    if (!tour) return;
    if (inside) exitBuilding();
    tour.i++; tour.t = 0;
    if (tour.i >= tour.steps.length) return stopTour();
    const s = tour.steps[tour.i], cap = $('caption');
    if (tour.failed) { tour.failed.status = tour.failed._was; tour.failed = null; refreshCards(); }
    if (s.place && !s.ref) s.ref = { t: 'place', id: String(s.place) };
    if (s.move && !s.ref) s.ref = { t: 'place', id: String(s.move.to) };
    cap.hidden = false; cap.classList.toggle('fail', !!s.fail);
    cap.innerHTML = `<small>${esc(tour.label)} · ${tour.i + 1} / ${tour.steps.length}</small><b>${esc(s.title ?? nameOfRef(s.ref ?? {}) ?? '')}</b>${s.text ? `<span>${esc(s.text)}</span>` : ''}${s.payload ? `<pre>${esc(typeof s.payload === 'string' ? s.payload : JSON.stringify(s.payload, null, 1))}</pre>` : ''}<i style="animation-duration:${s.dur}s"></i>`;
    cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in');
    if (s.fail && s.ref?.t === 'place') { const p = placeById.get(s.ref.id); if (p) { p._was = p.status; p.status = 'down'; tour.failed = p; refreshCards(); } }
    renderDock();
    const go = () => {
      if (s.move) { const f = courierGo(String(s.move.from), String(s.move.to), s.fail ? '#E5484D' : s.move.color); if (f) { flyTo(f.pos.clone(), fitZoom() * 3.4, 1); follow = { ref: { t: 'courier' }, pos: () => f.pos }; if (s.move.say) later(() => tour && say(() => f.pos.clone().setY(3.2), s.move.say, 3), 800); } return; }
      courierStop();
      if (s.enter) { later(() => tour && enterBuilding(s.ref.id), 900); flyTo(new THREE.Vector3(placeById.get(s.ref.id).cx, 0, placeById.get(s.ref.id).cz), fitZoom() * 2.6, .9); return; }
      if (s.ref.t === 'home') { follow = null; viewAll(1.4); return; }
      const p = posOfRef(s.ref); if (!p) return;
      flyTo(p.clone(), fitZoom() * (s.ref.t === 'place' ? 2.6 : 4.4), 1.2);
      if (isMover(s.ref)) follow = { ref: s.ref, pos: () => posOfRef(s.ref) };
      later(() => tour && reactTo(s.ref), 900);
    };
    later(go, inside ? 400 : 0);
  }
  function stopTour(quiet) { if (!tour) return; if (tour.failed) { tour.failed.status = tour.failed._was; refreshCards(); } tour = null; follow = null; courierStop(); $('caption').hidden = true; app.classList.remove('touring'); if (inside) exitBuilding(); renderDock(); if (!quiet) viewAll(); emit('tour', false); }
  function stepTour(dt) {
    if (!tour) return; tour.t += dt; const s = tour.steps[tour.i];
    if (inside && s?.enter && tour.t > 3 && !inside.walked) { inside.walked = true; inside.me.target = new THREE.Vector3(-inside.W / 2 + 3, 0, -1.5); }
    if (s && tour.t >= s.dur) { if (inside) inside.walked = false; nextStep(); }
  }

  // ============================================================================ replay: a period of events in a minute
  let clockOff = 0, splash = 0, simT = 0;
  function startReplay() {
    const tl = W.timeline; if (!tl?.events?.length) return;
    stopTour(); if (inside) exitBuilding(); if (mode !== 'map') setMode('map'); if (view) { view = null; app.classList.remove('open'); }
    const evs = tl.events.map((e) => ({ ...e, ts: +new Date(e.at) })).sort((a, b) => a.ts - b.ts);
    const t0 = +new Date(tl.from ?? evs[0].at), t1 = +new Date(tl.to ?? evs.at(-1).at);
    const saveSt = new Map(VEH.map((v) => [v.id, v.state]));
    for (const e of evs) if (e.vehicle && e.from && !e._seen) { const v = vehById.get(String(e.vehicle)); if (v && !evs.some((x) => x !== e && x.vehicle === e.vehicle && x.ts < e.ts)) { v.state = e.from; syncVehicle(v); } }
    paintBays(); refreshCards();
    replay = { evs, t0, t1, k: 0, i: 0, dur: tl.seconds ?? 60, saveSt, sum: 0 };
    $('clock').hidden = false; app.classList.add('touring'); renderDock(); viewAll(1); emit('replay', true);
  }
  function stopReplay() {
    if (!replay) return; const r = replay; replay = null;
    for (const v of VEH) if (r.saveSt.has(v.id) && v.state !== r.saveSt.get(v.id)) { v.state = r.saveSt.get(v.id); syncVehicle(v); }
    paintBays(); refreshCards(); $('clock').hidden = true; app.classList.remove('touring'); renderDock(); emit('replay', false);
  }
  function feed(text, tone = 'brand') {
    const box = $('feed'), el = document.createElement('div'); el.className = 'c-toast ' + tone; el.textContent = text; box.prepend(el);
    while (box.children.length > 4) box.lastChild.remove();
    later(() => el.classList.add('out'), 3800); later(() => el.remove(), 4400);
  }
  function stepReplay(dt) {
    if (!replay) return; const r = replay;
    r.k = Math.min(1, r.k + dt / r.dur); const now = r.t0 + (r.t1 - r.t0) * r.k;
    while (r.i < r.evs.length && r.evs[r.i].ts <= now) {
      const e = r.evs[r.i++], p = e.place && placeById.get(String(e.place));
      if (e.vehicle && e.state) { const v = vehById.get(String(e.vehicle)); if (v) { v.state = e.state; syncVehicle(v); paintBays(); refreshCards(); } }
      if (e.text) feed(e.text, e.tone ?? 'brand');
      if (p && (e.amount != null || e.bubble)) say(() => p.anchor.clone().setY(p.anchor.y - 2), e.bubble ?? `+${fmtNum(e.amount, 'currency')}`, 2.4);
      if (e.amount) r.sum += e.amount;
    }
    const d = new Date(now);
    $('clock').innerHTML = `<b>${esc(T.day(d))}</b><span>${d.toLocaleTimeString(LOC, { hour: '2-digit', minute: '2-digit' })}</span>${r.sum ? `<em>+${esc(fmtNum(r.sum, 'currency'))}</em>` : ''}<i style="width:${r.k * 100}%"></i>`;
    if (r.k >= 1) later(stopReplay, 1500), r.k = 1.0001;
  }

  // ============================================================================ live data: update(patch) + optional sources
  function update(patch = {}) {
    const changed = new Set(), added = [];
    for (const d of patch.places ?? []) { const p = placeById.get(String(d.id)); if (p) Object.assign(p, d, { id: p.id }); }
    for (const d of patch.vehicles ?? []) {
      const id = String(d.id), v = vehById.get(id);
      if (v) { const was = moving(v), col = v.color; Object.assign(v, d, { id }); if (d.place != null) v.place = String(d.place); if (moving(v) !== was) changed.add(v); if (v.color !== col && v._f) { carBody.setColorAt(v._f.i, _c.set(v.color)); carBody.instanceColor.needsUpdate = true; } }
      else { const nv = { state: 'parked', color: '#C3C8CF', ...d, id, place: d.place != null ? String(d.place) : null }; VEH.push(nv); added.push(nv); }
    }
    for (const d of patch.people ?? []) { const q = perById.get(String(d.id)); if (q) Object.assign(q, d, { id: q.id }); else PEO.push({ state: 'idle', ...d, id: String(d.id) }); }
    if (patch.kpis && JSON.stringify(patch.kpis) !== JSON.stringify(W.kpis)) { W.kpis = patch.kpis; renderKpis(); }  // unchanged KPIs don't re-animate on every poll
    if (patch.actions) { ACTS.length = 0; patch.actions.forEach((a, i) => ACTS.push({ sev: 'amber', ...a, id: String(a.id ?? 'a' + i) })); }
    if (patch.asOf) { W.meta.asOf = patch.asOf; renderAsOf(); }
    if ('banner' in patch) { W.meta.banner = patch.banner; renderBanner(); }
    reindex(); applyNames();
    for (const v of added.splice(Math.max(0, CAP_V - FLEET.length))) { console.warn('[city] vehicle capacity reached, reload to show', v.id); }
    for (const v of added) { addFleet(v); const p = placeById.get(v.place); const b = p?.bays?.find((x) => !x.vehicle); if (b) { b.vehicle = v.id; v._f.bay = b; } changed.add(v); }
    for (const v of changed) { if (!moving(v) && !v._f.bay) { const b = placeById.get(v.place)?.bays?.find((x) => !x.vehicle); if (b) { b.vehicle = v.id; v._f.bay = b; } } syncVehicle(v); }
    paintBays(); refreshCards(); refreshSigns(); renderDrawer(); refreshNight();
    for (const r of Object.values(ROOMS)) if (r !== inside) r.dirty = true;
    emit('update', patch);
  }
  const live = { ok: 0, err: null, last: 0 };
  const SRC_TIMERS = [];
  const tpl = (s, row) => String(s).replace(/\{(\w+)\}/g, (_, k) => row[k] ?? '');
  function rowsToPatch(src, rows) {
    if (src.into === 'world' || !src.into) return Array.isArray(rows) ? {} : rows;
    const list = (Array.isArray(rows) ? rows : rows?.rows ?? []).map((row) => {
      const o = { id: row[src.key ?? 'id'] };
      for (const [k, f] of Object.entries(src.map ?? {})) o[k] = typeof f === 'string' && f.includes('{') ? tpl(f, row) : row[f];
      if (src.stateMap && o.state != null) o.state = src.stateMap[o.state] ?? src.stateMap['*'] ?? o.state;
      return o;
    });
    return { [src.into]: list };
  }
  // a CSV (e.g. a Google Sheet published to the web) → rows as objects, first line = headers
  function parseCsv(text) {
    const rows = [], sep = src_sep(text); let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) { const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true; else if (c === sep) { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += c; }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    const head = (rows.shift() ?? []).map((h) => h.trim());
    return rows.filter((r) => r.some((x) => x !== '')).map((r) => Object.fromEntries(head.map((h, i) => { const v = (r[i] ?? '').trim(); return [h, v !== '' && !isNaN(v) && !/^0\d/.test(v) ? +v : v]; })));
  }
  const src_sep = (t) => (t.split('\n')[0].split(';').length > t.split('\n')[0].split(',').length ? ';' : ',');
  async function poll(src) {
    try {
      let rows;
      if (src.type === 'static') rows = src.rows ?? src.patch;
      else if (src.type === 'csv') { const r = await fetch(src.url, { headers: src.headers ?? {}, credentials: src.credentials ?? 'same-origin', cache: 'no-store' }); if (!r.ok) throw new Error(r.status); rows = parseCsv(await r.text()); }
      else if (src.type === 'supabase') { const r = await fetch(`${src.url.replace(/\/$/, '')}/rest/v1/${src.table}?select=${encodeURIComponent(src.select ?? '*')}`, { headers: { apikey: src.anonKey, Authorization: `Bearer ${src.anonKey}` } }); if (!r.ok) throw new Error(r.status); rows = await r.json(); }
      else { const r = await fetch(src.url, { headers: src.headers ?? {}, credentials: src.credentials ?? 'same-origin', cache: 'no-store' }); if (!r.ok) throw new Error(r.status); rows = await r.json(); }
      update(rowsToPatch(src, rows)); live.ok++; live.last = performance.now(); live.err = null;
    } catch (e) { live.err = String(e.message ?? e); }
    renderAsOf();
  }
  function startSources() {
    for (const src of W.data?.sources ?? []) {
      if (src.type === 'sse') { const es = new EventSource(src.url); es.onmessage = (m) => { try { update(rowsToPatch(src, JSON.parse(m.data))); live.ok++; live.last = performance.now(); renderAsOf(); } catch {} }; es.onerror = () => { live.err = 'sse'; renderAsOf(); }; SRC_TIMERS.push({ close: () => es.close() }); continue; }
      if (src.type === 'ws') { const ws = new WebSocket(src.url); ws.onmessage = (m) => { try { update(rowsToPatch(src, JSON.parse(m.data))); live.ok++; live.last = performance.now(); renderAsOf(); } catch {} }; ws.onerror = () => { live.err = 'ws'; renderAsOf(); }; SRC_TIMERS.push({ close: () => ws.close() }); continue; }
      poll(src); if (src.type !== 'static') { const id = setInterval(() => poll(src), src.intervalMs ?? 15000); SRC_TIMERS.push({ close: () => clearInterval(id) }); }
    }
    if (W.data?.sources?.length) { const id = setInterval(renderAsOf, 30000); SRC_TIMERS.push({ close: () => clearInterval(id) }); }  // "x min ago" keeps counting
  }
  // a slim line under the header: a daily summary, a notice, whatever the data wants to say today
  function renderBanner() {
    const el = $('banner'), b = W.meta.banner, o = typeof b === 'string' ? { text: b } : b;
    el.hidden = !o?.text; if (!o?.text) return;
    el.className = `c-banner c-glass ${['green', 'amber', 'red', 'blue'].includes(o.tone) ? o.tone : ''}`;
    el.innerHTML = `${o.label ? `<b>${esc(o.label)}</b>` : ''}<span>${esc(o.text)}</span>${o.at ? `<small>${esc(T.ago((Date.now() - +new Date(o.at)) / 60000))}</small>` : ''}`;
  }
  function renderAsOf() {
    const el = $('live'), txt = $('asof'), srcs = W.data?.sources?.filter((s) => s.type !== 'static') ?? [];
    if (srcs.length) {
      // late when a request failed, when nothing arrived for 3 polls, or when the data's own asOf is older than staleAfterMs (30 min)
      const maxGap = Math.max(...srcs.map((s) => s.intervalMs ?? 15000)) * 3, ageMin = W.meta.asOf ? (Date.now() - +new Date(W.meta.asOf)) / 60000 : null;
      const stale = live.err || (live.last && performance.now() - live.last > maxGap) || (ageMin != null && ageMin > (W.data.staleAfterMs ?? 1800000) / 60000);
      el.classList.toggle('stale', !!stale); el.classList.toggle('nodata', !live.ok);
      txt.textContent = (!live.ok ? T.noData : stale ? T.stale : T.live) + (live.ok && ageMin != null && !isNaN(ageMin) ? ` · ${T.ago(Math.max(0, ageMin))}` : ''); return;
    }
    const d = W.meta.asOf ? new Date(W.meta.asOf) : null;
    el.hidden = !d; if (d) txt.textContent = `${T.asOf} ${d.toLocaleDateString(LOC)} ${d.toLocaleTimeString(LOC, { hour: '2-digit', minute: '2-digit' })}`;
  }

  // ============================================================================ build everything
  buildBase(); buildLights(); buildStreetLamps(); buildPlaces(); borderTrees();
  VEH.forEach(addFleet); assignBays(); FLEET.forEach((f) => { if (!moving(f.v)) parkAt(f); }); paintBays(); setupTraffic();
  placePeople(); buildCompanions(); crowd = new Crowd(PAWNS, root, 'city'); pickables.push(...crowd.pick);
  buildHeli(); HELI_PLACE = PLACES.find((p) => p.kind === 'tower')?.id ?? park.id; flushTrees(); buildCards(); buildHalos();
  const splashRing = new THREE.Mesh(new THREE.RingGeometry(.9, 1.1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, depthWrite: false })); splashRing.visible = false; root.add(splashRing);
  const walkMarker = new THREE.Mesh(new THREE.RingGeometry(.35, .5, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, depthWrite: false })); walkMarker.userData.t = 0; root.add(walkMarker);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.75, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, depthWrite: false })); ring.visible = false; root.add(ring);

  // ============================================================================ loop
  function resize() {
    const w = vw(), h = vh(); renderer.setSize(w, h); labels.setSize(w, h);
    const a = w / h; Object.assign(ocam, { left: -VIEW * a / 2, right: VIEW * a / 2, top: VIEW / 2, bottom: -VIEW / 2 }); ocam.updateProjectionMatrix();
    pcam.aspect = a; pcam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(sceneEl); resize();
  const clock = new THREE.Clock(); let raf = 0, running = true;
  function loop() {
    if (!running) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime + clockOff; simT = t;
    stepTour(dt); stepReplay(dt); updateBubbles(dt);
    if (flashT > 0) { flashT -= dt; if (flashT <= 0) tip.classList.remove('show'); }
    if (inside) { stepTween(dt); updateInside(dt, t); controls.update(); renderer.render(IN, ocam); labels.render(IN, ocam); return; }
    if (mode === 'map') {
      stepTween(dt);
      if (keys.size) { const off = ocam.position.clone().sub(controls.target), fw = new THREE.Vector3(-off.x, 0, -off.z).normalize(), rt = new THREE.Vector3(-fw.z, 0, fw.x), v = 60 / ocam.zoom * dt, mv = new THREE.Vector3();
        if (on('KeyW', 'ArrowUp')) mv.addScaledVector(fw, v); if (on('KeyS', 'ArrowDown')) mv.addScaledVector(fw, -v); if (on('KeyD', 'ArrowRight')) mv.addScaledVector(rt, v); if (on('KeyA', 'ArrowLeft')) mv.addScaledVector(rt, -v);
        controls.target.add(mv); ocam.position.add(mv); }
      if (follow && !tween) { const p = follow.pos(); if (p) { const b = controls.target.clone(), want = p.clone(), wpp = VIEW / ocam.zoom / vh(); const right = new THREE.Vector3().setFromMatrixColumn(ocam.matrixWorld, 0); right.y = 0; right.normalize(); want.addScaledVector(right, (drawerW() / 2) * wpp); want.y = 0; controls.target.lerp(want, 1 - Math.exp(-dt * 3)); ocam.position.add(controls.target.clone().sub(b)); } }
      const tg = controls.target, cx = clamp(tg.x, -SLAB.x, SLAB.x) - tg.x, cz = clamp(tg.z, -SLAB.z, SLAB.z) - tg.z;
      if (cx || cz) { tg.x += cx; tg.z += cz; ocam.position.x += cx; ocam.position.z += cz; }
      controls.update();
    }
    // traffic lights + vehicles
    const ph = lightPhase(t);
    LAMP.xg.emissiveIntensity = ph === 'x' ? 2.4 : 0; LAMP.xr.emissiveIntensity = ph === 'x' ? 0 : 2.4; LAMP.zg.emissiveIntensity = ph === 'z' ? 2.4 : 0; LAMP.zr.emissiveIntensity = ph === 'z' ? 0 : 2.4;
    for (const f of FLEET) { if (f.r) driveCar(f, dt, t); if (f.hop > 0) f.hop = Math.max(0, f.hop - dt); writeCar(f); }
    flushCars(); writePins(t);
    for (const p of PLACES) {
      if (p.arm) { const c = ((t + PLACES.indexOf(p) * 4) % 12) / 12; let a = c > .1 && c < .3 ? Math.min(1, (c - .1) * 12, (.3 - c) * 12) * 1.35 : 0; if (p._gate > 0) { p._gate -= dt; a = Math.max(a, Math.min(1, (2.4 - p._gate) * 3, p._gate * 3) * 1.35); } p.arm.rotation.z = a; }
      if (p._squash > 0) { p._squash = Math.max(0, p._squash - dt); const s = 1 + Math.sin((1 - p._squash / .5) * Math.PI) * .045; for (const m of p.meshes ?? []) if (m.parent === root) m.scale.y = s; }
    }
    // people
    for (const p of PAWNS) if (!p.me && !p.companion) stepPawn(p, PAWNS, dt, collide);
    if (mode === 'walk') walk(dt); else { ME.speed = 0; if (ME.react > 0) stepPawn(ME, PAWNS, dt, collide); else idleLook(ME, dt); }
    for (const p of COMPANIONS) {
      const near = mode === 'walk' && p.pos.distanceTo(ME.pos) < 3;
      if (near !== p.greet) { p.greet = near; p.tag.el.textContent = near ? (p.companion.greet ?? p.companion.name) : p.companion.name; p.pose = near ? 'wave' : 'stand'; }
      if (near) { p.wait = Math.max(p.wait, .4); p.target = null; p.vel.multiplyScalar(.8); p.yaw = Math.atan2(ME.pos.x - p.pos.x, ME.pos.z - p.pos.z); }
      stepPawn(p, PAWNS, dt, collide);
    }
    crowd.update(t, hoverPawn, selPawn); writeHat(HAT, ME);
    for (const p of [...COMPANIONS, ME]) p.tag.o.position.set(p.pos.x, p.y + 2.05 * p.scale, p.pos.z);
    if (walkMarker.userData.t > 0) { walkMarker.userData.t = Math.max(0, walkMarker.userData.t - dt); walkMarker.material.opacity = walkMarker.userData.t; walkMarker.scale.setScalar(1 + (1 - walkMarker.userData.t)); } walkMarker.visible = walkMarker.userData.t > 0 && mode === 'walk';
    // walking / riding: trees between the camera and you step aside so you never lose yourself
    { const near = mode === 'walk' || mode === 'ride', a = pcam.position, bpt = mode === 'ride' ? vehById.get(rideRef)?._f?.pos : ME.pos; let dirty = false;
      TREES.forEach((tr, i) => {
        let hid = false;
        if (near && bpt) { const abx = bpt.x - a.x, abz = bpt.z - a.z, L2 = abx * abx + abz * abz || 1, u = ((tr.x - a.x) * abx + (tr.z - a.z) * abz) / L2; if (u > -.05 && u < 1.02) { const px = a.x + abx * u - tr.x, pz = a.z + abz * u - tr.z; hid = px * px + pz * pz < (2.4 * tr.s) ** 2; } }
        if (hid !== !!tr.hid) { tr.hid = hid; writeTree(i, t); dirty = true; }
      });
      if (dirty) trunkIM.instanceMatrix.needsUpdate = crownIM.instanceMatrix.needsUpdate = true; }
    // trees wiggle, the fountain splashes, statuses pulse
    TREES.forEach((tr, i) => { if (tr.w > 0) { tr.w = Math.max(0, tr.w - dt * 1.3); writeTree(i, t); trunkIM.instanceMatrix.needsUpdate = crownIM.instanceMatrix.needsUpdate = true; } });
    if (splash > 0) { splash = Math.max(0, splash - dt); splashRing.visible = true; splashRing.position.set(FOUNTAIN.x, .82, FOUNTAIN.z); splashRing.scale.setScalar(1 + (1.2 - splash) * 2.2); splashRing.material.opacity = splash / 1.2; } else splashRing.visible = false;
    updateHalos(t, dt);
    // helicopter
    if (mode === 'heli' || HELI.landing) fly(dt);
    HELI.spin += ((inHeli ? 38 : 0) - HELI.spin) * (1 - Math.exp(-dt * (inHeli ? .8 : .35)));
    HELI.rotor.rotation.y += HELI.spin * dt; HELI.tail.rotation.z += HELI.spin * 1.6 * dt;
    HELI.sh.position.y = -(HELI.g.position.y - groundAt(HELI.g.position.x, HELI.g.position.z) - .08) / .85;
    // Scott follows you (and waits at the pad while you fly)
    { const tgt = inHeli ? HELI_HOME.clone().add(new THREE.Vector3(4.5, 0, 3.5)) : ME.pos.clone().add(new THREE.Vector3(Math.sin(ME.h + 2.2) * 1.6, 0, Math.cos(ME.h + 2.2) * 1.6));
      const g = DOG.g, dx = tgt.x - g.position.x, dz = tgt.z - g.position.z, d = Math.hypot(dx, dz), sp = d > 1.1 ? Math.min(9, d * 2.2) : 0;
      if (d > 40) g.position.set(tgt.x, 0, tgt.z);
      if (sp) { g.position.x += dx / d * sp * dt; g.position.z += dz / d * sp * dt; g.rotation.y += wrapA(Math.atan2(dx, dz) - g.rotation.y) * (1 - Math.exp(-dt * 8)); }
      if (DOG.jump > 0) DOG.jump = Math.max(0, DOG.jump - dt);
      g.position.y += (groundAt(g.position.x, g.position.z) + .05 + Math.sin((1 - DOG.jump / .7) * Math.PI) * (DOG.jump > 0 ? .9 : 0) - g.position.y) * .3;
      DOG.legs.forEach((l, i) => (l.rotation.x = sp ? Math.sin(t * 16 + (i % 2) * Math.PI + (i > 1 ? 1 : 0)) * .6 : 0)); DOG.tail.rotation.y = Math.sin(t * (sp || DOG.jump ? 10 : 16)) * .55; }
    // perspective camera for walk / fly / ride
    if (mode === 'ride') ride();
    if (mode !== 'map') { const k = reduced() ? 1 : 1 - Math.exp(-dt * (mode === 'heli' ? 3 : 5)); if (!camInit) { pcam.position.copy(goal); lookNow.copy(lookAt); camInit = true; } pcam.position.lerp(goal, k); lookNow.lerp(lookAt, k); pcam.lookAt(lookNow); }
    // prompts
    if (promptT > 0) { promptT -= dt; if (promptT <= 0) $('prompt').hidden = true; }
    else if (mode === 'walk') {
      nearPlace = null; for (const p of PLACES) { const r = p.rect; if (p.kind !== 'park' && ME.pos.x > r.x0 && ME.pos.x < r.x1 && ME.pos.z > r.z0 && ME.pos.z < r.z1) nearPlace = p; }
      const el = $('prompt');
      if (nearHeli()) { el.hidden = false; el.innerHTML = `<kbd>F</kbd>${T.pressHeli}`; }
      else if (nearPlace) { el.hidden = false; el.innerHTML = `<kbd>E</kbd>${nearPlace.enterable ? T.pressEnter + ' ' : ''}${esc(nearPlace.shown)}`; }
      else el.hidden = true;
    } else if (mode === 'heli') { const el = $('prompt'); el.hidden = HELI.g.position.y < 1.2; el.innerHTML = HELI.landing ? T.landing : `<kbd>F</kbd>${T.land}`; }
    // selection ring
    const sel = selV >= 0 ? FLEET[selV]?.pos : selPawn >= 0 ? PAWNS[selPawn]?.pos : null;
    ring.visible = !!sel && mode === 'map'; if (sel) { ring.position.set(sel.x, groundAt(sel.x, sel.z) + .08, sel.z); ring.scale.setScalar(selV >= 0 ? 1 : .5); ring.material.opacity = .55 + Math.sin(t * 4) * .3; }
    // cards hide when you are close (they would cover the scene)
    const fz = fitZoom(), close = mode !== 'map' || ocam.zoom > fz * 3.2;
    for (const [k, el] of CARDS) el.classList.toggle('dim', close || (view?.t === 'place' && view.id === k));
    const showNames = mode !== 'map' || ocam.zoom > fz * 2;
    for (const p of COMPANIONS) p.tag.el.style.opacity = showNames ? 1 : 0;
    ME.tag.el.style.opacity = showNames && mode === 'map' && !ME.hidden ? 1 : 0; DOG.tag.style.opacity = showNames ? 1 : 0;
    renderer.render(scene, cam); labels.render(scene, cam);
  }

  // ============================================================================ start + public API
  renderKpis(); renderDock(); renderAsOf(); renderBanner(); startSources();
  $('night')?.addEventListener('click', () => setNight(!night));
  { const n = W.meta.night; const h = new Date().getHours(); if (n === true || (n === 'auto' && (h >= 18 || h < 6))) setNight(true, { quiet: true }); }
  for (const f of FLEET) writeCar(f); flushCars();
  ocam.zoom = fitZoom() * .7; ocam.updateProjectionMatrix(); viewAll(1.8);
  later(() => ($('hint').style.opacity = 0), 9000);
  loop();
  if (W.meta.autoplay === 'tour') later(startTour, 2500);
  const api = {
    world: W, open, close: closeDrawer, enter: enterBuilding, exit: exitBuilding, setMode, viewAll, rotateBy, zoomBy, update, tour: startTour, stopTour, next: () => nextStep(), replay: startReplay, stopReplay, video: setVideo, ride: startRide,
    on(ev, fn) { (listeners[ev] ??= []).push(fn); return () => { listeners[ev] = listeners[ev].filter((x) => x !== fn); }; },
    // scripted camera (videos, embeds): fly({ x, z, zoomFit, zoom, az, daz, dur }) — zoomFit is relative to "see everything"
    fly(o = {}) { const off = ocam.position.clone().sub(controls.target), cur = new THREE.Spherical().setFromVector3(off); follow = null;
      const az = o.az ?? (o.daz != null ? AZ0 + o.daz : cur.theta), z = o.zoom ?? (o.zoomFit != null ? fitZoom() * o.zoomFit : ocam.zoom);
      flyTo(new THREE.Vector3(o.x ?? controls.target.x, 0, o.z ?? controls.target.z), z, o.dur ?? 1.2, az); },
    walkTo: (x, z) => { if (mode !== 'walk') setMode('walk'); walkGoTo(x, z); },
    setNight: (on) => setNight(on),
    pick: (x, y) => { const r = canvas.getBoundingClientRect(); const h = pickAt({ clientX: r.left + x, clientY: r.top + y }); return h ? { ...h, tip: tipText(h).replace(/<[^>]+>/g, ' · ') } : null; },
    state: () => ({ mode, view, night, inside: inside?.place.id ?? null, me: [+ME.pos.x.toFixed(2), +ME.pos.z.toFixed(2)], touring: !!tour, replaying: !!replay, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
    // test helper: run traffic for `sec` seconds and report the closest two cars got and the longest stop
    sim(sec) { const mv = FLEET.filter((f) => f.r); let minD = 1e9, maxStuck = 0; const stuck = new Map(); for (let t = 0; t < sec; t += .05) { for (const f of mv) driveCar(f, .05, t); for (let i = 0; i < mv.length; i++) for (let j = i + 1; j < mv.length; j++) minD = Math.min(minD, mv[i].pos.distanceTo(mv[j].pos)); for (const f of mv) { const s = f.r.v < .05 ? (stuck.get(f) ?? 0) + .05 : 0; stuck.set(f, s); maxStuck = Math.max(maxStuck, s); } } return { minD: +minD.toFixed(2), maxStuck: +maxStuck.toFixed(1) }; },
    destroy() {
      running = false; alive = false; cancelAnimationFrame(raf); for (const id of TIMERS) clearTimeout(id); TIMERS.clear(); ro.disconnect(); for (const s of SRC_TIMERS) s.close();
      removeEventListener('keydown', onKeyDown); removeEventListener('keyup', onKeyUp); removeEventListener('blur', onBlur); removeEventListener('pointerup', onPUp); removeEventListener('pointermove', onPMove);
      controls.dispose(); for (const r of Object.values(ROOMS)) disposeRoom(r);
      scene.traverse((o) => { if (o.isMesh) { o.geometry?.dispose(); } }); for (const t of disposables) t.dispose(); envTex.dispose(); pmrem.dispose(); renderer.dispose(); renderer.forceContextLoss();
      host.innerHTML = ''; host.classList.remove('cold', 'cold-night');
    },
  };
  return api;
}
