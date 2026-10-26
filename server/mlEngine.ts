import { Movie, UserInteraction, UserProfile } from '../src/types/movie.js';

export interface ScoredMovie extends Movie {
  similarityScore: number;
  matchReasons: string[];
}

export class MovieRecommendationEngine {
  // Vocabulary for vector space
  private allGenres: string[] = [];
  private allDirectors: string[] = [];

  constructor(movies: Movie[]) {
    this.trainVocabulary(movies);
  }

  public trainVocabulary(movies: Movie[]) {
    const genreSet = new Set<string>();
    const directorSet = new Set<string>();

    for (const m of movies) {
      m.genres.forEach(g => genreSet.add(g.toLowerCase()));
      if (m.director) directorSet.add(m.director.toLowerCase());
    }

    this.allGenres = Array.from(genreSet);
    this.allDirectors = Array.from(directorSet);
  }

  /**
   * Encodes a movie into a normalized feature vector.
   * Features: Genres (weight 2.5), Director (weight 2.0), Era (weight 1.0), Keywords (weight 1.5)
   */
  public extractMovieVector(movie: Movie): Record<string, number> {
    const vector: Record<string, number> = {};

    // 1. Genres
    for (const g of movie.genres) {
      vector[`genre:${g.toLowerCase()}`] = 2.5;
    }

    // 2. Director
    if (movie.director) {
      vector[`director:${movie.director.toLowerCase()}`] = 2.0;
    }

    // 3. Era
    const era = this.getEra(movie.release_year);
    vector[`era:${era}`] = 1.0;

    // 4. Keywords
    if (movie.keywords) {
      for (const kw of movie.keywords) {
        vector[`kw:${kw.toLowerCase().trim()}`] = 1.2;
      }
    }

    // 5. High rating prior
    if (movie.vote_average >= 8.0) {
      vector['quality:acclaimed'] = 1.0;
    }

    return vector;
  }

  private getEra(year: number): string {
    if (year < 1980) return '70s_or_older';
    if (year < 1990) return '80s';
    if (year < 2000) return '90s';
    if (year < 2010) return '2000s';
    if (year < 2020) return '2010s';
    return '2020s';
  }

  /**
   * Constructs user taste vector by aggregating positive and negative weights from all user interactions.
   */
  public buildUserTasteVector(interactions: UserInteraction[], moviesMap: Map<number, Movie>): {
    tasteVector: Record<string, number>;
    topGenres: { genre: string; count: number; percentage: number }[];
    summary: { totalWatched: number; totalFavorites: number; totalLikes: number; totalDislikes: number };
  } {
    const tasteVector: Record<string, number> = {};
    const genreCounts: Record<string, number> = {};
    let totalPositiveInteractions = 0;

    let totalWatched = 0;
    let totalFavorites = 0;
    let totalLikes = 0;
    let totalDislikes = 0;

    for (const item of interactions) {
      const movie = moviesMap.get(item.movieId);
      if (!movie) continue;

      let interactionWeight = 0;

      if (item.status === 'watched') {
        totalWatched++;
        interactionWeight += 1.5;
      }
      if (item.status === 'want_to_watch') {
        interactionWeight += 1.2;
      }
      if (item.favorite) {
        totalFavorites++;
        interactionWeight += 4.0;
      }
      if (item.liked === true) {
        totalLikes++;
        interactionWeight += 3.5;
      } else if (item.liked === false) {
        totalDislikes++;
        interactionWeight -= 4.0;
      }

      if (item.rating) {
        // 5 stars -> +3.0, 4 stars -> +1.5, 3 stars -> 0, 2 stars -> -1.5, 1 star -> -3.0
        interactionWeight += (item.rating - 3) * 1.5;
      }

      // If neutral watched with no ratings or likes, default small positive interest
      if (interactionWeight === 0 && item.status === 'watched') {
        interactionWeight = 1.0;
      }

      const movieVector = this.extractMovieVector(movie);
      for (const [feature, val] of Object.entries(movieVector)) {
        tasteVector[feature] = (tasteVector[feature] || 0) + val * interactionWeight;
      }

      // Count genres for analytics
      if (interactionWeight > 0) {
        totalPositiveInteractions++;
        for (const g of movie.genres) {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        }
      }
    }

    // Format top genres
    const topGenres = Object.entries(genreCounts)
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: totalPositiveInteractions > 0 ? Math.round((count / totalPositiveInteractions) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      tasteVector,
      topGenres,
      summary: { totalWatched, totalFavorites, totalLikes, totalDislikes },
    };
  }

  /**
   * Computes cosine similarity between user taste vector and movie vector
   */
  public computeSimilarity(userTaste: Record<string, number>, movieVector: Record<string, number>): {
    score: number;
    reasons: string[];
  } {
    const userKeys = Object.keys(userTaste);
    if (userKeys.length === 0) {
      // Cold-start baseline: score strictly based on TMDB vote average
      return { score: 75, reasons: ['Curated universal classic', 'High TMDB community acclaim'] };
    }

    let dotProduct = 0;
    let userNormSq = 0;
    let movieNormSq = 0;
    const matchedFeatures: { name: string; contribution: number }[] = [];

    for (const [k, v] of Object.entries(userTaste)) {
      userNormSq += v * v;
      if (movieVector[k]) {
        const contribution = v * movieVector[k];
        dotProduct += contribution;
        matchedFeatures.push({ name: k, contribution });
      }
    }

    for (const v of Object.values(movieVector)) {
      movieNormSq += v * v;
    }

    if (userNormSq === 0 || movieNormSq === 0) {
      return { score: 70, reasons: ['Neutral baseline recommendation'] };
    }

    const cosine = dotProduct / (Math.sqrt(userNormSq) * Math.sqrt(movieNormSq));

    // Map cosine [-1, 1] to a user-friendly [35% - 98%] match score
    const clampedScore = Math.max(35, Math.min(99, Math.round(50 + cosine * 45)));

    // Extract top explainable reasons
    matchedFeatures.sort((a, b) => b.contribution - a.contribution);
    const reasons: string[] = [];

    for (const feat of matchedFeatures.slice(0, 3)) {
      if (feat.name.startsWith('director:')) {
        reasons.push(`Matches your love for director ${feat.name.replace('director:', '')}`);
      } else if (feat.name.startsWith('genre:')) {
        reasons.push(`Strong alignment with your preferred ${feat.name.replace('genre:', '')} genre`);
      } else if (feat.name.startsWith('kw:')) {
        reasons.push(`Shares thematic focus on "${feat.name.replace('kw:', '')}"`);
      } else if (feat.name.startsWith('era:')) {
        reasons.push(`Fits your taste in ${feat.name.replace('era:', '').toUpperCase()} cinema`);
      }
    }

    if (reasons.length === 0) {
      reasons.push('Broad thematic affinity with your watch history');
    }

    return { score: clampedScore, reasons };
  }

  /**
   * Scores and ranks movies for a given user profile
   */
  public rankMovies(
    movies: Movie[],
    interactions: UserInteraction[],
    moviesMap: Map<number, Movie>
  ): ScoredMovie[] {
    const { tasteVector } = this.buildUserTasteVector(interactions, moviesMap);

    return movies.map(movie => {
      const movieVec = this.extractMovieVector(movie);
      const { score, reasons } = this.computeSimilarity(tasteVector, movieVec);
      return {
        ...movie,
        similarityScore: score,
        matchReasons: reasons,
      };
    }).sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
  }
}
