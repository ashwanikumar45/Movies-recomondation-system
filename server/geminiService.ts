import { GoogleGenAI } from '@google/genai';
import { Movie, UserProfile } from '../src/types/movie.js';

let aiInstance: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiInstance && process.env.GEMINI_API_KEY) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export async function explainMovieRecommendation(
  movie: Movie,
  userProfile: UserProfile,
  likedTitles: string[],
  dislikedTitles: string[]
): Promise<string> {
  const ai = getAIClient();

  // If no Gemini key or network fails, provide rich algorithmic fallback explanation
  const fallbackExplanation = `Based on your high affinity for ${
    userProfile.topGenres.map(g => g.genre).slice(0, 3).join(', ') || 'quality cinema'
  }${
    likedTitles.length > 0 ? ` and titles like ${likedTitles.slice(0, 2).join(' & ')}` : ''
  }, "${movie.title}" presents strong stylistic parallels through ${movie.director}'s direction, intense pacing, and compelling narrative tension.`;

  if (!ai) {
    return fallbackExplanation;
  }

  try {
    const prompt = `You are an expert film critic and cinema recommendation engine.
Analyze why the movie "${movie.title}" (${movie.release_year}, directed by ${movie.director}, genres: ${movie.genres.join(', ')}) is a great recommendation for this user.

User Taste Profile:
- Top Preferred Genres: ${userProfile.topGenres.map(g => `${g.genre} (${g.percentage}%)`).join(', ') || 'Varied'}
- Recently Liked Films: ${likedTitles.join(', ') || 'Exploring catalog'}
- Disliked Films to Avoid: ${dislikedTitles.join(', ') || 'None'}
- Movie Synopsis: "${movie.overview}"
- Core Thematic Keywords: ${movie.keywords.join(', ')}

Provide a concise, 2-to-3 sentence personalized justification explaining exactly why this user will appreciate the cinematography, thematic depth, or narrative tone of "${movie.title}". Do not use bullet points or marketing cliches. Sound like a knowledgeable, discerning film curator.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text?.trim();
    return text || fallbackExplanation;
  } catch (err) {
    console.warn('[GeminiService] Could not generate AI explanation, falling back to algorithmic reason:', err);
    return fallbackExplanation;
  }
}
