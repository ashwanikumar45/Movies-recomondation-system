import React, { useState } from 'react';
import { Bookmark, CheckCircle2, Heart, ThumbsUp, Film, Sparkles, Trash2, ExternalLink } from 'lucide-react';
import { Movie, UserInteraction, UserProfile } from '../types/movie';
import { MovieCard } from './MovieCard';

interface WatchlistDashboardProps {
  allMovies: Movie[];
  interactions: Record<number, UserInteraction>;
  activeProfile: UserProfile | null;
  onOpenDetails: (movie: Movie) => void;
  onToggleLike: (movie: Movie, liked: boolean) => void;
  onToggleWatchlist: (movie: Movie) => void;
  onToggleWatched: (movie: Movie) => void;
  onToggleFavorite: (movie: Movie) => void;
  onNavigateToDiscover: () => void;
}

export const WatchlistDashboard: React.FC<WatchlistDashboardProps> = ({
  allMovies,
  interactions,
  activeProfile,
  onOpenDetails,
  onToggleLike,
  onToggleWatchlist,
  onToggleWatched,
  onToggleFavorite,
  onNavigateToDiscover,
}) => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'watched' | 'favorites' | 'liked'>('watchlist');

  // Filter movies according to interactions
  const watchlistMovies = allMovies.filter(
    (m) => interactions[m.id]?.status === 'want_to_watch'
  );

  const watchedMovies = allMovies.filter(
    (m) => interactions[m.id]?.status === 'watched'
  );

  const favoriteMovies = allMovies.filter(
    (m) => Boolean(interactions[m.id]?.favorite)
  );

  const likedMovies = allMovies.filter(
    (m) => interactions[m.id]?.liked === true
  );

  const getActiveList = () => {
    switch (activeTab) {
      case 'watchlist':
        return watchlistMovies;
      case 'watched':
        return watchedMovies;
      case 'favorites':
        return favoriteMovies;
      case 'liked':
        return likedMovies;
    }
  };

  const currentList = getActiveList();

  return (
    <div className="space-y-8">
      {/* Dashboard KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Watchlist */}
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'watchlist'
              ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-950/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-indigo-400 mb-1.5">
            <span>Watchlist</span>
            <Bookmark className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {watchlistMovies.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Titles to watch next</div>
        </button>

        {/* Watched */}
        <button
          onClick={() => setActiveTab('watched')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'watched'
              ? 'bg-sky-950/40 border-sky-500/80 shadow-md shadow-sky-950/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-sky-400 mb-1.5">
            <span>Watched</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {watchedMovies.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Logged viewing history</div>
        </button>

        {/* Favorites */}
        <button
          onClick={() => setActiveTab('favorites')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'favorites'
              ? 'bg-pink-950/40 border-pink-500/80 shadow-md shadow-pink-950/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-pink-400 mb-1.5">
            <span>Favorites</span>
            <Heart className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {favoriteMovies.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">All-time top cinema</div>
        </button>

        {/* Liked */}
        <button
          onClick={() => setActiveTab('liked')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'liked'
              ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1.5">
            <span>Liked Titles</span>
            <ThumbsUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {likedMovies.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Thumbs up positive bias</div>
        </button>
      </div>

      {/* Main List Section */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white capitalize">
              {activeTab === 'watchlist' && 'My Watchlist'}
              {activeTab === 'watched' && 'Watched Viewing History'}
              {activeTab === 'favorites' && 'Curated Favorite Films'}
              {activeTab === 'liked' && 'Liked Films Shaping Your Taste Profile'}
            </h3>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              ({currentList.length} items)
            </span>
          </div>
        </div>

        {currentList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {currentList.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                interaction={interactions[movie.id]}
                onOpenDetails={onOpenDetails}
                onToggleLike={onToggleLike}
                onToggleWatchlist={onToggleWatchlist}
                onToggleWatched={onToggleWatched}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 px-4 text-center bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Film className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">
              No films in this collection yet
            </h4>
            <p className="text-xs text-slate-400 mb-4 max-w-xs">
              Explore the Discover catalog or Recommendations to bookmark films, mark watched titles, and like favorites.
            </p>
            <button
              onClick={onNavigateToDiscover}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Explore Discover Catalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
