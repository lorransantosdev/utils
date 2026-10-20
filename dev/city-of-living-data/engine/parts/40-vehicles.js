
  // ============================================================================ vehicles (instanced: a handful of draw calls for the whole fleet)
  const CAR_GEO = { body: RB(3.4, .72, 1.62, .24).translate(0, .58, 0), cab: RB(1.95, .66, 1.44, .26).translate(-.2, 1.2, 0) };
  { const B = new Batch();
    for (const [x, z] of [[1.1, .78], [1.1, -.78], [-1.1, .78], [-1.1, -.78]]) B.add(new THREE.CylinderGeometry(.34, .34, .26, 16).rotateX(Math.PI / 2), '#1E2024', x, .34, z);
    for (const z of [-.5, .5]) { B.box(.06, .14, .34, '#FFF4D6', 1.71, .66, z); B.box(.06, .12, .3, '#D3262B', -1.71, .7, z); }
    B.box(3.46, .16, 1.66, '#2A2D33', 0, .3, 0); CAR_GEO.det = mergeGeometries(B.l); }
  const CAP_V = VEH.length + 24;
  const FLEET = [];
  const carBody = new THREE.InstancedMesh(CAR_GEO.body, new THREE.MeshStandardMaterial({ roughness: .32, metalness: .22, envMapIntensity: 1.2 }), CAP_V);
  const carCab = new THREE.InstancedMesh(CAR_GEO.cab, new THREE.MeshStandardMaterial({ color: '#33465A', roughness: .08, metalness: .3, transparent: true, opacity: .58, envMapIntensity: 1.6, depthWrite: false }), CAP_V);
  const carDet = new THREE.InstancedMesh(CAR_GEO.det, VC, CAP_V);
  const carBlob = new THREE.InstancedMesh(new THREE.PlaneGeometry(4.4, 2.5).rotateX(-Math.PI / 2), BLOB, CAP_V);
  const carHead = new THREE.InstancedMesh(new THREE.SphereGeometry(.22, 14, 10).translate(-.05, 1.12, -.3), new THREE.MeshStandardMaterial({ roughness: .7 }), CAP_V);
  const carTorso = new THREE.InstancedMesh(RB(.4, .42, .44, .14).translate(-.05, .78, -.3), new THREE.MeshStandardMaterial({ roughness: .7 }), CAP_V);
  // night: headlights, tail lights and a soft beam on the road (only for cars that are moving)
  const beamTex = canvasTex((x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,230,170,.55)'); g.addColorStop(1, 'rgba(255,230,170,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(0, h * .38); x.lineTo(w, 0); x.lineTo(w, h); x.lineTo(0, h * .62); x.closePath(); x.fill(); }, 256, 128);
  const carLamp = new THREE.InstancedMesh(mergeGeometries([plain(new THREE.BoxGeometry(.08, .16, .36).translate(1.73, .66, -.5)), plain(new THREE.BoxGeometry(.08, .16, .36).translate(1.73, .66, .5))]), new THREE.MeshStandardMaterial({ color: '#FFF4D6', emissive: '#FFE3A6', emissiveIntensity: 2.2 }), CAP_V);
  const carTail = new THREE.InstancedMesh(mergeGeometries([plain(new THREE.BoxGeometry(.08, .14, .32).translate(-1.73, .7, -.5)), plain(new THREE.BoxGeometry(.08, .14, .32).translate(-1.73, .7, .5))]), new THREE.MeshStandardMaterial({ color: '#D3262B', emissive: '#FF2D2D', emissiveIntensity: 1.6 }), CAP_V);
  const carBeam = new THREE.InstancedMesh(new THREE.PlaneGeometry(6.5, 4.2).rotateX(-Math.PI / 2).translate(4.9, .06, 0), new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), CAP_V);
  for (const m of [carLamp, carTail, carBeam]) m.visible = false;
  const carIMs = [carBody, carCab, carDet, carBlob, carHead, carTorso, carLamp, carTail, carBeam];
  for (const m of carIMs) { m.count = 0; m.frustumCulled = false; if (m !== carBlob && m !== carCab) { m.castShadow = true; m.receiveShadow = true; } root.add(m); }
  carBody.userData.pick = carCab.userData.pick = carDet.userData.pick = { t: 'vehicle', inst: true };
  carHead.userData.pick = carTorso.userData.pick = { t: 'driver', inst: true };
  pickables.push(carBody, carCab, carDet, carHead, carTorso);
  const SKIN = ['#F1C9A5', '#E0AC86', '#C68B64', '#9C6644', '#7A4A2E', '#EAC0A0'];
  let hoverV = -1, selV = -1;
  function addFleet(v) {
    const f = { v, i: FLEET.length, pos: new THREE.Vector3(), yaw: 0, y: .3, bay: null, r: null, hop: 0, hidden: false };
    FLEET.push(f); v._f = f;
    for (const m of carIMs) m.count = FLEET.length;
    carBody.setColorAt(f.i, _c.set(v.color)); carBody.instanceColor.needsUpdate = true;
    const dr = v.driver && perById.get(v.driver);
    carHead.setColorAt(f.i, _c.set(dr?.look?.skin ?? SKIN[f.i % SKIN.length])); carTorso.setColorAt(f.i, _c.set(dr?.look?.shirt ?? W.roles.driver?.color ?? '#3B82F6'));
    carHead.instanceColor.needsUpdate = carTorso.instanceColor.needsUpdate = true;
    return f;
  }
  function writeCar(f) {
    if (f.hidden) { for (const m of carIMs) m.setMatrixAt(f.i, _Z); return; }
    const sc = f.i === hoverV || f.i === selV ? 1.08 : 1, hop = f.hop > 0 ? Math.sin((1 - f.hop / .6) * Math.PI) * .45 : 0;
    // the body leans out in turns and dips its nose when braking
    const roll = clamp(-(f.yawRate ?? 0) * (f.r?.v ?? 0) * .018, -.09, .09), pitch = clamp((f.acc ?? 0) * .012, -.05, .05);
    _q.setFromEuler(_E.set(roll, f.yaw, pitch, 'YXZ')); _s.set(sc, sc, sc); _v.set(f.pos.x, f.y + hop, f.pos.z);
    _m.compose(_v, _q, _s);
    carBody.setMatrixAt(f.i, _m); carCab.setMatrixAt(f.i, _m); carDet.setMatrixAt(f.i, _m);
    const drv = moving(f.v) || f.packet;
    carHead.setMatrixAt(f.i, drv ? _m : _Z); carTorso.setMatrixAt(f.i, drv ? _m : _Z);
    carLamp.setMatrixAt(f.i, drv ? _m : _Z); carTail.setMatrixAt(f.i, drv ? _m : _Z); carBeam.setMatrixAt(f.i, drv ? _m : _Z);
    _s.set(1, 1, 1); _v.set(f.pos.x, f.y + .02, f.pos.z); _m.compose(_v, _q, _s); carBlob.setMatrixAt(f.i, _m);
  }
  const flushCars = () => { for (const m of carIMs) m.instanceMatrix.needsUpdate = true; };
  function assignBays() {
    for (const p of PLACES) {
      const bays = p.bays ?? [];
      for (const b of bays) b.vehicle = null;
      const order = [...p.vehicles.filter((v) => !moving(v)), ...p.vehicles.filter((v) => moving(v))];
      order.forEach((v, i) => { const f = v._f; f.bay = bays[i] ?? null; if (f.bay) f.bay.vehicle = v.id; });
    }
  }
  function parkAt(f) {
    if (!f.bay) { f.hidden = true; return; }
    f.hidden = false; f.pos.set(f.bay.x, 0, f.bay.z); f.yaw = f.bay.rot; f.y = .3; f.r = null;
  }
  // alert pins over vehicles (red = urgent, amber = soon)
  const pinHead = new THREE.InstancedMesh(new THREE.SphereGeometry(.32, 16, 12).translate(0, .62, 0), new THREE.MeshStandardMaterial({ roughness: .35 }), CAP_V);
  const pinCone = new THREE.InstancedMesh(new THREE.ConeGeometry(.2, .5, 14).rotateX(Math.PI).translate(0, .25, 0), new THREE.MeshStandardMaterial({ roughness: .4 }), CAP_V);
  pinHead.frustumCulled = pinCone.frustumCulled = false; root.add(pinHead, pinCone);
  pinHead.userData.pick = pinCone.userData.pick = { t: 'pin', inst: true }; pickables.push(pinHead);
  function writePins(t) {
    pinHead.count = pinCone.count = FLEET.length;
    for (const f of FLEET) {
      const sev = f.v.alert; if (!sev || f.hidden || sev === 'blue') { pinHead.setMatrixAt(f.i, _Z); pinCone.setMatrixAt(f.i, _Z); continue; }
      const col = sev === 'red' ? '#E5484D' : '#F59E0B'; pinHead.setColorAt(f.i, _c.set(col)); pinCone.setColorAt(f.i, _c.set(col));
      _v.set(f.pos.x, f.y + 2 + Math.sin(t * 2.4 + f.i) * .1, f.pos.z); _m.compose(_v, _q.identity(), _s.set(1, 1, 1)); pinHead.setMatrixAt(f.i, _m); pinCone.setMatrixAt(f.i, _m);
    }
    pinHead.instanceMatrix.needsUpdate = pinCone.instanceMatrix.needsUpdate = true;
    if (pinHead.instanceColor) pinHead.instanceColor.needsUpdate = pinCone.instanceColor.needsUpdate = true;
  }

  // ============================================================================ traffic: lanes, stop lines, one car per junction
  const segPts = (a, b) => {
    const dx = Math.sign(b.x - a.x), dz = Math.sign(b.z - a.z), rx = -dz, rz = dx;
    return { dx, dz, rx, rz, s: new THREE.Vector3(a.x + dx * TURN + rx * LANE, 0, a.z + dz * TURN + rz * LANE), e: new THREE.Vector3(b.x - dx * TURN + rx * LANE, 0, b.z - dz * TURN + rz * LANE) };
  };
  const pickNext = (prev, cur) => { const o = cur.nb.filter((x) => x !== prev); return o[Math.floor(rnd() * o.length)] ?? prev; };
  const LANES = new Map(), LOCK = new Map();
  const laneOf = (a, b) => { const k = `${a.i},${a.j}>${b.i},${b.j}`; if (!LANES.has(k)) LANES.set(k, []); return LANES.get(k); };
  const GAP = 6.6, STOP = 2.4;
  function bezLen(a, b, c) { let L = 0, px = a.x, pz = a.z; for (let i = 1; i <= 10; i++) { const u = i / 10, k = 1 - u, x = a.x * k * k + b.x * 2 * k * u + c.x * u * u, z = a.z * k * k + b.z * 2 * k * u + c.z * u * u; L += Math.hypot(x - px, z - pz); px = x; pz = z; } return L; }
  const nearestNode = (pt) => NODES.reduce((a, b) => (Math.hypot(b.x - pt.x, b.z - pt.z) < Math.hypot(a.x - pt.x, a.z - pt.z) ? b : a));
  function joinTraffic(f, a, b) {
    if (!a) { const p = placeById.get(f.v.place); a = nearestNode(p?.gate ?? new THREE.Vector3()); b = a.nb[Math.floor(rnd() * a.nb.length)]; }
    const r = f.r = { a, b, c: pickNext(a, b), phase: 'seg', v: 0, vmax: 5.6 + rnd() * 1.4, go: true };
    r.len = segPts(a, b).s.distanceTo(segPts(a, b).e);
    // take the spot of the lane farthest from every car already on it (never on top of another car)
    const L = laneOf(a, b); let best = rnd() * r.len * .6, bestGap = -1;
    if (L.length) for (let s = 0; s < r.len - 1; s += .5) { const g = Math.min(...L.map((o) => Math.abs(o.r.s - s))); if (g > bestGap + .01) { bestGap = g; best = s; } }
    r.s = best; L.push(f);
    f.y = .06; f.hidden = false; placeCar(f, 0);
  }
  function leaveTraffic(f) {
    const r = f.r; if (!r) return;
    if (r.phase === 'seg') { const L = laneOf(r.a, r.b), i = L.indexOf(f); if (i >= 0) L.splice(i, 1); }
    for (const [k, o] of LOCK) if (o === f) LOCK.delete(k);
    f.r = null;
  }
  function setupTraffic() {
    const edges = []; for (const a of NODES) for (const b of a.nb) edges.push([a, b]);
    edges.sort(() => rnd() - .5);
    // spread the cars: each one takes the emptiest lane it can find, at most one car per ~2·GAP of lane
    FLEET.filter((f) => moving(f.v)).forEach((f, i) => {
      let pick = edges[i * 2 % edges.length], room = -1;
      for (let k = 0; k < edges.length; k++) { const [a, b] = edges[(i * 2 + k) % edges.length], n = laneOf(a, b).length, len = segPts(a, b).s.distanceTo(segPts(a, b).e), free = len / (GAP * 2) - n; if (free > room) { room = free; pick = [a, b]; } if (n === 0) break; }
      joinTraffic(f, pick[0], pick[1]);
    });
  }
  const _p = new THREE.Vector3(), _f = new THREE.Vector3(), _g = new THREE.Vector3();
  function driveCar(f, dt, t) {
    const r = f.r;
    let target = r.vmax;
    if (r.phase === 'seg') {
      let gap = Infinity; for (const o of laneOf(r.a, r.b)) if (o !== f && o.r.s > r.s) gap = Math.min(gap, o.r.s - r.s);
      target = Math.min(target, Math.max(0, gap - GAP) * 1.5);
      const light = r.b.nb.length < 3 || lightPhase(t) === (r.a.z === r.b.z ? 'x' : 'z');
      const lock = LOCK.get(r.b); let room = Infinity; for (const o of laneOf(r.b, r.c)) room = Math.min(room, o.r.s);
      r.go = light && (!lock || lock === f) && room > GAP + 1.5;
      if (f.dest && r.b === f.dest) r.go = false; // a journey's courier stops at its destination
      if (!r.go) target = Math.min(target, Math.max(0, r.len - STOP - r.s) * 1.6);
    } else target = r.vmax * .72;
    if (f.hold > 0) { f.hold -= dt; target = 0; }
    const v0 = r.v;
    r.v += (target - r.v) * (1 - Math.exp(-dt * (target < r.v ? 7 : 1.8)));
    if (dt) f.acc = THREE.MathUtils.lerp(f.acc ?? 0, (r.v - v0) / dt, 1 - Math.exp(-dt * 6));
    r.s += r.v * dt;
    if (r.phase === 'seg') {
      if (!r.go && r.s > r.len - STOP) { r.s = r.len - STOP; r.v = 0; }
      if (r.go && r.s >= r.len) {
        LOCK.set(r.b, f); const L = laneOf(r.a, r.b); L.splice(L.indexOf(f), 1);
        r.s -= r.len; r.phase = 'turn';
        const A = segPts(r.a, r.b), C = segPts(r.b, r.c);
        r.p0 = A.e; r.p2 = C.s;
        r.p1 = A.dx === C.dx && A.dz === C.dz ? A.e.clone().lerp(C.s, .5) : new THREE.Vector3(r.b.x + (A.rx + C.rx) * LANE, 0, r.b.z + (A.rz + C.rz) * LANE);
        r.len = bezLen(r.p0, r.p1, r.p2);
      }
    }
    if (r.phase === 'turn' && r.s >= r.len) {
      if (LOCK.get(r.b) === f) LOCK.delete(r.b);
      r.s = Math.min(r.s - r.len, 1); r.phase = 'seg';
      const nc = f.route ? f.route.shift() ?? pickNext(r.b, r.c) : pickNext(r.b, r.c); r.a = r.b; r.b = r.c; r.c = nc;
      r.len = segPts(r.a, r.b).s.distanceTo(segPts(r.a, r.b).e); laneOf(r.a, r.b).push(f);
    }
    placeCar(f, dt);
  }
  function placeCar(f, dt) {
    const r = f.r; let yaw;
    if (r.phase === 'seg') { const Sg = segPts(r.a, r.b); _p.copy(Sg.s).lerp(Sg.e, Math.max(0, r.s) / r.len); yaw = Math.atan2(-Sg.dz, Sg.dx); }
    else {
      const u = Math.min(1, r.s / r.len), k = 1 - u;
      _p.set(0, 0, 0).addScaledVector(r.p0, k * k).addScaledVector(r.p1, 2 * k * u).addScaledVector(r.p2, u * u);
      _f.copy(r.p1).sub(r.p0).multiplyScalar(2 * k).add(_g.copy(r.p2).sub(r.p1).multiplyScalar(2 * u)); yaw = Math.atan2(-_f.z, _f.x);
    }
    f.pos.copy(_p);
    if (!dt) f.yaw = yaw; else { const d = wrapA(yaw - f.yaw), dy = d * (1 - Math.exp(-dt * 12)); f.yaw += dy; f.yawRate = THREE.MathUtils.lerp(f.yawRate ?? 0, dy / dt, 1 - Math.exp(-dt * 8)); }
  }
  // a vehicle changes state (live data, replay): it leaves its bay for the road, or comes back to it
  // the courier of a journey: drives from one place to another along the streets, obeying the lights
  let COURIER = null;
  function bfs(a, b) { const prev = new Map([[a, null]]), q = [a]; while (q.length) { const n = q.shift(); if (n === b) break; for (const m of n.nb) if (!prev.has(m)) { prev.set(m, n); q.push(m); } } const path = []; for (let n = b; n; n = prev.get(n)) path.unshift(n); return path; }
  function courierGo(fromId, toId, color) {
    const A = placeById.get(fromId), B = placeById.get(toId); if (!A || !B) return null;
    if (!COURIER) { COURIER = addFleet({ id: '__courier', name: '', color: color ?? BRAND, state: '__courier' }); COURIER.packet = true; }
    const f = COURIER; leaveTraffic(f); carBody.setColorAt(f.i, _c.set(color ?? BRAND)); carBody.instanceColor.needsUpdate = true;
    const a = nearestNode(A.gate), b = nearestNode(B.gate);
    let path = bfs(a, b); if (path.length < 2) path = [a.nb[0], a];
    joinTraffic(f, path[0], path[1]); f.r.s = 0; f.r.c = path[2] ?? pickNext(path[0], path[1]); f.route = path.slice(3); f.dest = path.at(-1); f.r.vmax = 7.5;
    placeCar(f, 0); return f;
  }
  function courierStop() { if (COURIER) { leaveTraffic(COURIER); COURIER.hidden = true; COURIER.dest = null; } }
  function syncVehicle(v) {
    const f = v._f ?? addFleet(v);
    if (moving(v)) { if (!f.r) joinTraffic(f); }
    else { leaveTraffic(f); parkAt(f); }
  }
