
  // ============================================================================ people: articulated, instanced, with walking physics
  // Every person is a little figure with legs, arms, hands, head and hair. They accelerate, slow down
  // when they arrive, keep their distance from each other and swing their legs in step with how far
  // they actually moved (no sliding feet). One crowd = 9 draw calls, whatever the number of people.
  const HAIR = ['#2A1C14', '#4A3222', '#1A1A1A', '#6B4A2E', '#8C6239', '#3B2A1E'];
  const PANTS = ['#2E3440', '#3D4A5C', '#4B4F57', '#1F2937', '#5B6472'];
  function mkPawn(list, o) {
    const lk = o.data?.look ?? o.look ?? {};
    const p = {
      id: list.length, pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: rnd() * 6, y: .25, ph: rnd() * 6, wait: rnd() * 3, speed: 0,
      pose: 'stand', lookT: 0, hidden: false, react: 0, ...o, look: 0, // `look` is the head-turn angle; the appearance object passed as `look` lives in `lk`
      style: lk.style ?? (rnd() < .4 ? 'long' : 'short'), skin: lk.skin ?? SKIN[Math.floor(rnd() * SKIN.length)], hairC: lk.hair ?? HAIR[Math.floor(rnd() * HAIR.length)],
      pants: lk.pants ?? PANTS[Math.floor(rnd() * PANTS.length)], scale: lk.scale ?? 1,
    };
    p.shirt = lk.shirt ?? o.shirt ?? (o.data ? roleOf(o.data).color : '#888888');
    list.push(p); return p;
  }
  // local space: feet on y = 0, facing +z. Limbs are built around their pivot (hip, shoulder, neck).
  const PG = (() => {
    const vc = (fn) => { const B = new Batch(); fn(B); return mergeGeometries(B.l); };
    return {
      leg: vc((B) => { B.rb(.17, .44, .19, '#FFFFFF', 0, -.22, 0, .07); B.rb(.19, .1, .28, '#555555', 0, -.43, .045, .04); }),
      torso: vc((B) => { B.rb(.46, .5, .3, '#FFFFFF', 0, .74, 0, .13); B.rb(.44, .12, .28, '#B9B9B9', 0, .53, 0, .05); }),
      arm: RB(.12, .4, .13, .05).translate(0, -.19, 0),
      hand: new THREE.SphereGeometry(.07, 10, 8).translate(0, -.43, 0),
      head: vc((B) => { B.add(new THREE.SphereGeometry(.21, 20, 16), '#FFFFFF', 0, .22, 0); for (const s of [-1, 1]) B.box(.04, .055, .02, '#262626', s * .075, .24, .2); B.add(new THREE.SphereGeometry(.035, 8, 6), '#E9A08A', 0, .19, .21); }),
      hair: new THREE.SphereGeometry(.226, 20, 12, 0, Math.PI * 2, 0, Math.PI * .56).translate(0, .245, -.012),
      long: RB(.4, .44, .12, .05).translate(0, .06, -.16),
      bun: new THREE.SphereGeometry(.1, 12, 8).translate(0, .46, -.12),
    };
  })();
  const PMAT = (vc) => new THREE.MeshStandardMaterial({ roughness: .72, vertexColors: !!vc });
  class Crowd {
    constructor(list, parent, tag) {
      this.list = list; this.tag = tag; const n = Math.max(1, list.length);
      const im = (g, cnt, vc) => { const m = new THREE.InstancedMesh(g, PMAT(vc), cnt); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; parent.add(m); return m; };
      this.legs = im(PG.leg, n * 2, true); this.torso = im(PG.torso, n, true); this.arms = im(PG.arm, n * 2); this.hands = im(PG.hand, n * 2);
      this.head = im(PG.head, n, true); this.hair = im(PG.hair, n); this.long = im(PG.long, n); this.bun = im(PG.bun, n);
      this.shadow = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), BLOB, n); this.shadow.frustumCulled = false; parent.add(this.shadow);
      list.forEach((p) => this.paint(p));
      for (const m of [this.torso, this.head, this.legs, this.arms, this.hair]) m.userData.pick = { t: 'pawn', inst: true, crowd: this };
      this.pick = [this.torso, this.head, this.legs, this.arms, this.hair];
    }
    paint(p) {
      const i = p.id, set = (m, k, c) => { m.setColorAt(k, _c.set(c)); m.instanceColor.needsUpdate = true; };
      set(this.torso, i, p.shirt); set(this.head, i, p.skin); set(this.hair, i, p.hairC); set(this.long, i, p.hairC); set(this.bun, i, p.hairC);
      for (const k of [i * 2, i * 2 + 1]) { set(this.legs, k, p.pants); set(this.arms, k, p.shirt); set(this.hands, k, p.skin); }
    }
    idOf(mesh, inst) { return mesh === this.legs || mesh === this.arms ? Math.floor(inst / 2) : inst; }
    update(t, hoverId = -1, selId = -1) {
      for (const p of this.list) {
        const i = p.id;
        if (p.hidden) { for (const [m, k] of [[this.torso, i], [this.head, i], [this.hair, i], [this.long, i], [this.bun, i], [this.shadow, i], [this.legs, i * 2], [this.legs, i * 2 + 1], [this.arms, i * 2], [this.arms, i * 2 + 1], [this.hands, i * 2], [this.hands, i * 2 + 1]]) m.setMatrixAt(k, _Z); continue; }
        // gait from distance travelled: one full cycle every ~1.1 m
        const sp = Math.min(1, p.speed / 1.4), sit = p.pose === 'sit' || p.pose === 'type';
        const swing = Math.sin(p.ph) * (.15 + .5 * sp) * (p.speed > .05 ? 1 : 0);
        const bob = p.speed > .05 ? Math.abs(Math.cos(p.ph)) * .05 * sp : Math.sin(t * 1.8 + i) * .006;
        const hop = p.react > 0 && !sit ? Math.max(0, Math.sin((1 - p.react / 2.4) * Math.PI * 3)) * .12 * (p.react > 1.4 ? 1 : 0) : 0;
        const sc = (i === hoverId || i === selId) ? 1.14 * p.scale : p.scale;
        _E.set(sp * .08, p.yaw, 0, 'YXZ');
        _B.compose(_v.set(p.pos.x, p.y + bob + hop - (sit ? .3 : 0), p.pos.z), _q.setFromEuler(_E), _s.set(sc, sc, sc));
        this.torso.setMatrixAt(i, _B);
        _M.copy(_B).multiply(_T.makeTranslation(0, .99, 0)).multiply(_R.makeRotationFromEuler(_E.set(p.pose === 'phone' ? .45 : p.pose === 'type' ? .15 : 0, p.look, 0)));
        this.head.setMatrixAt(i, _M); this.hair.setMatrixAt(i, _M);
        this.long.setMatrixAt(i, p.style === 'long' ? _M : _Z); this.bun.setMatrixAt(i, p.style === 'bun' ? _M : _Z);
        for (const s of [0, 1]) {
          const side = s ? 1 : -1, legA = sit ? -1.45 : swing * (s ? 1 : -1);
          _M.copy(_B).multiply(_T.makeTranslation(side * .11, .47, 0)).multiply(_R.makeRotationX(legA));
          this.legs.setMatrixAt(i * 2 + s, _M);
          let armA = -swing * (s ? 1 : -1) * .9, armZ = side * .07;
          if (p.pose === 'phone' && s) { armA = -1.25; armZ = .25; }
          if (p.pose === 'type') { armA = -1.05 + Math.sin(t * 14 + i * 3 + s * 2) * .08; armZ = side * -.05; }
          if (p.pose === 'wave' && s) { armA = -2.6; armZ = .35 + Math.sin(t * 9) * .3; }
          if (p.pose === 'point' && s) { armA = -1.5; armZ = .1; }
          _M.copy(_B).multiply(_T.makeTranslation(side * .29, .95, 0)).multiply(_R.makeRotationFromEuler(_E.set(armA, 0, armZ)));
          this.arms.setMatrixAt(i * 2 + s, _M); this.hands.setMatrixAt(i * 2 + s, _M);
        }
        _M.compose(_v.set(p.pos.x, p.y + .02 - (sit ? .3 : 0), p.pos.z), _q.identity(), _s.set(.95, 1, .95)); this.shadow.setMatrixAt(i, _M);
      }
      for (const m of [this.legs, this.torso, this.arms, this.hands, this.head, this.hair, this.long, this.bun, this.shadow]) m.instanceMatrix.needsUpdate = true;
    }
  }
  // steering: seek a target with arrival, keep personal space, never walk through walls
  function stepPawn(p, list, dt, collideFn) {
    if (p.react > 0) { p.react -= dt; if (p.react <= 0 && p.pose === 'wave') p.pose = p.basePose ?? 'stand'; p.vel.multiplyScalar(Math.exp(-dt * 8)); p.speed = 0; if (p.faceTo != null) p.yaw += wrapA(p.faceTo - p.yaw) * (1 - Math.exp(-dt * 8)); return; }
    if (p.mode !== 'wander') { p.speed = 0; p.vel.set(0, 0, 0); idleLook(p, dt); return; }
    if (p.wait > 0) p.wait -= dt;
    else if (!p.target) {
      for (let i = 0; i < 10 && !p.target; i++) { const c = new THREE.Vector3(p.rect.x0 + rnd() * (p.rect.x1 - p.rect.x0), 0, p.rect.z0 + rnd() * (p.rect.z1 - p.rect.z0)), b = c.clone(); collideFn(c, .7); if (c.distanceToSquared(b) < .001) p.target = b; }
      if (!p.target) p.wait = 1;
    }
    const max = p.slow ? .95 : 1.25, acc = 2.6, want = new THREE.Vector3();
    if (p.target && p.wait <= 0) {
      want.set(p.target.x - p.pos.x, 0, p.target.z - p.pos.z); const d = want.length();
      if (d < .25) { p.target = null; p.wait = 1.2 + rnd() * (p.slow ? 5 : 3); want.set(0, 0, 0); }
      else want.multiplyScalar(max * Math.min(1, d / 1.4) / d); // arrive gently
    }
    for (const q of list) { // personal space
      if (q === p || q.hidden) continue;
      const dx = p.pos.x - q.pos.x, dz = p.pos.z - q.pos.z, d2 = dx * dx + dz * dz;
      if (d2 < .85 && d2 > 1e-6) { const d = Math.sqrt(d2), k = (.92 - d) / .92 * 1.6; want.x += dx / d * k; want.z += dz / d * k; }
    }
    const steer = want.sub(p.vel), lim = acc * dt; if (steer.length() > lim) steer.setLength(lim);
    p.vel.add(steer); if (p.vel.length() > max) p.vel.setLength(max);
    const before = p.pos.clone();
    p.pos.addScaledVector(p.vel, dt); collideFn(p.pos, .35);
    p.y += (groundAt(p.pos.x, p.pos.z) - p.y) * (1 - Math.exp(-dt * 10));
    const moved = before.distanceTo(p.pos); p.speed = moved / Math.max(dt, 1e-4);
    p.ph += moved / .55 * Math.PI; // stride-matched
    if (p.speed > .08) { p.yaw += wrapA(Math.atan2(p.vel.x, p.vel.z) - p.yaw) * (1 - Math.exp(-dt * 7)); p.look *= .9; }
    else idleLook(p, dt);
  }
  function idleLook(p, dt) { p.lookT -= dt; if (p.lookT <= 0) { p.lookT = 2 + rnd() * 4; p.lookTo = (rnd() - .5) * 1.2; } p.look += ((p.lookTo ?? 0) - p.look) * (1 - Math.exp(-dt * 3)); }
  const groundAt = (x, z) => { let y = 0; for (const r of raised) if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) y = Math.max(y, r.y); return y; };
  function collide(p, rad = .45) {
    for (const c of colliders) if (p.x > c.x0 - rad && p.x < c.x1 + rad && p.z > c.z0 - rad && p.z < c.z1 + rad) {
      const dl = p.x - (c.x0 - rad), dr = c.x1 + rad - p.x, dt = p.z - (c.z0 - rad), db = c.z1 + rad - p.z, m = Math.min(dl, dr, dt, db);
      if (m === dl) p.x = c.x0 - rad; else if (m === dr) p.x = c.x1 + rad; else if (m === dt) p.z = c.z0 - rad; else p.z = c.z1 + rad;
    }
    p.x = clamp(p.x, -SLAB.x + 1.5, SLAB.x - 1.5); p.z = clamp(p.z, -SLAB.z + 1.5, SLAB.z - 1.5);
  }

  // who stands where, from the data: active people walk around their place, inactive ones stand still,
  // people waiting for a vehicle wait next to it on their phone, drivers sit inside their car.
  const PAWNS = [];
  const park = PLACES.find((p) => p.kind === 'park');
  function placePeople() {
    const idleCount = new Map();
    for (const q of PEO) {
      const pl = placeById.get(q.place) ?? park, veh = q.vehicle && vehById.get(q.vehicle);
      const isDriving = q.state === 'drive' || (veh && moving(veh) && veh.driver === q.id);
      const p = mkPawn(PAWNS, { data: q, mode: 'idle', rect: pl.hang });
      q._pawn = p;
      if (isDriving || q.state === 'away') { p.hidden = true; continue; }
      if (q.state === 'wait' && veh?._f?.bay) {
        const b = veh._f.bay, side = b.row === 0 && b.rot > 0 ? 1 : -1;
        p.pose = p.basePose = 'phone'; p.pos.set(b.x + .6, .3, b.z + side * (BAY_D / 2 + .7)); p.y = .3; p.yaw = side > 0 ? Math.PI : 0; continue;
      }
      if (q.state === 'wander' || q.state === 'work') { p.mode = 'wander'; p.pos.set(pl.door.x + (rnd() - .5) * 4, .25, pl.door.z + rnd()); collide(p.pos); p.y = groundAt(p.pos.x, p.pos.z); continue; }
      const k = idleCount.get(pl) ?? 0; idleCount.set(pl, k + 1);
      const nIdle = PEO.filter((x) => (placeById.get(x.place) ?? park) === pl && x.state === 'idle').length;
      p.pos.copy(pl.idleSpot ? pl.idleSpot(k, nIdle) : new THREE.Vector3(pl.hang.x0 + rnd() * (pl.hang.x1 - pl.hang.x0), .25, pl.hang.z0 + rnd() * (pl.hang.z1 - pl.hang.z0)));
      collide(p.pos); p.y = groundAt(p.pos.x, p.pos.z);
      if (pl.kind === 'tower') p.yaw = Math.atan2(pl.cx - p.pos.x, pl.cz + .5 - p.pos.z); else p.yaw = (rnd() - .5) * .8;
    }
  }
  // the people you care about, you and Scott: they live in the square and have name tags
  const COMPANIONS = [];
  let ME, DOG, HAT;
  function nameTag(text, parent = root, cls = 'c-name') { const el = document.createElement('div'); el.className = cls; el.textContent = text; const o = new CSS2DObject(el); parent.add(o); return { el, o }; }
  function buildCompanions() {
    const r = park.hang;
    W.companions.forEach((c, i) => {
      const p = mkPawn(PAWNS, { companion: c, mode: 'wander', rect: r, slow: true, look: c.look });
      p.pos.set(park.cx - 9 + i * 5.2, .35, park.cz + 6 - (i % 2) * 2); p.y = .35; p.tag = nameTag(c.name); COMPANIONS.push(p);
    });
    ME = mkPawn(PAWNS, { me: true, mode: 'player', look: { shirt: W.player.shirt, skin: W.player.skin, hair: W.player.hair, style: W.player.style ?? 'short' } });
    ME.pos.set(park.cx, .35, park.cz + 7); ME.y = .35; ME.yaw = ME.h = Math.PI; ME.tag = nameTag(W.player.label ?? `${W.player.name}`);
    const cap = new THREE.Mesh(mergeGeometries([colored(new THREE.SphereGeometry(.235, 18, 8, 0, Math.PI * 2, 0, Math.PI * .45).translate(0, .26, 0), W.player.cap), colored(RB(.3, .04, .22, .02).translate(0, .33, .24), W.player.cap)]), VC);
    cap.matrixAutoUpdate = false; cap.castShadow = true; root.add(cap); HAT = cap;
    // Scott
    const g = new THREE.Group(), B = new Batch(), c = W.pet.coat;
    B.rb(.42, .38, .86, c, 0, .55, 0, .14).rb(.4, .38, .4, c, 0, .82, .5, .14).rb(.22, .17, .2, '#E7C29A', 0, .74, .74, .06).box(.08, .06, .04, '#1B1B1B', 0, .8, .84).box(.42, .08, .12, BRAND, 0, .66, .36);
    for (const s of [-1, 1]) { B.rb(.09, .2, .12, mix(c, '#000000', .45), s * .15, 1.05, .45, .03); B.box(.04, .05, .02, '#1B1B1B', s * .09, .88, .7); }
    B.flush(g);
    const legs = []; for (const [x, z] of [[-.12, .28], [.12, .28], [-.12, -.28], [.12, -.28]]) { const l = new THREE.Mesh(RB(.11, .4, .11, .04).translate(0, -.2, 0), new THREE.MeshStandardMaterial({ color: c, roughness: .8 })); l.position.set(x, .4, z); l.castShadow = true; g.add(l); legs.push(l); }
    const tail = new THREE.Mesh(RB(.08, .08, .36, .03).translate(0, 0, -.18), new THREE.MeshStandardMaterial({ color: c })); tail.position.set(0, .72, -.42); tail.rotation.x = .6; g.add(tail);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.4).rotateX(-Math.PI / 2), BLOB); sh.position.y = .02; g.add(sh);
    const tg = nameTag(W.pet.label ?? 'Scott', g); tg.o.position.set(0, 1.6, 0);
    g.traverse((m) => { if (m.isMesh) { m.userData.pick = { t: 'pet' }; pickables.push(m); } });
    g.scale.setScalar(1.15); g.position.set(park.cx + 1.4, .35, park.cz + 8); root.add(g);
    DOG = { g, legs, tail, tag: tg.el, wag: 0, jump: 0 };
  }
  function writeHat(hat, p) {
    if (p.hidden) { hat.visible = false; return; }
    hat.visible = true;
    _E.set(Math.min(1, p.speed / 1.4) * .08, p.yaw, 0, 'YXZ');
    const bob = p.speed > .05 ? Math.abs(Math.cos(p.ph)) * .05 : 0;
    hat.matrix.compose(_v.set(p.pos.x, p.y + bob, p.pos.z), _q.setFromEuler(_E), _s.set(p.scale, p.scale, p.scale)).multiply(_T.makeTranslation(0, .99, 0));
  }
  let crowd, hoverPawn = -1, selPawn = -1;
