'use client';

import React, { useState, useEffect } from 'react';
import {
  Waves,
  MapPin,
  Crosshair,
  Search,
  PlusCircle,
  Trophy,
  Sliders,
  ChevronDown,
  Camera,
  Code2,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentLocationName: string;
  currentCoords: [number, number];
  onSelectCoordinates: (lat: number, lng: number, name: string) => void;
  radiusKm: number;
  onRadiusChange: (radius: number) => void;
  onOpenReportModal: () => void;
  onOpenStatsModal: () => void;
  isLocating: boolean;
  onUseGps: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLocationName,
  currentCoords,
  onSelectCoordinates,
  radiusKm,
  onRadiusChange,
  onOpenReportModal,
  onOpenStatsModal,
  isLocating,
  onUseGps,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const [recentLocations, setRecentLocations] = useState<Array<{ name: string; lat: number; lng: number }>>([
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  ]);

  // Load recent locations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('riverrevive_recent_searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentLocations(parsed);
        }
      }
    } catch {}
  }, []);

  const saveRecentLocation = (item: { name: string; lat: number; lng: number }) => {
    setRecentLocations((prev) => {
      const filtered = prev.filter((p) => p.name.toLowerCase() !== item.name.toLowerCase());
      const updated = [item, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('riverrevive_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Search places worldwide using Free Nominatim API
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=6&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'RiverReviveAI-Search/1.0',
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.warn('Geocoding search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectPlace = (place: any) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    const shortName = place.display_name.split(',')[0].trim();
    const displayName = place.display_name.split(',').slice(0, 3).join(',');
    saveRecentLocation({ name: shortName, lat, lng });
    onSelectCoordinates(lat, lng, displayName);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSelectPlace(suggestions[0]);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-emerald-950/10 px-4 py-2.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Main Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Tagline */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center space-x-2.5" title="RiverRevive AI — Autonomous Waterway Sentinel">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#134e3a] shadow-sm">
                <Waves className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg font-black tracking-tight text-slate-900">
                    RiverRevive
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Google AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Autonomous River Cleanup Sentinel
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={onUseGps}
                disabled={isLocating}
                title="Locate via GPS"
                className="p-2 rounded-xl bg-slate-100 text-emerald-700 border border-slate-200"
              >
                <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onOpenReportModal}
                title="Report a polluted spot"
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#134e3a] text-white flex items-center gap-1 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Report
              </button>
            </div>
          </div>

          {/* Search Bar & Location Selector */}
          <div className="w-full md:w-auto flex-1 max-w-xl flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <div className="flex items-center bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all shadow-inner">
                <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
                  placeholder="Search city, river, ghat, or canal (e.g. Kolkata, Varanasi, London)..."
                  className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                  title="Type any city or river name to inspect immediately"
                />
                {isSearching && (
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin ml-2" />
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSearchDropdown && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl overflow-hidden z-50 divide-y divide-slate-100 border border-slate-200 shadow-xl">
                  {suggestions.map((place) => (
                    <button
                      key={place.place_id}
                      type="button"
                      onClick={() => handleSelectPlace(place)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex items-start gap-2.5"
                      title={`Jump to ${place.display_name}`}
                    >
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 line-clamp-1">
                          {place.display_name.split(',')[0]}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {place.display_name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* GPS Button with hover tooltip */}
            <button
              type="button"
              onClick={onUseGps}
              disabled={isLocating}
              title="Detect your device GPS coordinates"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-emerald-800 hover:border-emerald-300 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-600' : 'text-emerald-700'}`} />
              <span className="hidden lg:inline">{isLocating ? 'Locating...' : 'My GPS'}</span>
            </button>

            {/* Radius Filter with hover tooltip */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRadiusMenu(!showRadiusMenu)}
                title={`Scan radius: currently searching within ${radiusKm} km`}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-emerald-800 hover:border-emerald-300 transition-all shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                <span>{radiusKm} km</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRadiusMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl p-3 z-50 shadow-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">Scan Radius</span>
                    <span className="text-xs font-mono font-bold text-emerald-700">{radiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="1"
                    value={radiusKm}
                    onChange={(e) => onRadiusChange(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 km</span>
                    <span>10 km</span>
                    <span>25 km</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Header Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={onOpenStatsModal}
              title="View community volunteer impact, cleaned weight & rankings"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-all shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Impact</span>
            </button>

            <button
              onClick={onOpenReportModal}
              title="Report an uncleaned riverbank or dumping site"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#134e3a] hover:bg-[#0e3a2b] text-white shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-300" />
              <span>Report Spot</span>
            </button>
          </div>
        </div>

        {/* Friendly Quick-Location Switcher Chips Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono mr-1">
              Recent:
            </span>
            {recentLocations.map((loc) => {
              const isCurrent =
                currentLocationName.toLowerCase().includes(loc.name.toLowerCase());
              return (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => onSelectCoordinates(loc.lat, loc.lng, loc.name)}
                  title={`Jump instantly to ${loc.name}`}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    isCurrent
                      ? 'bg-[#134e3a] text-white font-bold shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  <MapPin className={`w-3 h-3 ${isCurrent ? 'text-white' : 'text-emerald-700'}`} />
                  <span>{loc.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Location Display Indicator with hover title */}
          <div
            className="flex items-center gap-1.5 text-xs text-slate-600 font-medium ml-auto"
            title={`Active Location: ${currentLocationName}`}
          >
            <span className="text-slate-400">Current Area:</span>
            <span className="font-bold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              📍 {currentLocationName.split(',')[0]}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
