
  // ============================================================================ entities
  const PLACES = W.places, VEH = W.vehicles, PEO = W.people, ACTS = W.actions;
  const placeById = new Map(), vehById = new Map(), perById = new Map();
  const reindex = () => {
    placeById.clear(); vehById.clear(); perById.clear();
    PLACES.forEach((p) => placeById.set(p.id, p)); VEH.forEach((v) => vehById.set(v.id, v)); PEO.forEach((p) => perById.set(p.id, p));
    for (const p of PLACES) { p.vehicles = VEH.filter((v) => v.place === p.id); p.people = PEO.filter((q) => q.place === p.id); }
  };
  reindex();
  const stOf = (v) => W.states[v.state] ?? { label: v.state, tone: 'muted' };
  const moving = (v) => !!stOf(v).moving;
  const roleOf = (p) => W.roles[p.role] ?? { label: p.role ?? '', color: '#888888' };
  const ENTERABLE = { shop: true, office: true, tower: true, cluster: true };
  const initials = (n) => String(n ?? '').split(/\s+/).filter((w) => w && !/^(d[aeo]s?|de|of|the|and|e)$/i.test(w)).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '·';
  let hideNames = false; const NAMES_KEY = W.meta.hideNamesKey ?? 'cold-hide-names:' + W.meta.title;
  try { hideNames = localStorage.getItem(NAMES_KEY) === '1'; } catch {}
  const hasPrivate = PLACES.some((p) => p.private) || PEO.some((p) => p.private);
  function applyNames() {
    let n = 0;
    for (const p of PLACES) {
      if (p.private) n++;
      const hide = hideNames && p.private;
      p.shown = hide ? `${W.meta.alias.place} ${n}` : (p.name ?? p.id);
      p.markShown = hide ? (W.meta.alias.place[0] + n) : (p.mark ?? initials(p.name ?? p.id));
    }
    for (const q of PEO) q.shown = hideNames && q.private ? roleOf(q).label : (q.name ?? roleOf(q).label);
  }
  applyNames();
  const nameOfRef = (r) => r.t === 'place' ? placeById.get(r.id)?.shown : r.t === 'vehicle' ? vehById.get(r.id)?.name : r.t === 'person' ? perById.get(r.id)?.shown : '';
  // every to-do points somewhere; to-dos of a place include the ones of its vehicles and people
  const actionsOf = (pl) => ACTS.filter((a) => a.place === pl.id || (a.target?.t === 'vehicle' && vehById.get(a.target.id)?.place === pl.id) || (a.target?.t === 'person' && perById.get(a.target.id)?.place === pl.id) || (a.target?.t === 'place' && a.target.id === pl.id));
  const SEV = { red: 0, amber: 1, blue: 2, muted: 3 };
  const sortActs = (l) => l.slice().sort((a, b) => (SEV[a.sev] ?? 3) - (SEV[b.sev] ?? 3));

  // ============================================================================ the plan: blocks on a slab
  const BW = 34, BD = 30, RW = 8, SX = BW + RW, SZ = BD + RW;
  const NPL = PLACES.length;
  const COLS = NPL <= 3 ? NPL : NPL === 4 ? 2 : NPL <= 6 ? 3 : NPL <= 8 ? 4 : NPL === 9 ? 3 : 4, ROWS = Math.ceil(NPL / COLS);
  { // tall buildings go to the back rows, centre first; everything else fills from the front
    const slots = []; for (let r = ROWS - 1; r >= 0; r--) for (let c = 0; c < COLS; c++) slots.push({ r, c });
    const backCentre = slots.slice().sort((a, b) => a.r - b.r || Math.abs(a.c - (COLS - 1) / 2) - Math.abs(b.c - (COLS - 1) / 2));
    const used = new Set(), take = (s) => { used.add(s); return s; };
    const tall = PLACES.filter((p) => p.kind === 'tower' || p.kind === 'office');
    for (const p of PLACES) if (p.slot) p._s = take(slots.find((s) => s.r === p.slot.row && s.c === p.slot.col) ?? slots.find((s) => !used.has(s)));
    for (const p of tall) if (!p._s) p._s = take(backCentre.find((s) => !used.has(s)));
    for (const p of PLACES) if (!p._s) p._s = take(slots.find((s) => !used.has(s)));
    for (const p of PLACES) { p.cx = (p._s.c - (COLS - 1) / 2) * SX; p.cz = (p._s.r - (ROWS - 1) / 2) * SZ; p.rect = { x0: p.cx - BW / 2, x1: p.cx + BW / 2, z0: p.cz - BD / 2, z1: p.cz + BD / 2 }; }
  }
  const XS = Array.from({ length: COLS + 1 }, (_, i) => (i - COLS / 2) * SX), ZS = Array.from({ length: ROWS + 1 }, (_, j) => (j - ROWS / 2) * SZ);
  const SLAB = { x: COLS * SX / 2 + 4 + 9, z: ROWS * SZ / 2 + 4 + 8 };
  const S = Math.max(SLAB.x, SLAB.z);
  sun.position.set(-S * .8, S * 1.45, S * .6); sun.target.position.set(0, 0, 0);
  Object.assign(sun.shadow.camera, { left: -S * 1.25, right: S * 1.25, top: S * 1.05, bottom: -S * 1.05, near: 1, far: S * 5 }); sun.shadow.camera.updateProjectionMatrix();
  const root = new THREE.Group(); scene.add(root);
  const colliders = [], raised = [], pickables = [];
  const NODES = [];
  for (let j = 0; j <= ROWS; j++) for (let i = 0; i <= COLS; i++) NODES.push({ i, j, x: XS[i], z: ZS[j], nb: [] });
  const nodeAt = (i, j) => NODES[j * (COLS + 1) + i];
  for (const nd of NODES) { if (nd.i > 0) nd.nb.push(nodeAt(nd.i - 1, nd.j)); if (nd.i < COLS) nd.nb.push(nodeAt(nd.i + 1, nd.j)); if (nd.j > 0) nd.nb.push(nodeAt(nd.i, nd.j - 1)); if (nd.j < ROWS) nd.nb.push(nodeAt(nd.i, nd.j + 1)); }
  const LANE = 2, TURN = 5.8;

  function buildBase() {
    const B = new Batch();
    B.rb(SLAB.x * 2, 5, SLAB.z * 2, PAL.slab, 0, -2.55, 0, 2.2);
    B.box(SLAB.x * 2 - 1.2, .06, SLAB.z * 2 - 1.2, PAL.grass, 0, -.02, 0);
    B.flush(root, { cast: false });
    const R = new Batch();
    R.box(XS[COLS] - XS[0] + RW, .06, ZS[ROWS] - ZS[0] + RW, PAL.road, 0, .02, 0);
    R.flush(root, { cast: false });
    const M = new Batch(), Wc = PAL.mark;
    for (const a of NODES) for (const b of a.nb) {
      if (!(b.i > a.i || b.j > a.j)) continue;
      const L = Math.hypot(b.x - a.x, b.z - a.z), dx = (b.x - a.x) / L, dz = (b.z - a.z) / L;
      for (let s = TURN + 1.5; s < L - TURN - 1.5; s += 3.2) M.box(dx ? 1.6 : .16, .02, dx ? .16 : 1.6, Wc, a.x + dx * (s + .8), .06, a.z + dz * (s + .8));
    }
    for (const a of NODES) for (const b of a.nb) {
      const dx = Math.sign(b.x - a.x), dz = Math.sign(b.z - a.z), cx = a.x + dx * 5, cz = a.z + dz * 5;
      for (let k = -3; k <= 3; k += .85) M.box(dx ? 1.3 : .42, .02, dx ? .42 : 1.3, Wc, dx ? cx : a.x + k, .061, dx ? a.z + k : cz);
    }
    M.flush(root, { cast: false });
    const Sd = new Batch();
    for (const p of PLACES) { Sd.rb(BW, .5, BD, PAL.walk, p.cx, 0, p.cz, .35); raised.push({ ...p.rect, y: .25 }); }
    Sd.flush(root, { cast: false });
  }

  // trees: two instanced meshes for the whole city; each one wiggles when clicked
  const TREES = [];
  const tree = (x, z, s = 1, y = .25) => TREES.push({ x, z, s: s * (.85 + rnd() * .35), y, t: Math.floor(rnd() * 3), ry: rnd() * 6, sy: 1 + rnd() * .2, w: 0 });
  let trunkIM, crownIM;
  function writeTree(i, t) {
    const tr = TREES[i], wig = tr.w > 0 ? Math.sin(t * 22) * tr.w * .12 : 0;
    _m.compose(_v.set(tr.x, tr.y, tr.z), _q.setFromEuler(_E.set(wig, tr.ry, wig * .7)), _s.set(tr.s, tr.s * tr.sy, tr.s));
    trunkIM.setMatrixAt(i, _m); crownIM.setMatrixAt(i, _m);
  }
  function flushTrees() {
    trunkIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(.13, .18, 1.4, 6).translate(0, .7, 0), new THREE.MeshStandardMaterial({ color: '#9A7357', roughness: .9 }), TREES.length);
    crownIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.05, 1).translate(0, 2.05, 0), new THREE.MeshStandardMaterial({ roughness: .85, flatShading: true }), TREES.length);
    TREES.forEach((tr, i) => { writeTree(i, 0); crownIM.setColorAt(i, _c.set(PAL.trees[tr.t])); });
    for (const im of [trunkIM, crownIM]) { im.castShadow = true; im.receiveShadow = true; im.userData.pick = { t: 'prop', k: 'tree', inst: true }; root.add(im); pickables.push(im); }
  }
  function borderTrees() {
    for (let x = -SLAB.x + 3; x <= SLAB.x - 3; x += 4.6) { tree(x + (rnd() - .5), -SLAB.z + 2.6, .9, 0); tree(x + (rnd() - .5), SLAB.z - 2.6, .9, 0); }
    for (let z = -SLAB.z + 7; z <= SLAB.z - 7; z += 4.6) { tree(-SLAB.x + 2.6, z, .9, 0); tree(SLAB.x - 2.6, z, .9, 0); }
  }

  // traffic lights: streets along x and along z take turns (12 s cycle)
  const LAMP = {}; for (const k of ['xr', 'xg', 'zr', 'zg']) LAMP[k] = new THREE.MeshStandardMaterial({ color: '#2A2D33', emissive: k.endsWith('r') ? '#FF3B30' : '#22E07A', emissiveIntensity: 0 });
  const LIGHTS = [];
  function buildLights() {
    const B = new Batch(), L = { xr: [], xg: [], zr: [], zg: [] };
    for (const nd of NODES) {
      if (nd.nb.length < 3) continue;
      for (const [sx, sz, ax] of [[1, 1, 'x'], [-1, -1, 'x'], [1, -1, 'z'], [-1, 1, 'z']]) {
        const x = nd.x + sx * 4.7, z = nd.z + sz * 4.7;
        B.box(.14, 2.6, .14, '#3A3D44', x, 1.55, z).rb(.36, .7, .32, '#2A2D33', x, 3.0, z, .1);
        L[ax + 'r'].push(plain(new THREE.SphereGeometry(.1, 8, 6).translate(x, 3.18, z + .17 * Math.sign(sz))));
        L[ax + 'g'].push(plain(new THREE.SphereGeometry(.1, 8, 6).translate(x, 2.84, z + .17 * Math.sign(sz))));
        LIGHTS.push({ x, z, ax });
      }
    }
    const m = B.flush(root); if (m) { m.userData.pick = { t: 'prop', k: 'light' }; pickables.push(m); }
    for (const k of Object.keys(L)) if (L[k].length) root.add(new THREE.Mesh(mergeGeometries(L[k]), LAMP[k]));
  }
  const lightPhase = (t) => { const c = t % 12; return c < 5.3 ? 'x' : c < 6 ? null : c < 11.3 ? 'z' : null; };
