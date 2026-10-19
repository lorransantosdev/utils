
  // ============================================================================ helicopter
  let HELI;
  function buildHeli() {
    const g = new THREE.Group(), B = new Batch();
    B.add(new THREE.SphereGeometry(1.2, 22, 16).scale(1.7, 1, 1), BRAND, .2, 1.45, 0);
    B.add(new THREE.SphereGeometry(1.21, 22, 16, 0, Math.PI * 2, Math.PI * .62, Math.PI * .38).scale(1.7, 1, 1), '#FFFFFF', .2, 1.45, 0);
    B.add(new THREE.CylinderGeometry(.16, .34, 4.8, 12).rotateZ(Math.PI / 2), BRAND, -3.3, 1.8, 0);
    B.rb(.8, 1.3, .12, BRAND, -5.6, 2.4, 0, .05).rb(1.1, .1, 1.4, '#FFFFFF', -5.3, 1.9, 0, .03).rb(1, .45, .8, '#2A2D33', .2, 2.65, 0, .12);
    for (const s of [-1, 1]) { B.add(new THREE.CylinderGeometry(.06, .06, 3.6, 8).rotateZ(Math.PI / 2), '#2A2D33', .2, .07, s * .9); B.box(.08, .65, .08, '#2A2D33', -.8, .42, s * .85).box(.08, .65, .08, '#2A2D33', 1.1, .42, s * .85); }
    B.flush(g);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12, -Math.PI * .45, Math.PI * .9, Math.PI * .18, Math.PI * .5).scale(1.55, .9, 1.02).translate(.5, 1.5, 0), new THREE.MeshStandardMaterial({ color: '#22303F', roughness: .05, metalness: .4 })));
    const rotor = new THREE.Group(); rotor.position.set(.2, 2.95, 0); g.add(rotor);
    const R = new Batch(); for (let i = 0; i < 2; i++) R.box(8.6, .05, .28, '#2A2D33', 0, 0, 0, i * Math.PI / 2); R.rb(.3, .25, .3, '#2A2D33', 0, 0, 0, .08); R.flush(rotor);
    const tail = new THREE.Group(); tail.position.set(-5.65, 2.4, .12); g.add(tail);
    const Tb = new Batch(); Tb.box(.06, 1.4, .12, '#2A2D33', 0, 0, 0).box(1.4, .06, .12, '#2A2D33', 0, 0, 0); Tb.flush(tail);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(8, 4).rotateX(-Math.PI / 2), BLOB); g.add(sh);
    g.traverse((m) => { if (m.isMesh) { m.castShadow = m !== sh; m.userData.pick = { t: 'prop', k: 'heli' }; pickables.push(m); } });
    g.scale.setScalar(.85); g.position.set(HELI_HOME.x, .3, HELI_HOME.z); g.rotation.y = Math.PI / 2 - .4; root.add(g);
    HELI = { g, rotor, tail, sh, spin: 0, vel: new THREE.Vector3(), yawV: 0, landing: false };
  }

  // ============================================================================ labels in the city: one card per place
  const CARDS = new Map();
  function markHtml(p, size = 30) {
    const bg = p.kind === 'cluster' ? '#8D939B' : p.kind === 'tower' ? 'var(--ink)' : p.kind === 'park' ? 'var(--green)' : (p.color ?? 'var(--brand)');
    const inner = p.kind === 'tower' && W.meta.brand.logo ? logoSvg(Math.round(size * .6), Math.round(size * .3), '#fff') : p.kind === 'park' ? '♥' : esc(p.markShown);
    return `<span class="mk" style="background:${bg}${p.kind === 'tower' ? ';color:var(--paper)' : ''}">${inner}</span>`;
  }
  const redCount = (p) => actionsOf(p).filter((a) => a.sev === 'red').length;
  function autoCard(p) {
    if (p.card) return p.card;
    if (p.kind === 'shop') { const road = p.vehicles.filter(moving).length, cap = p.capacity; return `${road} ${T.onRoad} · ${p.vehicles.length - road} ${T.inLot}${cap ? ` · ${p.vehicles.length}/${cap} ${T.bays}` : ''}`; }
    if (p.kind === 'park') return W.companions.map((c) => c.name).join(', ');
    const act = p.people.filter((q) => q.state === 'wander' || q.state === 'work').length;
    return p.people.length ? `${p.people.length} ${T.people_} · ${act} ${T.active}` : (p.sub ?? '');
  }
  function cardHtml(p) {
    const red = redCount(p), st = p.status && p.status !== 'ok' ? `<i class="st st-${p.status}"></i>` : '';
    return `${markHtml(p)}<div><b>${esc(p.shown)}</b><small>${esc(autoCard(p))}</small></div>${red ? `<span class="badge">${red}</span>` : ''}${st}`;
  }
  function buildCards() {
    for (const p of PLACES) {
      const el = document.createElement('button'); el.type = 'button';
      el.className = 'c-card' + (p.kind === 'shop' || p.kind === 'office' ? '' : ' minor');
      el.addEventListener('click', (e) => { e.stopPropagation(); if (!tourOn()) open({ t: 'place', id: p.id }); });
      el.addEventListener('dblclick', (e) => { e.stopPropagation(); if (p.enterable) enterBuilding(p.id); });
      el.addEventListener('pointerdown', (e) => e.stopPropagation());
      el.addEventListener('pointerenter', () => setHoverPlace(p)); el.addEventListener('pointerleave', () => setHoverPlace(null));
      const o = new CSS2DObject(el); o.position.copy(p.anchor); root.add(o);
      CARDS.set(p.id, el);
    }
    refreshCards();
  }
  const refreshCards = () => { for (const p of PLACES) { const el = CARDS.get(p.id); if (el) { el.innerHTML = cardHtml(p); el.classList.toggle('warn', p.status === 'warn'); el.classList.toggle('down', p.status === 'down'); el.classList.toggle('nodata', p.status === 'none'); } } };
  // a status halo around a place: amber pulses, red pulses faster and smokes
  const HALOS = [];
  function buildHalos() {
    for (const p of PLACES) {
      const m = new THREE.Mesh(new THREE.RingGeometry(15.5, 16.4, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#F59E0B', transparent: true, opacity: 0, depthWrite: false }));
      m.position.set(p.cx, .3, p.cz); m.visible = false; root.add(m);
      const puffs = []; for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(.8, 1), new THREE.MeshStandardMaterial({ color: '#6B6F76', transparent: true, opacity: .5, roughness: 1, flatShading: true })); s.visible = false; root.add(s); puffs.push(s); }
      HALOS.push({ p, m, puffs });
    }
  }
  function updateHalos(t, dt) {
    for (const h of HALOS) {
      const s = h.p.status, on = s === 'warn' || s === 'down';
      h.m.visible = on; if (on) { h.m.material.color.set(s === 'down' ? '#E5484D' : '#F59E0B'); h.m.material.opacity = .35 + Math.sin(t * (s === 'down' ? 6 : 3)) * .25; }
      h.puffs.forEach((pf, i) => {
        pf.visible = s === 'down'; if (!pf.visible) return;
        const k = ((t * .35 + i / 6) % 1); pf.position.set(h.p.anchor.x + Math.sin(i * 2.1 + t * .5) * 1.2, h.p.roof + k * 9, h.p.anchor.z + 1.5 + Math.cos(i * 1.7) * 1.2);
        pf.scale.setScalar(.6 + k * 1.6); pf.material.opacity = .55 * (1 - k);
      });
    }
  }

  // ============================================================================ camera moves (smooth, always in iso)
  let tween = null, follow = null;
  const ease = (k) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const vw = () => sceneEl.clientWidth || 1, vh = () => sceneEl.clientHeight || 1;
  const drawerW = () => (app.classList.contains('open') && !narrow() ? 396 : 0);
  const sheetH = () => (app.classList.contains('open') && narrow() ? vh() * .64 : 0);
  // zoom that fits the whole slab, measured in camera space at the current azimuth
  function fitZoom() {
    const a = vw() / vh(), off = ocam.position.clone().sub(controls.target);
    const m = new THREE.Matrix4().lookAt(off, new THREE.Vector3(), UP), inv = m.clone().invert();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const yy of [-5, 8]) { const p = new THREE.Vector3(sx * SLAB.x, yy, sz * SLAB.z).applyMatrix4(inv); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    const w = x1 - x0, h = y1 - y0;
    if (a < 1) return (VIEW * a) / (w * .7);
    return Math.min((VIEW * a) / (w * 1.04), VIEW / (h * 1.12));
  }
  // fly so that `p` sits in the middle of the part of the screen not covered by the drawer
  function flyTo(p, z, dur = 1.1, az = null) {
    const off = ocam.position.clone().sub(controls.target);
    if (az != null) off.setFromSphericalCoords(off.length(), POLAR, az);
    const wpp = VIEW / z / vh();
    const right = new THREE.Vector3().setFromMatrixColumn(ocam.matrixWorld, 0); right.y = 0; right.normalize();
    if (az != null) right.set(Math.cos(az), 0, -Math.sin(az));
    const fwd = new THREE.Vector3(-off.x, 0, -off.z).normalize();
    const aim = p.clone().setY(0).addScaledVector(right, (drawerW() / 2) * wpp).addScaledVector(fwd, -(sheetH() / 2) * wpp / Math.cos(POLAR));
    if (dur <= 0 || reduced()) { controls.target.copy(aim); ocam.position.copy(aim).add(off); ocam.zoom = z; ocam.updateProjectionMatrix(); tween = null; return; }
    tween = { k: 0, dur, t0: controls.target.clone(), t1: aim, o0: ocam.position.clone().sub(controls.target), o1: off, z0: ocam.zoom, z1: z };
  }
  const viewAll = (dur = 1.2) => flyTo(new THREE.Vector3(0, 0, 2), fitZoom(), dur);
  function rotateBy(a) { const off = ocam.position.clone().sub(controls.target), s = new THREE.Spherical().setFromVector3(off); const t = controls.target.clone(); tween = { k: 0, dur: .7, t0: t, t1: t, o0: off, o1: new THREE.Vector3().setFromSphericalCoords(off.length(), POLAR, s.theta + a), z0: ocam.zoom, z1: ocam.zoom }; }
  function zoomBy(f) { const o = ocam.position.clone().sub(controls.target); tween = { k: 0, dur: .4, t0: controls.target.clone(), t1: controls.target.clone(), o0: o, o1: o.clone(), z0: ocam.zoom, z1: clamp(ocam.zoom * f, controls.minZoom, controls.maxZoom) }; }
  function stepTween(dt) {
    if (!tween) return;
    tween.k += dt; const k = ease(Math.min(1, tween.k / tween.dur));
    controls.target.lerpVectors(tween.t0, tween.t1, k);
    const s0 = new THREE.Spherical().setFromVector3(tween.o0), s1 = new THREE.Spherical().setFromVector3(tween.o1);
    let dth = wrapA(s1.theta - s0.theta); const off = new THREE.Vector3().setFromSphericalCoords(320, POLAR, s0.theta + dth * k);
    ocam.position.copy(controls.target).add(off); ocam.zoom = THREE.MathUtils.lerp(tween.z0, tween.z1, k); ocam.updateProjectionMatrix();
    if (k >= 1) tween = null;
  }
