
  // ============================================================================ open anything: drawer + camera + a reaction in the city
  const pawnOfRef = (r) => r.t === 'person' ? perById.get(r.id)?._pawn : r.t === 'companion' ? COMPANIONS[r.i] : r.t === 'me' ? ME : null;
  const posOfRef = (r) => {
    if (r.t === 'place') { const p = placeById.get(r.id); return p ? new THREE.Vector3(p.cx, 0, p.cz + 2) : null; }
    if (r.t === 'vehicle') { const f = vehById.get(r.id)?._f; return f && !f.hidden ? f.pos : null; }
    if (r.t === 'person') { const q = perById.get(r.id); if (!q) return null; const pw = q._pawn; if (pw && !pw.hidden) return pw.pos; const v = q.vehicle && vehById.get(q.vehicle); return v?._f && !v._f.hidden ? v._f.pos : placeById.get(q.place) ? new THREE.Vector3(placeById.get(q.place).cx, 0, placeById.get(q.place).cz) : null; }
    if (r.t === 'companion') return COMPANIONS[r.i]?.pos;
    if (r.t === 'me') return ME.pos;
    if (r.t === 'pet') return DOG.g.position;
    return null;
  };
  const listeners = {};
  const emit = (ev, d) => (listeners[ev] ?? []).forEach((fn) => fn(d));
  function open(r, { fly = true, react = true } = {}) {
    if (!r) return;
    if (r.t === 'action') { const a = ACTS.find((x) => x.id === r.id); return open(actRef(a) ?? { t: 'actions' }); }
    if (r.t === 'place' && !placeById.get(r.id)) return;
    if (r.t === 'place' && r.id !== view?.id) tab = null;
    if (r.tab) tab = r.tab;
    view = r; follow = null;
    selV = r.t === 'vehicle' ? vehById.get(r.id)?._f?.i ?? -1 : r.t === 'person' && perById.get(r.id)?._pawn?.hidden ? vehById.get(perById.get(r.id).vehicle)?._f?.i ?? -1 : -1;
    const pw = pawnOfRef(r); selPawn = pw && !inside ? pw.id : -1;
    app.classList.add('open'); renderDrawer(); renderDock(); emit('open', r);
    if (react) reactTo(r);
    if (!fly || mode !== 'map' || inside) return;
    const fz = fitZoom();
    if (r.t === 'place') { const p = placeById.get(r.id); flyTo(new THREE.Vector3(p.cx, 0, p.cz + 2), fz * 2.5); }
    else if (r.t === 'home' || r.t === 'actions') viewAll();
    else if (r.t === 'prop') { if (r.pos) flyTo(new THREE.Vector3(...r.pos), fz * 3.6, .9); }
    else { const p = posOfRef(r); if (p) { flyTo(p.clone(), fz * 4.4, .9); if (isMover(r)) follow = { ref: r, pos: () => posOfRef(r) }; } }
  }
  const isMover = (r) => r.t === 'vehicle' ? moving(vehById.get(r.id)) : r.t === 'person' ? (pawnOfRef(r)?.mode === 'wander' || pawnOfRef(r)?.hidden) : r.t === 'companion' || r.t === 'pet';
  function closeDrawer() { view = null; selV = -1; selPawn = -1; follow = null; app.classList.remove('open'); renderDock(); if (mode === 'map' && !inside && !tour) viewAll(); emit('close'); }

  // ---------------------------------------------------------------- reactions: people turn, wave and talk; cars hop and honk
  const BUBBLES = [];
  function say(posFn, text, dur = 3.6, parent = root) {
    if (!text) return;
    const el = document.createElement('div'); el.className = 'c-say'; el.textContent = text;
    const o = new CSS2DObject(el); parent.add(o);
    const b = { o, el, posFn, t: dur, parent }; BUBBLES.push(b);
    while (BUBBLES.length > 4) killBubble(BUBBLES[0]);
    return b;
  }
  function killBubble(b) { b.parent.remove(b.o); b.el.remove(); BUBBLES.splice(BUBBLES.indexOf(b), 1); }
  function updateBubbles(dt) { for (const b of BUBBLES.slice()) { b.t -= dt; const p = b.posFn(); if (p) b.o.position.set(p.x, p.y, p.z); b.el.style.opacity = b.t < .4 ? b.t / .4 : 1; if (b.t <= 0 || !p) killBubble(b); } }
  const nextLine = (e, fallback) => { const l = e.lines?.length ? e.lines : fallback ? [fallback] : []; if (!l.length) return null; e._li = ((e._li ?? -1) + 1) % l.length; return (e._said = l[e._li]); };
  function facing(p) { const tgt = mode === 'map' || inside ? ocam.position : (mode === 'walk' ? ME.pos : pcam.position); return Math.atan2(tgt.x - p.pos.x, tgt.z - p.pos.z); }
  function reactPawn(pw, line, parent = root) {
    if (!pw || pw.hidden) return;
    const sit = pw.pose === 'sit' || pw.pose === 'type' || pw.pose === 'phone';
    pw.basePose = pw.basePose ?? pw.pose; pw.react = 2.4; pw.target = null; pw.wait = Math.max(pw.wait, 2.6);
    if (!sit) { pw.pose = 'wave'; pw.faceTo = facing(pw); } else pw.look = clamp(wrapA(facing(pw) - pw.yaw), -1, 1);
    say(() => _v.set(pw.pos.x, pw.y + 2.35 * pw.scale, pw.pos.z).clone(), line, 3.6, parent);
  }
  function reactTo(r) {
    if (r.t === 'person') { const q = perById.get(r.id), pw = q?._pawn; const line = nextLine(q, q.page?.subtitle);
      if (pw && !pw.hidden && !inside) reactPawn(pw, line);
      else if (!inside) { const v = q.vehicle && vehById.get(q.vehicle); if (v?._f && !v._f.hidden) { v._f.hold = 1.2; say(() => v._f.pos.clone().setY(3.1), line); } }
      if (inside) { const ip = inside.pawns.find((x) => x.data === q); if (ip) reactPawn(ip, line, inside.g); }
    } else if (r.t === 'companion') { const c = W.companions[r.i]; reactPawn(COMPANIONS[r.i], nextLine(c, c.greet)); }
    else if (r.t === 'me') reactPawn(ME, W.player.lines?.[0] ?? '👋');
    else if (r.t === 'vehicle') { const v = vehById.get(r.id), f = v?._f; if (!f || f.hidden) return; const line = nextLine(v, moving(v) ? (v.driver && perById.get(v.driver)?.lines?.[0]) ?? stOf(v).label : stOf(v).label);
      if (!moving(v)) f.hop = .6; else f.hold = 1.4;
      if (!inside) say(() => f.pos.clone().setY(f.y + 3.2), line);
    } else if (r.t === 'place' && !inside) { const p = placeById.get(r.id); p._squash = .5; }
    else if (r.t === 'pet') { DOG.jump = .7; say(() => DOG.g.position.clone().setY(DOG.g.position.y + 2.2), W.pet.bark ?? 'Au au!'); }
  }

  // ---------------------------------------------------------------- drawer clicks
  host.querySelector('[data-close]').onclick = () => closeDrawer();
  host.querySelector('.c-drawer').addEventListener('click', (e) => {
    const q = (s) => e.target.closest(s); let b;
    if ((b = q('[data-tab]'))) { tab = b.dataset.tab; return renderDrawer(); }
    if ((b = q('[data-ref]'))) return open(JSON.parse(b.dataset.ref));
    if ((b = q('[data-go]'))) return open(JSON.parse(b.dataset.go));
    if ((b = q('[data-do]'))) return doIt(b.dataset.do);
  });
  function doIt(d) {
    const [k, arg] = d.split(':');
    if (k === 'enter') return enterBuilding(arg);
    if (k === 'walk') return walkTo(arg);
    if (k === 'mode') return setMode(arg);
    if (k === 'heli') return setMode('heli');
    if (k === 'tour') return startTour();
    if (k === 'journey') { const j = W.journeys?.[+arg]; return j && startTour(j.steps, j.title); }
    if (k === 'replay') return startReplay();
    if (k === 'ride') return startRide(arg);
    if (k === 'pet') return reactTo({ t: 'pet' });
    if (k === 'talk') { reactTo(view); return renderDrawer(); }
    if (k === 'follow') { if (follow) { follow = null; } else { const r = view; follow = { ref: r, pos: () => posOfRef(r) }; if (!inside && mode === 'map') flyTo(posOfRef(r).clone(), Math.max(ocam.zoom, fitZoom() * 4), .8); } return renderDrawer(); }
  }
  $('dock').addEventListener('click', (e) => {
    const q = (s) => e.target.closest(s); let b;
    if (q('[data-exit]')) return exitBuilding();
    if (q('[data-stop]')) { stopTour(); stopReplay(); return; }
    if ((b = q('[data-mode]'))) return setMode(b.dataset.mode);
    if (q('[data-overview]')) { if (mode !== 'map') setMode('map'); return open({ t: 'home' }); }
    if (q('[data-tour]')) return startTour();
    if (q('[data-replay]')) return startReplay();
    if (q('[data-video]')) return setVideo(!videoMode);
  });
  $('kpis').addEventListener('click', (e) => { const b = e.target.closest('[data-kpi]'); const k = b && W.kpis[+b.dataset.kpi]; if (k?.ref) open(k.ref); });
  $('names').onclick = () => { hideNames = !hideNames; try { localStorage.setItem(NAMES_KEY, hideNames ? '1' : '0'); } catch {} applyNames(); refreshSigns(); refreshCards(); renderDrawer(); renderDock(); for (const r of Object.values(ROOMS)) r.dirty = true; };
  function refreshSigns() { for (const p of PLACES) if (p.sign) { const m = p.sign.material; m.map.dispose(); m.map = signTex(p.shown, p.signSub ?? p.sub ?? '', { bg: p.kind === 'cluster' ? (p.color ?? '#6E737B') : (p.color ?? BRAND) }); m.needsUpdate = true; } }
  host.querySelector('[data-zin]').onclick = () => zoomBy(1.4); host.querySelector('[data-zout]').onclick = () => zoomBy(1 / 1.4);
  host.querySelector('[data-rotl]').onclick = () => rotateBy(-Math.PI / 2); host.querySelector('[data-rotr]').onclick = () => rotateBy(Math.PI / 2);
  host.querySelector('[data-home]').onclick = () => { if (inside) return exitBuilding(); if (mode !== 'map') setMode('map'); if (view) closeDrawer(); else viewAll(); };
  function setVideo(on) { videoMode = on; app.classList.toggle('video', on); renderDock(); later(() => { resize(); if (!inside) viewAll(.6); }, 60); }

  // ============================================================================ hover + click in the city (and inside)
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  function pickAt(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, inside ? ocam : cam);
    for (const h of ray.intersectObjects(inside ? inside.pick : pickables, false)) {
      let vis = true; for (let x = h.object; x; x = x.parent) if (!x.visible) vis = false; if (!vis) continue;
      const pk = h.object.userData.pick; if (!pk) continue;
      if (pk.t === 'vehicle' && pk.inst) { const f = FLEET[h.instanceId]; if (!f || f.hidden || f.packet) continue; return { t: 'vehicle', id: f.v.id }; }
      if (pk.t === 'driver') { const f = FLEET[h.instanceId]; if (!f || f.packet) continue; return f.v.driver && perById.get(f.v.driver) ? { t: 'person', id: f.v.driver } : { t: 'vehicle', id: f.v.id }; }
      if (pk.t === 'pin') { const f = FLEET[h.instanceId]; if (f) return { t: 'vehicle', id: f.v.id }; continue; }
      if (pk.t === 'pawn') {
        const pw = pk.crowd.list[pk.crowd.idOf(h.object, h.instanceId)]; if (!pw || pw.hidden) continue;
        if (pw.me) { if (mode === 'walk' || inside) continue; return { t: 'me' }; }
        if (pw.companion) return { t: 'companion', i: W.companions.indexOf(pw.companion) };
        if (pw.data) return { t: 'person', id: pw.data.id };
        if (pw.empty) return { t: 'person', id: pw.empty.id, empty: true };
        continue;
      }
      if (pk.t === 'prop' && pk.inst && pk.k === 'tree') return { t: 'prop', k: 'tree', i: h.instanceId };
      if (pk.t === 'prop' && pk.k === 'bay') { const b = pk.bays[h.instanceId]; return { t: 'prop', k: 'bay', place: b.place, n: b.n, vehicle: b.vehicle }; }
      if (pk.uvPick) { const r2 = pk.uvPick(h.uv); if (r2) return r2; continue; }
      return pk;
    }
    if (inside) return null;
    // the ground answers too: a block belongs to its place, a street tells you its traffic
    const hit = new THREE.Vector3(); if (!ray.ray.intersectPlane(new THREE.Plane(UP, -.25), hit)) return null;
    for (const p of PLACES) { const r = p.rect; if (hit.x > r.x0 && hit.x < r.x1 && hit.z > r.z0 && hit.z < r.z1) return { t: 'place', id: p.id }; }
    if (Math.abs(hit.x) < XS[COLS] + RW / 2 && Math.abs(hit.z) < ZS[ROWS] + RW / 2) { const n = FLEET.filter((f) => f.r && f.pos.distanceTo(hit) < 22).length; return { t: 'prop', k: 'road', sub: `${n} ${T.vehicles.toLowerCase()} ${T.onRoad}` }; }
    return null;
  }
  function tipText(h) {
    const sub = (s) => s ? `<small>${esc(s)}</small>` : '';
    if (h.t === 'vehicle') { const v = vehById.get(h.id); return `${esc(v.name)} ${esc(v.colorName ?? '')}${sub(h.hint ?? [stOf(v).label, placeById.get(v.place)?.shown, v.tip].filter(Boolean).join(' · '))}`; }
    if (h.t === 'person') { const q = perById.get(h.id); return h.empty ? `${T.emptyDesk}${sub(q.shown + ' · ' + T.inactive)}` : `${esc(q.shown)}${sub(h.hint ?? [q.shown !== roleOf(q).label ? roleOf(q).label : null, q.tip, placeById.get(q.place)?.kind !== 'park' ? placeById.get(q.place)?.shown : null].filter(Boolean).join(' · '))}`; }
    if (h.t === 'companion') { const c = W.companions[h.i]; return `${esc(c.name)}${sub(c.rel)}`; }
    if (h.t === 'me') return `${esc(W.player.name)}${sub(W.player.role ?? T.you)}`;
    if (h.t === 'pet') return `Scott${sub(W.pet.line ?? T.pet)}`;
    if (h.t === 'place') { const p = placeById.get(h.id); return `${esc(p.shown)}${sub(h.hint ?? (p.enterable && !inside ? `${autoCard(p)} · 2× ${T.enter.toLowerCase()}` : autoCard(p)))}`; }
    if (h.t === 'action') { const a = ACTS.find((x) => x.id === h.id); return `${esc(a.title)}${sub(a.text)}`; }
    if (h.t === 'door') return `${T.door}${sub(T.doorSub)}`;
    if (h.t === 'prop') {
      const p = h.place && placeById.get(h.place);
      if (h.k === 'bay') { const v = h.vehicle && vehById.get(h.vehicle); return `${T.bay} ${String(h.n).padStart(2, '0')}${sub(v ? `${v.name} · ${moving(v) ? T.bayOut : stOf(v).label}` : T.bayFree)}`; }
      if (h.k === 'light') { const c = simT % 12; return `${T.light}${sub(c < 5.3 || (c > 6 && c < 11.3) ? T.lightGo : T.lightNow(Math.ceil(c < 6 ? 6 - c : 12 - c)))}`; }
      if (h.k === 'vault') return `${esc(p?.vaultTitle ?? T.vault)}${sub(p?.vaultText)}`;
      if (h.k === 'ghost') return `${T.ghost}${sub(p?.nextFloor)}`;
      if (h.k === 'gate') return `${T.gate}${sub(p?.shown)}`;
      return `${esc(h.label ?? T[h.k] ?? h.k)}${sub(h.sub)}`;
    }
    return '';
  }
  const PROP_OPENS = { heli: 1, vault: 1, ghost: 1 };
  function clickProp(h) {
    if (h.k === 'tree') { TREES[h.i].w = 1; return; }
    if (h.k === 'bay') return h.vehicle ? open({ t: 'vehicle', id: h.vehicle }) : open({ t: 'place', id: h.place });
    if (h.k === 'gate') { const p = placeById.get(h.place); p._gate = 2.4; return; }
    if (h.k === 'fountain') { splash = 1.2; return; }
    if (h.k === 'light') { flashTip(tipText(h)); return; }
    if (h.k === 'bench') { say(() => new THREE.Vector3(park.cx, 2.4, park.cz), W.meta.locale.startsWith('pt') ? 'Senta aqui um pouco 🙂' : 'Have a seat 🙂', 2.5); return; }
    if (h.k === 'plant' && h.obj) { h.obj.userData.w = 1; return; }
    if (h.k === 'heli' && mode === 'map' && !inside) return open({ t: 'prop', k: 'heli' }, { fly: false });
    if (PROP_OPENS[h.k]) return open({ t: 'prop', k: h.k, place: h.place }, { fly: false });
    if (h.ref) return open(h.ref, { fly: !inside });
  }
  let flashT = 0; function flashTip(html) { tip.innerHTML = html; tip.classList.add('show'); flashT = 2; }
  let hover = null, down = null, hoverPlace = null;
  function setHoverPlace(p) {
    if (hoverPlace === p) return;
    if (hoverPlace?.mat) hoverPlace.mat.emissiveIntensity = 0; CARDS.get(hoverPlace?.id)?.classList.remove('hot');
    hoverPlace = p; if (p?.mat) p.mat.emissiveIntensity = PAL.night ? .14 : .07; CARDS.get(p?.id)?.classList.add('hot');
  }
  const canvas = renderer.domElement;
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || down?.drag || tour) return;
    const h = pickAt(e), key = h ? JSON.stringify(h) : '';
    if (key !== (hover ? JSON.stringify(hover) : '')) {
      hover = h; tip.innerHTML = h ? tipText(h) : ''; tip.classList.toggle('show', !!h); canvas.style.cursor = h ? 'pointer' : '';
      hoverV = !inside && h?.t === 'vehicle' ? vehById.get(h.id)?._f?.i ?? -1 : -1;
      hoverPawn = -1; if (!inside && h) { const pw = h.t === 'person' ? perById.get(h.id)?._pawn : h.t === 'companion' ? COMPANIONS[h.i] : h.t === 'me' ? ME : null; if (pw) hoverPawn = pw.id; }
      if (inside) { inside.hoverPawn = -1; if (h?.t === 'person') { const ip = inside.pawns.find((x) => x.data?.id === h.id || x.empty?.id === h.id); if (ip) inside.hoverPawn = ip.id; } inside.hoverObj = h?.obj ?? null; }
      setHoverPlace(!inside && h?.t === 'place' ? placeById.get(h.id) : null);
    }
    const r = sceneEl.getBoundingClientRect(); tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top - 40}px)`;
  });
  canvas.addEventListener('pointerleave', () => { hover = null; tip.classList.remove('show'); hoverV = hoverPawn = -1; setHoverPlace(null); });
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; if (mode !== 'map' && !inside) look = e.clientX; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down = null; return; }
    down = null; if (tour) return;
    const h = pickAt(e);
    if (inside) {
      if (!h) { const r = canvas.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, ocam); const hit = new THREE.Vector3(); if (ray.ray.intersectPlane(new THREE.Plane(UP, 0), hit)) { collideRoom(inside, hit, .35); inside.me.target = hit; inside.marker.position.set(hit.x, .06, hit.z); inside.marker.userData.t = .8; } return; }
      if (h.t === 'door') return exitBuilding();
      if (h.t === 'prop') return clickProp(h);
      return open(h, { fly: false });
    }
    if (!h) return;
    if (h.t === 'prop') return clickProp(h);
    if (h.t === 'me' && mode === 'walk') return;
    open(h, { fly: mode === 'map' });
  });
  canvas.addEventListener('dblclick', (e) => {
    if (mode !== 'map' || inside || tour) return;
    const h = pickAt(e); if (h?.t === 'place' && placeById.get(h.id)?.enterable) return enterBuilding(h.id);
    const r = canvas.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, ocam);
    const hit = new THREE.Vector3(); if (ray.ray.intersectPlane(new THREE.Plane(UP, 0), hit)) { follow = null; const o = ocam.position.clone().sub(controls.target); tween = { k: 0, dur: .6, t0: controls.target.clone(), t1: hit, o0: o, o1: o.clone(), z0: ocam.zoom, z1: Math.min(controls.maxZoom, ocam.zoom * 1.8) }; }
  });
  controls.addEventListener('start', () => { tween = null; if (!tour) follow = null; $('hint').style.opacity = 0; if (down) down.drag = true; tip.classList.remove('show'); });
  controls.addEventListener('end', () => { if (down) down.drag = false; });
  const tourOn = () => !!tour;

  // ============================================================================ walk, helicopter, ride along (perspective camera)
  const keys = new Set();
  const typing = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? '');
  const MOVE = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyC', 'ShiftLeft', 'ShiftRight'];
  const visible = () => host.isConnected && host.getClientRects().length > 0;
  const onKeyDown = (e) => {
    if (typing() || !visible()) return;
    if (tour && (e.code === 'ArrowRight' || e.code === 'Space')) { e.preventDefault(); return nextStep(); }
    if (tour && e.code === 'ArrowLeft') { e.preventDefault(); tour.i = Math.max(-1, tour.i - 2); return nextStep(); }
    if (e.key === 'Escape') { if (tour || replay) { stopTour(); stopReplay(); return; } if (view) return closeDrawer(); if (inside) return exitBuilding(); if (mode !== 'map') return setMode('map'); }
    if (mode === 'map') {
      if (e.code === 'KeyQ') rotateBy(-Math.PI / 2); if (e.code === 'KeyE') rotateBy(Math.PI / 2);
      if (e.key === '+' || e.key === '=') zoomBy(1.4); if (e.key === '-') zoomBy(1 / 1.4);
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) { keys.add(e.code); e.preventDefault(); if (!inside) { follow = null; tween = null; } }
      return;
    }
    if (MOVE.includes(e.code)) { keys.add(e.code); e.preventDefault(); }
    if (e.code === 'KeyF') { if (mode === 'heli') land(); else if (nearHeli()) board(); }
    if (e.code === 'KeyE' && mode === 'walk' && nearPlace) { if (nearPlace.enterable) enterBuilding(nearPlace.id); else open({ t: 'place', id: nearPlace.id }); }
  };
  const onKeyUp = (e) => keys.delete(e.code), onBlur = () => keys.clear();
  addEventListener('keydown', onKeyDown); addEventListener('keyup', onKeyUp); addEventListener('blur', onBlur);
  let inHeli = false, nearPlace = null, rideRef = null;
  const nearHeli = () => ME.pos.distanceTo(HELI.g.position) < 6.5;
  function board() { inHeli = true; ME.hidden = true; HELI.landing = false; mode = 'heli'; applyMode(); }
  function land() { const t = HELI.g.position.clone(); collide(t, 3); if (t.distanceToSquared(HELI.g.position) > .01) return flash(T.freeSpot); HELI.landing = true; }
  function landed() { HELI.landing = false; inHeli = false; const side = new THREE.Vector3(Math.sin(HELI.g.rotation.y), 0, Math.cos(HELI.g.rotation.y)); ME.pos.copy(HELI.g.position).addScaledVector(side, 3.2); collide(ME.pos); ME.hidden = false; ME.h = HELI.g.rotation.y + Math.PI / 2; mode = 'walk'; applyMode(); }
  function walkTo(id) { const P0 = placeById.get(id); if (!P0) return; if (inside) exitBuilding(); if (inHeli) { inHeli = false; HELI.g.position.set(HELI_HOME.x, .3, HELI_HOME.z); ME.hidden = false; } ME.pos.copy(P0.gate ?? P0.door); ME.h = Math.PI; collide(ME.pos); DOG.g.position.copy(ME.pos).add(new THREE.Vector3(1.4, 0, 1)); mode = 'walk'; applyMode(); }
  function flash(msg) { const el = $('prompt'); el.hidden = false; el.textContent = msg; promptT = 2.2; }
  let promptT = 0;
  function startRide(id) { const v = vehById.get(id); if (!v || !moving(v)) return; rideRef = id; if (inside) exitBuilding(); mode = 'ride'; applyMode(); }
  function setMode(m) {
    if (inside) exitBuilding();
    if (m === mode && m !== 'heli') return;
    if (m === 'heli') { if (!inHeli) { ME.pos.copy(HELI.g.position).add(new THREE.Vector3(2.5, 0, 2.5)); board(); } else { mode = 'heli'; applyMode(); } return; }
    if (m === 'walk' && inHeli) { HELI.g.position.y > .6 ? land() : landed(); return; }
    if (m === 'map') rideRef = null;
    mode = m; applyMode();
  }
  let camInit = false, look = null;
  function applyMode() {
    const map = mode === 'map';
    cam = map ? ocam : pcam; controls.enabled = map; tween = null; follow = null; camInit = false;
    app.classList.toggle('walk', mode === 'walk' || mode === 'ride'); app.classList.toggle('fly', mode === 'heli');
    const k = $('keys'); k.hidden = map; k.innerHTML = mode === 'walk' ? T.keysWalk : mode === 'heli' ? T.keysHeli : mode === 'ride' ? T.keysRide : '';
    const coarse = matchMedia('(pointer: coarse)').matches || narrow(), pad = $('pad'); pad.hidden = map || mode === 'ride' || !coarse;
    pad.innerHTML = mode === 'heli' ? '<button data-k="Space">▲</button><button data-k="KeyW">↑</button><button data-k="KeyF" class="sm">⬇</button><button data-k="KeyA">↺</button><button data-k="KeyS">↓</button><button data-k="KeyD">↻</button><button data-k="KeyC">▼</button>'
      : `<button data-k="KeyF" class="sm">${ic('heli')}</button><button data-k="KeyW">↑</button><button data-k="KeyE" class="sm">${ic('enter')}</button><button data-k="KeyA">←</button><button data-k="KeyS">↓</button><button data-k="KeyD">→</button>`;
    if (map) { $('prompt').hidden = true; const lk = (inHeli ? HELI.g.position : ME.pos).clone(); lk.y = 0; if (!inside) flyTo(lk, fitZoom() * 3, .9); }
    renderDock(); resize(); emit('mode', mode);
  }
  $('pad').addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-k]'); if (!b) return; e.preventDefault(); const k = b.dataset.k;
    if (k === 'KeyF') return mode === 'heli' ? land() : nearHeli() ? board() : flash(T.nearHeli);
    if (k === 'KeyE') return nearPlace ? (nearPlace.enterable ? enterBuilding(nearPlace.id) : open({ t: 'place', id: nearPlace.id })) : flash(T.nearPlace);
    keys.add(k); b.classList.add('on');
    const up = () => { keys.delete(k); b.classList.remove('on'); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
  });
  const onPUp = () => (look = null);
  const onPMove = (e) => { if (look == null || mode === 'map' || inside) return; const dx = e.clientX - look; look = e.clientX; if (mode === 'walk') ME.h -= dx * .006; else if (mode === 'heli') HELI.g.rotation.y -= dx * .005; else rideYaw -= dx * .006; };
  addEventListener('pointerup', onPUp); addEventListener('pointermove', onPMove);
  const goal = new THREE.Vector3(), lookAt = new THREE.Vector3(), lookNow = new THREE.Vector3();
  let rideYaw = 0;
  const on = (...c) => c.some((k) => keys.has(k));
  function walk(dt) {
    const f = (on('KeyW', 'ArrowUp') ? 1 : 0) - (on('KeyS', 'ArrowDown') ? 1 : 0), turn = (on('KeyA', 'ArrowLeft') ? 1 : 0) - (on('KeyD', 'ArrowRight') ? 1 : 0);
    ME.h += turn * dt * 2.4; const v = f * (on('ShiftLeft', 'ShiftRight') ? 8 : 4.2); ME.speed = Math.abs(v);
    ME.pos.x += Math.sin(ME.h) * v * dt; ME.pos.z += Math.cos(ME.h) * v * dt; collide(ME.pos);
    ME.y += (groundAt(ME.pos.x, ME.pos.z) + .05 - ME.y) * (1 - Math.exp(-dt * 14));
    ME.yaw = ME.h; ME.ph += Math.abs(v) * dt / .55 * Math.PI;
    const fw = new THREE.Vector3(Math.sin(ME.h), 0, Math.cos(ME.h));
    goal.copy(ME.pos).addScaledVector(fw, -8.5).add(new THREE.Vector3(0, 5.2, 0)); lookAt.copy(ME.pos).addScaledVector(fw, 4).add(new THREE.Vector3(0, 1, 0));
  }
  function fly(dt) {
    const H = HELI, g = H.g;
    if (H.landing) { const gy = groundAt(g.position.x, g.position.z) + .05; H.vel.multiplyScalar(Math.exp(-dt * 3)); g.position.y += (gy - g.position.y) * (1 - Math.exp(-dt * 2.2)); if (g.position.y - gy < .08) { g.position.y = gy; landed(); } }
    else {
      const f = (on('KeyW', 'ArrowUp') ? 1 : 0) - (on('KeyS', 'ArrowDown') ? 1 : 0), turn = (on('KeyA', 'ArrowLeft') ? 1 : 0) - (on('KeyD', 'ArrowRight') ? 1 : 0), up = (on('Space') ? 1 : 0) - (on('KeyC', 'ShiftLeft') ? 1 : 0);
      H.yawV += (turn * 1.5 - H.yawV) * (1 - Math.exp(-dt * 4)); g.rotation.y += H.yawV * dt;
      const fw = new THREE.Vector3(Math.cos(g.rotation.y), 0, -Math.sin(g.rotation.y));
      H.vel.lerp(fw.multiplyScalar(f * 20).add(new THREE.Vector3(0, up * 7, 0)), 1 - Math.exp(-dt * 1.8)); g.position.addScaledVector(H.vel, dt);
      const gy = groundAt(g.position.x, g.position.z) + .05;
      if (g.position.y < gy + 3 && up >= 0 && H.spin > 20) g.position.y += (gy + 3 - g.position.y) * (1 - Math.exp(-dt * 1.5));
      g.position.y = clamp(g.position.y, gy, 60); g.position.x = clamp(g.position.x, -SLAB.x - 40, SLAB.x + 40); g.position.z = clamp(g.position.z, -SLAB.z - 40, SLAB.z + 40);
      const fv = H.vel.x * Math.cos(g.rotation.y) - H.vel.z * Math.sin(g.rotation.y);
      g.rotation.z += (-fv * .012 - g.rotation.z) * (1 - Math.exp(-dt * 3));
    }
    const fw2 = new THREE.Vector3(Math.cos(g.rotation.y), 0, -Math.sin(g.rotation.y));
    goal.copy(g.position).addScaledVector(fw2, -20).add(new THREE.Vector3(0, 9, 0)); lookAt.copy(g.position).addScaledVector(fw2, 7).add(new THREE.Vector3(0, -1, 0));
  }
  function ride() {
    const v = vehById.get(rideRef), f = v?._f; if (!f || !moving(v)) { setMode('map'); return; }
    const a = f.yaw + rideYaw, fw = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
    goal.copy(f.pos).addScaledVector(fw, -7.5).add(new THREE.Vector3(0, 3.6, 0)); lookAt.copy(f.pos).addScaledVector(fw, 6).add(new THREE.Vector3(0, 1, 0));
  }
