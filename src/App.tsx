import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Film,
  Sparkles,
  SlidersHorizontal,
  Bookmark,
  Heart,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Movie, UserInteraction, UserProfile, FilterState } from './types/movie';
import {
  getMovies,
  getRecommendations,
  getUserProfile,
  getUsers,
  getUserInteractions,
  recordInteraction,
  syncAuthUser,
  setActiveAuthId,
} from './services/api';
import { subscribeToAuth, logoutUser } from './services/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { FilterBar } from './components/FilterBar';
import { MovieCard } from './components/MovieCard';
import { MovieDetailModal } from './components/MovieDetailModal';
import { RecommendationsView } from './components/RecommendationsView';
import { WatchlistDashboard } from './components/WatchlistDashboard';
import { TasteProfileModal } from './components/TasteProfileModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'discover' | 'recommendations' | 'watchlist' | 'profile'>('discover');
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [activeUserId, setActiveUserId] = useState<string>('user_cinephile');
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<UserProfile[]>([]);
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalMovieCount, setTotalMovieCount] = useState<number>(0);
  const [loadingMovies, setLoadingMovies] = useState<boolean>(true);

  const [recommendations, setRecommendations] = useState<{
    forYou: Movie[];
    hiddenGems: Movie[];
    topRatedOverall: Movie[];
  }>({ forYou: [], hiddenGems: [], topRatedOverall: [] });
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);

  const [interactions, setInteractions] = useState<Record<number, UserInteraction>>({});
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [tmdbApiKey, setTmdbApiKey] = useState<string>(() => localStorage.getItem('tmdb_key') || '');
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' } | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    selectedGenres: [],
    yearRange: [1950, 2030],
    minRating: 0,
    sortBy: 'recommended',
    statusFilter: 'all',
    collectionFilter: 'all',
  });

  const showToast = useCallback((message: string, type: 'info' | 'success' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  // 0. Listen to real Firebase Authentication state
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setAuthUser(user);
      if (user) {
        setActiveAuthId(user.uid);
        setActiveUserId(user.uid);
        try {
          const profile = await syncAuthUser({
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          });
          setActiveProfile(profile);
          showToast(`Signed in as ${user.displayName || user.email?.split('@')[0] || 'User'}`);
        } catch (err) {
          console.error('Failed to sync auth profile:', err);
        }
      } else {
        setActiveAuthId(null);
      }
    });
    return () => unsubscribe();
  }, [showToast]);

  // 1. Initial Load: Users & Profile
  useEffect(() => {
    getUsers()
      .then((users) => {
        setAvailableProfiles(users || []);
        if (users && users.length > 0 && !activeUserId) {
          setActiveUserId(users[0].id);
        }
      })
      .catch((err) => console.error('Error fetching users:', err));
  }, []);

  // 2. Load User Profile and Interactions whenever activeUserId changes
  useEffect(() => {
    if (!activeUserId) return;

    getUserProfile(activeUserId)
      .then((profile) => setActiveProfile(profile))
      .catch(console.error);

    getUserInteractions(activeUserId)
      .then((interList) => {
        const dict: Record<number, UserInteraction> = {};
        if (Array.isArray(interList)) {
          interList.forEach((item) => {
            dict[item.movieId] = item;
          });
        }
        setInteractions(dict);
      })
      .catch(console.error);
  }, [activeUserId]);

  // 3. Load Movies catalog when filters or active profile changes
  useEffect(() => {
    setLoadingMovies(true);
    getMovies({
      userId: activeUserId,
      search: filters.search,
      genres: filters.selectedGenres,
      minRating: filters.minRating > 0 ? filters.minRating : undefined,
      minYear: filters.yearRange[0],
      maxYear: filters.yearRange[1],
      sortBy: filters.sortBy,
      collection: filters.collectionFilter !== 'all' ? filters.collectionFilter : undefined,
    })
      .then((data) => {
        setMovies(data.movies || []);
        setTotalMovieCount(data.total || 0);
      })
      .catch((err) => {
        console.error('Failed to load movies:', err);
      })
      .finally(() => {
        setLoadingMovies(false);
      });
  }, [filters, activeUserId]);

  // 4. Fetch Top Recommendations on demand
  useEffect(() => {
    if (currentTab === 'recommendations' && activeUserId) {
      setLoadingRecs(true);
      getRecommendations(activeUserId)
        .then((data) => {
          setRecommendations(data || { forYou: [], hiddenGems: [], topRatedOverall: [] });
        })
        .catch(console.error)
        .finally(() => setLoadingRecs(false));
    }
  }, [currentTab, activeUserId]);

  // Compute available genres dynamically
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => {
      if (m && m.genres) {
        m.genres.forEach((g) => set.add(g));
      }
    });
    return Array.from(set).sort();
  }, [movies]);

  // Update Movie Interaction Handler
  const handleUpdateInteraction = async (payload: {
    movieId: number;
    status?: 'none' | 'watched' | 'want_to_watch';
    liked?: boolean | null;
    rating?: number;
    favorite?: boolean;
    notes?: string;
  }) => {
    if (!activeUserId) return;

    try {
      const res = await recordInteraction(activeUserId, payload);
      setInteractions((prev) => ({
        ...prev,
        [payload.movieId]: res.interaction,
      }));
      if (res.profile) {
        setActiveProfile(res.profile);
      }
    } catch (err) {
      console.error('Failed to save interaction:', err);
      showToast('Could not record movie interaction.', 'info');
    }
  };

  const handleToggleLike = (movie: Movie, liked: boolean) => {
    const current = interactions[movie.id]?.liked;
    const nextVal = current === liked ? null : liked;
    handleUpdateInteraction({ movieId: movie.id, liked: nextVal });
    if (nextVal === true) showToast(`Added "${movie.title}" to your liked list!`);
  };

  const handleToggleWatchlist = (movie: Movie) => {
    const current = interactions[movie.id]?.status;
    const nextStatus = current === 'want_to_watch' ? 'none' : 'want_to_watch';
    handleUpdateInteraction({ movieId: movie.id, status: nextStatus });
    if (nextStatus === 'want_to_watch') {
      showToast(`Added "${movie.title}" to your Watchlist!`);
    } else {
      showToast(`Removed "${movie.title}" from your Watchlist.`, 'info');
    }
  };

  const handleToggleWatched = (movie: Movie) => {
    const current = interactions[movie.id]?.status;
    const nextStatus = current === 'watched' ? 'none' : 'watched';
    handleUpdateInteraction({ movieId: movie.id, status: nextStatus });
    if (nextStatus === 'watched') {
      showToast(`Marked "${movie.title}" as Watched!`);
    }
  };

  const handleToggleFavorite = (movie: Movie) => {
    const current = interactions[movie.id]?.favorite;
    handleUpdateInteraction({ movieId: movie.id, favorite: !current });
  };

  const watchlistCount = useMemo(() => {
    return Object.values(interactions).filter((i) => i && i.status === 'want_to_watch').length;
  }, [interactions]);

  const handleUpdateTmdbKey = (key: string) => {
    setTmdbApiKey(key);
    localStorage.setItem('tmdb_key', key);
    showToast('TMDB API Key configured successfully!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-indigo-600 selection:text-white">
      {/* 1. Header Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'profile') {
            setProfileModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        activeProfile={activeProfile}
        onOpenProfileModal={() => setProfileModalOpen(true)}
        watchlistCount={watchlistCount}
        authUser={authUser}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onSignOut={async () => {
          await logoutUser();
          showToast('Signed out successfully.');
        }}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Tab 1: Discover Catalog */}
        {currentTab === 'discover' && (
          <div>
            <HeroBanner
              searchQuery={filters.search}
              onSearchChange={(q) => setFilters((prev) => ({ ...prev, search: q }))}
              onExploreRecommendations={() => setCurrentTab('recommendations')}
              totalMovies={totalMovieCount || movies.length}
              selectedCollection={filters.collectionFilter || 'all'}
              onSelectCollection={(col) => setFilters((prev) => ({ ...prev, collectionFilter: col }))}
            />

            <FilterBar
              filters={filters}
              onFilterChange={(f) => setFilters(f)}
              availableGenres={availableGenres}
              totalMatches={movies.length}
            />

            {/* Movie Poster Grid */}
            {loadingMovies ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                <span className="text-sm font-medium">Loading movie catalog...</span>
              </div>
            ) : movies.length === 0 ? (
              <div className="py-20 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center px-4">
                <Film className="w-12 h-12 text-slate-600 mb-3" />
                <h3 className="text-base font-semibold text-white mb-1">No movies found</h3>
                <p className="text-xs text-slate-400 max-w-md mb-4">
                  Try adjusting your search query, genre selection, or era filter to view titles.
                </p>
                <button
                  onClick={() =>
                    setFilters({
                      search: '',
                      selectedGenres: [],
                      yearRange: [1950, 2030],
                      minRating: 0,
                      sortBy: 'recommended',
                      statusFilter: 'all',
                      collectionFilter: 'all',
                    })
                  }
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
                {movies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    interaction={interactions[movie.id]}
                    onOpenDetails={(m) => setSelectedMovie(m)}
                    onToggleLike={handleToggleLike}
                    onToggleWatchlist={handleToggleWatchlist}
                    onToggleWatched={handleToggleWatched}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Recommendations View */}
        {currentTab === 'recommendations' && (
          <RecommendationsView
            recommendations={recommendations}
            isLoading={loadingRecs}
            activeProfile={activeProfile}
            onOpenDetails={(m) => setSelectedMovie(m)}
            interactions={interactions}
            onToggleLike={handleToggleLike}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleWatched={handleToggleWatched}
            onToggleFavorite={handleToggleFavorite}
            onRefresh={() => {
              if (activeUserId) {
                setLoadingRecs(true);
                getRecommendations(activeUserId)
                  .then((data) => setRecommendations(data))
                  .finally(() => setLoadingRecs(false));
              }
            }}
          />
        )}

        {/* Tab 3: Watchlist & History Dashboard */}
        {currentTab === 'watchlist' && (
          <WatchlistDashboard
            allMovies={movies}
            interactions={interactions}
            activeProfile={activeProfile}
            onOpenDetails={(m) => setSelectedMovie(m)}
            onToggleLike={handleToggleLike}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleWatched={handleToggleWatched}
            onToggleFavorite={handleToggleFavorite}
            onNavigateToDiscover={() => setCurrentTab('discover')}
          />
        )}
      </main>

      {/* 3. Global Movie Detail Modal */}
      <MovieDetailModal
        movie={selectedMovie}
        interaction={selectedMovie ? interactions[selectedMovie.id] : undefined}
        activeProfile={activeProfile}
        onClose={() => setSelectedMovie(null)}
        onUpdateInteraction={handleUpdateInteraction}
      />

      {/* 4. Taste Profile Switcher & TMDB API Key Modal */}
      <TasteProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        activeProfile={activeProfile}
        availableProfiles={availableProfiles}
        onSelectProfile={(uid) => {
          setActiveUserId(uid);
          setProfileModalOpen(false);
          const matched = availableProfiles.find((p) => p.id === uid);
          showToast(`Switched active profile to ${matched ? matched.name : 'User'}`);
        }}
        tmdbApiKey={tmdbApiKey}
        onUpdateTmdbKey={handleUpdateTmdbKey}
      />

      {/* 5. Firebase Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => showToast('Authenticated successfully!')}
      />

      {/* 6. Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs font-medium shadow-2xl shadow-black/80 animate-bounce-subtle">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* 7. Cinematic Clean Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070a12] py-8 px-4 sm:px-6 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-slate-300">CineMatch Cinema</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>Personalized Movie Recommendation Engine & Watchlist</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Powered by TMDB & Firebase Auth</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
