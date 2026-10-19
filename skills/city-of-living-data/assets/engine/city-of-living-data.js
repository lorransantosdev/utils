// City of Living Data — engine
// Turns one world.json (places, vehicles, people, actions, KPIs) into a living isometric city:
// a diorama you can pan, rotate and zoom, enter every building, click every car, person and prop,
// walk with your avatar and your dog Scott, fly a helicopter, follow a car, present a tour and
// replay a week of events. three.js only. MIT.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const VERSION = '2.0.0';

// ============================================================================ strings
const STR = {
  'pt-BR': {
    map: 'Mapa', walk: 'A pé', heli: 'Helicóptero', overview: 'Visão geral', hideNames: 'Ocultar nomes', namesHidden: 'Nomes ocultos',
    exit: 'Sair do prédio', enter: 'Entrar', enterPlace: 'Entrar no prédio', enterHint: 'tudo lá dentro é clicável', follow: 'Seguir', unfollow: 'Parar de seguir', ride: 'Andar junto',
    present: 'Apresentar', stop: 'Parar', replay: 'Replay', video: 'Modo vídeo', videoOff: 'Sair do modo vídeo', more: 'Mais',
    actions: 'Precisa de atenção', urgent: 'urgentes', vehicles: 'Veículos', people: 'Pessoas', todo: 'Pendências', places: 'Lugares', nothing: 'Nada pendente.',
    walkThere: 'Ir a pé até lá', fly: 'Voar de helicóptero', seeAll: 'Ver todas', seeVehicle: 'Ver o veículo', seeDriver: 'Ver o motorista', seePlace: 'Abrir o lugar', talk: 'Falar',
    asOf: 'Retrato de', live: 'Ao vivo', stale: 'Dados atrasados', noData: 'Sem dados', close: 'Fechar', zoomIn: 'Aproximar', zoomOut: 'Afastar', rotL: 'Girar para a esquerda', rotR: 'Girar para a direita', home: 'Ver tudo',
    hintMap: 'Arraste para mover · roda do mouse para zoom · clique em qualquer coisa', hintInside: 'Clique no chão para andar · clique em tudo · tapete = sair',
    keysWalk: '<b>A pé</b><span>clique no chão para ir até lá</span><span><kbd>W A S D</kbd> andar · <kbd>Shift</kbd> correr</span><span>arraste para olhar · clique nas pessoas</span><span><kbd>E</kbd> entrar · <kbd>F</kbd> helicóptero · <kbd>Esc</kbd> mapa</span>',
    keysHeli: '<b>Helicóptero</b><span><kbd>W S</kbd> frente/trás · <kbd>A D</kbd> girar</span><span><kbd>Espaço</kbd> subir · <kbd>C</kbd> descer</span><span><kbd>F</kbd> pousar · <kbd>Esc</kbd> mapa</span>',
    keysRide: '<b>Andando junto</b><span>arraste para olhar em volta</span><span><kbd>Esc</kbd> voltar ao mapa</span>',
    pressEnter: 'Entrar em', pressHeli: 'Entrar no helicóptero', land: 'Pousar aqui', landing: 'Pousando…', freeSpot: 'Escolha um lugar livre para pousar', nearHeli: 'Chegue perto do helicóptero', nearPlace: 'Chegue perto de um prédio',
    door: 'Saída', doorSub: 'clique para voltar à cidade', bay: 'Vaga', bayFree: 'livre', bayOut: 'carro fora', emptyDesk: 'Mesa vazia', screen: 'Painel', board: 'Quadro de pendências', keys: 'Chaves', keyIn: 'chave no quadro', keyOut: 'chave fora · na rua',
    vault: 'Cofre', ghost: 'Próximo andar', helipad: 'Heliponto', tree: 'Árvore', fountain: 'Fonte', bench: 'Banco', light: 'Semáforo', gate: 'Portão', plant: 'Planta', workshop: 'Oficina', table: 'Mesa de reunião', road: 'Rua', papers: 'Papéis no balcão', counter: 'Balcão', logo: 'Placa',
    lightNow: (s) => `verde para esta rua em ${s} s`, lightGo: 'verde agora',
    pet: 'Seu cachorro. Vai aonde você for.', you: 'Você', onRoad: 'na rua', inLot: 'no pátio', bays: 'vagas', of: 'de', used: 'usadas', free: 'livres', capacity: 'Vagas',
    tour: 'Apresentação', step: 'Passo', replayOf: 'Replay', speed: 'por segundo', day: (d) => d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    floors: 'andares', people_: 'pessoas', active: 'ativos', inactive: 'sem acesso recente',
  },
  en: {
    map: 'Map', walk: 'Walk', heli: 'Helicopter', overview: 'Overview', hideNames: 'Hide names', namesHidden: 'Names hidden',
    exit: 'Leave building', enter: 'Enter', enterPlace: 'Go inside', enterHint: 'everything inside is clickable', follow: 'Follow', unfollow: 'Stop following', ride: 'Ride along',
    present: 'Present', stop: 'Stop', replay: 'Replay', video: 'Video mode', videoOff: 'Exit video mode', more: 'More',
    actions: 'Needs attention', urgent: 'urgent', vehicles: 'Vehicles', people: 'People', todo: 'To do', places: 'Places', nothing: 'Nothing pending.',
    walkThere: 'Walk there', fly: 'Fly the helicopter', seeAll: 'See all', seeVehicle: 'See the vehicle', seeDriver: 'See the driver', seePlace: 'Open the place', talk: 'Talk',
    asOf: 'Snapshot of', live: 'Live', stale: 'Data is late', noData: 'No data', close: 'Close', zoomIn: 'Zoom in', zoomOut: 'Zoom out', rotL: 'Rotate left', rotR: 'Rotate right', home: 'See everything',
    hintMap: 'Drag to move · scroll to zoom · click anything', hintInside: 'Click the floor to walk · click everything · door mat = exit',
    keysWalk: '<b>Walking</b><span>click the ground to go there</span><span><kbd>W A S D</kbd> move · <kbd>Shift</kbd> run</span><span>drag to look · click people</span><span><kbd>E</kbd> enter · <kbd>F</kbd> helicopter · <kbd>Esc</kbd> map</span>',
    keysHeli: '<b>Helicopter</b><span><kbd>W S</kbd> forward/back · <kbd>A D</kbd> turn</span><span><kbd>Space</kbd> up · <kbd>C</kbd> down</span><span><kbd>F</kbd> land · <kbd>Esc</kbd> map</span>',
    keysRide: '<b>Riding along</b><span>drag to look around</span><span><kbd>Esc</kbd> back to the map</span>',
    pressEnter: 'Enter', pressHeli: 'Board the helicopter', land: 'Land here', landing: 'Landing…', freeSpot: 'Pick a free spot to land', nearHeli: 'Get close to the helicopter', nearPlace: 'Get close to a building',
    door: 'Exit', doorSub: 'click to go back to the city', bay: 'Bay', bayFree: 'free', bayOut: 'vehicle out', emptyDesk: 'Empty desk', screen: 'Screen', board: 'To-do board', keys: 'Keys', keyIn: 'key on the board', keyOut: 'key out · on the road',
    vault: 'Vault', ghost: 'Next floor', helipad: 'Helipad', tree: 'Tree', fountain: 'Fountain', bench: 'Bench', light: 'Traffic light', gate: 'Gate', plant: 'Plant', workshop: 'Workshop', table: 'Meeting table', road: 'Street', papers: 'Papers on the counter', counter: 'Counter', logo: 'Sign',
    lightNow: (s) => `green for this street in ${s} s`, lightGo: 'green now',
    pet: 'Your dog. Goes wherever you go.', you: 'You', onRoad: 'on the road', inLot: 'in the lot', bays: 'bays', of: 'of', used: 'used', free: 'free', capacity: 'Bays',
    tour: 'Presentation', step: 'Step', replayOf: 'Replay', speed: 'per second', day: (d) => d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
    floors: 'floors', people_: 'people', active: 'active', inactive: 'no recent access',
  },
};

// ============================================================================ palettes
// Only the ground, roads and buildings change; status colors (red / amber / green / blue) never do.
const PALETTES = {
  cream: { bg: ['#FBF6F2', '#EEECEA'], slab: '#E3DBD1', grass: '#D6EDDC', road: '#C2C4C8', mark: '#FFFFFF', walk: '#F7F4F0', lot: '#E2DED8', wall: '#FFFFFF', trim: '#ECE7E1', dark: '#3A3D44', glass: '#2B3949', park: '#CDEBD6', path: '#F3EEE6', water: '#9AD3EE', trees: ['#3DB883', '#2E9E6C', '#58C796'], floor: '#EADCC8', room: '#FAF7F3', sun: 2.3, hemi: 1.35, night: false },
  mint: { bg: ['#F1FAF6', '#E3EFEA'], slab: '#D5E3DC', grass: '#CFEBDD', road: '#B9C3C0', mark: '#FFFFFF', walk: '#F3F8F5', lot: '#DCE6E1', wall: '#FFFFFF', trim: '#E2ECE7', dark: '#34403C', glass: '#25403A', park: '#C3E8D3', path: '#EEF5F0', water: '#8ED6E4', trees: ['#2FB37A', '#23946A', '#4FCB91'], floor: '#DDE8E1', room: '#F7FBF9', sun: 2.2, hemi: 1.35, night: false },
  sunset: { bg: ['#FFF2E8', '#F4E3D7'], slab: '#E8D2C2', grass: '#E3EDD2', road: '#C7BEB8', mark: '#FFF8F2', walk: '#FBF1EA', lot: '#EADBD0', wall: '#FFFBF7', trim: '#F1E2D6', dark: '#4A3B36', glass: '#3B2E35', park: '#DCEBC8', path: '#F7EADF', water: '#A8D4EA', trees: ['#58A86B', '#3F8F59', '#7CC07F'], floor: '#EED8C4', room: '#FFF8F2', sun: 2.4, hemi: 1.3, night: false },
  night: { bg: ['#14202E', '#0B121B'], slab: '#1D2836', grass: '#1E3A31', road: '#2C3644', mark: '#8C97A6', walk: '#2A3545', lot: '#263140', wall: '#E7ECF2', trim: '#C9D2DD', dark: '#1A2029', glass: '#F5C76B', park: '#21443A', path: '#33404F', water: '#2B6C8C', trees: ['#2E8F68', '#23775A', '#3AA57A'], floor: '#C9BCA8', room: '#E9E4DC', sun: .9, hemi: .75, night: true },
};

// ============================================================================ small helpers
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrapA = (a) => ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
const mix = (a, b, k) => { const c = new THREE.Color(a).lerp(new THREE.Color(b), k); return '#' + c.getHexString(); };
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', close: '<path d="m9 5 7 7-7 7"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  rotl: '<path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v5h5"/>', rotr: '<path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/>',
  home: '<path d="M4 11 12 4l8 7v9H4z"/>', chev: '<path d="m9 5 7 7-7 7"/>', map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  walk: '<circle cx="13" cy="4.5" r="2"/><path d="m10 21 2-6 3 3v3M8 12l2-4 4 1 2 3 3 1M10 8l-1 5"/>',
  heli: '<path d="M3 5h16M11 5v3"/><path d="M5 12a6 4 0 0 1 6-4h3a5 5 0 0 1 0 10H9a4 4 0 0 1-4-4z"/><path d="M8 18l-1 2h10M19 13h3"/>',
  alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.3"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  car: '<path d="M4 16v-4l2-5h12l2 5v4z"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>', enter: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3M14 4h5v16h-5"/>',
  play: '<path d="M7 4v16l13-8z"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>', replay: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 8v4l3 2"/>',
  video: '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18.5h2"/>', target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', chat: '<path d="M4 5h16v11H9l-5 4z"/>', more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  building: '<path d="M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 8h2M14 8h2M8 12h2M14 12h2"/>',
};
const ic = (n, sw = 2) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] ?? ''}</svg>`;

// ============================================================================ the world, with defaults
// Everything the engine draws comes from here; fields left out get sensible defaults.
function normalize(src) {
  const W = structuredClone(src ?? {});
  W.meta = { title: 'City of Living Data', subtitle: '', locale: 'en', palette: 'cream', ...W.meta };
  W.meta.brand = { name: W.meta.title, color: '#F63B04', ...W.meta.brand };
  W.meta.alias = { place: W.meta.locale.startsWith('pt') ? 'Local' : 'Place', person: W.meta.locale.startsWith('pt') ? 'Pessoa' : 'Person', ...W.meta.alias };
  W.roles = { owner: { label: 'Owner', color: '#10B981' }, staff: { label: 'Staff', color: '#F63B04' }, driver: { label: 'Driver', color: '#3B82F6' }, customer: { label: 'Customer', color: '#A3A8AF' }, family: { label: 'Family', color: '#8B5CF6' }, ...W.roles };
  W.states = { road: { label: 'On the road', tone: 'brand', moving: true }, waiting: { label: 'Reserved', tone: 'blue' }, parked: { label: 'In the lot', tone: 'green' }, ...W.states };
  W.places = (W.places ?? []).map((p, i) => ({ kind: 'shop', ...p, id: String(p.id ?? i + 1) }));
  if (!W.places.some((p) => p.kind === 'park')) W.places.push({ id: 'park', kind: 'park', name: W.meta.locale.startsWith('pt') ? 'Praça' : 'Square', auto: true });
  W.vehicles = (W.vehicles ?? []).map((v, i) => ({ state: 'parked', color: '#C3C8CF', ...v, id: String(v.id ?? 'v' + i), place: v.place != null ? String(v.place) : null }));
  W.people = (W.people ?? []).map((p, i) => ({ state: 'idle', ...p, id: String(p.id ?? 'p' + i), place: p.place != null ? String(p.place) : null }));
  W.actions = (W.actions ?? []).map((a, i) => ({ sev: 'amber', ...a, id: String(a.id ?? 'a' + i) }));
  W.kpis = W.kpis ?? [];
  W.player = { name: W.meta.locale.startsWith('pt') ? 'Você' : 'You', shirt: '#151515', skin: '#D4A07A', hair: '#2A1C14', cap: W.meta.brand.color, ...W.player };
  W.pet = { coat: '#B9753F', ...W.pet, name: 'Scott' }; // Scott is in every city, always named Scott
  W.companions = W.companions ?? [];
  W.home = W.home ?? {};
  return W;
}


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
  renderer.setPixelRatio(opts.pixelRatio ?? Math.min(devicePixelRatio, 2));
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
    if (tr.hid) { trunkIM.setMatrixAt(i, _Z); crownIM.setMatrixAt(i, _Z); return; }
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
    addPickMeshes(p, B.flush(root, { mat: placeMat(p) }), G.flush(root, { mat: GLASS, cast: false }));
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
    addPickMeshes(p, B.flush(root, { mat: placeMat(p) }), G.flush(root, { mat: GLASS, cast: false }));
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
    addPickMeshes(p, B.flush(root, { mat: placeMat(p) }), G.flush(root, { mat: GLASS, cast: false }));
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
    addPickMeshes(p, B.flush(root, { mat: placeMat(p) }), G.flush(root, { mat: GLASS, cast: false }));
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
  const carIMs = [carBody, carCab, carDet, carBlob, carHead, carTorso];
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
      pose: 'stand', look: 0, lookT: 0, hidden: false, react: 0, ...o,
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
    const bg = p.kind === 'cluster' ? '#8D939B' : p.kind === 'tower' ? 'var(--ink)' : p.kind === 'park' ? 'var(--green)' : (p.color ? col(p.color) : 'var(--brand)');
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
    const red = redCount(p), st = ['warn', 'down', 'none'].includes(p.status) ? `<i class="st st-${p.status}"></i>` : '';
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


  // ============================================================================ UI: numbers, dock, drawer
  const shown = new Map();
  function countUp(el, to, fmt) {
    if (!el) return; const from = shown.get(el) ?? 0; shown.set(el, to);
    if (reduced() || typeof to !== 'number') { el.textContent = fmt(to); return; }
    const t0 = performance.now(); const step = (now) => { const k = Math.min(1, (now - t0) / 800), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
  }
  function renderKpis() {
    const box = $('kpis'); box.hidden = !W.kpis.length;
    box.innerHTML = W.kpis.map((k, i) => `<${k.ref ? 'button' : 'div'} class="kpi ${k.tone ?? ''}" data-kpi="${i}"><span>${esc(k.label)}</span><b class="num"><span data-kv="${i}">–</span>${k.sub ? `<em>${esc(k.sub)}</em>` : ''}</b></${k.ref ? 'button' : 'div'}>`).join('');
    W.kpis.forEach((k, i) => countUp(box.querySelector(`[data-kv="${i}"]`), k.value, (v) => typeof k.value === 'number' ? fmtNum(k.format === 'int' || !k.format ? Math.round(v) : v, k.format) : String(k.value)));
  }
  let mode = 'map', inside = null, tour = null, replay = null, videoMode = false;
  function renderDock() {
    const d = $('dock');
    if (inside) { d.innerHTML = `<button data-exit class="play">${ic('rotl')}<span class="t">${T.exit}</span></button><span class="sep"></span><span class="room">${esc(inside.place.shown)}</span>`; }
    else if (tour) { d.innerHTML = `<button data-stop class="play">${ic('stop')}<span class="t">${T.stop}</span></button><span class="sep"></span><span class="room">${esc(tour.label)} · ${tour.i + 1}/${tour.steps.length}</span>`; }
    else if (replay) { d.innerHTML = `<button data-stop class="play">${ic('stop')}<span class="t">${T.stop}</span></button><span class="sep"></span><span class="room">${esc(W.timeline?.title ?? T.replay)}</span>`; }
    else {
      d.innerHTML = [['map', T.map, 'map'], ['walk', T.walk, 'walk'], ['heli', T.heli, 'heli']].map(([m, l, i]) => `<button data-mode="${m}" class="${mode === m ? 'on' : ''}">${ic(i)}<span class="t">${l}</span></button>`).join('')
        + `<span class="sep"></span><button data-overview class="${view?.t === 'home' ? 'on' : ''}">${ic('home')}<span class="t">${esc(W.home.label ?? T.overview)}</span></button>`
        + `<button data-tour>${ic('play')}<span class="t">${T.present}</span></button>`
        + (W.timeline?.events?.length ? `<button data-replay>${ic('replay')}<span class="t">${esc(W.timeline.label ?? T.replay)}</span></button>` : '')
        + `<button data-video title="${videoMode ? T.videoOff : T.video}" class="${videoMode ? 'on' : ''}">${ic('video')}</button>`;
    }
    const nb = $('names'); nb.hidden = !hasPrivate; nb.innerHTML = `${ic(hideNames ? 'eyeOff' : 'eye')}<span class="t">${hideNames ? T.namesHidden : T.hideNames}</span>`; nb.classList.toggle('on', hideNames);
  }

  // the drawer shows one thing at a time; every row, chip and button in it leads somewhere
  let view = null, tab = null, lastList = [];
  const tones = { brand: 'p-road', blue: 'p-res', green: 'p-free', amber: 'p-amber', red: 'p-red', muted: 'p-muted' };
  const pill = (st) => `<span class="pill ${tones[st.tone] ?? 'p-muted'}"><i></i>${esc(st.label)}</span>`;
  const kt = (s) => `<div class="kt ${s.tone ?? ''}"><span>${esc(s.label)}</span><b class="num">${esc(s.value)}${s.of != null ? `<em>/ ${esc(s.of)}</em>` : ''}</b>${s.sub ? `<small>${esc(s.sub)}</small>` : ''}</div>`;
  const alertBox = (a) => `<div class="alert ${{ red: 'a-red', amber: 'a-amber', blue: 'a-blue' }[a.sev] ?? 'a-amber'}">${ic(a.sev === 'blue' ? 'clock' : 'alert')}<div><b>${esc(a.title)}</b>${esc(a.text ?? '')}</div></div>`;
  const refAttr = (r) => r ? `data-ref='${esc(JSON.stringify(r))}'` : '';
  const actRef = (a) => a.target ?? (a.place ? { t: 'place', id: a.place } : null);
  const actRow = (a) => { const r = actRef(a); return `<button class="row" ${refAttr(r)}><span class="sv ${a.sev}"></span><span class="grow"><b>${esc(a.title)}</b><small>${esc([a.place && placeById.get(a.place)?.shown, a.text].filter(Boolean).join(' · '))}</small></span>${r ? ic('chev') : ''}</button>`; };
  const vehRow = (v) => { const st = stOf(v); return `<button class="row ${view?.t === 'vehicle' && view.id === v.id ? 'sel' : ''}" ${refAttr({ t: 'vehicle', id: v.id })}><span class="swatch" style="background:${col(v.color)}"></span><span class="grow ell"><b>${esc(v.name)} ${v.colorName ? `<i>${esc(v.colorName)}</i>` : ''}</b><small>${esc(v.listSub ?? placeById.get(v.place)?.shown ?? '')}</small></span>${v.alert === 'red' ? '<span class="badge">!</span>' : ''}${pill(st)}</button>`; };
  const perRow = (q) => `<button class="row" ${refAttr({ t: 'person', id: q.id })}><span class="dot" style="background:${col(roleOf(q).color)}"></span><span class="grow ell"><b>${esc(q.shown)}</b><small>${esc(q.listSub ?? roleOf(q).label)}</small></span>${ic('chev')}</button>`;
  function stackBar(p) {
    const tot = Math.max(1, p.vehicles.length), by = (f) => p.vehicles.filter(f).length / tot * 100;
    return p.vehicles.length ? `<div class="stack"><i style="width:${by(moving)}%;background:var(--brand)"></i><i style="width:${by((v) => !moving(v) && stOf(v).tone === 'blue')}%;background:var(--blue)"></i><i style="width:${by((v) => !moving(v) && stOf(v).tone !== 'blue')}%;background:var(--green)"></i></div>` : '';
  }
  const placeRow = (p) => `<button class="row" ${refAttr({ t: 'place', id: p.id })}>${markHtml(p).replace('class="mk"', 'class="mk mini"')}<span class="grow"><b>${esc(p.shown)}</b><small>${esc(autoCard(p))}</small>${stackBar(p)}</span>${redCount(p) ? `<span class="badge">${redCount(p)}</span>` : ''}${ic('chev')}</button>`;
  function blocks(list = []) {
    return list.map((b) => {
      const h = b.title ? `<h3>${esc(b.title)}${b.flag ? ` <em class="hot">${esc(b.flag)}</em>` : ''}${b.right ? `<span class="r">${esc(b.right)}</span>` : ''}</h3>` : '';
      switch (b.type) {
        case 'stats': return `<div class="blk">${h}<div class="kgrid">${b.items.map(kt).join('')}</div></div>`;
        case 'bar': return `<div class="bar-row"><span>${esc(b.label)}</span><b>${esc(b.text ?? `${b.value} ${T.of} ${b.max}`)}</b></div><div class="bar ${b.tone ?? ''}"><i style="width:${clamp((b.value / Math.max(1e-9, b.max)) * 100, 0, 100)}%"></i></div>`;
        case 'alerts': return b.items.map(alertBox).join('');
        case 'timeline': return `<div class="blk">${h}<ol class="vsteps">${b.items.map((s) => `<li class="${s.state ?? ''}"><span class="dot">${ic(s.state === 'done' ? 'check' : s.state === 'gap' ? 'alert' : s.state === 'eta' ? 'flag' : 'clock', 2.4)}</span><b>${esc(s.label)}</b><small>${esc(s.note ?? '')}</small></li>`).join('')}</ol></div>`;
        case 'kv': return `<div class="blk">${h}<dl class="kv">${b.items.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`;
        case 'funnel': { const mx = Math.max(1, ...b.items.map((i) => i.value)); return `<div class="blk">${h}${b.items.map((i) => `<div class="fn"><span>${esc(i.label)}</span><div class="bar ${i.tone ?? ''}"><i style="width:${Math.max(3, i.value / mx * 100)}%"></i></div><b>${esc(i.value)}</b></div>`).join('')}${b.note ? `<p class="muted">${esc(b.note)}</p>` : ''}</div>`; }
        case 'spark': { const mx = Math.max(1, ...b.items.map((i) => i.value)); return `<div class="blk">${h}<div class="spark">${b.items.map((i) => `<div><span style="height:${Math.max(4, i.value / mx * 46)}px"></span>${esc(i.label)} · ${esc(i.value)}</div>`).join('')}</div>${b.note ? `<p class="muted">${esc(b.note)}</p>` : ''}</div>`; }
        case 'note': return `<p class="muted">${esc(b.text)}</p>`;
        case 'chips': return `<div class="blk">${h}<div class="ppl">${b.items.map((c) => `<span ${refAttr(c.ref)} class="${c.ref ? 'lnk' : ''}"><i style="background:${col(c.color, 'var(--muted)')}"></i>${esc(c.label)}</span>`).join('')}</div></div>`;
        case 'list': {
          let items = b.of === 'places' ? PLACES.filter((p) => !p.auto) : b.of === 'actions' ? sortActs(ACTS) : b.of === 'vehicles' ? VEH : PEO;
          if (b.ids) items = b.ids.map((id) => (b.of === 'places' ? placeById : b.of === 'vehicles' ? vehById : b.of === 'people' ? perById : new Map(ACTS.map((a) => [a.id, a]))).get(String(id))).filter(Boolean);
          const total = items.length; if (b.limit) items = items.slice(0, b.limit);
          const row = b.of === 'places' ? placeRow : b.of === 'actions' ? actRow : b.of === 'vehicles' ? vehRow : perRow;
          return `<div class="blk">${h.replace('</h3>', b.of === 'actions' && !b.flag ? ` <em class="hot">${total}</em></h3>` : '</h3>')}${items.map(row).join('') || `<p class="muted">${T.nothing}</p>`}${b.limit && total > b.limit ? `<button class="more" data-go='${b.of === 'actions' ? '{"t":"actions"}' : '{"t":"home"}'}'>${T.seeAll} (${total})</button>` : ''}</div>`;
        }
        case 'buttons': return `<div class="btns">${b.items.map(btn).join('')}</div>`;
        default: return '';
      }
    }).join('');
  }
  const btn = (x, i) => `<button class="btn ${x.ghost || i ? 'ghost' : ''}" ${x.ref ? refAttr(x.ref) : ''} ${x.do ? `data-do="${esc(x.do)}"` : ''}>${x.icon ? ic(x.icon) : ''}${esc(x.label)}</button>`;
  const crumbHome = () => [{ t: 'home' }, W.home.label ?? T.overview];
  const PAGES = {
    home() {
      const b = W.home.blocks ?? [{ type: 'list', of: 'places', title: T.places }, { type: 'list', of: 'actions', title: T.actions, limit: 4 }];
      const tower = PLACES.find((p) => p.kind === 'tower' && p.enterable);
      const js = (W.journeys ?? []).map((j, i) => btn({ label: j.title, icon: 'play', do: 'journey:' + i }, 1)).join('');
      return { crumbs: [crumbHome()], html: `<div class="hero"><span class="mk dark">${W.meta.brand.logo ? logoSvg(22, 11, '#fff') : esc(W.meta.brand.name[0])}</span><div><h2>${esc(W.home.title ?? W.meta.title)}</h2><p>${esc(W.home.subtitle ?? W.meta.subtitle ?? '')}</p></div></div>${js ? `<div class="blk"><h3>${esc(W.journeysTitle ?? (LOC.startsWith('pt') ? 'Jornadas' : 'Journeys'))}</h3><div class="btns" style="margin-top:0">${js}</div></div>` : ''}${blocks(b)}<div class="btns">${tower ? btn({ label: `${T.enter}: ${tower.shown}`, icon: 'enter', do: 'enter:' + tower.id }, 0) : ''}${btn({ label: T.present, icon: 'play', do: 'tour' }, 1)}</div>` };
    },
    actions() { const l = sortActs(ACTS); return { crumbs: [crumbHome(), [null, T.actions]], html: `<div class="hero"><span class="mk" style="background:var(--red)">${ic('alert')}</span><div><h2>${T.actions}</h2><p>${l.filter((a) => a.sev === 'red').length} ${T.urgent}</p></div></div>${l.map(actRow).join('')}` }; },
    place(v) {
      const p = placeById.get(v.id); if (!p) return null;
      const acts = sortActs(actionsOf(p)), tabs = [];
      if (p.vehicles.length) tabs.push(['vehicles', T.vehicles, p.vehicles.length]); if (p.people.length) tabs.push(['people', T.people, p.people.length]); if (acts.length || tabs.length) tabs.push(['todo', T.todo, acts.length]);
      if (!tabs.some((x) => x[0] === tab)) tab = tabs[0]?.[0];
      const rank = (x) => (moving(x) ? 0 : stOf(x).tone === 'blue' ? 1 : 2);
      const list = tab === 'vehicles' ? p.vehicles.slice().sort((a, b) => rank(a) - rank(b)).map(vehRow).join('') : tab === 'people' ? p.people.map(perRow).join('') : acts.map(actRow).join('') || `<p class="muted">${T.nothing}</p>`;
      const cap = p.capacity;
      return { crumbs: [crumbHome(), [null, p.shown]], html: `
        <div class="hero">${markHtml(p, 44)}<div><h2>${esc(p.shown)}</h2><p>${esc(p.page?.subtitle ?? p.sub ?? '')}</p></div></div>
        ${p.enterable && !inside ? `<button class="btn enter" data-do="enter:${esc(p.id)}">${ic('enter')}${T.enterPlace}<small>${esc(p.enterHint ?? T.enterHint)}</small></button>` : ''}
        ${cap ? blocks([{ type: 'bar', label: T.capacity, value: p.vehicles.length, max: cap, text: `${p.vehicles.length} ${T.of} ${cap} ${T.used} · ${Math.max(0, cap - p.vehicles.length)} ${T.free}`, tone: 'blue' }]) : ''}
        ${blocks(p.page?.blocks)}
        ${tabs.length ? `<div class="blk"><div class="tabs">${tabs.map(([k, l, c]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l} <em>${c}</em></button>`).join('')}</div>${list}</div>` : ''}
        <div class="btns">${p.kind !== 'park' ? btn({ label: T.walkThere, icon: 'walk', do: 'walk:' + p.id }, 1) : btn({ label: T.walkThere, icon: 'walk', do: 'walk:' + p.id }, 0)}${p.vault != null || p === placeById.get(HELI_PLACE) ? btn({ label: T.fly, icon: 'heli', do: 'heli' }, 1) : ''}</div>` };
    },
    vehicle(v) {
      const x = vehById.get(v.id); if (!x) return null;
      const p = placeById.get(x.place), st = stOf(x), dr = x.driver && perById.get(x.driver), mv = moving(x);
      const crumbs = [crumbHome()]; if (p) crumbs.push([{ t: 'place', id: p.id }, p.shown]); crumbs.push([null, x.name]);
      return { crumbs, html: `
        <div class="hero"><span class="mk sw" style="background:${col(x.color)}"></span><div><h2>${esc(x.name)} ${x.colorName ? esc(x.colorName) : ''}</h2><p>${esc(x.page?.subtitle ?? p?.shown ?? '')}${x._f?.bay ? ` · ${T.bay} ${String(x._f.bay.n).padStart(2, '0')}` : ''}</p></div></div>
        <div class="status">${pill(st)}<span class="sub">${esc(x.stateText ?? '')}</span></div>
        ${blocks(x.page?.blocks)}
        <div class="btns">${mv ? btn({ label: follow?.ref?.id === x.id ? T.unfollow : T.follow, icon: 'target', do: 'follow' }, 0) + btn({ label: T.ride, icon: 'car', do: 'ride:' + x.id }, 1) : ''}${dr ? btn({ label: T.seeDriver, icon: 'user', ref: { t: 'person', id: dr.id } }, mv ? 1 : 0) : ''}</div>` };
    },
    person(v) {
      const q = perById.get(v.id); if (!q) return null;
      const p = placeById.get(q.place), veh = q.vehicle && vehById.get(q.vehicle), R = roleOf(q);
      const crumbs = [crumbHome()]; if (p) crumbs.push([{ t: 'place', id: p.id }, p.shown]); crumbs.push([null, q.shown]);
      const said = q._said ?? (q.lines?.[0]);
      return { crumbs, html: `
        <div class="hero"><span class="mk" style="background:${col(R.color)}">${esc(q.shown[0] ?? '?')}</span><div><h2>${esc(q.shown)}</h2><p>${esc(q.page?.subtitle ?? [R.label, p?.shown].filter(Boolean).join(' · '))}</p></div></div>
        ${said ? `<blockquote class="say">“${esc(said)}”</blockquote>` : ''}
        ${blocks(q.page?.blocks)}
        <div class="btns">${btn({ label: T.talk, icon: 'chat', do: 'talk' }, 0)}${veh ? btn({ label: T.seeVehicle, icon: 'car', ref: { t: 'vehicle', id: veh.id } }, 1) : ''}${p && p.kind !== 'park' ? btn({ label: T.seePlace, icon: 'building', ref: { t: 'place', id: p.id } }, 1) : ''}${q._pawn?.mode === 'wander' || (veh && moving(veh) && veh.driver === q.id) ? btn({ label: T.follow, icon: 'target', do: 'follow' }, 1) : ''}</div>` };
    },
    companion(v) { const c = W.companions[v.i]; return { crumbs: [crumbHome(), [{ t: 'place', id: park.id }, park.shown], [null, c.name]], html: `<div class="hero"><span class="mk" style="background:${col(c.look?.shirt, 'var(--brand)')}">${esc(c.name[0])}</span><div><h2>${esc(c.name)}</h2><p>${esc(c.rel ?? '')}</p></div></div>${c._said ? `<blockquote class="say">“${esc(c._said)}”</blockquote>` : ''}${blocks(c.page?.blocks)}<div class="btns">${btn({ label: T.talk, icon: 'chat', do: 'talk' }, 0)}</div>` }; },
    me() { return { crumbs: [crumbHome(), [null, W.player.name]], html: `<div class="hero"><span class="mk dark">${esc(W.player.name[0])}</span><div><h2>${esc(W.player.name)}</h2><p>${esc(W.player.role ?? T.you)}</p></div></div><div class="btns">${btn({ label: T.walk, icon: 'walk', do: 'mode:walk' }, 0)}${btn({ label: T.fly, icon: 'heli', do: 'heli' }, 1)}</div>` }; },
    pet() { return { crumbs: [crumbHome(), [null, 'Scott']], html: `<div class="hero"><span class="mk" style="background:${col(W.pet.coat)}">S</span><div><h2>${esc(W.pet.label ?? 'Scott')}</h2><p>${esc(W.pet.line ?? T.pet)}</p></div></div><div class="btns">${btn({ label: '🦴', do: 'pet' }, 0)}${btn({ label: T.walk, icon: 'walk', do: 'mode:walk' }, 1)}</div>` }; },
    prop(v) {
      const p = v.place && placeById.get(v.place), crumbs = [crumbHome()]; if (p) crumbs.push([{ t: 'place', id: p.id }, p.shown]);
      const page = (title, sub, body = '', mk = ic('flag')) => ({ crumbs: [...crumbs, [null, title]], html: `<div class="hero"><span class="mk dark">${mk}</span><div><h2>${esc(title)}</h2><p>${esc(sub ?? '')}</p></div></div>${body}` });
      if (v.k === 'heli') return page(T.heli, T.fly, `<div class="btns">${btn({ label: T.fly, icon: 'heli', do: 'heli' }, 0)}</div>`, ic('heli'));
      if (v.k === 'vault') return page(p?.vaultTitle ?? T.vault, p?.vaultText ?? `${p?.vault ?? 0}`, blocks(p?.vaultBlocks));
      if (v.k === 'ghost') return page(T.ghost, p?.nextFloor ?? '', blocks(p?.floorBlocks));
      return null;
    },
  };
  let HELI_PLACE = null;
  function renderDrawer() {
    if (!view) return;
    const pg = PAGES[view.t]?.(view); if (!pg) return closeDrawer();
    $('crumbs').innerHTML = pg.crumbs.map(([r, l], i) => `<button ${r ? refAttr(r) : ''} class="${i === pg.crumbs.length - 1 ? 'on' : ''}">${esc(l)}</button>`).join(ic('chev'));
    const b = $('body'), key = JSON.stringify(view);
    b.innerHTML = pg.html;
    if (b.dataset.key !== key) { b.scrollTop = 0; b.classList.remove('rise'); void b.offsetWidth; b.classList.add('rise'); b.dataset.key = key; }
  }


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
    const el = document.createElement('div'), tx = document.createElement('div'); tx.className = 'c-say'; tx.textContent = text; el.appendChild(tx); // the pop animation lives on the inner box, so it never fights the label's own transform
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
      if (pk.t === 'place' && !inside) return { ...pk, ground: [h.point.x, h.point.z] };
      return pk;
    }
    if (inside) return null;
    // the ground answers too: a block belongs to its place, a street tells you its traffic
    const hit = new THREE.Vector3(); if (!ray.ray.intersectPlane(new THREE.Plane(UP, -.25), hit)) return null;
    for (const p of PLACES) { const r = p.rect; if (hit.x > r.x0 && hit.x < r.x1 && hit.z > r.z0 && hit.z < r.z1) return { t: 'place', id: p.id, ground: [hit.x, hit.z] }; }
    if (Math.abs(hit.x) < XS[COLS] + RW / 2 && Math.abs(hit.z) < ZS[ROWS] + RW / 2) { const n = FLEET.filter((f) => f.r && f.pos.distanceTo(hit) < 22).length; return { t: 'prop', k: 'road', sub: `${n} ${T.vehicles.toLowerCase()} ${T.onRoad}`, ground: [hit.x, hit.z] }; }
    return { t: 'grass', ground: [hit.x, hit.z] };
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
    let h = pickAt(e); if (h?.t === 'grass' || (mode === 'walk' && h?.ground)) h = null;
    const hk = (x) => (x ? JSON.stringify({ ...x, ground: undefined }) : ''), key = hk(h);
    if (key !== hk(hover)) {
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
    // walking: a click on the ground is where you want to go
    if (mode === 'walk' && (!h || h.ground)) { if (h?.ground) walkGoTo(h.ground[0], h.ground[1]); return; }
    if (!h || h.t === 'grass') return;
    if (h.t === 'prop') return clickProp(h);
    if (h.t === 'me' && mode === 'walk') return;
    open(h.ground ? { t: h.t, id: h.id } : h, { fly: mode === 'map' });
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
  let walkTarget = null;
  function walkGoTo(x, z) { const p = new THREE.Vector3(x, 0, z); collide(p); walkTarget = p; walkMarker.position.set(p.x, groundAt(p.x, p.z) + .07, p.z); walkMarker.userData.t = 1; }
  function walk(dt) {
    let f = (on('KeyW', 'ArrowUp') ? 1 : 0) - (on('KeyS', 'ArrowDown') ? 1 : 0), turn = (on('KeyA', 'ArrowLeft') ? 1 : 0) - (on('KeyD', 'ArrowRight') ? 1 : 0);
    if (f || turn) walkTarget = null;
    else if (walkTarget) { // click-to-walk: turn toward the spot, walk, slow down on arrival
      const dx = walkTarget.x - ME.pos.x, dz = walkTarget.z - ME.pos.z, d = Math.hypot(dx, dz);
      if (d < .4) walkTarget = null; else { ME.h += wrapA(Math.atan2(dx, dz) - ME.h) * (1 - Math.exp(-dt * 8)); f = Math.min(1, d / 1.5); }
    }
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
    cork.userData.pick = { t: 'cork', uvPick: (uv) => { const a = noteAt(uv, items); return a ? { t: 'action', id: a.id } : { t: 'place', id: p.id, hint: T.board, tab: 'todo' } } }; room.pick.push(cork);
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
  function veil(fn) { const f = $('veil'); if (reduced()) { fn(); return; } f.classList.add('on'); later(() => { fn(); requestAnimationFrame(() => f.classList.remove('on')); }, 280); }
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
      const hn = $('hint'); hn.textContent = T.hintInside; hn.style.opacity = 1; later(() => (hn.style.opacity = 0), 6000);
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
    if (patch.kpis) { W.kpis = patch.kpis; renderKpis(); }
    if (patch.actions) { ACTS.length = 0; patch.actions.forEach((a, i) => ACTS.push({ sev: 'amber', ...a, id: String(a.id ?? 'a' + i) })); }
    if (patch.asOf) { W.meta.asOf = patch.asOf; renderAsOf(); }
    reindex(); applyNames();
    for (const v of added.splice(Math.max(0, CAP_V - FLEET.length))) { console.warn('[city] vehicle capacity reached, reload to show', v.id); }
    for (const v of added) { addFleet(v); const p = placeById.get(v.place); const b = p?.bays?.find((x) => !x.vehicle); if (b) { b.vehicle = v.id; v._f.bay = b; } changed.add(v); }
    for (const v of changed) { if (!moving(v) && !v._f.bay) { const b = placeById.get(v.place)?.bays?.find((x) => !x.vehicle); if (b) { b.vehicle = v.id; v._f.bay = b; } } syncVehicle(v); }
    paintBays(); refreshCards(); refreshSigns(); renderDrawer();
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
  async function poll(src) {
    try {
      let rows;
      if (src.type === 'static') rows = src.rows ?? src.patch;
      else if (src.type === 'supabase') { const r = await fetch(`${src.url.replace(/\/$/, '')}/rest/v1/${src.table}?select=${encodeURIComponent(src.select ?? '*')}`, { headers: { apikey: src.anonKey, Authorization: `Bearer ${src.anonKey}` } }); if (!r.ok) throw new Error(r.status); rows = await r.json(); }
      else { const r = await fetch(src.url, { headers: src.headers ?? {}, credentials: src.credentials ?? 'same-origin' }); if (!r.ok) throw new Error(r.status); rows = await r.json(); }
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
  }
  function renderAsOf() {
    const el = $('live'), txt = $('asof'), srcs = W.data?.sources?.filter((s) => s.type !== 'static') ?? [];
    if (srcs.length) {
      const maxGap = Math.max(...srcs.map((s) => s.intervalMs ?? 15000)) * 3, stale = live.err || (live.last && performance.now() - live.last > maxGap);
      el.classList.toggle('stale', !!stale); el.classList.toggle('nodata', !live.ok);
      txt.textContent = !live.ok ? T.noData : stale ? T.stale : T.live; return;
    }
    const d = W.meta.asOf ? new Date(W.meta.asOf) : null;
    el.hidden = !d; if (d) txt.textContent = `${T.asOf} ${d.toLocaleDateString(LOC)} ${d.toLocaleTimeString(LOC, { hour: '2-digit', minute: '2-digit' })}`;
  }

  // ============================================================================ build everything
  buildBase(); buildLights(); buildPlaces(); borderTrees();
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
  renderKpis(); renderDock(); renderAsOf(); startSources();
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
    pick: (x, y) => { const r = canvas.getBoundingClientRect(); const h = pickAt({ clientX: r.left + x, clientY: r.top + y }); return h ? { ...h, tip: tipText(h).replace(/<[^>]+>/g, ' · ') } : null; },
    state: () => ({ mode, view, inside: inside?.place.id ?? null, me: [+ME.pos.x.toFixed(2), +ME.pos.z.toFixed(2)], touring: !!tour, replaying: !!replay, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
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
