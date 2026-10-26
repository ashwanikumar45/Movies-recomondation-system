import { Movie, UserInteraction, UserProfile, MLMatchExplanation } from '../types/movie';

const API_BASE = '/api';

export interface MovieQueryParams {
  search?: string;
  genres?: string[];
  minYear?: number;
  maxYear?: number;
  minRating?: number;
  sortBy?: 'recommended' | 'rating' | 'popularity' | 'newest' | 'title';
  statusFilter?: 'all' | 'watched' | 'watchlist' | 'favorites';
  collection?: 'all' | 'bollywood' | 'viral' | 'limited_hollywood';
  userId?: string;
  limit?: number;
}

export async function getMovies(params: MovieQueryParams): Promise<{ total: number; movies: Movie[] }> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.genres && params.genres.length > 0) query.set('genres', params.genres.join(','));
  if (params.minYear) query.set('minYear', params.minYear.toString());
  if (params.maxYear) query.set('maxYear', params.maxYear.toString());
  if (params.minRating) query.set('minRating', params.minRating.toString());
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.statusFilter) query.set('statusFilter', params.statusFilter);
  if (params.collection) query.set('collection', params.collection);
  if (params.userId) query.set('userId', params.userId);
  if (params.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/movies?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch movies');
  return res.json();
}

export async function getMovie(id: number, userId?: string): Promise<Movie> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`${API_BASE}/movies/${id}${query}`);
  if (!res.ok) throw new Error('Failed to fetch movie');
  return res.json();
}

export async function getRecommendations(userId: string): Promise<{
  forYou: Movie[];
  hiddenGems: Movie[];
  topRatedOverall: Movie[];
}> {
  const res = await fetch(`${API_BASE}/recommendations/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json();
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch user profile');
  const data = await res.json();
  return data.profile;
}

let activeAuthId: string | null = null;
export function setActiveAuthId(id: string | null) {
  activeAuthId = id;
}

export async function syncAuthUser(user: {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error('Failed to sync authenticated user');
  const data = await res.json();
  return data.profile;
}

export async function getUsers(): Promise<UserProfile[]> {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  const data = await res.json();
  return data.users;
}

export async function getUserInteractions(userId: string): Promise<UserInteraction[]> {
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(userId)}/interactions`);
  if (!res.ok) throw new Error('Failed to fetch user interactions');
  const data = await res.json();
  return data.interactions;
}

export async function recordInteraction(
  userId: string,
  payload: {
    movieId: number;
    status?: 'none' | 'watched' | 'want_to_watch';
    liked?: boolean | null;
    rating?: number;
    favorite?: boolean;
    notes?: string;
  }
): Promise<{ success: boolean; interaction: UserInteraction; profile: UserProfile }> {
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(userId)}/interact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to record interaction');
  return res.json();
}

export async function getAIExplanation(movieId: number, userId: string): Promise<MLMatchExplanation> {
  const res = await fetch(`${API_BASE}/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ movieId, userId }),
  });
  if (!res.ok) throw new Error('Failed to fetch AI explanation');
  return res.json();
}

export async function searchTMDB(query: string, apiKey?: string): Promise<{ live: boolean; results: any[] }> {
  const searchParams = new URLSearchParams({ query });
  if (apiKey) searchParams.set('apiKey', apiKey);
  const res = await fetch(`${API_BASE}/tmdb/search?${searchParams.toString()}`);
  if (!res.ok) throw new Error('TMDB search request failed');
  return res.json();
}
