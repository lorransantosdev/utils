// City of Living Data — React / Next.js component.
// Next.js: render it client-only, e.g. const CityView = dynamic(() => import('./CityView'), { ssr: false })
'use client';
import { useEffect, useRef } from 'react';
import { createCity } from './city-of-living-data.js';
import './city-of-living-data.css';
import defaultWorld from './world.json';

type CityApi = ReturnType<typeof createCity>;

export default function CityView({ world: data = defaultWorld, options, onReady, style }: {
  world?: unknown; options?: Record<string, unknown>; onReady?: (api: CityApi) => void; style?: React.CSSProperties;
}) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<CityApi | null>(null);
  useEffect(() => {
    if (!host.current) return;
    api.current = createCity(host.current, data, options);
    onReady?.(api.current);
    return () => { api.current?.destroy(); api.current = null; };
    // re-create only when the world object itself changes; push live changes with api.update(patch)
  }, [data]);
  return <div ref={host} style={{ position: 'relative', width: '100%', height: '100%', minHeight: 480, ...style }} />;
}
