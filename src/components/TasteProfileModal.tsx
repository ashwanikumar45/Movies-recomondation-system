import React, { useState } from 'react';
import {
  X,
  User,
  SlidersHorizontal,
  Key,
  Sparkles,
  PieChart,
  Check,
  Plus,
  RefreshCw,
  Info
} from 'lucide-react';
import { UserProfile } from '../types/movie';

interface TasteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: UserProfile | null;
  availableProfiles: UserProfile[];
  onSelectProfile: (userId: string) => void;
  tmdbApiKey: string;
  onUpdateTmdbKey: (key: string) => void;
}

export const TasteProfileModal: React.FC<TasteProfileModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  availableProfiles,
  onSelectProfile,
  tmdbApiKey,
  onUpdateTmdbKey,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(tmdbApiKey);
  const [isSavedKey, setIsSavedKey] = useState(false);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    onUpdateTmdbKey(apiKeyInput);
    setIsSavedKey(true);
    setTimeout(() => setIsSavedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto p-6 sm:p-8 space-y-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Taste Profile & Cinema Preferences</h2>
              <p className="text-xs text-slate-400">Manage viewer persona and recommendation parameters</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Switch Active User Profile */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Switch Viewer Persona
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {availableProfiles.map((p) => {
              const isSelected = p.id === activeProfile?.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProfile(p.id)}
                  className={`flex flex-col items-center text-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-md shadow-indigo-950/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <img
                    src={p.avatar}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-400/40 mb-2"
                  />
                  <span className="text-xs font-bold text-white mb-0.5">{p.name}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">{p.tagline}</span>
                  {isSelected && (
                    <span className="mt-2 text-[10px] font-mono text-indigo-300 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active Profile
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Active Taste Vector Breakdown */}
        {activeProfile && (
          <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <PieChart className="w-4 h-4 text-indigo-400" />
                <span>Live Taste Vector Affinity for {activeProfile.name}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {activeProfile.totalWatched} logged
              </span>
            </div>

            {/* Genre breakdown progress bars */}
            <div className="space-y-2 pt-1">
              {activeProfile.topGenres && activeProfile.topGenres.length > 0 ? (
                activeProfile.topGenres.map((tg) => (
                  <div key={tg.genre} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{tg.genre}</span>
                      <span className="text-indigo-400 font-mono tabular-nums">
                        {tg.percentage}% ({tg.count} titles)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, tg.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic py-2 text-center">
                  No interactions recorded yet. Like or rate films in Discover to calibrate your vector.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: TMDB API Key Integration */}
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Key className="w-4 h-4 text-amber-400" />
              <span>TMDB API Cloud Gateway (Optional)</span>
            </div>
            {tmdbApiKey && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                Live TMDB Active
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The platform includes 120+ curated iconic films with verified TMDB posters and metadata. 
            Optionally insert your TMDB API v3 key to enable live infinite search against the official TMDB cloud.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="e.g. 3a89e0df34ab9c..."
              className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {isSavedKey ? 'Saved!' : 'Save Key'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
