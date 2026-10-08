'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Incident, HotspotCluster, OverpassElement } from '@/types';
import { Loader2, MapPin } from 'lucide-react';

// Dynamic import with SSR disabled for Leaflet
const RiverMapInner = dynamic(
  () => import('./RiverMapInner').then((mod) => mod.RiverMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] rounded-3xl glass-panel border border-eco-border flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-eco-cyan/10 border border-eco-cyan/30 flex items-center justify-center animate-pulse">
            <MapPin className="w-6 h-6 text-eco-cyan" />
          </div>
          <Loader2 className="w-6 h-6 text-eco-cyan animate-spin absolute -bottom-1 -right-1" />
        </div>
        <p className="text-xs text-slate-400 font-mono tracking-wide">
          INITIALIZING LEAFLET GEOSPATIAL ENGINE...
        </p>
      </div>
    ),
  }
);

interface RiverMapProps {
  center: [number, number];
  zoom: number;
  incidents: Incident[];
  clusters: HotspotCluster[];
  overpassElements: OverpassElement[];
  selectedCluster: HotspotCluster | null;
  onSelectCluster: (cluster: HotspotCluster) => void;
  onDiagnoseIncident: (incident: Incident) => void;
  onOrganizeCleanup: (cluster: HotspotCluster) => void;
  onMapClick?: (lat: number, lng: number) => void;
  activeFilter?: 'all' | 'high' | 'moderate' | 'waterway';
  onFilterChange?: (filter: 'all' | 'high' | 'moderate' | 'waterway') => void;
}

export const RiverMap: React.FC<RiverMapProps> = (props) => {
  return <RiverMapInner {...props} />;
};

