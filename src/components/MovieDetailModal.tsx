import React, { useEffect, useState } from 'react';
import {
  X,
  Star,
  Play,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  CheckCircle2,
  Heart,
  Sparkles,
  Clapperboard,
  Users,
  MessageSquare,
  Share2,
  Calendar,
  Clock
} from 'lucide-react';
import { Movie, UserInteraction, UserProfile, MLMatchExplanation } from '../types/movie';
import { getAIExplanation } from '../services/api';

interface MovieDetailModalProps {
  movie: Movie | null;
  interaction?: UserInteraction;
  activeProfile: UserProfile | null;
  onClose: () => void;
  onUpdateInteraction: (payload: {
    movieId: number;
    status?: 'none' | 'watched' | 'want_to_watch';
    liked?: boolean | null;
    rating?: number;
    favorite?: boolean;
    notes?: string;
  }) => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  interaction,
  activeProfile,
  onClose,
  onUpdateInteraction,
}) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<MLMatchExplanation | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [userNote, setUserNote] = useState(interaction?.notes || '');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setShowTrailer(false);
    setUserNote(interaction?.notes || '');
    setAiExplanation(null);

    // Auto-fetch AI analysis when modal opens
    if (movie && activeProfile) {
      setLoadingAi(true);
      getAIExplanation(movie.id, activeProfile.id)
        .then(data => setAiExplanation(data))
        .catch(err => console.warn('AI explanation failed:', err))
        .finally(() => setLoadingAi(false));
    }
  }, [movie?.id, activeProfile?.id]);

  if (!movie) return null;

  const isLiked = interaction?.liked === true;
  const isDisliked = interaction?.liked === false;
  const isWatchlist = interaction?.status === 'want_to_watch';
  const isWatched = interaction?.status === 'watched';
  const isFavorite = Boolean(interaction?.favorite);
  const currentRating = interaction?.rating || 0;

  const handleStarRating = (stars: number) => {
    const newRating = currentRating === stars ? 0 : stars;
    onUpdateInteraction({
      movieId: movie.id,
      rating: newRating,
      // If user rates 4 or 5 stars, automatically mark watched and positive interest
      status: newRating >= 3 ? 'watched' : interaction?.status,
      liked: newRating >= 4 ? true : newRating <= 2 && newRating > 0 ? false : interaction?.liked,
    });
  };

  const handleSaveNotes = () => {
    onUpdateInteraction({
      movieId: movie.id,
      notes: userNote,
    });
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div
        className="relative w-full max-w-4xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Backdrop Banner / Trailer Player */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-slate-950 overflow-hidden">
          {showTrailer && movie.trailer_url ? (
            <iframe
              src={`${movie.trailer_url}?autoplay=1&rel=0`}
              title={`${movie.title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <>
              <img
                src={movie.backdrop_path || movie.poster_path}
                alt={movie.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/30 to-transparent" />

              {/* Play Trailer Floating Action */}
              {movie.trailer_url && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white font-semibold text-sm shadow-xl shadow-indigo-900/50 hover:scale-105 transition-all cursor-pointer backdrop-blur-sm"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Watch Official Trailer</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Quick exit trailer button */}
          {showTrailer && (
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute bottom-3 right-3 z-10 px-3 py-1 bg-black/70 hover:bg-black text-xs text-white rounded-md border border-slate-700"
            >
              Exit Trailer
            </button>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="p-5 sm:p-8 space-y-6">
          {/* Header Row: Title, Year, Match, Ratings */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-2 font-mono">
                <span className="tabular-nums text-slate-200">{movie.release_year}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="tabular-nums">{movie.runtime} min</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{movie.genres.join(' / ')}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {movie.title}
              </h2>
              {movie.tagline && (
                <p className="text-xs sm:text-sm text-slate-400 italic mt-1 font-serif">
                  "{movie.tagline}"
                </p>
              )}
            </div>

            {/* Score Badges */}
            <div className="flex items-center gap-3 shrink-0">
              {movie.similarityScore && (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{movie.similarityScore}% Match</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">Based on your taste vector</span>
                </div>
              )}

              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="tabular-nums">{movie.vote_average.toFixed(1)} TMDB</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 font-mono tabular-nums">
                  {movie.vote_count.toLocaleString()} votes
                </span>
              </div>
            </div>
          </div>

          {/* Interactive User Engagement Bar */}
          <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {/* Likes & Dislikes Feedback */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium mr-1">Your Feedback:</span>
              <button
                onClick={() =>
                  onUpdateInteraction({
                    movieId: movie.id,
                    liked: isLiked ? null : true,
                  })
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  isLiked
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Like</span>
              </button>

              <button
                onClick={() =>
                  onUpdateInteraction({
                    movieId: movie.id,
                    liked: isDisliked ? null : false,
                  })
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  isDisliked
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Dislike</span>
              </button>
            </div>

            {/* Watchlist & Watched */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onUpdateInteraction({
                    movieId: movie.id,
                    status: isWatchlist ? 'none' : 'want_to_watch',
                  })
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  isWatchlist
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>

              <button
                onClick={() =>
                  onUpdateInteraction({
                    movieId: movie.id,
                    status: isWatched ? 'none' : 'watched',
                  })
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  isWatched
                    ? 'bg-sky-600 border-sky-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isWatched ? 'Watched' : 'Mark Watched'}</span>
              </button>

              <button
                onClick={() =>
                  onUpdateInteraction({
                    movieId: movie.id,
                    favorite: !isFavorite,
                  })
                }
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isFavorite
                    ? 'bg-pink-600 border-pink-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
              </button>
            </div>

            {/* 5-Star Rating Control */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400 mr-1.5">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarRating(star)}
                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  title={`Rate ${star} Star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      star <= currentRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600 hover:text-amber-300'
                    }`}
                  />
                </button>
              ))}
              {currentRating > 0 && (
                <span className="text-xs font-mono text-amber-300 ml-1">({currentRating}/5)</span>
              )}
            </div>
          </div>

          {/* 2-Column Split: Overview & Cast VS Machine Learning Explainability */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Synopsis, Director, Cast */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Overview
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {movie.overview}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">Director:</span>{' '}
                  <span className="text-white">{movie.director}</span>
                </div>
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Cast:</span>{' '}
                  <span className="text-slate-200">{movie.cast.join(', ')}</span>
                </div>
              </div>

              {/* Thematic Keywords */}
              {movie.keywords && movie.keywords.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 mb-1.5">Thematic Tags:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Notes */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>Personal Notes / Review Memo</span>
                  </label>
                  {userNote !== (interaction?.notes || '') && (
                    <button
                      onClick={handleSaveNotes}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                    >
                      Save Note
                    </button>
                  )}
                </div>
                <textarea
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="Record your personal reflections, thoughts, or memorable quotes..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Right: Friendly Taste Analysis & AI Summary */}
            <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Why You'll Love This Movie
                </h3>
              </div>

              {/* Match Factors */}
              <div>
                <div className="text-xs text-slate-400 mb-2">Highlights matching your taste:</div>
                <div className="space-y-2">
                  {movie.matchReasons && movie.matchReasons.length > 0 ? (
                    movie.matchReasons.map((reason, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800"
                      >
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{reason}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      Like and bookmark movies to see personalized match highlights here!
                    </div>
                  )}
                </div>
              </div>

              {/* AI Guide */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>AI Movie Insights</span>
                  </div>
                </div>

                {loadingAi ? (
                  <div className="py-4 text-center text-xs text-slate-400 animate-pulse">
                    Analyzing how this film fits your watching history...
                  </div>
                ) : aiExplanation ? (
                  <div className="text-xs text-slate-300 leading-relaxed bg-indigo-950/20 border border-indigo-800/40 rounded-lg p-3">
                    <p>{aiExplanation.aiAnalysis}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    AI analysis provides deep filmic justification for this selection.
                  </p>
                )}
              </div>

              {/* Share link */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>TMDB ID: #{movie.id}</span>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Link Copied!' : 'Share Movie'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
