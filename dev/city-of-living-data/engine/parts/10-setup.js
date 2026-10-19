
// ============================================================================ createCity
export function createCity(host, worldIn, opts = {}) {
  const W = normalize(worldIn);
  const LOC = W.meta.locale, T = { ...(STR[LOC] ?? (LOC.startsWith('pt') ? STR['pt-BR'] : STR.en)), ...(W.meta.text ?? {}) };
  const PAL = { ...(PALETTES[W.meta.palette] ?? PALETTES.cream), ...(W.meta.paletteOverrides ?? {}) };
  const BRAND = W.meta.brand.color, BRAND_DK = mix(BRAND, '#000000', .2), BRAND_TINT = mix(BRAND, '#FFFFFF', .92);
  const rnd = ((s) => () => (s = (s * 16807) % 2147483647) / 2147483647)(opts.seed ?? 20261019);
  // every timer goes through later(), so destroy() can cancel them all
  const TIMERS = new Set(); let alive = true;
  const later = (fn, ms) => { const id = setTimeout(() => { TIMERS.delete(id); if (alive) fn(); }, ms); TIMERS.add(id); return id; };
  // colours that reach HTML come from data: only accept real hex colours
  const col = (c, fb = '#888888') => (/^#[0-9a-f]{3,8}$/i.test(String(c ?? '')) ? c : fb);
  const reduced = () => opts.reducedMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtNum = (v, f) => {
    if (typeof v !== 'number') return String(v ?? '–');
    const cur = W.meta.currency ?? (LOC.startsWith('pt') ? 'BRL' : 'USD');
    if (f === 'currency') return new Intl.NumberFormat(LOC, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v);
    if (f === 'currency2') return new Intl.NumberFormat(LOC, { style: 'currency', currency: cur, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
    if (f === 'pct') return new Intl.NumberFormat(LOC, { style: 'percent', maximumFractionDigits: 1 }).format(v);
    return new Intl.NumberFormat(LOC, { maximumFractionDigits: f === 'int' || !f ? 0 : 1 }).format(v);
  };

  // ---------------------------------------------------------------- DOM shell (all inside host)
  host.classList.add('cold'); if (PAL.night) host.classList.add('cold-night');
  host.style.setProperty('--brand', col(BRAND, '#F63B04')); host.style.setProperty('--brand-strong', BRAND_DK); host.style.setProperty('--brand-tint', BRAND_TINT);
  host.style.setProperty('--bg-a', PAL.bg[0]); host.style.setProperty('--bg-b', PAL.bg[1]);
  const logoSvg = (w, h, fill = 'currentColor') => W.meta.brand.logo ? `<svg viewBox="${esc(W.meta.brand.logo.viewBox ?? '0 0 24 24')}" width="${w}" height="${h}" aria-hidden="true"><path fill="${fill}" d="${esc(W.meta.brand.logo.d)}"/></svg>` : `<b style="font-size:${h}px">${esc((W.meta.brand.name ?? '·')[0])}</b>`;
  host.innerHTML = `
  <div class="c-app">
    <div class="c-scene"></div><div class="c-tip"></div>
    <header class="c-top">
      <div class="c-brand c-glass">${W.meta.brand.logo ? logoSvg(34, 16, BRAND) : ''}<div><b>${esc(W.meta.title)}</b>${W.meta.subtitle ? `<small>${esc(W.meta.subtitle)}</small>` : ''}</div></div>
      <div class="c-kpis c-glass" data-kpis></div>
      <div class="c-side"><button class="c-pill c-glass" data-names hidden></button><span class="c-live c-glass" data-live><i></i><span data-asof></span></span></div>
    </header>
    <nav class="c-dock c-glass" data-dock></nav>
    <div class="c-cam c-glass">
      <button data-zin title="${T.zoomIn}" aria-label="${T.zoomIn}">${ic('plus')}</button><button data-zout title="${T.zoomOut}" aria-label="${T.zoomOut}">${ic('minus')}</button><hr>
      <button data-rotl title="${T.rotL} (Q)" aria-label="${T.rotL}">${ic('rotl')}</button><button data-rotr title="${T.rotR} (E)" aria-label="${T.rotR}">${ic('rotr')}</button><hr>
      <button data-home title="${T.home}" aria-label="${T.home}">${ic('home')}</button>
    </div>
    <div class="c-hint" data-hint>${T.hintMap}</div>
    <aside class="c-drawer" aria-label="Details"><div class="c-dh"><nav class="c-crumbs" data-crumbs></nav><button class="c-close" data-close title="${T.close} (Esc)" aria-label="${T.close}">${ic('close')}</button></div><div class="c-body" data-body></div></aside>
    <div class="c-caption" data-caption hidden></div>
    <div class="c-clock" data-clock hidden></div>
    <div class="c-feed" data-feed></div>
    <div class="c-prompt" data-prompt hidden></div>
    <div class="c-veil" data-veil></div>
    <div class="c-keys c-glass" data-keys hidden></div>
    <div class="c-pad" data-pad hidden></div>
  </div>`;
  const app = host.querySelector('.c-app'), $ = (s) => host.querySelector(`[data-${s}]`), sceneEl = host.querySelector('.c-scene'), tip = host.querySelector('.c-tip');
  const narrow = () => (app.clientWidth || innerWidth) <= 760;

  // ---------------------------------------------------------------- renderer, cameras, light
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!opts.preserveDrawingBuffer });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.04;
  sceneEl.appendChild(renderer.domElement);
  const labels = new CSS2DRenderer(); labels.domElement.className = 'c-labels'; sceneEl.appendChild(labels.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environment = envTex; scene.environmentIntensity = PAL.night ? .25 : .5;

  const VIEW = 112, POLAR = 0.96, AZ0 = Math.PI / 4;
  const ocam = new THREE.OrthographicCamera(-1, 1, 1, -1, -600, 1600);
  const pcam = new THREE.PerspectiveCamera(55, 1, .3, 900);
  let cam = ocam;
  const controls = new OrbitControls(ocam, renderer.domElement);
  Object.assign(controls, { enableDamping: true, dampingFactor: .09, minPolarAngle: POLAR, maxPolarAngle: POLAR, minZoom: .35, maxZoom: 9, zoomToCursor: true, screenSpacePanning: false, zoomSpeed: 1.1, rotateSpeed: .6 });
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
  controls.target.set(0, 0, 0); ocam.position.setFromSphericalCoords(320, POLAR, AZ0); ocam.lookAt(0, 0, 0);

  const hemi = new THREE.HemisphereLight('#FFFFFF', PAL.night ? '#223040' : '#E9DED3', PAL.hemi); scene.add(hemi);
  const sun = new THREE.DirectionalLight(PAL.night ? '#AFC6FF' : '#FFF1E2', PAL.sun);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = .04; sun.shadow.radius = 3;
  scene.add(sun, sun.target);

  // ---------------------------------------------------------------- geometry helpers
  const _c = new THREE.Color();
  const plain = (g) => { g = g.index ? g.toNonIndexed() : g; if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); return g; };
  function colored(geo, hex) {
    const g = plain(geo); _c.set(hex); const n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
  }
  const RB = (w, h, d, r = .25, seg = 2) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - .01, h / 2 - .01, d / 2 - .01));
  const VC = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .82 });
  const GLASS = PAL.night ? new THREE.MeshStandardMaterial({ color: '#2B3949', emissive: PAL.glass, emissiveIntensity: .55, roughness: .3 }) : new THREE.MeshStandardMaterial({ color: PAL.glass, roughness: .12, metalness: .35, envMapIntensity: 1.4 });
  class Batch {
    constructor() { this.l = []; }
    add(g, col, x = 0, y = 0, z = 0, ry = 0) { if (ry) g.rotateY(ry); g.translate(x, y, z); this.l.push(colored(g, col)); return this; }
    box(w, h, d, col, x, y, z, ry = 0) { return this.add(new THREE.BoxGeometry(w, h, d), col, x, y, z, ry); }
    rb(w, h, d, col, x, y, z, r = .25, ry = 0) { return this.add(RB(w, h, d, r), col, x, y, z, ry); }
    flush(parent, { mat = VC, cast = true, recv = true, pick } = {}) {
      if (!this.l.length) return null; const m = new THREE.Mesh(mergeGeometries(this.l), mat); this.l = [];
      m.castShadow = cast; m.receiveShadow = recv; if (pick) m.userData.pick = pick; parent.add(m); return m;
    }
  }
  const disposables = [];
  function canvasTex(draw, w = 1024, h = 256) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); draw(x, w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; disposables.push(t); return t;
  }
  const FONT_D = W.meta.fontDisplay ?? 'Sora', FONT_B = W.meta.fontBody ?? 'DM Sans';
  function fitText(x, text, maxW, size, weight = 800, font = FONT_D) { let s = size; do { x.font = `${weight} ${s}px ${font}, ${FONT_B}, Arial, sans-serif`; s *= .94; } while (x.measureText(text).width > maxW && s > 14); }
  function wrapText(x, text, maxW) { const words = String(text).split(' '), lines = []; let l = ''; for (const w of words) { const t = l ? l + ' ' + w : w; if (x.measureText(t).width > maxW && l) { lines.push(l); l = w; } else l = t; } if (l) lines.push(l); return lines; }
  const rr = (x, X, Y, w, h, r) => { x.beginPath(); x.roundRect(X, Y, w, h, r); };
  const logoPath = W.meta.brand.logo ? new Path2D(W.meta.brand.logo.d) : null, logoVB = (W.meta.brand.logo?.viewBox ?? '0 0 24 24').split(/\s+/).map(Number);
  function signTex(title, sub, { bg = BRAND, fg = '#FFFFFF', logo = false } = {}) {
    return canvasTex((x, w, h) => {
      x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
      let off = 0;
      if (logo && logoPath) { const lw = h * .62, sc = lw / logoVB[2], lh = logoVB[3] * sc; x.save(); x.translate(60, h / 2 - lh / 2); x.scale(sc, sc); x.fill(logoPath); x.restore(); off = 60; }
      fitText(x, title, w - 80 - off * 2, sub ? h * .42 : h * .5); x.fillText(title, w / 2 + off, sub ? h * .4 : h / 2);
      if (sub) { fitText(x, sub, w - 80, h * .17, 600, FONT_B); x.globalAlpha = .9; x.fillText(sub, w / 2 + off, h * .76); x.globalAlpha = 1; }
    });
  }
  const basic = (tex) => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const plane = (tex, w, h) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(tex));
  const BLOB = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: (() => { const t = canvasTex((x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(60,40,20,.42)'); g.addColorStop(1, 'rgba(60,40,20,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 64, 64); t.colorSpace = THREE.NoColorSpace; return t; })() });
  const HIDDEN = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = (w, h, d, x, y, z, pick, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), HIDDEN); m.position.set(x, y, z); m.userData.pick = pick; parent.add(m); return m; };
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _v = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), _E = new THREE.Euler();
  const _B = new THREE.Matrix4(), _T = new THREE.Matrix4(), _R = new THREE.Matrix4(), _M = new THREE.Matrix4(), _Z = new THREE.Matrix4().makeScale(0, 0, 0);
