
  // ============================================================================ inside the buildings
  // Every enterable place opens into a cut-away room built from the same data as the city: one key per
  // vehicle on the key board (an orange tag = the vehicle is out), the place's numbers on the wall screen,
  // its to-dos as notes on the cork board (each note opens what it is about), the people working at
  // desks or at the counter, the ones waiting on chairs. Click the floor to walk; walls facing you fade.
  const IN = new THREE.Scene();
  IN.environment = envTex; IN.environmentIntensity = .55;
  IN.add(new THREE.HemisphereLight('#FFFFFF', '#E9DED3', 1.25));
  const inSun = new THREE.DirectionalLight('#FFF4E8', 1.7);
  inSun.position.set(-18, 34, 22); inSun.castShadow = true; inSun.shadow.mapSize.set(1536, 1536); inSun.shadow.bias = -.0006; inSun.shadow.normalBias = .03;
  Object.assign(inSun.shadow.camera, { left: -30, right: 30, top: 26, bottom: -26, near: 1, far: 100 }); IN.add(inSun);
  const ROOMS = {};
  let saved = null;
  const TONE_HEX = { brand: BRAND, blue: '#3B82F6', green: '#10B981', amber: '#F59E0B', red: '#E5484D', muted: '#8FA0B3' };
  function autoScreen(p) {
    const road = p.vehicles.filter(moving).length, act = p.people.filter((q) => q.state === 'wander' || q.state === 'work').length, todo = actionsOf(p).length;
    const tiles = []; if (p.vehicles.length) tiles.push({ label: T.onRoad, value: `${road}/${p.vehicles.length}`, tone: 'brand' });
    if (p.people.length) tiles.push({ label: T.active, value: `${act}/${p.people.length}`, tone: 'green' });
    tiles.push({ label: T.todo, value: todo, tone: todo ? 'amber' : 'green' });
    return { title: p.shown, tiles, bar: p.vehicles.length ? { label: T.onRoad, value: road, max: p.vehicles.length } : null };
  }
  function screenTex(p, wide = false) {
    const sc = p.screen ?? autoScreen(p);
    const w = wide ? 1536 : 1024, h = wide ? 540 : 512;
    return canvasTex((x) => {
      x.fillStyle = '#121C27'; x.fillRect(0, 0, w, h); x.fillStyle = BRAND; x.fillRect(0, 0, w, 10); x.textBaseline = 'top';
      if (sc.big != null) {
        x.fillStyle = '#8FA0B3'; x.font = `600 30px ${FONT_B}, Arial`; x.fillText(sc.title ?? '', 56, 50);
        x.fillStyle = '#FFFFFF'; fitText(x, String(sc.big), w * .55, 120, 800); x.fillText(String(sc.big), 50, 92);
        if (sc.line) { x.fillStyle = '#10B981'; x.font = `700 30px ${FONT_B}, Arial`; x.fillText(sc.line, 56, 240); }
        const fu = sc.funnel ?? [], mx = Math.max(1, ...fu.map((f) => f.value));
        fu.slice(0, 4).forEach((f, i) => { const Y = 320 + i * 44; x.fillStyle = '#8FA0B3'; x.font = `600 24px ${FONT_B}, Arial`; x.fillText(f.label, 56, Y); x.fillStyle = '#1C2A38'; rr(x, 330, Y + 2, 560, 24, 12); x.fill(); x.fillStyle = TONE_HEX[f.tone] ?? BRAND; rr(x, 330, Y + 2, Math.max(24, 560 * f.value / mx), 24, 12); x.fill(); x.fillStyle = '#fff'; x.font = `700 24px ${FONT_B}, Arial`; x.fillText(String(f.value), 910, Y); });
        if (sc.spark?.items?.length) { const S2 = sc.spark.items, m2 = Math.max(1, ...S2.map((s) => s.value)), bw = Math.min(70, 380 / S2.length - 20);
          x.fillStyle = '#8FA0B3'; x.font = `600 24px ${FONT_B}, Arial`; x.fillText(sc.spark.title ?? '', 1080, 50);
          S2.forEach((s, i) => { const bh = s.value / m2 * 300; x.fillStyle = i === S2.length - 1 ? BRAND : mix(BRAND, '#121C27', .6); rr(x, 1090 + i * (bw + 30), 470 - bh, bw, bh, 10); x.fill(); x.fillStyle = '#8FA0B3'; x.font = `600 22px ${FONT_B}, Arial`; x.fillText(`${s.label} ${s.value}`, 1090 + i * (bw + 30), 482); }); }
        return;
      }
      x.fillStyle = '#FFFFFF'; x.font = `700 40px ${FONT_D}, ${FONT_B}, Arial`; x.fillText(sc.title ?? T.screen, 48, 40);
      x.fillStyle = '#8FA0B3'; x.font = `600 26px ${FONT_B}, Arial`; x.fillText(sc.subtitle ?? p.shown, 48, 92);
      const tl = (sc.tiles ?? []).slice(0, 4), tw = (w - 96 - (tl.length - 1) * 16) / Math.max(1, tl.length);
      tl.forEach((t, i) => { const X = 48 + i * (tw + 16), Y = 160; x.fillStyle = '#1C2A38'; rr(x, X, Y, tw, 220, 18); x.fill(); x.fillStyle = TONE_HEX[t.tone] ?? BRAND; x.fillRect(X, Y, 8, 220); x.fillStyle = '#8FA0B3'; x.font = `600 24px ${FONT_B}, Arial`; wrapText(x, t.label, tw - 40).slice(0, 2).forEach((l, k) => x.fillText(l, X + 26, Y + 24 + k * 28)); x.fillStyle = '#FFFFFF'; fitText(x, String(t.value), tw - 50, 64, 800); x.fillText(String(t.value), X + 26, Y + 100); });
      if (sc.bar) { x.fillStyle = '#8FA0B3'; x.font = `600 24px ${FONT_B}, Arial`; x.fillText(`${sc.bar.label} · ${Math.round(sc.bar.value / Math.max(1, sc.bar.max) * 100)}%`, 48, 412); x.fillStyle = '#1C2A38'; rr(x, 48, 452, w - 96, 20, 10); x.fill(); x.fillStyle = BRAND; rr(x, 48, 452, Math.max(20, (w - 96) * sc.bar.value / Math.max(1, sc.bar.max)), 20, 10); x.fill(); }
    }, w, h);
  }
  // cork board: up to 6 notes; the hit test maps the clicked spot to the note under it
  const NOTE = { cols: 3, x0: 28, y0: 80, dx: 240, dy: 210, w: 210, h: 180, W: 768, H: 512 };
  function corkTex(items) {
    return canvasTex((x, w, h) => {
      x.fillStyle = '#D9B98C'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(120,80,40,${rnd() * .12})`; x.fillRect(rnd() * w, rnd() * h, 3, 3); }
      x.fillStyle = '#5B3B1E'; x.font = `800 30px ${FONT_D}, ${FONT_B}, Arial`; x.textBaseline = 'top'; x.fillText(T.todo, 28, 22);
      if (!items.length) { x.font = `600 26px ${FONT_B}, Arial`; x.fillText(T.nothing, 28, 90); }
      items.slice(0, 6).forEach((t, i) => {
        const X = NOTE.x0 + (i % 3) * NOTE.dx, Y = NOTE.y0 + Math.floor(i / 3) * NOTE.dy, rot = (rnd() - .5) * .08;
        x.save(); x.translate(X + 105, Y + 90); x.rotate(rot); x.translate(-105, -90);
        x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(6, 8, 210, 180);
        x.fillStyle = t.sev === 'red' ? '#FF8A80' : t.sev === 'amber' ? '#FFE082' : '#A7C7FF'; x.fillRect(0, 0, 210, 180);
        x.fillStyle = '#D32F2F'; x.beginPath(); x.arc(105, 10, 9, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#2A1A0A'; x.font = `700 22px ${FONT_B}, Arial`;
        wrapText(x, t.title, 186).slice(0, 5).forEach((l, k) => x.fillText(l, 12, 30 + k * 28));
        x.restore();
      });
    }, NOTE.W, NOTE.H);
  }
  const noteAt = (uv, items) => { if (!uv) return null; const px = uv.x * NOTE.W, py = (1 - uv.y) * NOTE.H; for (let i = 0; i < Math.min(6, items.length); i++) { const X = NOTE.x0 + (i % 3) * NOTE.dx, Y = NOTE.y0 + Math.floor(i / 3) * NOTE.dy; if (px >= X && px <= X + NOTE.w && py >= Y && py <= Y + NOTE.h) return items[i]; } return null; };
  function boardTitleTex(title, sub) { return canvasTex((x, w, h) => { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); x.fillStyle = '#0A0A0A'; x.textBaseline = 'middle'; x.font = `800 54px ${FONT_D}, ${FONT_B}, Arial`; x.fillText(title, 24, h * .38); x.fillStyle = '#6E6E6E'; x.font = `600 30px ${FONT_B}, Arial`; x.fillText(sub, 24, h * .78); }, 768, 160); }
  function monitorTex() { return canvasTex((x, w, h) => { x.fillStyle = '#F5F3F1'; x.fillRect(0, 0, w, h); x.fillStyle = BRAND; x.fillRect(0, 0, w, 34); x.fillStyle = '#fff'; x.font = `700 20px ${FONT_D}, Arial`; x.fillText(W.meta.brand.name ?? '', 14, 24); for (let i = 0; i < 5; i++) { x.fillStyle = i % 2 ? '#E7E3DF' : '#EFEBE7'; x.fillRect(14, 50 + i * 32, w - 28, 24); x.fillStyle = [BRAND, '#3B82F6', '#10B981'][i % 3]; x.fillRect(w - 70, 56 + i * 32, 46, 12); } }, 320, 220); }
  function plaqueTex(p) { return canvasTex((x, w, h) => { x.fillStyle = p.color ?? BRAND; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.textBaseline = 'middle'; fitText(x, p.shown, w - 50, 52); x.fillText(p.shown, 26, h * .38); x.font = `600 26px ${FONT_B}, Arial`; x.globalAlpha = .9; x.fillText(autoCard(p), 26, h * .75); }, 640, 200); }
  function gridTex(title, cells, note) { // a wall of squares, one per member: green = done
    return canvasTex((x, w, h) => {
      x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); x.fillStyle = '#0A0A0A'; x.textBaseline = 'top'; x.font = `800 40px ${FONT_D}, Arial`; x.fillText(title, 30, 24);
      cells.slice(0, 40).forEach((on, i) => { const X = 30 + (i % 10) * 70, Y = 96 + Math.floor(i / 10) * 74; x.fillStyle = on ? '#10B981' : '#D9DCE0'; rr(x, X, Y, 58, 58, 10); x.fill(); if (on) { x.fillStyle = '#fff'; x.font = '800 34px Arial'; x.fillText('✓', X + 16, Y + 10); } });
      if (note) { x.fillStyle = '#6E6E6E'; x.font = `600 24px ${FONT_B}, Arial`; x.fillText(note, 30, h - 44); }
    }, 760, 400);
  }
  function roomShell(Wd, D, H, floorCol) {
    const g = new THREE.Group(); g.visible = false; IN.add(g);
    const B = new Batch();
    B.rb(Wd + 1.2, .6, D + 1.2, PAL.slab, 0, -.3, 0, .3).box(Wd, .04, D, floorCol, 0, .02, 0);
    _c.set(floorCol).multiplyScalar(.94); const plank = '#' + _c.getHexString();
    for (let x = -Wd / 2 + 1.1; x < Wd / 2; x += 1.1) B.box(.04, .005, D, plank, x, .045, 0);
    B.flush(g, { cast: false });
    const walls = [], wc = PAL.room;
    const wall = (nrm, build) => { const w = new THREE.Group(), full = new Batch(), stub = new Batch(); build(full, stub); const fm = full.flush(w), sm = stub.flush(w); g.add(w); walls.push({ n: nrm, full: fm, stub: sm, items: [] }); return walls.at(-1); };
    wall(new THREE.Vector3(0, 0, -1), (F, Sb) => { F.box(Wd + .6, H, .3, wc, 0, H / 2, -D / 2 - .15).box(Wd, .22, .04, BRAND, 0, .11, -D / 2 + .02); Sb.box(Wd + .6, .5, .3, wc, 0, .25, -D / 2 - .15); });
    wall(new THREE.Vector3(-1, 0, 0), (F, Sb) => { F.box(.3, H, D, wc, -Wd / 2 - .15, H / 2, 0).box(.04, .22, D, BRAND, -Wd / 2 + .02, .11, 0); Sb.box(.3, .5, D, wc, -Wd / 2 - .15, .25, 0); });
    wall(new THREE.Vector3(1, 0, 0), (F, Sb) => { F.box(.3, H, D, wc, Wd / 2 + .15, H / 2, 0); Sb.box(.3, .5, D, wc, Wd / 2 + .15, .25, 0); });
    wall(new THREE.Vector3(0, 0, 1), (F, Sb) => {
      const seg = (Wd - 3.2) / 2;
      for (const s of [-1, 1]) { F.box(seg + .3, H, .3, wc, s * (1.6 + seg / 2 + .15), H / 2, D / 2 + .15); Sb.box(seg + .3, .5, .3, wc, s * (1.6 + seg / 2 + .15), .25, D / 2 + .15); }
      F.box(3.2, H - 2.8, .3, wc, 0, 2.8 + (H - 2.8) / 2, D / 2 + .15).box(3.4, .2, .4, BRAND, 0, 2.8, D / 2 + .15);
    });
    const mat = new THREE.Mesh(RB(3, .05, 1.4, .02), new THREE.MeshStandardMaterial({ color: BRAND, roughness: .9 }));
    mat.position.set(0, .06, D / 2 - .8); mat.userData.pick = { t: 'door' }; g.add(mat);
    const marker = new THREE.Mesh(new THREE.RingGeometry(.25, .36, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, depthWrite: false })); marker.userData.t = 0; g.add(marker);
    return { g, W: Wd, D, H, walls, pick: [mat], pawns: [], colliders: [], plants: [], door: new THREE.Vector3(0, 0, D / 2 - 1.4), center: new THREE.Vector3(0, 0, .5), marker, hoverPawn: -1 };
  }
  const solid = (room, x, z, w, d) => room.colliders.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  function plant(room, x, z) {
    const B = new Batch(); B.add(new THREE.CylinderGeometry(.32, .25, .55, 14), '#E9E3DA', 0, .3, 0).add(new THREE.IcosahedronGeometry(.55, 1), '#3DB883', 0, 1.0, 0).add(new THREE.IcosahedronGeometry(.4, 1), '#2E9E6C', .2, 1.35, -.1);
    const g = new THREE.Group(); g.position.set(x, 0, z); room.g.add(g); const m = B.flush(g); m.userData.pick = { t: 'prop', k: 'plant', obj: g }; g.userData.w = 0; room.pick.push(m); room.plants.push(g); solid(room, x, z, 1, 1);
  }
  function chair(B, x, z, ry = 0, col = '#3A3D44') { B.rb(.56, .1, .56, col, x, .46, z, .04, ry); const bx = Math.sin(ry) * -.25, bz = Math.cos(ry) * -.25; B.rb(.56, .6, .08, col, x + bx, .78, z + bz, .04, ry); B.box(.06, .42, .06, '#2A2D33', x, .22, z); }
  const addPick = (room, m, pick) => { m.userData.pick = pick; room.pick.push(m); return m; };
  function screenOnBackWall(room, p, x, w, h, wide) {
    const scr = plane(screenTex(p, wide), w, h); scr.position.set(x, room.H * .56, -room.D / 2 + .12); room.g.add(scr);
    const B = new Batch(); B.rb(w + .4, h + .4, .14, '#1A1D22', x, room.H * .56, -room.D / 2 + .02, .08); B.flush(room.g);
    addPick(room, scr, { t: 'place', id: p.id, hint: T.screen });
  }
  function keyBoard(room, p, z0) {
    const Wd = room.W, cap = clamp(Math.max(p.vehicles.length, p.capacity ?? 0), 1, 20), perRow = 5, rows = Math.ceil(cap / perRow);
    const order = [...p.vehicles.filter((v) => !moving(v)), ...p.vehicles.filter((v) => moving(v))];
    const B = new Batch(), bh = rows * .95 + 1.2, bw = perRow * 1.2 + .6, cz = z0;
    B.rb(.12, bh, bw, '#C9A57A', -Wd / 2 + .08, 1.1 + bh / 2, cz, .05).rb(.14, bh + .2, bw + .2, '#8A6A4F', -Wd / 2 + .03, 1.1 + bh / 2, cz, .05);
    const road = order.filter(moving).length;
    hitBox(.2, bh, bw, -Wd / 2 + .06, 1.1 + bh / 2, cz, { t: 'place', id: p.id, hint: T.keys }, room.g); room.pick.push(room.g.children.at(-1));
    const ttl = plane(boardTitleTex(T.keys, `${p.vehicles.length}${p.capacity ? ` ${T.of} ${p.capacity}` : ''} · ${road} ${T.onRoad}`), 3, .62); ttl.rotation.y = Math.PI / 2; ttl.position.set(-Wd / 2 + .17, 1.1 + bh + .45, cz); room.g.add(ttl);
    for (let k = 0; k < cap; k++) {
      const v = order[k], zz = cz - bw / 2 + .9 + (k % perRow) * 1.2, yy = 1.1 + bh - .55 - Math.floor(k / perRow) * .95;
      B.box(.12, .06, .06, '#5A5A5A', -Wd / 2 + .2, yy, zz);
      if (!v) continue;
      if (moving(v)) { const tag = new THREE.Mesh(RB(.06, .22, .3, .02), new THREE.MeshStandardMaterial({ color: BRAND })); tag.position.set(-Wd / 2 + .2, yy - .22, zz); room.g.add(tag); addPick(room, tag, { t: 'vehicle', id: v.id, hint: T.keyOut }); continue; }
      const kg = new THREE.Group(); kg.position.set(-Wd / 2 + .22, yy - .05, zz);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.09, .025, 8, 16).rotateY(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#C9CDD3', metalness: .8, roughness: .3 })); ring.position.y = -.08; kg.add(ring);
      const fob = new THREE.Mesh(RB(.12, .34, .22, .05), new THREE.MeshStandardMaterial({ color: v.color, roughness: .4 })); fob.position.y = -.32; fob.castShadow = true; kg.add(fob);
      const lab = new THREE.Mesh(RB(.04, .14, .2, .02), new THREE.MeshStandardMaterial({ color: TONE_HEX[stOf(v).tone] ?? '#10B981' })); lab.position.set(.05, -.55, 0); kg.add(lab);
      for (const m of [fob, ring, lab]) addPick(room, m, { t: 'vehicle', id: v.id, hint: `${T.keyIn} · ${stOf(v).label}` });
      room.g.add(kg);
    }
    B.flush(room.g);
    return bw;
  }
  function corkBoard(room, p, z) {
    const items = sortActs(actionsOf(p)).slice(0, 6);
    const cork = plane(corkTex(items), 4.8, 3.2); cork.rotation.y = Math.PI / 2; cork.position.set(-room.W / 2 + .1, 2.3, z); room.g.add(cork);
    const B = new Batch(); B.rb(.1, 3.4, 5, '#8A6A4F', -room.W / 2 + .04, 2.3, z, .04); B.flush(room.g);
    cork.userData.pick = { t: 'cork', uvPick: (uv) => { const a = noteAt(uv, items); return a ? { t: 'action', id: a.id } : { t: 'place', id: p.id, hint: T.board } } }; room.pick.push(cork);
  }
  const insidePawn = (room, o) => mkPawn(room.pawns, o);
  function desks(room, p, list, x0, z0, cols, dx = 3.6, dz = 3.2) {
    const B = new Batch();
    list.forEach((q, k) => {
      const x = x0 + (k % cols) * dx, z = z0 + Math.floor(k / cols) * dz, act = q.state === 'wander' || q.state === 'work';
      B.rb(2, .08, 1.1, '#FFFFFF', x, .78, z, .03); for (const [sx, sz] of [[-.9, -.45], [.9, -.45], [-.9, .45], [.9, .45]]) B.box(.06, .74, .06, '#3A3D44', x + sx, .38, z + sz);
      B.rb(.9, .55, .06, '#1A1D22', x, 1.15, z - .35, .02).box(.08, .3, .08, '#1A1D22', x, .9, z - .38);
      if (act) { const s2 = new THREE.Mesh(new THREE.PlaneGeometry(.82, .47), basic(monitorTex())); s2.position.set(x, 1.15, z - .315); room.g.add(s2); }
      chair(B, x, z + .75, Math.PI, act ? (roleOf(q).color) : '#B9B4AE'); solid(room, x, z, 2.1, 1.3);
      if (act) { const pw = insidePawn(room, { data: q, mode: 'idle', pose: 'type' }); pw.pos.set(x, .5, z + .62); pw.y = .25; pw.yaw = Math.PI; pw.basePose = 'type'; }
      else hitBox(2, 1.4, 1.6, x, .8, z + .2, { t: 'person', id: q.id, empty: true }, room.g) && room.pick.push(room.g.children.at(-1));
    });
    B.flush(room.g);
  }
  function buildShopRoom(p) {
    const Wd = 22, D = 15, room = roomShell(Wd, D, 4.6, PAL.floor), g = room.g, B = new Batch();
    screenOnBackWall(room, p, -1.5, 8.4, 4.2);
    const logo = plane(signTex(p.shown, p.signSub ?? p.sub ?? '', { bg: p.color ?? BRAND }), 5.2, .8); logo.position.set(6.5, 3.6, -D / 2 + .06); g.add(logo); addPick(room, logo, { t: 'place', id: p.id });
    if (p.vehicles.length || p.capacity) keyBoard(room, p, -3.2);
    corkBoard(room, p, 3.4);
    // the counter: whoever runs the place stands behind it
    B.rb(7, 1.05, 1.3, '#FFFFFF', 4, .52, -3.6, .12).box(7.02, .85, .06, p.color ?? BRAND, 4, .5, -2.94).rb(7.3, .08, 1.5, '#E3DED8', 4, 1.08, -3.6, .03); solid(room, 4, -3.6, 7.2, 1.5);
    const mon = plane(monitorTex(), 1.2, .82); mon.position.set(2.6, 1.6, -3.8); mon.rotation.y = .2; g.add(mon); addPick(room, mon, { t: 'place', id: p.id, hint: T.screen });
    B.rb(1.3, .9, .08, '#1A1D22', 2.6, 1.6, -3.85, .03, .2).box(.08, .4, .08, '#1A1D22', 2.6, 1.2, -3.9);
    if (p.inbox?.count) { for (let k = 0; k < Math.min(30, p.inbox.count); k++) B.box(.5, .02, .7, k % 2 ? '#FFFFFF' : '#F4F1EC', 5.8 + (k % 2) * .03, 1.14 + k * .025, -3.5); hitBox(.7, .4, .9, 5.8, 1.25, -3.5, { t: 'prop', k: 'papers', label: p.inbox.label ?? T.papers, sub: `${p.inbox.count}`, ref: p.inbox.ref ?? { t: 'place', id: p.id } }, g); room.pick.push(g.children.at(-1)); }
    const staff = p.people.filter((q) => !['wait', 'drive', 'away'].includes(q.state)).slice(0, 3);
    hitBox(7.2, 1.2, 1.5, 4, .6, -3.6, { t: 'prop', k: 'counter', sub: staff.map((q) => q.shown).join(', '), ref: staff[0] ? { t: 'person', id: staff[0].id } : { t: 'place', id: p.id } }, g); room.pick.push(g.children.at(-1));
    staff.forEach((q, i) => { const pw = insidePawn(room, { data: q, mode: 'idle' }); pw.pos.set(4.2 + (i - (staff.length - 1) / 2) * 1.8, 0, -4.9); pw.y = 0; pw.yaw = 0; });
    // people here for a vehicle wait on the chairs
    const waiting = p.people.filter((q) => q.state === 'wait').slice(0, 10);
    waiting.forEach((q, k) => { const x = -6.5 + k * 1.25, z = 3.6; chair(B, x, z, Math.PI); const pw = insidePawn(room, { data: q, mode: 'idle', pose: 'sit' }); pw.pos.set(x, .5, z + .05); pw.y = .25; pw.yaw = Math.PI; pw.basePose = 'sit'; });
    if (waiting.length) solid(room, -6.5 + (waiting.length - 1) * .62, 3.6, waiting.length * 1.25, .9);
    B.rb(2.4, .45, 1.1, '#D9C3A5', -3.6, .22, 1.6, .1); solid(room, -3.6, 1.6, 2.4, 1.1);
    B.box(.1, 3, 2.6, '#E9E6E2', Wd / 2 - .02, 1.5, -3.5); for (let h = .3; h < 3; h += .3) B.box(.12, .04, 2.4, '#CFCAC4', Wd / 2 - .05, h, -3.5);
    hitBox(.3, 3, 2.6, Wd / 2 - .1, 1.5, -3.5, { t: 'prop', k: 'workshop', sub: p.workshopText ?? '' }, g); room.pick.push(g.children.at(-1));
    const shop = plane(signTex(T.workshop.toUpperCase(), null, { bg: '#3A3D44' }), 2.4, .5); shop.rotation.y = -Math.PI / 2; shop.position.set(Wd / 2 - .05, 3.4, -3.5); g.add(shop);
    for (const [x, z] of [[-Wd / 2 + 1, -D / 2 + 1], [Wd / 2 - 1, -D / 2 + 1], [Wd / 2 - 1, D / 2 - 1.2], [-Wd / 2 + 1, D / 2 - 1.2]]) plant(room, x, z);
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(6, 4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: signTex(W.meta.brand.name, null, { logo: true, bg: BRAND_TINT, fg: BRAND }), roughness: .95 })); rug.position.set(2, .05, 2); rug.receiveShadow = true; g.add(rug);
    B.flush(g);
    return room;
  }
  function buildOfficeRoom(p) {
    const team = p.people.filter((q) => !['wait', 'drive'].includes(q.state)).slice(0, 24), cols = 4, rows = Math.max(1, Math.ceil(team.length / cols));
    const Wd = 28, D = Math.max(18, 9 + rows * 3.2), room = roomShell(Wd, D, 5, PAL.night ? '#C9BCA8' : '#E6E1DA'), g = room.g, B = new Batch();
    screenOnBackWall(room, p, -2, 13, 4.6, true);
    const shops = p.kind === 'tower' ? PLACES.filter((x) => x.kind === 'shop').slice(0, 5) : [];
    shops.forEach((s, i) => { const pl = plane(plaqueTex(s), 3.6, 1.12); pl.rotation.y = Math.PI / 2; pl.position.set(-Wd / 2 + .08, 3.9 - i * 1.3, -D / 2 + 3.5); g.add(pl); addPick(room, pl, { t: 'place', id: s.id }); });
    const cl = p.kind === 'tower' ? PLACES.find((x) => x.kind === 'cluster') : null;
    if (cl) {
      const cells = cl.people.map((q) => !!q.done || q.state === 'wander' || q.state === 'work');
      const tw = plane(gridTex(cl.shown, cl.grid ?? cells, cl.gridNote ?? ''), 5.2, 2.74); tw.rotation.y = Math.PI / 2; tw.position.set(-Wd / 2 + .08, 2.6, D / 2 - 5); g.add(tw);
      const members = cl.people.slice(0, 40);
      tw.userData.pick = { t: 'grid', uvPick: (uv) => { if (!uv) return null; const px = uv.x * 760, py = (1 - uv.y) * 400, c = Math.floor((px - 30) / 70), r = Math.floor((py - 96) / 74), i = r * 10 + c; return c >= 0 && c < 10 && r >= 0 && members[i] ? { t: 'person', id: members[i].id } : { t: 'place', id: cl.id }; } }; room.pick.push(tw);
    }
    desks(room, p, team, -6, -D / 2 + 6.4, cols);
    if (p.vault != null) {
      const vx = 10.5, vz = -D / 2 + 3.2;
      B.rb(4.8, .25, 3.6, PAL.dark, vx, .12, vz, .08).rb(4.8, .2, 3.6, PAL.dark, vx, 2.9, vz, .08);
      for (const [dx, dz] of [[-2.3, -1.7], [2.3, -1.7], [-2.3, 1.7], [2.3, 1.7]]) B.box(.14, 2.7, .14, PAL.dark, vx + dx, 1.5, vz + dz);
      const vg = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.6, 3.3), new THREE.MeshStandardMaterial({ color: '#D3E8F5', transparent: true, opacity: .22, depthWrite: false })); vg.position.set(vx, 1.5, vz); g.add(vg); addPick(room, vg, { t: 'prop', k: 'vault', place: p.id });
      const bars = []; for (let i = 0; i < Math.min(48, p.vault); i++) { const l = Math.floor(i / 6), r = i % 6; bars.push(plain(new THREE.BoxGeometry(.62, .22, .3).translate(vx - 1.4 + (r % 3) * .95 + (l % 2) * .2, .36 + l * .23, vz - .5 + Math.floor(r / 3) * .9))); }
      if (bars.length) { const gm = new THREE.Mesh(mergeGeometries(bars), new THREE.MeshStandardMaterial({ color: '#E8B53A', roughness: .28, metalness: .85, envMapIntensity: 1.6 })); gm.castShadow = true; g.add(gm); }
      solid(room, vx, vz, 4.9, 3.7);
    }
    const mz = D / 2 - 4.5;
    B.rb(4, .1, 2, '#B07D58', 9, .8, mz, .05).box(.12, .76, .12, '#3A3D44', 7.3, .38, mz).box(.12, .76, .12, '#3A3D44', 10.7, .38, mz);
    for (const [x, dz, r] of [[7.6, -1.3, 0], [9, -1.3, 0], [10.4, -1.3, 0], [7.6, 1.3, Math.PI], [9, 1.3, Math.PI], [10.4, 1.3, Math.PI]]) chair(B, x, mz + dz, r, '#E9E3DA');
    solid(room, 9, mz, 4.4, 3.4); hitBox(4.4, 1, 3.4, 9, .6, mz, { t: 'prop', k: 'table', sub: p.meetingText ?? '' }, g); room.pick.push(g.children.at(-1));
    for (const [x, z] of [[-Wd / 2 + 1, -D / 2 + 1], [Wd / 2 - 1, D / 2 - 1.2], [-Wd / 2 + 1, D / 2 - 1.2], [Wd / 2 - 1, -D / 2 + 1]]) plant(room, x, z);
    B.flush(g);
    return room;
  }
  function buildClusterRoom(p) {
    const team = p.people.slice(0, 40), cols = 8, rows = Math.max(1, Math.ceil(team.length / cols));
    const Wd = Math.max(24, cols * 2.6 + 6), D = Math.max(15, 8 + rows * 2.4), room = roomShell(Wd, D, 4.4, PAL.floor), g = room.g, B = new Batch();
    screenOnBackWall(room, p, 0, 8.4, 4.2);
    if (p.vehicles.length) keyBoard(room, p, 0);
    team.forEach((q, k) => {
      const x = -Wd / 2 + 4 + (k % cols) * 2.6, z = -D / 2 + 4.6 + Math.floor(k / cols) * 2.4, act = q.state === 'wander' || q.state === 'work';
      B.rb(1.7, .07, .9, '#FFFFFF', x, .74, z, .03).box(.05, .7, .05, '#3A3D44', x - .75, .36, z - .35).box(.05, .7, .05, '#3A3D44', x + .75, .36, z - .35).box(.05, .7, .05, '#3A3D44', x - .75, .36, z + .35).box(.05, .7, .05, '#3A3D44', x + .75, .36, z + .35);
      B.rb(.6, .38, .05, q.done ? '#10B981' : '#1A1D22', x, 1.0, z - .28, .02);
      chair(B, x, z + .6, Math.PI, act ? roleOf(q).color : '#C9C4BE'); solid(room, x, z, 1.8, 1.1);
      if (act) { const pw = insidePawn(room, { data: q, mode: 'idle', pose: 'type' }); pw.pos.set(x, .5, z + .5); pw.y = .25; pw.yaw = Math.PI; pw.basePose = 'type'; }
      else { hitBox(1.7, 1.3, 1.4, x, .7, z + .2, { t: 'person', id: q.id, empty: true }, g); room.pick.push(g.children.at(-1)); }
    });
    for (const [x, z] of [[-Wd / 2 + 1, -D / 2 + 1], [Wd / 2 - 1, -D / 2 + 1], [Wd / 2 - 1, D / 2 - 1.2], [-Wd / 2 + 1, D / 2 - 1.2]]) plant(room, x, z);
    B.flush(g);
    return room;
  }
  function makeRoom(p) {
    const room = p.kind === 'shop' ? buildShopRoom(p) : p.kind === 'cluster' ? buildClusterRoom(p) : buildOfficeRoom(p);
    room.place = p;
    room.me = insidePawn(room, { me: true, mode: 'goto', look: { shirt: W.player.shirt, skin: W.player.skin, hair: W.player.hair, style: W.player.style ?? 'short' } }); room.me.y = 0;
    room.crowd = new Crowd(room.pawns, room.g, 'room'); room.pick.push(...room.crowd.pick);
    room.cap = new THREE.Mesh(HAT.geometry, VC); room.cap.matrixAutoUpdate = false; room.cap.castShadow = true; room.g.add(room.cap);
    return room;
  }
  function disposeRoom(room) { IN.remove(room.g); room.g.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) { m.map?.dispose(); m.dispose(); } } }); }
  const roomZoom = (room) => narrow() ? (VIEW * vw() / vh()) / ((room.W + room.D) * .74) : Math.min((VIEW * vw() / vh()) / (room.W * 1.55), VIEW / (room.D * 1.75)) * .95;
  function veil(fn) { const f = $('veil'); if (reduced()) { fn(); return; } f.classList.add('on'); setTimeout(() => { fn(); requestAnimationFrame(() => f.classList.remove('on')); }, 280); }
  function enterBuilding(id) {
    const p = placeById.get(id); if (!p?.enterable) return;
    if (inside?.place === p) return;
    if (view) { view = null; app.classList.remove('open'); }
    veil(() => {
      if (inside) { inside.g.visible = false; inside = null; }
      if (ROOMS[id]?.dirty) { disposeRoom(ROOMS[id]); delete ROOMS[id]; }
      const room = ROOMS[id] ??= makeRoom(p);
      saved = saved ?? { t: controls.target.clone(), p: ocam.position.clone(), z: ocam.zoom, mode };
      if (mode !== 'map') { if (inHeli) { inHeli = false; HELI.g.position.set(HELI_HOME.x, .3, HELI_HOME.z); ME.hidden = false; } mode = 'map'; cam = ocam; controls.enabled = true; app.classList.remove('walk', 'fly'); $('keys').hidden = true; $('pad').hidden = true; $('prompt').hidden = true; }
      inside = room; room.g.visible = true; tween = null; follow = null;
      root.traverse((o) => { if (o.isCSS2DObject) o.element.style.display = 'none'; });
      room.me.pos.copy(room.door); room.me.yaw = Math.PI; room.me.target = null; room.me.vel.set(0, 0, 0);
      const off = new THREE.Vector3().setFromSphericalCoords(320, POLAR, AZ0);
      controls.target.copy(room.center); ocam.position.copy(room.center).add(off); ocam.zoom = roomZoom(room); ocam.updateProjectionMatrix();
      app.classList.add('inside'); renderDock(); hover = null; tip.classList.remove('show');
      const hn = $('hint'); hn.textContent = T.hintInside; hn.style.opacity = 1; setTimeout(() => (hn.style.opacity = 0), 6000);
      emit('enter', id);
    });
  }
  function exitBuilding() {
    if (!inside) return;
    veil(() => {
      const room = inside, p = room.place;
      room.g.visible = false; inside = null;
      for (const b of BUBBLES.slice()) if (b.parent === room.g) killBubble(b);
      controls.target.copy(saved.t); ocam.position.copy(saved.p); ocam.zoom = saved.z; ocam.updateProjectionMatrix();
      root.traverse((o) => { if (o.isCSS2DObject) o.element.style.display = ''; });
      app.classList.remove('inside'); hover = null; tip.classList.remove('show');
      if (saved.mode === 'walk') { ME.pos.copy(p.door ?? p.gate); ME.pos.z += 1.5; ME.h = ME.yaw = 0; collide(ME.pos); mode = 'walk'; applyMode(); }
      saved = null; renderDock(); emit('exit', p.id);
    });
  }
  function updateInside(dt, t) {
    const room = inside, dir = ocam.position.clone().sub(controls.target).setY(0).normalize();
    for (const w of room.walls) w.full.visible = w.n.dot(dir) <= .2;
    const me = room.me;
    if (keys.size) {
      const fw = dir.clone().negate(), rt = new THREE.Vector3(-fw.z, 0, fw.x), mv = new THREE.Vector3();
      if (on('KeyW', 'ArrowUp')) mv.add(fw); if (on('KeyS', 'ArrowDown')) mv.sub(fw); if (on('KeyD', 'ArrowRight')) mv.add(rt); if (on('KeyA', 'ArrowLeft')) mv.sub(rt);
      if (mv.lengthSq()) me.target = me.pos.clone().addScaledVector(mv.normalize(), 1.2);
    }
    if (me.target) {
      const want = new THREE.Vector3(me.target.x - me.pos.x, 0, me.target.z - me.pos.z), d = want.length();
      if (d < .2) me.target = null; else want.multiplyScalar(2.6 * Math.min(1, d / 1) / d);
      const steer = want.sub(me.vel), lim = 9 * dt; if (steer.length() > lim) steer.setLength(lim); me.vel.add(steer);
    } else me.vel.multiplyScalar(Math.exp(-dt * 10));
    const before = me.pos.clone(); me.pos.addScaledVector(me.vel, dt); collideRoom(room, me.pos, .35);
    const moved = before.distanceTo(me.pos); me.speed = moved / Math.max(dt, 1e-4); me.ph += moved / .55 * Math.PI;
    if (me.speed > .08) me.yaw += wrapA(Math.atan2(me.vel.x, me.vel.z) - me.yaw) * (1 - Math.exp(-dt * 10));
    if (me.pos.z > room.D / 2 - 1.1 && Math.abs(me.pos.x) < 1.4 && me.speed > .3 && me.vel.z > 0) exitBuilding();
    for (const p of room.pawns) if (p !== me) { if (p.react > 0) stepPawn(p, room.pawns, dt, () => {}); else idleLook(p, dt); }
    room.crowd.update(t, room.hoverPawn, -1); writeHat(room.cap, me);
    for (const pl of room.plants) { if (pl.userData.w > 0) { pl.userData.w = Math.max(0, pl.userData.w - dt * 1.4); pl.rotation.z = Math.sin(t * 24) * .12 * pl.userData.w; } }
    if (room.marker.userData.t > 0) { room.marker.userData.t -= dt; room.marker.material.opacity = room.marker.userData.t / .8; room.marker.scale.setScalar(1 + (1 - room.marker.userData.t / .8)); } else room.marker.material.opacity = 0;
    const tg = controls.target, cx = clamp(tg.x, -room.W / 2, room.W / 2) - tg.x, cz = clamp(tg.z, -room.D / 2, room.D / 2) - tg.z;
    if (cx || cz) { tg.x += cx; tg.z += cz; ocam.position.x += cx; ocam.position.z += cz; }
  }
  function collideRoom(room, p, rad) {
    for (const c of room.colliders) if (p.x > c.x0 - rad && p.x < c.x1 + rad && p.z > c.z0 - rad && p.z < c.z1 + rad) {
      const dl = p.x - (c.x0 - rad), dr = c.x1 + rad - p.x, dt = p.z - (c.z0 - rad), db = c.z1 + rad - p.z, m = Math.min(dl, dr, dt, db);
      if (m === dl) p.x = c.x0 - rad; else if (m === dr) p.x = c.x1 + rad; else if (m === dt) p.z = c.z0 - rad; else p.z = c.z1 + rad;
    }
    p.x = clamp(p.x, -room.W / 2 + .5, room.W / 2 - .5); p.z = clamp(p.z, -room.D / 2 + .5, room.D / 2 - .4);
  }
