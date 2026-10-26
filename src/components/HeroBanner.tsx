import React from 'react';
import { Search, Sparkles, Film, Flame, Trophy, Play, Check } from 'lucide-react';

interface HeroBannerProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExploreRecommendations: () => void;
  totalMovies: number;
  selectedCollection?: 'all' | 'bollywood' | 'viral' | 'limited_hollywood';
  onSelectCollection?: (col: 'all' | 'bollywood' | 'viral' | 'limited_hollywood') => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  onSearchChange,
  onExploreRecommendations,
  totalMovies,
  selectedCollection = 'all',
  onSelectCollection,
}) => {
  const quickSearches = ['3 Idiots', 'Oppenheimer', 'The Dark Knight', 'Tumbbad', 'Interstellar', 'Horror'];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800/80 mb-8 bg-slate-950">
      {/* Background cinematic imagery with gradient overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/src/assets/images/hero_cinematic_backdrop_1792955255670.jpg"
          alt="Cinematic theater backdrop"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090d16] via-[#090d16]/70 to-transparent" />
      </div>

      {/* Content Viewport */}
      <div className="relative z-10 max-w-5xl px-5 py-8 sm:px-8 sm:py-12 flex flex-col justify-center">
        {/* Simple badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium w-fit mb-4">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Curated Cinema Guide & Personalized Picks</span>
        </div>

        {/* Display Headline - Simple & Catchy */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3 leading-tight">
          Find The Best Movies To Watch Tonight
        </h1>

        {/* Subtitle in plain, easy-to-understand words */}
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mb-6 leading-relaxed">
          Handpicked <strong>Bollywood blockbusters</strong>, <strong>viral worldwide hits</strong>, and <strong>cult Hollywood classics</strong>. 
          Save to your watchlist, rate what you love, and get instant recommendations tailored to you.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mb-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search any movie title, actor (Aamir, SRK, Bale), or director..."
              className="w-full pl-10 pr-24 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 px-2 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-md cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick search suggestion tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs text-slate-400">
            <span className="text-slate-500 text-[11px]">Quick Search:</span>
            {quickSearches.map((tag) => (
              <button
                key={tag}
                onClick={() => onSearchChange(tag)}
                className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Simple Visual Category Cards */}
        {onSelectCollection && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 max-w-3xl">
            {/* 1. Bollywood */}
            <button
              onClick={() => onSelectCollection(selectedCollection === 'bollywood' ? 'all' : 'bollywood')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                selectedCollection === 'bollywood'
                  ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-950/50'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                🇮🇳
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Bollywood Classics</span>
                  {selectedCollection === 'bollywood' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="text-[11px] text-slate-400 truncate">3 Idiots, Sholay, Dangal & more</div>
              </div>
            </button>

            {/* 2. Viral Hits */}
            <button
              onClick={() => onSelectCollection(selectedCollection === 'viral' ? 'all' : 'viral')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                selectedCollection === 'viral'
                  ? 'bg-rose-950/40 border-rose-500 text-white shadow-lg shadow-rose-950/50'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-xl shrink-0">
                🔥
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Viral & Trending</span>
                  {selectedCollection === 'viral' && <Check className="w-3.5 h-3.5 text-rose-400" />}
                </div>
                <div className="text-[11px] text-slate-400 truncate">Oppenheimer, Barbie, RRR</div>
              </div>
            </button>

            {/* 3. Limited Edition Hollywood */}
            <button
              onClick={() => onSelectCollection(selectedCollection === 'limited_hollywood' ? 'all' : 'limited_hollywood')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                selectedCollection === 'limited_hollywood'
                  ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
                🎬
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Hollywood Masterpieces</span>
                  {selectedCollection === 'limited_hollywood' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <div className="text-[11px] text-slate-400 truncate">Dark Knight, Interstellar & more</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
