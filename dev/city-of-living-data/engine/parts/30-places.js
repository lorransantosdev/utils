
  // ============================================================================ places
  // Each kind is a small, recognisable model. Size and detail come from the data
  // (bays = capacity, floors = a metric, gold bars = a count), never from decoration.
  const BAY_W = 2.6, BAY_D = 5;
  const placeMat = (p) => (p.mat ??= (() => { const m = VC.clone(); m.emissive = new THREE.Color(BRAND); m.emissiveIntensity = 0; return m; })());
  const pickPlace = (p) => ({ t: 'place', id: p.id });
  function addPickMeshes(p, ...ms) { for (const m of ms) if (m) { m.userData.pick = m.userData.pick ?? pickPlace(p); (p.meshes ??= []).push(m); pickables.push(m); } }
  function bayFill(B, b, col) { B.box(BAY_W - .45, .02, BAY_D - .7, col, b.x, .29, b.z); }
  function dashed(B, b, col) {
    const w = BAY_W - .5, d = BAY_D - .8;
    for (let x = -w / 2; x < w / 2 - .1; x += .5) { B.box(.28, .02, .09, col, b.x + x + .14, .3, b.z - d / 2); B.box(.28, .02, .09, col, b.x + x + .14, .3, b.z + d / 2); }
    for (let z = -d / 2; z < d / 2 - .1; z += .5) { B.box(.09, .02, .28, col, b.x - w / 2, .3, b.z + z + .14); B.box(.09, .02, .28, col, b.x + w / 2, .3, b.z + z + .14); }
  }
  function lot(B, p, cx, lotZ, cap, rowsN = 2) {
    const cols = Math.ceil(cap / rowsN), lotW = cols * BAY_W + 3, lotD = rowsN * BAY_D + (rowsN - 1) * 4 + 1.6;
    B.rb(lotW, .08, lotD, PAL.lot, cx, .27, lotZ, .05);
    raised.push({ x0: cx - lotW / 2, x1: cx + lotW / 2, z0: lotZ - lotD / 2, z1: lotZ + lotD / 2, y: .3 });
    const bays = [], x0 = cx - (cols * BAY_W) / 2;
    for (let row = 0; row < rowsN; row++) {
      const zc = lotZ - lotD / 2 + BAY_D / 2 + .8 + row * (BAY_D + 4), nr = row < rowsN - 1 ? cols : cap - cols * (rowsN - 1);
      for (let c = 0; c <= nr; c++) B.box(.1, .02, BAY_D - .3, PAL.mark, x0 + c * BAY_W, .3, zc);
      for (let c = 0; c < nr; c++) bays.push({ x: x0 + (c + .5) * BAY_W, z: zc, rot: row === 0 && rowsN > 1 ? Math.PI / 2 : -Math.PI / 2, row, n: bays.length + 1, place: p.id });
    }
    p.bays = bays; p.lot = { x0: cx - lotW / 2, x1: cx + lotW / 2, z0: lotZ - lotD / 2, z1: lotZ + lotD / 2 };
    return { lotW, lotD };
  }
  function buildShop(p) {
    const cx = p.cx, cz = p.cz, B = new Batch(), G = new Batch(), y = .25;
    const cap = clamp(Math.max(p.vehicles.length, p.capacity ?? p.vehicles.length, 2), 2, 22);
    const bz = cz - 10.6, bw = 24, bd = 6, H = 4, band = p.color ?? BRAND;
    B.rb(bw, H, bd, PAL.wall, cx, y + H / 2, bz, .4).rb(bw + .3, .55, bd + .3, band, cx, y + H - .45, bz, .2).rb(bw + .1, .3, bd + .1, PAL.trim, cx, y + H + .1, bz, .12);
    G.box(11, 2.3, .12, '#000', cx - 5.2, y + 1.4, bz + bd / 2 + .02);
    for (let i = 0; i <= 5; i++) B.box(.1, 2.4, .16, PAL.dark, cx - 10.7 + i * 2.2, y + 1.4, bz + bd / 2 + .06);
    B.rb(4.6, .18, 1.8, PAL.dark, cx - 5.2, y + 2.9, bz + bd / 2 + .85, .08);
    for (const dx of [4.4, 8.6]) { B.box(3.4, 2.7, .1, '#E9E6E2', cx + dx, y + 1.35, bz + bd / 2 + .03); for (let h = .35; h < 2.7; h += .34) B.box(3.2, .05, .04, '#CFCAC4', cx + dx, y + h, bz + bd / 2 + .1); }
    for (const dx of [-7, 0, 7]) B.rb(1.6, .7, 1.3, '#DAD5CF', cx + dx, y + H + .6, bz - 1, .15);
    B.rb(13, 2.1, .35, band, cx - 1, y + H + 1.45, bz + 1.6, .15).box(.18, 1.1, .18, PAL.dark, cx - 6, y + H + .5, bz + 1.6).box(.18, 1.1, .18, PAL.dark, cx + 4, y + H + .5, bz + 1.6);
    colliders.push({ x0: cx - bw / 2 - .3, x1: cx + bw / 2 + .3, z0: bz - bd / 2 - .3, z1: bz + bd / 2 + .3 });
    p.sign = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 1.9), basic(signTex(p.shown, p.signSub ?? p.sub ?? '', { bg: band })));
    p.sign.position.set(cx - 1, y + H + 1.45, bz + 1.79); p.sign.userData.pick = pickPlace(p); root.add(p.sign); pickables.push(p.sign);
    const lotZ = cz + 2, { lotW } = lot(B, p, cx, lotZ, cap);
    // gate + low fence on the street side
    const gz = cz + BD / 2 - 1.2, gx = cx + lotW / 2 - 2;
    for (let x = cx - BW / 2 + 1.5; x < cx + BW / 2 - 1; x += 1.8) if (Math.abs(x - gx) > 2.4) { B.box(.1, .8, .1, '#C9C4BE', x, y + .4, gz); B.box(1.8, .07, .07, '#C9C4BE', x + .9, y + .72, gz); }
    B.box(.3, 1, .3, PAL.dark, gx - 2.2, y + .5, gz);
    p.arm = new THREE.Group(); p.arm.position.set(gx - 2.2, y + .95, gz); root.add(p.arm);
    const A = new Batch(); for (let i = 0; i < 5; i++) A.box(.85, .13, .13, i % 2 ? '#FFFFFF' : band, .45 + i * .85, 0, 0); const am = A.flush(p.arm, { pick: { t: 'prop', k: 'gate', place: p.id } }); pickables.push(am);
    for (let x = cx - BW / 2 + 2; x < cx + BW / 2; x += 5.5) if (Math.abs(x - gx) > 4) tree(x, cz + BD / 2 - 2.6, .8);
    tree(cx - BW / 2 + 1.8, lotZ - 3, .85); tree(cx - BW / 2 + 1.8, lotZ + 4, .85); tree(cx + BW / 2 - 1.8, lotZ - 3, .85); tree(cx + BW / 2 - 1.8, lotZ + 4, .85);
    addPickMeshes(p, B.flush(root, { mat: placeMat(p) }), G.flush(root, { mat: glassFor(p), cast: false }));
    Object.assign(p, { anchor: new THREE.Vector3(cx, y + H + 7.5, bz - 3), door: new THREE.Vector3(cx - 5.2, y, bz + bd / 2 + 2.2), gate: new THREE.Vector3(gx, y, gz + 2), roof: y + H + 3 });
    p.hang = { x0: p.door.x - 4, x1: p.door.x + 4, z0: p.door.z - .6, z1: p.door.z + .4 };
  }
  function buildCluster(p) {
    const cx = p.cx, cz = p.cz, B = new Batch(), G = new Batch(), y = .25, kz = cz - 10, grey = p.color ?? '#6E737B';
    for (let i = 0; i < 6; i++) {
      const x = cx - 13.5 + i * 5.4;
      B.rb(4.7, 3, 4.4, PAL.wall, x, y + 1.5, kz, .3).rb(4.9, .35, 4.6, '#A9AEB5', x, y + 2.9, kz, .12).rb(5, .14, 1.4, i % 2 ? '#D9DCE0' : '#C6CAD0', x, y + 2.3, kz + 2.7, .05);
      G.box(2.6, 1.6, .1, '#000', x - .6, y + 1.1, kz + 2.22);
    }
    colliders.push({ x0: cx - 16.3, x1: cx + 16.3, z0: kz - 2.5, z1: kz + 2.6 });
    B.rb(9, 1.7, .3, grey, cx, y + 4.6, kz + .5, .12).box(.16, 1.2, .16, PAL.dark, cx - 3, y + 3.5, kz + .5).box(.16, 1.2, .16, PAL.dark, cx + 3, y + 3.5, kz + .5);
    p.sign = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 1.5), basic(signTex(p.shown, p.signSub ?? p.sub ?? '', { bg: grey })));
    p.sign.position.set(cx, y + 4.6, kz + .68); p.sign.userData.pick = pickPlace(p); root.add(p.sign); pickables.push(p.sign);
    const n = Math.max(1, Math.min(8, p.vehicles.length, p.capacity ?? 99));
    if (p.vehicles.length) lot(B, p, cx + 9.5, cz + 6.5, Math.max(n, 4), 1);
    for (let x = cx - BW / 2 + 2; x < cx + BW / 2; x += 5.5) tree(x, cz + BD / 2 - 2.4, .8);
    addPickMeshes(p, B.flush(root, { mat: placeMat(p) }), G.flush(root, { mat: glassFor(p), cast: false }));
    Object.assign(p, { anchor: new THREE.Vector3(cx, y + 7.6, kz), door: new THREE.Vector3(cx, y, kz + 4), gate: new THREE.Vector3(cx, y, cz + 8), roof: y + 5 });
    p.hang = { x0: cx - 15, x1: cx + 2, z0: cz - 5.5, z1: cz + 12 };
    p.idleSpot = (k) => new THREE.Vector3(cx - 15.5 + (k % 13) * 1.3 + (rnd() - .5) * .3, y, cz - 5.6 + Math.floor(k / 13) * 1.5 + (rnd() - .5) * .3);
  }
  let PAD = null, HELI_HOME = null;
  function buildTower(p, first) {
    const cx = p.cx, cz = p.cz, B = new Batch(), G = new Batch(), y = .25, band = p.color ?? BRAND;
    const floors = clamp(Math.round(p.floors ?? 3), 1, 24), tw = 15, td = 10, tz = cz - 8, lobby = 4, fh = 3;
    B.rb(tw, lobby, td, PAL.wall, cx, y + lobby / 2, tz, .4);
    G.box(tw - 3, lobby - 1, .12, '#000', cx, y + (lobby - 1) / 2 + .1, tz + td / 2 + .02);
    B.rb(6, .2, 2.6, PAL.dark, cx, y + lobby - .9, tz + td / 2 + 1.3, .08);
    for (let f = 0; f < floors; f++) {
      const fy = y + lobby + f * fh;
      B.rb(tw - .5, fh - .45, td - .5, PAL.wall, cx, fy + (fh - .45) / 2, tz, .3);
      G.box(tw - 1.2, fh - 1.25, td - .3, '#000', cx, fy + (fh - .45) / 2, tz);
      B.rb(tw + .1, .45, td + .1, band, cx, fy + fh - .22, tz, .15);
    }
    const top = y + lobby + floors * fh;
    colliders.push({ x0: cx - tw / 2 - .3, x1: cx + tw / 2 + .3, z0: tz - td / 2 - .3, z1: tz + td / 2 + .3 });
    const crown = new THREE.Group(); crown.position.y = top; root.add(crown);
    const C = new Batch(); C.rb(tw - 2, 1.3, td - 2, PAL.trim, cx, .65, tz, .25).rb(1.1, 3, 1.1, '#DAD5CF', cx + 4.5, 1.5, tz - 2, .15);
    addPickMeshes(p, C.flush(crown, { mat: placeMat(p) }));
    const lg = plane(signTex(p.signTitle ?? W.meta.brand.name, null, { logo: true, bg: band }), 9, 1.3); lg.position.set(cx, .65, tz + (td - 2) / 2 + .02); crown.add(lg); addPickMeshes(p, lg);
    const lg2 = plane(signTex(p.signTitle ?? W.meta.brand.name, null, { logo: true, bg: band }), 6, 1.1); lg2.position.set(cx, y + lobby - .45, tz + td / 2 + .03); root.add(lg2); addPickMeshes(p, lg2);
    if (p.nextFloor !== false) { // the next floor, dashed: what it takes to grow
      const gg = new THREE.BoxGeometry(tw - .5, fh - .45, td - .5);
      const ghost = new THREE.LineSegments(new THREE.EdgesGeometry(gg), new THREE.LineDashedMaterial({ color: band, dashSize: .45, gapSize: .3 }));
      ghost.position.set(cx, 1.3 + (fh - .45) / 2, tz); ghost.computeLineDistances(); crown.add(ghost);
      const gf = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ color: band, transparent: true, opacity: .06, depthWrite: false })); gf.position.copy(ghost.position); gf.userData.pick = { t: 'prop', k: 'ghost', place: p.id }; crown.add(gf); pickables.push(gf);
    }
    if (first) {
      const pad = new THREE.Vector3(cx - 10, y, cz + 6);
      B.add(new THREE.CylinderGeometry(4.2, 4.2, .08, 40), PAL.dark, pad.x, y + .04, pad.z).add(new THREE.RingGeometry(3.5, 3.8, 48).rotateX(-Math.PI / 2), band, pad.x, y + .1, pad.z);
      B.box(.45, .02, 2.6, '#FFFFFF', pad.x - .9, y + .1, pad.z).box(.45, .02, 2.6, '#FFFFFF', pad.x + .9, y + .1, pad.z).box(1.4, .02, .45, '#FFFFFF', pad.x, y + .1, pad.z);
      PAD = pad; HELI_HOME = pad;
    }
    if (p.vault != null) {
      const vx = cx + 10, vz = cz + 6;
      B.rb(7.6, .3, 5.6, PAL.dark, vx, y + .15, vz, .1).rb(7.6, .3, 5.6, PAL.dark, vx, y + 3.6, vz, .1);
      for (const [dx, dz] of [[-3.6, -2.6], [3.6, -2.6], [-3.6, 2.6], [3.6, 2.6]]) B.box(.22, 3.3, .22, PAL.dark, vx + dx, y + 1.9, vz + dz);
      const vg = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.1, 5.2), new THREE.MeshStandardMaterial({ color: '#D3E8F5', transparent: true, opacity: .2, roughness: .05, depthWrite: false }));
      vg.position.set(vx, y + 1.85, vz); vg.userData.pick = { t: 'prop', k: 'vault', place: p.id }; root.add(vg); pickables.push(vg);
      colliders.push({ x0: vx - 4, x1: vx + 4, z0: vz - 3, z1: vz + 3 });
      const bars = [], nb = Math.min(64, Math.round(p.vault));
      for (let i = 0; i < nb; i++) { const l = Math.floor(i / 8), r = i % 8; bars.push(plain(new THREE.BoxGeometry(.8, .28, .4).translate(vx - 2.4 + (r % 4) * 1.6 + (l % 2) * .35, y + .45 + l * .3, vz - .65 + Math.floor(r / 4) * 1.3))); }
      if (bars.length) { const gm = new THREE.Mesh(mergeGeometries(bars), new THREE.MeshStandardMaterial({ color: '#E8B53A', roughness: .28, metalness: .85, envMapIntensity: 1.5 })); gm.castShadow = true; gm.userData.pick = { t: 'prop', k: 'vault', place: p.id }; root.add(gm); pickables.push(gm); }
    }
    for (let x = cx - BW / 2 + 2; x < cx + BW / 2; x += 6) tree(x, cz + BD / 2 - 2.2, .8);
    addPickMeshes(p, B.flush(root, { mat: placeMat(p) }), G.flush(root, { mat: glassFor(p), cast: false }));
    Object.assign(p, { anchor: new THREE.Vector3(cx, top + 5.4, tz), door: new THREE.Vector3(cx, y, tz + td / 2 + 3), gate: new THREE.Vector3(cx, y, cz + 9), roof: top + 2, crown, floorsN: floors });
    p.hang = { x0: cx - 4.5, x1: cx + 5, z0: cz - 1, z1: cz + 12 };
    p.idleSpot = (k, nIdle) => { const a = k / Math.max(1, nIdle) * Math.PI * 1.5 - Math.PI * .75; return new THREE.Vector3(cx + Math.cos(a) * 2.4, y, cz + .5 + Math.sin(a) * 1.4); };
  }
  function buildOffice(p) {
    const cx = p.cx, cz = p.cz, B = new Batch(), G = new Batch(), y = .25, band = p.color ?? BRAND;
    const floors = clamp(Math.round(p.floors ?? 2), 1, 8), ow = 18, od = 9, oz = cz - 8.5, fh = 2.8;
    for (let f = 0; f < floors; f++) {
      const fy = y + f * fh;
      B.rb(ow, fh - .3, od, PAL.wall, cx, fy + (fh - .3) / 2, oz, .35);
      G.box(ow - 2, fh - 1.3, .12, '#000', cx, fy + fh / 2 - .1, oz + od / 2 + .02);
      B.rb(ow + .2, .32, od + .2, band, cx, fy + fh - .16, oz, .12);
    }
    const top = y + floors * fh;
    B.rb(ow - 1.5, .5, od - 1.5, PAL.trim, cx, top + .25, oz, .15).rb(3.4, .2, 1.6, PAL.dark, cx, y + 2.3, oz + od / 2 + .8, .08);
    colliders.push({ x0: cx - ow / 2 - .3, x1: cx + ow / 2 + .3, z0: oz - od / 2 - .3, z1: oz + od / 2 + .3 });
    p.sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.4), basic(signTex(p.shown, p.signSub ?? p.sub ?? '', { bg: band })));
    p.sign.position.set(cx, top + 1.3, oz + od / 2 - .4); p.sign.userData.pick = pickPlace(p); root.add(p.sign); pickables.push(p.sign);
    B.box(.16, 1.1, .16, PAL.dark, cx - 3.5, top + .8, oz + od / 2 - .5).box(.16, 1.1, .16, PAL.dark, cx + 3.5, top + .8, oz + od / 2 - .5);
    if (p.vehicles.length) lot(B, p, cx + 8.5, cz + 7, Math.max(4, Math.min(8, p.capacity ?? p.vehicles.length)), 1);
    B.add(new THREE.CylinderGeometry(2.2, 2.4, .3, 28), '#E8E3DC', cx - 8, y + .15, cz + 6);
    tree(cx - 8, cz + 6, 1, y + .3);
    for (let x = cx - BW / 2 + 2; x < cx + BW / 2; x += 6) tree(x, cz + BD / 2 - 2.2, .8);
    addPickMeshes(p, B.flush(root, { mat: placeMat(p) }), G.flush(root, { mat: glassFor(p), cast: false }));
    Object.assign(p, { anchor: new THREE.Vector3(cx, top + 4.4, oz), door: new THREE.Vector3(cx, y, oz + od / 2 + 2.4), gate: new THREE.Vector3(cx, y, cz + 9), roof: top + 1 });
    p.hang = { x0: cx - 6, x1: cx + 4, z0: cz - 2, z1: cz + 11 };
    p.idleSpot = (k) => new THREE.Vector3(cx - 4 + (k % 6) * 1.4, y, cz - 1.5 + Math.floor(k / 6) * 1.4);
  }
  let FOUNTAIN = null;
  function buildPark(p, withPad) {
    const cx = p.cx, cz = p.cz, B = new Batch(), y = .25;
    B.rb(BW - 1.6, .1, BD - 1.6, PAL.park, cx, y + .03, cz, .3);
    B.box(BW - 2, .02, 2.4, PAL.path, cx, y + .1, cz).box(2.4, .02, BD - 2, PAL.path, cx, y + .1, cz);
    const F = new Batch();
    F.add(new THREE.CylinderGeometry(3.6, 3.8, .55, 36), '#E8E3DC', cx, y + .3, cz).add(new THREE.CylinderGeometry(3.2, 3.2, .1, 36), PAL.water, cx, y + .55, cz)
      .add(new THREE.CylinderGeometry(.35, .5, 1.5, 14), '#E8E3DC', cx, y + 1, cz).add(new THREE.CylinderGeometry(1.1, .8, .24, 20), '#E8E3DC', cx, y + 1.8, cz);
    const fm = F.flush(root, { pick: { t: 'prop', k: 'fountain' } }); pickables.push(fm);
    FOUNTAIN = { x: cx, z: cz, y: y + 1.9 }; colliders.push({ x0: cx - 3.9, x1: cx + 3.9, z0: cz - 3.9, z1: cz + 3.9 });
    for (const [dx, dz] of [[-9, -7.5], [9, -7.5], [-9, 7.5], [9, 7.5]]) {
      if (withPad && dx < 0 && dz > 0) continue;
      B.add(new THREE.CylinderGeometry(2, 2, .3, 24), '#EADFCF', cx + dx, y + .2, cz + dz);
      for (let a = 0; a < 9; a++) B.add(new THREE.SphereGeometry(.26, 8, 6), a % 3 ? BRAND : mix(BRAND, '#FFFFFF', .6), cx + dx + Math.cos(a * .7) * 1.3, y + .45, cz + dz + Math.sin(a * 1.3) * 1.2);
      tree(cx + dx, cz + dz, 1, y + .35);
    }
    const Bn = new Batch();
    for (const [dx, dz, r] of [[-5.5, -2.6, 0], [5.5, 2.6, Math.PI], [-5.5, 2.6, Math.PI], [5.5, -2.6, 0]]) Bn.rb(2.2, .12, .6, '#B07D58', cx + dx, y + .55, cz + dz, .04, r).rb(2.2, .45, .1, '#B07D58', cx + dx, y + .85, cz + dz + (r ? .3 : -.3), .04, r);
    pickables.push(Bn.flush(root, { pick: { t: 'prop', k: 'bench' } }));
    if (withPad) {
      const pad = new THREE.Vector3(cx - 9, y, cz + 7.5);
      B.add(new THREE.CylinderGeometry(3.4, 3.4, .08, 40), PAL.dark, pad.x, y + .12, pad.z).add(new THREE.RingGeometry(2.8, 3.05, 48).rotateX(-Math.PI / 2), BRAND, pad.x, y + .17, pad.z);
      PAD = pad; HELI_HOME = pad;
    }
    for (let x = cx - BW / 2 + 2; x < cx + BW / 2; x += 4.8) { tree(x, cz - BD / 2 + 1.8, .95); tree(x + 1.2, cz + BD / 2 - 1.8, .95); }
    for (let z = cz - BD / 2 + 6; z < cz + BD / 2 - 4; z += 5) { tree(cx - BW / 2 + 1.8, z, .95); tree(cx + BW / 2 - 1.8, z + 2, .95); }
    addPickMeshes(p, B.flush(root, { mat: placeMat(p) }));
    Object.assign(p, { anchor: new THREE.Vector3(cx, 4, cz), door: new THREE.Vector3(cx, y, cz + 9), gate: new THREE.Vector3(cx, y, cz + 9), roof: 3 });
    p.hang = { x0: cx - 14, x1: cx + 14, z0: cz - 12, z1: cz + 11 };
  }
  function buildGroves() { // blocks with no place become a small grove, so the grid never looks unfinished
    const used = new Set(PLACES.map((p) => p._s.r + ',' + p._s.c)), B = new Batch();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (used.has(r + ',' + c)) continue;
      const cx = (c - (COLS - 1) / 2) * SX, cz = (r - (ROWS - 1) / 2) * SZ;
      B.rb(BW, .5, BD, PAL.walk, cx, 0, cz, .35).rb(BW - 1.6, .1, BD - 1.6, PAL.park, cx, .28, cz, .3); raised.push({ x0: cx - BW / 2, x1: cx + BW / 2, z0: cz - BD / 2, z1: cz + BD / 2, y: .25 });
      for (let i = 0; i < 16; i++) tree(cx + (rnd() - .5) * (BW - 6), cz + (rnd() - .5) * (BD - 6), 1.1, .35);
    }
    B.flush(root, { cast: false });
  }
  function buildPlaces() {
    buildGroves();
    let firstTower = true;
    const park = PLACES.find((p) => p.kind === 'park'), hasTower = PLACES.some((p) => p.kind === 'tower');
    for (const p of PLACES) {
      if (p.kind === 'shop') buildShop(p);
      else if (p.kind === 'cluster') buildCluster(p);
      else if (p.kind === 'tower') { buildTower(p, firstTower); firstTower = false; }
      else if (p.kind === 'office') buildOffice(p);
      else if (p.kind === 'park') buildPark(p, !hasTower && p === park);
      else { p.kind = 'shop'; buildShop(p); }
      p.enterable = ENTERABLE[p.kind] && p.enter !== false;
    }
  }
  // free bays green, bays whose vehicle is out dashed: rebuilt when states change
  let bayMesh = null, bayHits = null;
  function paintBays() {
    if (bayMesh) { root.remove(bayMesh); bayMesh.geometry.dispose(); }
    const B = new Batch();
    for (const p of PLACES) for (const b of p.bays ?? []) { const v = b.vehicle && vehById.get(b.vehicle); if (!v) bayFill(B, b, '#D7F2E3'); else if (moving(v)) dashed(B, b, BRAND); }
    bayMesh = B.flush(root, { cast: false });
    if (!bayHits) { // one invisible box per bay, so every bay answers a click
      const all = PLACES.flatMap((p) => p.bays ?? []);
      bayHits = new THREE.InstancedMesh(new THREE.BoxGeometry(BAY_W - .3, .4, BAY_D - .5), HIDDEN, Math.max(1, all.length));
      all.forEach((b, i) => { _m.compose(_v.set(b.x, .4, b.z), _q.identity(), _s.set(1, 1, 1)); bayHits.setMatrixAt(i, _m); });
      bayHits.userData.pick = { t: 'prop', k: 'bay', inst: true, bays: all }; root.add(bayHits); pickables.push(bayHits);
    }
  }
