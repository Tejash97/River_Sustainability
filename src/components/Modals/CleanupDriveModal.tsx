'use client';

import React, { useState, useEffect } from 'react';
import { HotspotCluster, CleanupDrivePlan } from '@/types';
import {
  X,
  CalendarCheck,
  MapPin,
  Clock,
  ShieldCheck,
  CheckSquare,
  Share2,
  Copy,
  Check,
  Download,
  Loader2,
  Sparkles,
  MessageCircle,
  Instagram,
  Twitter,
  Truck,
  Edit3,
  Save,
  Plus,
  Trash2,
  CloudSun,
  Navigation,
  Eye,
  ExternalLink,
  Send,
  AlertTriangle
} from 'lucide-react';

interface CleanupDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  cluster: HotspotCluster | null;
}

interface TargetWeatherForecast {
  matchedHour: string;
  temperature: number;
  rainProbability: number;
  precipitation: number;
  windSpeed: number;
  isSafeForCleanup: boolean;
  advisory: string;
  googleWeatherBadge?: string;
}

export const CleanupDriveModal: React.FC<CleanupDriveModalProps> = ({
  isOpen,
  onClose,
  cluster,
}) => {
  const [plan, setPlan] = useState<CleanupDrivePlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'logistics' | 'social'>('logistics');

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customTagline, setCustomTagline] = useState<string>('');
  const [customAssemblyPoint, setCustomAssemblyPoint] = useState<string>('');
  const [customSchedule, setCustomSchedule] = useState<string>('');
  const [customDateTime, setCustomDateTime] = useState<string>('');
  const [customDepot, setCustomDepot] = useState<string>('');
  const [customSupplies, setCustomSupplies] = useState<string[]>([]);
  const [newSupplyText, setNewSupplyText] = useState<string>('');
  const [customWhatsapp, setCustomWhatsapp] = useState<string>('');
  const [customInstagram, setCustomInstagram] = useState<string>('');
  const [customTwitter, setCustomTwitter] = useState<string>('');

  // Target time weather state
  const [targetWeather, setTargetWeather] = useState<TargetWeatherForecast | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);

  // Share dropdown state
  const [showShareMenu, setShowShareMenu] = useState<boolean>(false);

  // Default next Saturday 6:30 AM
  const getNextSaturdayIso = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (6 - day + 7) % 7 || 7; // days to next Saturday
    d.setDate(d.getDate() + diff);
    d.setHours(6, 30, 0, 0);
    return d.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:MM'
  };

  useEffect(() => {
    if (!isOpen || !cluster) {
      setPlan(null);
      setError(null);
      setIsEditMode(false);
      setTargetWeather(null);
      return;
    }

    const fetchDrivePlan = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch('/api/gemini-drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cluster }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to generate cleanup drive plan');
        }

        const initialPlan: CleanupDrivePlan = data.plan;
        setPlan(initialPlan);

        // Populate editable state
        setCustomTitle(initialPlan.drive_title);
        setCustomTagline(initialPlan.tagline);
        setCustomAssemblyPoint(initialPlan.logistics.meeting_point);
        setCustomSchedule(initialPlan.logistics.recommended_time);
        setCustomDepot(initialPlan.logistics.waste_disposal_drop_off);
        setCustomSupplies([...initialPlan.tool_checklist]);
        setCustomWhatsapp(initialPlan.social_media_copy.whatsapp);
        setCustomInstagram(initialPlan.social_media_copy.instagram);
        setCustomTwitter(initialPlan.social_media_copy.x_twitter);

        const defaultIso = getNextSaturdayIso();
        setCustomDateTime(defaultIso);

        // Fetch forecast for initial schedule
        fetchScheduleWeather(cluster.center.lat, cluster.center.lng, defaultIso);
      } catch (err: any) {
        setError(err.message || 'Error generating action plan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrivePlan();
  }, [isOpen, cluster]);

  const fetchScheduleWeather = async (lat: number, lng: number, dateTimeStr: string) => {
    try {
      setIsLoadingWeather(true);
      const res = await fetch('/api/forecast-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          targetDateTime: dateTimeStr,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTargetWeather(data);
      }
    } catch (err) {
      console.warn('Could not fetch schedule forecast:', err);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleDateTimeChange = (newDateTime: string) => {
    setCustomDateTime(newDateTime);
    if (cluster) {
      fetchScheduleWeather(cluster.center.lat, cluster.center.lng, newDateTime);
    }
    // Update schedule display text
    try {
      const d = new Date(newDateTime);
      const formatted = `${d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      setCustomSchedule(formatted);
    } catch {}
  };

  const handleAddSupply = () => {
    if (newSupplyText.trim()) {
      setCustomSupplies([...customSupplies, newSupplyText.trim()]);
      setNewSupplyText('');
    }
  };

  const handleRemoveSupply = (index: number) => {
    setCustomSupplies(customSupplies.filter((_, i) => i !== index));
  };

  if (!isOpen || !cluster) return null;

  const lat = cluster.center.lat;
  const lng = cluster.center.lng;
  const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  const googleStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Build complete share text
  const buildShareInvite = () => {
    return `🌊 *RIVER REVIVAL ACTION DRIVE* 🌊\n` +
      `*Mission:* ${customTitle}\n` +
      `"${customTagline}"\n\n` +
      `📍 *Assembly Point:* ${customAssemblyPoint}\n` +
      `🧭 *Google Maps Directions:* ${googleMapsNavUrl}\n` +
      `🗓️ *Schedule:* ${customSchedule}\n` +
      (targetWeather ? `☀️ *Forecast at event time:* ${targetWeather.temperature}°C, ${targetWeather.rainProbability}% rain prob (${targetWeather.advisory})\n` : '') +
      `♻️ *Waste Segregation Depot:* ${customDepot}\n\n` +
      `🎒 *What to Bring:* ${customSupplies.slice(0, 4).join(', ')}\n\n` +
      `Together, let's restore our river! Join us and make a difference! 💚🌱\n` +
      `_Organized with RiverRevive AI (Google Solution Challenge)_`;
  };

  const handleNativeShare = async () => {
    const text = buildShareInvite();
    if (navigator.share) {
      try {
        await navigator.share({
          title: customTitle,
          text: text,
          url: googleMapsNavUrl,
        });
      } catch {}
    } else {
      handleCopyText(text, 'share-all');
    }
  };

  const handleExportMarkdown = () => {
    const mdContent = `# ${customTitle}
> ${customTagline}

**Target Waterway:** ${cluster.name}  
**Coordinates:** ${lat}, ${lng}  
**Urgency Rating:** ${cluster.urgencyScore}/100  
**Google Maps Route:** [Navigate to Riverbank](${googleMapsNavUrl})

---

## 📍 Logistics & Timing
- **Assembly Point:** ${customAssemblyPoint}
- **Scheduled Time:** ${customSchedule}
- **Weather Forecast at Scheduled Hour:** ${targetWeather ? `${targetWeather.temperature}°C, Rain ${targetWeather.rainProbability}%, Wind ${targetWeather.windSpeed} km/h - ${targetWeather.advisory}` : 'Favorable'}
- **Segregation & Drop-off Depot:** ${customDepot}

---

## 🛡️ Volunteer Safety Protocols
${(plan?.safety_guidelines || [
  'Wear heavy-duty puncture-resistant rubber gloves at all times.',
  'Wear high rubber boots along riverbank edges.',
  'Work strictly in buddy pairs and maintain safety distances.'
]).map((g) => `- ${g}`).join('\n')}

---

## 🧰 Required Supplies & Equipment
${customSupplies.map((t) => `- [ ] ${t}`).join('\n')}

---

## 📢 Social Mobilization Copy
### WhatsApp:
${customWhatsapp}

### Instagram:
${customInstagram}

### X (Twitter):
${customTwitter}

---
*Created via RiverRevive AI • Powered by Google Gemini & Google Maps*
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RiverRevive-Plan-${cluster.name.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 my-6 bg-white text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#134e3a] text-white font-bold shadow-md">
              <CalendarCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Community Action Blueprint</h2>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  GOOGLE GEMINI AI
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Logistics, forward weather forecast, Google navigation & volunteer mobilization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isEditMode
                  ? 'bg-[#134e3a] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {isEditMode ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5 text-emerald-700" />}
              <span>{isEditMode ? 'Done Editing' : 'Customize Plan'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-9 h-9 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-300 font-mono tracking-wider">
              GENERATING BLUEPRINT VIA GOOGLE GEMINI NEURAL AGENT...
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="my-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Plan Content */}
        {plan && !isLoading && (
          <div className="space-y-4 my-4">
            
            {/* Title & Tagline Banner */}
            <div className="rounded-2xl p-4 bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-800 font-bold">
                  COMMUNITY ACTION BLUEPRINT
                </span>
                {isEditMode && (
                  <span className="text-[10px] font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    Editing Mode Active
                  </span>
                )}
              </div>

              {isEditMode ? (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Mission Title"
                  />
                  <input
                    type="text"
                    value={customTagline}
                    onChange={(e) => setCustomTagline(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 italic"
                    placeholder="Tagline / Slogan"
                  />
                </div>
              ) : (
                <>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                    {customTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 italic mt-0.5">
                    "{customTagline}"
                  </p>
                </>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 text-xs font-bold">
              <button
                onClick={() => setActiveTab('logistics')}
                className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'logistics'
                    ? 'border-[#134e3a] text-[#134e3a]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Logistics & Safety Checklist</span>
              </button>

              <button
                onClick={() => setActiveTab('social')}
                className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'social'
                    ? 'border-[#134e3a] text-[#134e3a]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Social Mobilization Copy</span>
              </button>
            </div>

            {/* TAB 1: Logistics & Safety Checklist */}
            {activeTab === 'logistics' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                
                {/* 3 Main Cards (Assembly, Schedule, Depot) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* 1. Assembly Point Card with Google Maps Navigation */}
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                        <MapPin className="w-4 h-4 text-emerald-700" />
                        <span>Assembly Point</span>
                      </div>
                      <a
                        href={googleMapsNavUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] bg-slate-200/70 hover:bg-slate-200 text-slate-800 px-2 py-0.5 rounded-lg border border-slate-300 flex items-center gap-1 font-semibold transition-colors"
                        title="Open Google Maps Turn-by-Turn Navigation"
                      >
                        <Navigation className="w-2.5 h-2.5 text-emerald-700" />
                        <span>Google Nav</span>
                      </a>
                    </div>

                    {isEditMode ? (
                      <input
                        type="text"
                        value={customAssemblyPoint}
                        onChange={(e) => setCustomAssemblyPoint(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="e.g. Chintadripet MRTS Station Entrance"
                      />
                    ) : (
                      <p className="text-xs text-slate-800 font-medium">
                        {customAssemblyPoint}
                      </p>
                    )}

                    {/* Google Street View Quick Link */}
                    <div className="pt-1 flex items-center gap-2">
                      <a
                        href={googleStreetViewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-slate-500 hover:text-emerald-800 flex items-center gap-1 underline transition-colors"
                      >
                        <Eye className="w-3 h-3 text-emerald-700" />
                        <span>View Meetup Street View in Google Maps</span>
                      </a>
                    </div>
                  </div>

                  {/* 2. Recommended Schedule Card with Future Time Weather Forecast */}
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold">
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span>Recommended Schedule</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Editable
                      </span>
                    </div>

                    {isEditMode ? (
                      <div className="space-y-1.5">
                        <input
                          type="datetime-local"
                          value={customDateTime}
                          onChange={(e) => handleDateTimeChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                        />
                        <input
                          type="text"
                          value={customSchedule}
                          onChange={(e) => setCustomSchedule(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                          placeholder="e.g. Saturday 6:30 AM – 9:30 AM"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-200 font-medium">
                          {customSchedule}
                        </p>
                        <button
                          onClick={() => setIsEditMode(true)}
                          className="text-[10px] text-cyan-400 hover:underline"
                        >
                          Change Date/Time
                        </button>
                      </div>
                    )}

                    {/* DYNAMIC FUTURE WEATHER FORECAST AT USER'S CHOSEN TIMING */}
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      {isLoadingWeather ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                          <span>Forecasting weather for scheduled timing...</span>
                        </div>
                      ) : targetWeather ? (
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1 text-cyan-300">
                              <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                              <span>Forecast: {targetWeather.temperature}°C</span>
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                targetWeather.isSafeForCleanup
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {targetWeather.isSafeForCleanup ? '✓ Safe for Cleanup' : '⚠️ Weather Alert'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Rain: {targetWeather.rainProbability}% • Wind: {targetWeather.windSpeed} km/h • {targetWeather.advisory}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* 3. Segregation & Municipal Drop-off Depot Card */}
                  <div className="sm:col-span-2 bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                      <Truck className="w-4 h-4 text-emerald-700" />
                      <span>Segregation & Municipal Drop-off Depot</span>
                    </div>

                    {isEditMode ? (
                      <input
                        type="text"
                        value={customDepot}
                        onChange={(e) => setCustomDepot(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="e.g. Greater Chennai Corporation (GCC) Zonal Waste Collection Point, Zone 5"
                      />
                    ) : (
                      <p className="text-xs text-slate-800 font-medium">
                        {customDepot}
                      </p>
                    )}
                  </div>
                </div>

                {/* Safety Protocols */}
                <div className="rounded-2xl p-3.5 bg-rose-50/70 border border-rose-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase font-mono">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                    <span>Mandatory Hydrological Safety Protocols</span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {(plan.safety_guidelines || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Equipment & Gear Checklist (Editable + Checkable) */}
                <div className="rounded-2xl p-3.5 bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase font-mono">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-700" />
                      <span>Required Gear & Equipment Checklist ({customSupplies.length})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {customSupplies.map((tool, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs text-slate-800 bg-white p-2 rounded-xl border border-slate-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />
                          <span>{tool}</span>
                        </div>
                        {isEditMode && (
                          <button
                            onClick={() => handleRemoveSupply(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isEditMode && (
                    <div className="pt-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={newSupplyText}
                        onChange={(e) => setNewSupplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSupply()}
                        placeholder="Add another tool / supply..."
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        onClick={handleAddSupply}
                        className="px-3 py-1.5 rounded-xl bg-[#134e3a] text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: Social Mobilization Copy */}
            {activeTab === 'social' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                {/* WhatsApp */}
                <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                      <MessageCircle className="w-4 h-4 text-emerald-700" />
                      <span>WhatsApp Community Message</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(customWhatsapp)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 hover:bg-emerald-200 text-xs font-medium flex items-center gap-1"
                      >
                        <Send className="w-3 h-3 text-emerald-700" />
                        <span>Open WhatsApp</span>
                      </a>
                      <button
                        onClick={() => handleCopyText(customWhatsapp, 'wa')}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 shadow-sm"
                      >
                        {copiedKey === 'wa' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'wa' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                  {isEditMode ? (
                    <textarea
                      value={customWhatsapp}
                      onChange={(e) => setCustomWhatsapp(e.target.value)}
                      rows={4}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                    />
                  ) : (
                    <pre className="text-xs text-slate-800 whitespace-pre-wrap font-sans bg-white p-3 rounded-xl border border-emerald-200 max-h-36 overflow-y-auto">
                      {customWhatsapp}
                    </pre>
                  )}
                </div>

                {/* Instagram */}
                <div className="bg-pink-50/50 rounded-2xl p-4 border border-pink-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-pink-800 text-xs font-bold">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      <span>Instagram Caption & Hashtags</span>
                    </div>
                    <button
                      onClick={() => handleCopyText(customInstagram, 'ig')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 shadow-sm"
                    >
                      {copiedKey === 'ig' ? <Check className="w-3 h-3 text-pink-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'ig' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  {isEditMode ? (
                    <textarea
                      value={customInstagram}
                      onChange={(e) => setCustomInstagram(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                    />
                  ) : (
                    <pre className="text-xs text-slate-800 whitespace-pre-wrap font-sans bg-white p-3 rounded-xl border border-pink-200 max-h-36 overflow-y-auto">
                      {customInstagram}
                    </pre>
                  )}
                </div>

                {/* X / Twitter */}
                <div className="bg-sky-50/50 rounded-2xl p-4 border border-sky-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sky-800 text-xs font-bold">
                      <Twitter className="w-4 h-4 text-sky-600" />
                      <span>X (Twitter) 280-Character Post</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(customTwitter)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 hover:bg-sky-200 text-xs font-medium flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 text-sky-600" />
                        <span>Post to X</span>
                      </a>
                      <button
                        onClick={() => handleCopyText(customTwitter, 'tw')}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 shadow-sm"
                      >
                        {copiedKey === 'tw' ? <Check className="w-3 h-3 text-sky-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'tw' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                  {isEditMode ? (
                    <textarea
                      value={customTwitter}
                      onChange={(e) => setCustomTwitter(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                    />
                  ) : (
                    <p className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-sky-200">
                      {customTwitter}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions & Share Controls */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-emerald-900 font-semibold">Powered by Google Gemini 2.0 & Google Maps</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Plan to Others */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="px-3.5 py-2 rounded-xl bg-[#134e3a] hover:bg-[#0e3a2b] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Plan</span>
              </button>

              {showShareMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-2xl p-2.5 shadow-2xl border border-slate-200 backdrop-blur-xl flex flex-col gap-1 z-50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Share Plan with Community
                  </span>

                  <button
                    onClick={handleNativeShare}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-emerald-700" />
                    <span>Native Share (Mobile / PC)</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(buildShareInvite())}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 text-xs font-semibold text-emerald-900 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Send via WhatsApp</span>
                  </a>

                  <button
                    onClick={() => {
                      handleCopyText(buildShareInvite(), 'invite-full');
                      setShowShareMenu(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors"
                  >
                    <Copy className="w-4 h-4 text-amber-600" />
                    <span>{copiedKey === 'invite-full' ? 'Copied Invite!' : 'Copy Formatted Invite'}</span>
                  </button>

                  <a
                    href={googleMapsNavUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50 text-xs font-semibold text-blue-900 transition-colors"
                  >
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <span>Copy Google Maps Route Link</span>
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={handleExportMarkdown}
              disabled={!plan}
              className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#134e3a] hover:bg-[#0e3a2b] text-white font-bold text-xs transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
