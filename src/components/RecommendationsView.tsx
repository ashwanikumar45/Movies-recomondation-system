import React from 'react';
import { Sparkles, RefreshCw, Compass, Award, Flame } from 'lucide-react';
import { Movie, UserInteraction, UserProfile } from '../types/movie';
import { MovieCard } from './MovieCard';

interface RecommendationsViewProps {
  recommendations: {
    forYou: Movie[];
    hiddenGems: Movie[];
    topRatedOverall: Movie[];
  };
  interactions: Record<number, UserInteraction>;
  activeProfile: UserProfile | null;
  onOpenDetails: (movie: Movie) => void;
  onToggleLike: (movie: Movie, liked: boolean) => void;
  onToggleWatchlist: (movie: Movie) => void;
  onToggleWatched: (movie: Movie) => void;
  onToggleFavorite: (movie: Movie) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  recommendations,
  interactions,
  activeProfile,
  onOpenDetails,
  onToggleLike,
  onToggleWatchlist,
  onToggleWatched,
  onToggleFavorite,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="space-y-12">
      {/* Top Profile Summary Ribbon */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-900/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personalized Recommendation Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Curated Picks for {activeProfile?.name || 'You'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tailored dynamically to your cinema taste profile based on your{' '}
            <span className="text-indigo-300 font-mono tabular-nums">
              {activeProfile?.totalWatched || 0} watched
            </span>{' '}
            and{' '}
            <span className="text-emerald-300 font-mono tabular-nums">
              {activeProfile?.totalLikes || 0} liked
            </span>{' '}
            films.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/30 whitespace-nowrap cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Updating Recommendations...' : 'Refresh Recommendations'}</span>
        </button>
      </div>

      {/* Section 1: For You */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Top Match Shelf</h3>
            <span className="text-xs text-slate-500 hidden sm:inline">
              · Tailored unwatched selections aligned with your favorites
            </span>
          </div>
        </div>

        {recommendations.forYou.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recommendations.forYou.map((movie) => (
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
          <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 text-sm">
            Like or rate more films in the Discover tab to build your taste profile!
          </div>
        )}
      </div>

      {/* Section 2: Hidden Gems (High-Rating Niche Selections) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Acclaimed Masterpieces</h3>
            <span className="text-xs text-slate-500 hidden sm:inline">
              · Critically acclaimed &gt;8.2 TMDB score
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recommendations.hiddenGems.map((movie) => (
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
      </div>

      {/* Section 3: Essential Cinema Classics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Cinema Hall of Fame</h3>
            <span className="text-xs text-slate-500 hidden sm:inline">
              · Universal landmarks across decades
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recommendations.topRatedOverall.map((movie) => (
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
      </div>
    </div>
  );
};
