export interface Movie {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  release_year: number;
  vote_average: number;
  vote_count: number;
  genres: string[];
  runtime: number; // in minutes
  director: string;
  cast: string[];
  trailer_url?: string;
  keywords: string[];
  tagline?: string;
  similarityScore?: number; // 0 - 100 percentage match
  matchReasons?: string[];
  collection?: 'bollywood' | 'viral' | 'limited_hollywood';
}

export type InteractionStatus = 'none' | 'watched' | 'want_to_watch';

export interface UserInteraction {
  userId?: string;
  movieId: number;
  status: InteractionStatus;
  liked: boolean | null; // true = like, false = dislike, null = neutral
  rating?: number; // 1 to 5 stars
  favorite: boolean;
  notes?: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  tagline: string;
  avatar: string;
  createdAt: string;
  totalWatched: number;
  totalFavorites: number;
  totalLikes: number;
  totalDislikes: number;
  topGenres: { genre: string; count: number; percentage: number }[];
  tasteVector: Record<string, number>;
}

export interface FilterState {
  search: string;
  selectedGenres: string[];
  yearRange: [number, number];
  minRating: number;
  sortBy: 'recommended' | 'rating' | 'popularity' | 'newest' | 'title';
  statusFilter?: 'all' | 'watched' | 'watchlist' | 'favorites';
  collectionFilter?: 'all' | 'bollywood' | 'viral' | 'limited_hollywood';
}

export interface MLMatchExplanation {
  movieId: number;
  movieTitle: string;
  overallMatchScore: number;
  keyFactors: { factor: string; impact: string }[];
  aiAnalysis: string;
}
