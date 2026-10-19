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
