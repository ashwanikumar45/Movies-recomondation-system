import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_MOVIES } from './server/moviesData.js';
import { MovieRecommendationEngine } from './server/mlEngine.js';
import { usersCollection, interactionsCollection, cachedMoviesCollection } from './server/db.js';
import { explainMovieRecommendation } from './server/geminiService.js';
import { Movie, UserInteraction, UserProfile } from './src/types/movie.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (process.env.NODE_ENV === 'production' && process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 3000;
}
const PORT = getPort();

app.use(express.json());

// ==========================================
// MIDDLEWARES
// ==========================================

// 1. Security Headers Middleware
app.use((_req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 2. Request Logger Middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      const ms = Date.now() - start;
      console.log(`[API ${req.method}] ${req.path} -> ${res.statusCode} (${ms}ms)`);
    }
  });
  next();
});

// 3. User Identity & Authentication Middleware
app.use('/api', (req: Request, _res: Response, next) => {
  const authHeader = req.headers.authorization;
  const headerUserId = req.headers['x-user-id'] as string;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    (req as any).userId = authHeader.substring(7);
  } else if (headerUserId) {
    (req as any).userId = headerUserId;
  } else if (req.query.userId) {
    (req as any).userId = req.query.userId;
  } else {
    (req as any).userId = 'user_cinephile';
  }
  next();
});

// In-memory catalog mapped by ID for fast vector lookups
const moviesMap = new Map<number, Movie>();
INITIAL_MOVIES.forEach(m => moviesMap.set(m.id, m));

const mlEngine = new MovieRecommendationEngine(INITIAL_MOVIES);

// Seed initial default profiles if empty
async function initDatabase() {
  const usersCount = await usersCollection.countDocuments();
  if (usersCount === 0) {
    const defaultUsers: Partial<UserProfile>[] = [
      {
        id: 'user_cinephile',
        name: 'Julian Vance',
        tagline: 'Modern & Classic Cinema Enthusiast',
        avatar: '/src/assets/images/avatar_cinephile_user_1792955256389.jpg',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_scifi',
        name: 'Elena Rostova',
        tagline: 'Deep Space & Cyberpunk Aficionado',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_critic',
        name: 'Marcus Chen',
        tagline: 'Neo-Noir & Psychological Thrillers',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      }
    ];

    for (const u of defaultUsers) {
      await usersCollection.insertOne(u);
    }

    // Seed some initial training interactions for Julian Vance (Sci-Fi / Mind-Bending fan)
    const initialInteractions: Partial<UserInteraction>[] = [
      {
        userId: 'user_cinephile',
        movieId: 157336, // Interstellar
        status: 'watched',
        liked: true,
        rating: 5,
        favorite: true,
        updatedAt: new Date().toISOString()
      },
      {
        userId: 'user_cinephile',
        movieId: 27205, // Inception
        status: 'watched',
        liked: true,
        rating: 5,
        favorite: true,
        updatedAt: new Date().toISOString()
      },
      {
        userId: 'user_cinephile',
        movieId: 335984, // Blade Runner 2049
        status: 'watched',
        liked: true,
        rating: 5,
        favorite: true,
        updatedAt: new Date().toISOString()
      },
      {
        userId: 'user_cinephile',
        movieId: 693134, // Dune 2
        status: 'watched',
        liked: true,
        rating: 5,
        favorite: false,
        updatedAt: new Date().toISOString()
      },
      {
        userId: 'user_cinephile',
        movieId: 602, // Independence Day
        status: 'watched',
        liked: false,
        rating: 2,
        favorite: false,
        updatedAt: new Date().toISOString()
      }
    ];

    for (const inter of initialInteractions) {
      await interactionsCollection.insertOne(inter);
    }
  }
}

initDatabase().catch(console.error);

// Helper to compute user profile with dynamic analytics
async function getUserProfileWithStats(userId: string): Promise<UserProfile | null> {
  const user = await usersCollection.findOne({ id: userId });
  if (!user) return null;

  const rawInteractions = await interactionsCollection.find({ userId });
  const interactions = rawInteractions as unknown as UserInteraction[];

  const { tasteVector, topGenres, summary } = mlEngine.buildUserTasteVector(interactions, moviesMap);

  return {
    id: user.id,
    name: user.name,
    tagline: user.tagline || 'Film Lover',
    avatar: user.avatar || '/src/assets/images/avatar_cinephile_user_1792955256389.jpg',
    createdAt: user.createdAt || new Date().toISOString(),
    totalWatched: summary.totalWatched,
    totalFavorites: summary.totalFavorites,
    totalLikes: summary.totalLikes,
    totalDislikes: summary.totalDislikes,
    topGenres,
    tasteVector,
  };
}

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. GET /api/movies: Hybrid search and filter
app.get('/api/movies', async (req: Request, res: Response) => {
  try {
    const {
      search = '',
      genres = '',
      minYear = '1950',
      maxYear = '2030',
      minRating = '0',
      sortBy = 'recommended',
      userId = 'user_cinephile',
      statusFilter = 'all',
      collection = 'all',
      limit = '100'
    } = req.query as Record<string, string>;

    const userInteractions = (await interactionsCollection.find({ userId })) as unknown as UserInteraction[];
    const interactionsMap = new Map<number, UserInteraction>();
    userInteractions.forEach(i => interactionsMap.set(i.movieId, i));

    // Score all movies with ML model
    const scored = mlEngine.rankMovies(INITIAL_MOVIES, userInteractions, moviesMap);

    const minYr = parseInt(minYear, 10) || 1950;
    const maxYr = parseInt(maxYear, 10) || 2030;
    const minRt = parseFloat(minRating) || 0;
    const selectedGenres = genres ? genres.split(',').filter(Boolean) : [];
    const searchTerms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);

    // Apply filters
    const filtered = scored.filter(movie => {
      // Collection filter (Bollywood, Viral, Limited Edition Hollywood)
      if (collection && collection !== 'all') {
        if (movie.collection !== collection) return false;
      }

      // Status filter
      const interaction = interactionsMap.get(movie.id);
      if (statusFilter === 'watched' && interaction?.status !== 'watched') return false;
      if (statusFilter === 'watchlist' && interaction?.status !== 'want_to_watch') return false;
      if (statusFilter === 'favorites' && !interaction?.favorite) return false;

      // Year range
      if (movie.release_year < minYr || movie.release_year > maxYr) return false;

      // Rating threshold
      if (movie.vote_average < minRt) return false;

      // Genre filter (AND match if specified)
      if (selectedGenres.length > 0) {
        const hasGenre = selectedGenres.some(sg =>
          movie.genres.some(mg => mg.toLowerCase() === sg.toLowerCase())
        );
        if (!hasGenre) return false;
      }

      // Hybrid text search: title, director, cast, keywords
      if (searchTerms.length > 0) {
        const corpus = `${movie.title} ${movie.director} ${movie.cast.join(' ')} ${movie.genres.join(' ')} ${movie.keywords.join(' ')}`.toLowerCase();
        const matchesAll = searchTerms.every(term => corpus.includes(term));
        if (!matchesAll) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'rating') {
      filtered.sort((a, b) => b.vote_average - a.vote_average);
    } else if (sortBy === 'popularity') {
      filtered.sort((a, b) => b.vote_count - a.vote_count);
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => b.release_year - a.release_year);
    } else if (sortBy === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    // 'recommended' is default, already sorted by similarityScore

    const maxItems = parseInt(limit, 10) || 100;
    res.json({
      total: filtered.length,
      movies: filtered.slice(0, maxItems),
    });
  } catch (err: any) {
    console.error('Error fetching movies:', err);
    res.status(500).json({ error: 'Failed to retrieve movies' });
  }
});

// 2. GET /api/movies/:id: Single movie with ML similarity
app.get('/api/movies/:id', async (req: Request, res: Response) => {
  try {
    const movieId = parseInt(req.params.id, 10);
    const movie = moviesMap.get(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const userId = (req.query.userId as string) || 'user_cinephile';
    const userInteractions = (await interactionsCollection.find({ userId })) as unknown as UserInteraction[];
    const { tasteVector } = mlEngine.buildUserTasteVector(userInteractions, moviesMap);
    const movieVec = mlEngine.extractMovieVector(movie);
    const { score, reasons } = mlEngine.computeSimilarity(tasteVector, movieVec);

    res.json({
      ...movie,
      similarityScore: score,
      matchReasons: reasons,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve movie details' });
  }
});

// 3. GET /api/recommendations/:userId: Top recommended curated lists
app.get('/api/recommendations/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userInteractions = (await interactionsCollection.find({ userId })) as unknown as UserInteraction[];
    const scored = mlEngine.rankMovies(INITIAL_MOVIES, userInteractions, moviesMap);

    // Unwatched top picks
    const watchedIds = new Set(
      userInteractions.filter(i => i.status === 'watched').map(i => i.movieId)
    );

    const unwatchedTopPicks = scored.filter(m => !watchedIds.has(m.id)).slice(0, 10);
    const hiddenGems = scored.filter(m => !watchedIds.has(m.id) && m.vote_average >= 8.2).slice(0, 6);
    const topRatedOverall = [...INITIAL_MOVIES].sort((a, b) => b.vote_average - a.vote_average).slice(0, 8);

    res.json({
      forYou: unwatchedTopPicks,
      hiddenGems,
      topRatedOverall,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// 4. User profiles
app.get('/api/users', async (_req: Request, res: Response) => {
  try {
    const users = await usersCollection.find({});
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 4b. Sync authenticated user profile (Firebase Auth)
app.post('/api/auth/sync', async (req: Request, res: Response) => {
  try {
    const { uid, displayName, email, photoURL } = req.body;
    if (!uid) return res.status(400).json({ error: 'UID is required' });

    const existing = await usersCollection.findOne({ id: uid });
    if (!existing) {
      await usersCollection.insertOne({
        id: uid,
        name: displayName || email?.split('@')[0] || 'Film Enthusiast',
        tagline: 'Personal Cinema Connoisseur',
        avatar: photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
        createdAt: new Date().toISOString(),
      });
    } else if (displayName || photoURL) {
      await usersCollection.updateOne(
        { id: uid },
        {
          $set: {
            name: displayName || existing.name,
            avatar: photoURL || existing.avatar,
          }
        }
      );
    }

    const profile = await getUserProfileWithStats(uid);
    res.json({ success: true, profile });
  } catch (err: any) {
    console.error('Error syncing auth user:', err);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

app.get('/api/users/:userId', async (req: Request, res: Response) => {
  try {
    const profile = await getUserProfileWithStats(req.params.userId);
    if (!profile) return res.status(404).json({ error: 'User profile not found' });
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// 5. User interactions
app.get('/api/users/:userId/interactions', async (req: Request, res: Response) => {
  try {
    const interactions = await interactionsCollection.find({ userId: req.params.userId });
    res.json({ interactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
});

app.post('/api/users/:userId/interact', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { movieId, status, liked, rating, favorite, notes } = req.body;

    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required' });
    }

    const query = { userId, movieId: Number(movieId) };
    const existing = await interactionsCollection.findOne(query);

    const updateDoc: Partial<UserInteraction> & { userId: string } = {
      userId,
      movieId: Number(movieId),
      status: status !== undefined ? status : (existing?.status || 'none'),
      liked: liked !== undefined ? liked : (existing?.liked ?? null),
      rating: rating !== undefined ? rating : existing?.rating,
      favorite: favorite !== undefined ? favorite : (existing?.favorite || false),
      notes: notes !== undefined ? notes : existing?.notes,
      updatedAt: new Date().toISOString(),
    };

    const updated = await interactionsCollection.updateOne(query, { $set: updateDoc }, { upsert: true });
    const profile = await getUserProfileWithStats(userId);

    res.json({ success: true, interaction: updated, profile });
  } catch (err) {
    console.error('Error recording interaction:', err);
    res.status(500).json({ error: 'Failed to update interaction' });
  }
});

// 6. Gemini AI Explain Route
app.post('/api/ai/explain', async (req: Request, res: Response) => {
  try {
    const { movieId, userId = 'user_cinephile' } = req.body;
    const movie = moviesMap.get(Number(movieId));
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const profile = await getUserProfileWithStats(userId);
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    const interactions = (await interactionsCollection.find({ userId })) as unknown as UserInteraction[];
    const likedTitles = interactions
      .filter(i => i.liked === true || i.favorite || (i.rating && i.rating >= 4))
      .map(i => moviesMap.get(i.movieId)?.title)
      .filter(Boolean) as string[];

    const dislikedTitles = interactions
      .filter(i => i.liked === false || (i.rating && i.rating <= 2))
      .map(i => moviesMap.get(i.movieId)?.title)
      .filter(Boolean) as string[];

    const explanation = await explainMovieRecommendation(movie, profile, likedTitles, dislikedTitles);

    res.json({
      movieId: movie.id,
      movieTitle: movie.title,
      overallMatchScore: movie.similarityScore || 85,
      aiAnalysis: explanation,
    });
  } catch (err) {
    console.error('Error generating AI explanation:', err);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// 7. TMDB Proxy / Search
app.get('/api/tmdb/search', async (req: Request, res: Response) => {
  try {
    const { query = '', apiKey = '' } = req.query as Record<string, string>;
    const tmdbKey = apiKey || process.env.TMDB_API_KEY;

    if (tmdbKey && query) {
      // Query real TMDB live
      const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(query)}&include_adult=false`;
      const response = await fetch(tmdbUrl);
      if (response.ok) {
        const data = await response.json();
        return res.json({ live: true, results: data.results });
      }
    }

    // Fallback: search internal indexed movies
    const q = query.toLowerCase();
    const results = INITIAL_MOVIES.filter(m =>
      m.title.toLowerCase().includes(q) || m.director.toLowerCase().includes(q)
    );
    res.json({ live: false, results });
  } catch (err) {
    res.status(500).json({ error: 'TMDB search failed' });
  }
});

// ==========================================
// VITE DEV SERVER / PRODUCTION STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 CineMatch Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
