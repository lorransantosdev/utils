// Types for the City of Living Data engine (city-of-living-data.js).
export type Ref =
  | { t: 'home' } | { t: 'actions' }
  | { t: 'place' | 'vehicle' | 'person' | 'action'; id: string }
  | { t: 'companion'; i: number } | { t: 'me' } | { t: 'pet' }
  | { t: 'prop'; k: 'heli' | 'vault' | 'ghost'; place?: string };
export interface CityOptions { seed?: number; reducedMotion?: boolean; preserveDrawingBuffer?: boolean; pixelRatio?: number }
export interface FlyOptions { x?: number; z?: number; zoom?: number; zoomFit?: number; az?: number; daz?: number; dur?: number }
export interface CityPatch { places?: any[]; vehicles?: any[]; people?: any[]; kpis?: any[]; actions?: any[]; asOf?: string; banner?: string | { text: string; label?: string; tone?: 'green' | 'amber' | 'red' | 'blue'; at?: string } | null }
export interface CityApi {
  world: any;
  open(ref: Ref, opts?: { fly?: boolean; react?: boolean }): void;
  close(): void;
  enter(placeId: string): void;
  exit(): void;
  setMode(mode: 'map' | 'walk' | 'heli'): void;
  ride(vehicleId: string): void;
  viewAll(seconds?: number): void;
  rotateBy(radians: number): void;
  zoomBy(factor: number): void;
  fly(o?: FlyOptions): void;
  walkTo(x: number, z: number): void;
  update(patch: CityPatch): void;
  tour(steps?: any[], label?: string): void;
  stopTour(): void;
  next(): void;
  replay(): void;
  stopReplay(): void;
  video(on: boolean): void;
  on(event: 'open' | 'close' | 'mode' | 'enter' | 'exit' | 'tour' | 'replay' | 'update', fn: (detail?: any) => void): () => void;
  state(): { mode: string; view: Ref | null; inside: string | null; touring: boolean; replaying: boolean; calls: number; tris: number; me: [number, number] };
  pick(x: number, y: number): (Ref & { tip?: string }) | null;
  sim(seconds: number): { minD: number; maxStuck: number };
  destroy(): void;
}
export const VERSION: string;
export function createCity(host: HTMLElement, world: unknown, options?: CityOptions): CityApi;
