'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { WeatherGuard } from '@/components/WeatherGuard';
import { RiverMap } from '@/components/Map/RiverMap';
import { HotspotList } from '@/components/Feed/HotspotList';
import { ReportIncidentModal } from '@/components/Modals/ReportIncidentModal';
import { DiagnosisModal } from '@/components/Modals/DiagnosisModal';
import { CleanupDriveModal } from '@/components/Modals/CleanupDriveModal';
import { ImpactStats } from '@/components/ImpactStats';
import {
  Incident,
  HotspotCluster,
  OverpassElement,
  WeatherData,
} from '@/types';
import { INITIAL_LAT, INITIAL_LNG, INITIAL_CITY } from '@/data/seedIncidents';
import { clusterIncidents } from '@/lib/clustering';
import {
  MapPin,
  RefreshCw,
  Sparkles,
  Droplets,
  CalendarCheck,
  Compass
} from 'lucide-react';

export default function Home() {
  // Location state - defaults to Kolkata or saved user selection
  const [currentCoords, setCurrentCoords] = useState<[number, number]>([
    22.5726,
    88.3639,
  ]);
  const [locationName, setLocationName] = useState<string>('Kolkata, West Bengal');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Data state
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [overpassElements, setOverpassElements] = useState<OverpassElement[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingOverpass, setIsLoadingOverpass] = useState<boolean>(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState<boolean>(true);

  // Selected state for modals & focus
  const [selectedCluster, setSelectedCluster] = useState<HotspotCluster | null>(null);
  const [diagnosingIncident, setDiagnosingIncident] = useState<Incident | null>(null);
  const [drivePlanningCluster, setDrivePlanningCluster] = useState<HotspotCluster | null>(null);

  // Modal visibility
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState<boolean>(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);

  // Active view tab on mobile (Map vs Hotspots)
  const [mobileTab, setMobileTab] = useState<'hotspots' | 'map'>('map');

  // Load saved location on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem('riverrevive_saved_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lng) {
          setCurrentCoords([parsed.lat, parsed.lng]);
          setLocationName(parsed.name || 'Selected City');
        }
      }
    } catch {}
  }, []);

  // 1. Fetch Incidents for the selected coordinates & city
  const fetchIncidents = useCallback(async (lat: number, lng: number, city: string) => {
    try {
      setIsLoadingIncidents(true);
      const res = await fetch(
        `/api/incidents?lat=${lat}&lng=${lng}&city=${encodeURIComponent(city)}`
      );
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
      }
    } catch (err) {
      console.warn('Failed to fetch incidents:', err);
    } finally {
      setIsLoadingIncidents(false);
    }
  }, []);

  // 2. Fetch Overpass Elements (Waterways & Tourist POIs)
  const fetchOverpass = useCallback(async (lat: number, lng: number, radius: number) => {
    try {
      setIsLoadingOverpass(true);
      const res = await fetch(`/api/overpass?lat=${lat}&lng=${lng}&radius=${radius}`);
      if (res.ok) {
        const data = await res.json();
        setOverpassElements(data.elements || []);
      }
    } catch (err) {
      console.warn('Failed to fetch Overpass data:', err);
    } finally {
      setIsLoadingOverpass(false);
    }
  }, []);

  // 3. Fetch Weather from Open-Meteo
  const fetchWeather = useCallback(async (lat: number, lng: number) => {
    try {
      setIsLoadingWeather(true);
      const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        setWeather(data.weather || null);
      }
    } catch (err) {
      console.warn('Failed to fetch weather data:', err);
    } finally {
      setIsLoadingWeather(false);
    }
  }, []);

  // Refresh all data whenever location coordinates or radius changes
  useEffect(() => {
    fetchIncidents(currentCoords[0], currentCoords[1], locationName);
    fetchOverpass(currentCoords[0], currentCoords[1], radiusKm);
    fetchWeather(currentCoords[0], currentCoords[1]);
  }, [fetchIncidents, fetchOverpass, fetchWeather, currentCoords, radiusKm, locationName]);

  // Handle location selection and save in state & localStorage
  const handleSelectCoordinates = (lat: number, lng: number, name: string) => {
    setCurrentCoords([lat, lng]);
    setLocationName(name);
    try {
      localStorage.setItem(
        'riverrevive_saved_location',
        JSON.stringify({ lat, lng, name })
      );
    } catch {}
  };

  // Handle GPS location click
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords([lat, lng]);

        // Reverse geocode with free Nominatim
        try {
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            {
              headers: { 'User-Agent': 'RiverReviveAI-ReverseGeocode/1.0' },
            }
          );
          if (revRes.ok) {
            const revData = await revRes.json();
            const displayName =
              revData.display_name?.split(',').slice(0, 3).join(',') ||
              'Your GPS Location';
            setLocationName(displayName);
            try {
              localStorage.setItem(
                'riverrevive_saved_location',
                JSON.stringify({ lat, lng, name: displayName })
              );
            } catch {}
          } else {
            const fallbackName = `GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
            setLocationName(fallbackName);
          }
        } catch {
          setLocationName(`GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        alert('Could not retrieve GPS location. Please allow location permissions or search an address.');
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Dynamically compute DBSCAN Clusters with friendly estimates
  const clusters = useMemo(() => {
    return clusterIncidents(
      incidents,
      currentCoords[0],
      currentCoords[1],
      overpassElements,
      0.6, // 600m epsilon
      2    // minPts = 2
    );
  }, [incidents, currentCoords, overpassElements]);

  // Handle incident diagnosis trigger
  const handleDiagnoseIncident = (incident: Incident) => {
    setDiagnosingIncident(incident);
    setIsDiagnosisModalOpen(true);
  };

  // Handle cleanup drive trigger
  const handleOrganizeCleanup = (cluster: HotspotCluster) => {
    setDrivePlanningCluster(cluster);
    setIsDriveModalOpen(true);
  };

  // Active priority filter state ('all' | 'high' | 'moderate' | 'waterway')
  const [activePriorityFilter, setActivePriorityFilter] = useState<'all' | 'high' | 'moderate' | 'waterway'>('all');

  // Callback when user adds new incident report
  const handleReportSubmitted = (newIncident: Incident) => {
    setIncidents((prev) => [newIncident, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8f6] text-slate-800 selection:bg-emerald-200 selection:text-emerald-950">
      {/* 1. TOP NAVIGATION WITH LOCATION SELECTOR */}
      <Navbar
        currentLocationName={locationName}
        currentCoords={currentCoords}
        onSelectCoordinates={handleSelectCoordinates}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        isLocating={isLocating}
        onUseGps={handleUseGps}
      />

      {/* 2. GOOGLE HACKATHON BADGE & REAL-TIME RIVER SAFETY ADVISORY */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-white border border-slate-200/90 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-bold text-slate-900 tracking-wide">
              Google Solution Challenge 2026
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline text-slate-600 font-medium">
              Google Gemini 2.0 AI & Google Maps Platform Geospatial Sentinel
            </span>
          </div>

          <span
            className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200"
            title="Real-time river hydrological sensor and incident monitoring"
          >
            Live Waterway Monitor
          </span>
        </div>

        <WeatherGuard
          weather={weather}
          isLoading={isLoadingWeather}
          locationName={locationName.split(',')[0]}
        />
      </div>

      {/* 3. MOBILE VIEW TOGGLE */}
      <div className="flex md:hidden px-4 mb-2">
        <div className="w-full flex rounded-2xl bg-white p-1 border border-slate-200 text-xs font-bold shadow-sm">
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mobileTab === 'map'
                ? 'bg-[#134e3a] text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🗺️ Google Map View
          </button>
          <button
            onClick={() => setMobileTab('hotspots')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mobileTab === 'hotspots'
                ? 'bg-[#134e3a] text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Nearest Spots ({clusters.length})
          </button>
        </div>
      </div>

      {/* 4. MAIN SPLIT INTERFACE */}
      <main className="max-w-7xl mx-auto w-full px-4 pb-6 flex-1 flex flex-col md:flex-row gap-4">
        
        {/* LEFT COLUMN: Clean, Friendly Interactive Map with Google Maps Navigation (7/12 desktop) */}
        <section
          className={`w-full md:w-1/2 lg:w-7/12 h-[520px] md:h-[calc(100vh-210px)] flex flex-col ${
            mobileTab === 'map' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Waterway Map: {locationName}</span>
              </span>
              {isLoadingOverpass && (
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-600" /> Syncing Overpass
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-2">
              <span>Click markers for Google Navigation & Clean Plans</span>
            </div>
          </div>

          <div className="flex-1 w-full h-full">
            <RiverMap
              center={currentCoords}
              zoom={14}
              incidents={incidents}
              clusters={clusters}
              overpassElements={overpassElements}
              selectedCluster={selectedCluster}
              activeFilter={activePriorityFilter}
              onFilterChange={setActivePriorityFilter}
              onSelectCluster={(cl) => {
                setSelectedCluster(cl);
              }}
              onDiagnoseIncident={handleDiagnoseIncident}
              onOrganizeCleanup={handleOrganizeCleanup}
              onMapClick={(lat, lng) => {
                setCurrentCoords([lat, lng]);
              }}
            />
          </div>
        </section>

        {/* RIGHT COLUMN: Suggested Polluted Places / Hotspots Feed (5/12 desktop) */}
        <section
          className={`w-full md:w-1/2 lg:w-5/12 h-[520px] md:h-[calc(100vh-210px)] ${
            mobileTab === 'hotspots' ? 'flex' : 'hidden md:flex'
          } flex-col bg-white/95 rounded-3xl p-4 border border-slate-200/90 shadow-xl backdrop-blur-md`}
        >
          <HotspotList
            clusters={clusters}
            selectedCluster={selectedCluster}
            activeFilter={activePriorityFilter}
            onFilterChange={setActivePriorityFilter}
            onSelectCluster={(c) => {
              setSelectedCluster(c);
              setCurrentCoords([c.center.lat, c.center.lng]);
            }}
            onOrganizeCleanup={handleOrganizeCleanup}
            onDiagnoseIncident={handleDiagnoseIncident}
            locationName={locationName}
            isLoading={isLoadingIncidents}
          />
        </section>

      </main>

      {/* 5. MODAL DIALOGS */}
      {/* Citizen Report Modal */}
      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        defaultLat={currentCoords[0]}
        defaultLng={currentCoords[1]}
        onReportSubmitted={handleReportSubmitted}
      />

      {/* AI Hydrological Diagnosis Modal */}
      <DiagnosisModal
        isOpen={isDiagnosisModalOpen}
        onClose={() => setIsDiagnosisModalOpen(false)}
        incident={diagnosingIncident}
        onOrganizeCleanup={() => {
          if (diagnosingIncident) {
            const cluster = clusters.find((c) =>
              c.incidents.some((i) => i.id === diagnosingIncident.id)
            ) || {
              id: 'cluster-temp',
              name: diagnosingIncident.title,
              center: { lat: diagnosingIncident.lat, lng: diagnosingIncident.lng },
              incidents: [diagnosingIncident],
              totalSeverity: diagnosingIncident.severity,
              touristAttractionsNear: [],
              waterbodyType: 'river',
              urgencyScore: 75,
              urgencyLevel: 'critical',
              distanceKm: 0.5,
              estimatedTimeHours: 2.0,
              volunteersRecommended: 12,
              primaryAction: 'Volunteer Riverbank Sweep',
              howToCleanSummary: 'Sweep plastic bottles and food wrappers into heavy collection sacks.',
              gearNeededSummary: ['Gloves', 'Pickers', 'Bags'],
            };
            handleOrganizeCleanup(cluster);
          }
        }}
      />

      {/* AI Turnkey Cleanup Drive Plan Modal with Customization & Weather */}
      <CleanupDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        cluster={drivePlanningCluster}
      />

      {/* Community Leaderboard & Impact Counter Modal */}
      <ImpactStats
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        activeHotspotsCount={clusters.length}
      />
    </div>
  );
}
