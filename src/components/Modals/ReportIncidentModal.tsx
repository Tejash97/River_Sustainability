'use client';

import React, { useState } from 'react';
import {
  X,
  Camera,
  MapPin,
  AlertTriangle,
  Upload,
  CheckCircle,
  Loader2,
  Droplets,
  ShieldAlert
} from 'lucide-react';
import { IncidentCategory, Incident } from '@/types';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLat: number;
  defaultLng: number;
  onReportSubmitted: (newIncident: Incident) => void;
}

const CATEGORIES: IncidentCategory[] = [
  'Plastic & Solid Waste',
  'Sewage / Chemical Inflow',
  'Pipe / Infrastructure Leakage',
  'Dead Fish / Algae Bloom',
  'Oil / Industrial Slick',
];

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  defaultLat,
  defaultLng,
  onReportSubmitted,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('Plastic & Solid Waste');
  const [severity, setSeverity] = useState<number>(3);
  const [description, setDescription] = useState('');
  const [waterbodyName, setWaterbodyName] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [lat, setLat] = useState<number>(defaultLat);
  const [lng, setLng] = useState<number>(defaultLng);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter a descriptive report title.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          severity,
          description,
          waterbodyName,
          reporterName: reporterName || 'Citizen Eco Guardian',
          lat,
          lng,
          photoUrl: photoPreview || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit incident report');
      }

      setSuccessMsg('Report submitted successfully! Spatial clustering updated.');
      onReportSubmitted(data.incident);

      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setTitle('');
        setDescription('');
        setPhotoPreview(null);
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 my-6 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Droplets className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Report Water Pollution / Dumping</h2>
              <p className="text-xs text-slate-500">
                Log geo-tagged riverbank threats for AI diagnosis and cleanup mobilization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Incident Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Heavy plastic bottle accumulation below tourist ghat"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Category & Waterbody Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Waterbody Reference
              </label>
              <input
                type="text"
                value={waterbodyName}
                onChange={(e) => setWaterbodyName(e.target.value)}
                placeholder="e.g., Yamuna Embankment, Sector 4"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Severity Slider (1 to 5) */}
          <div className="bg-black/25 rounded-2xl p-3 border border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Pollution Severity Level (1 - 5)
              </label>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  severity >= 4
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : severity === 3
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                Level {severity}:{' '}
                {severity === 5
                  ? 'Catastrophic Toxic Inflow'
                  : severity === 4
                  ? 'Heavy Waste Blockage'
                  : severity === 3
                  ? 'Moderate Contamination'
                  : severity === 2
                  ? 'Scattered Litter'
                  : 'Minor Surface Float'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value, 10))}
              className="w-full accent-eco-cyan cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1 (Mild Litter)</span>
              <span>3 (Moderate)</span>
              <span>5 (Hazardous / Chemical)</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Detailed Description / Ecological Symptoms
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe color, smell, volume of trash, water current stability, or signs of affected fish..."
              className="w-full bg-eco-surface border border-eco-border rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-eco-cyan"
            />
          </div>

          {/* Geo Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="w-full bg-eco-surface border border-eco-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-eco-cyan"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="w-full bg-eco-surface border border-eco-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-eco-cyan"
              />
            </div>
          </div>

          {/* Photo Upload & Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Photo Evidence (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-xl bg-eco-surface border border-dashed border-eco-cyan/40 hover:border-eco-cyan text-xs text-eco-cyan transition-all">
                <Upload className="w-4 h-4" />
                <span>Upload Field Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photoPreview && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-eco-cyan">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-[10px] opacity-0 hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reporter name */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Reporter Name / Organization
            </label>
            <input
              type="text"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="e.g., Delhi Eco Club / Student Activist"
              className="w-full bg-eco-surface border border-eco-border rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-eco-cyan"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#134e3a] hover:bg-[#0e3a2b] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting & Clustering...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  <span>Submit Incident</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
