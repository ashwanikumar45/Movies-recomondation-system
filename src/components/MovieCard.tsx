import React from 'react';
import { Star, Bookmark, Heart, Film, Sparkles, Play, CheckCircle2 } from 'lucide-react';
import { Movie, UserInteraction } from '../types/movie';

interface MovieCardProps {
  movie: Movie;
  interaction?: UserInteraction;
  onOpenDetails: (movie: Movie) => void;
  onToggleLike: (movie: Movie, liked: boolean) => void;
  onToggleWatchlist: (movie: Movie) => void;
  onToggleWatched: (movie: Movie) => void;
  onToggleFavorite: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  interaction,
  onOpenDetails,
  onToggleLike,
  onToggleWatchlist,
  onToggleWatched,
  onToggleFavorite,
}) => {
  const [imgError, setImgError] = React.useState(false);

  const isLiked = interaction?.liked === true;
  const isWatchlist = interaction?.status === 'want_to_watch';
  const isWatched = interaction?.status === 'watched';
  const isFavorite = Boolean(interaction?.favorite);

  const formatRuntime = (mins: number) => {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getCollectionBadge = (col?: string) => {
    if (col === 'bollywood') {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md">
          🇮🇳 Bollywood
        </span>
      );
    }
    if (col === 'viral') {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md">
          🔥 Viral Hit
        </span>
      );
    }
    if (col === 'limited_hollywood') {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 backdrop-blur-md">
          🎬 Hollywood
        </span>
      );
    }
    return null;
  };

  return (
    <div
      onClick={() => onOpenDetails(movie)}
      className="group relative flex flex-col bg-[#111827] border border-slate-800 hover:border-indigo-500/60 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60 cursor-pointer text-left"
    >
      {/* Poster Media Box (2:3 aspect ratio) */}
      <div className="relative aspect-[2/3] w-full bg-slate-900 overflow-hidden">
        {!imgError ? (
          <img
            src={movie.poster_path}
            alt={movie.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-500 text-center">
            <Film className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-xs font-medium text-slate-400 line-clamp-2">{movie.title}</span>
          </div>
        )}

        {/* Top Badges: Category & Rating */}
        <div className="absolute top-2 inset-x-2 flex items-center justify-between gap-1 z-10 pointer-events-none">
          <div>{getCollectionBadge(movie.collection)}</div>

          <div className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-amber-300 border border-amber-500/30">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="tabular-nums">{movie.vote_average.toFixed(1)}</span>
          </div>
        </div>

        {/* Status Pills (In Watchlist / Watched) */}
        {(isWatchlist || isWatched) && (
          <div className="absolute top-10 left-2 z-10 pointer-events-none">
            {isWatchlist && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-600/90 text-white shadow-md backdrop-blur-md">
                <Bookmark className="w-2.5 h-2.5 fill-white" /> Watchlist
              </span>
            )}
            {isWatched && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-600/90 text-white shadow-md backdrop-blur-md">
                <CheckCircle2 className="w-2.5 h-2.5" /> Watched
              </span>
            )}
          </div>
        )}

        {/* Center Play Trailer Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-lg">
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Trailer & Info</span>
          </div>
        </div>

        {/* Quick Action Buttons at Bottom of Poster */}
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 pt-6 flex items-center justify-between z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Like Button */}
          <button
            onClick={() => onToggleLike(movie, true)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-xs ${
              isLiked
                ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                : 'bg-black/70 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={isLiked ? 'Liked (click to undo)' : 'Like this movie'}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
            {isLiked && <span className="text-[11px] font-medium pr-0.5">Liked</span>}
          </button>

          {/* Watchlist & Watched Toggle Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleWatchlist(movie)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isWatchlist
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                  : 'bg-black/70 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={isWatchlist ? 'In your Watchlist (click to remove)' : 'Add to Watchlist'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isWatchlist ? 'fill-white' : ''}`} />
            </button>

            <button
              onClick={() => onToggleWatched(movie)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isWatched
                  ? 'bg-sky-600 border-sky-500 text-white shadow-md'
                  : 'bg-black/70 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={isWatched ? 'Marked as Watched' : 'Mark as Watched'}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Card Content & Typography */}
      <div className="p-3 flex flex-col flex-1">
        {/* Release year and genre */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-mono">
          <span className="tabular-nums text-slate-300">{movie.release_year}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-indigo-300 font-sans">{movie.genres[0]}</span>
          {movie.runtime > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="tabular-nums text-slate-400">{formatRuntime(movie.runtime)}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1">
          {movie.title}
        </h3>

        {/* Director */}
        <p className="text-xs text-slate-400 line-clamp-1 mb-2">
          {movie.director}
        </p>

        {/* Match Reason Tag */}
        {movie.similarityScore && movie.similarityScore > 0 ? (
          <div className="mt-auto pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>{movie.similarityScore}% Match For You</span>
          </div>
        ) : movie.matchReasons && movie.matchReasons.length > 0 ? (
          <div className="mt-auto pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <span className="truncate">{movie.matchReasons[0]}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
