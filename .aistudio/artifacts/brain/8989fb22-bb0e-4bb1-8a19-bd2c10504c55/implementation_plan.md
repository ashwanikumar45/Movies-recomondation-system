# CineMatch ML — Intelligent Movie Recommendation & Taste Profiling Platform

A cinematic, responsive web application that leverages machine learning taste profiling, content similarity algorithms, and TMDB metadata integration to deliver personalized film recommendations based on user watch history, ratings, and explicit likes/dislikes.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Key Architecture Decisions for Review:**
> - **Machine Learning Engine**: Hybrid recommendation system combining high-dimensional vector embeddings (TF-IDF genre/keyword vectors + collaborative taste archetypes) with Gemini 3.8 Flash for deep semantic match explanations ("Why this film was picked for your taste").
> - **TMDB Integration**: Seamless hybrid TMDB client with a pre-indexed 120+ high-definition movie repository (complete with official TMDB poster paths, cast, directors, backdrop artwork, and trailers), plus an optional custom TMDB API key input for infinite real-time TMDB global catalog queries.
> - **Database Strategy**: Node.js Express backend with a MongoDB-compatible persistent document store (with JSON collections for users, ratings, watchlists, and movie vectors) plus configurable MongoDB Atlas URI connection support via environment variables.

---

### 1. Overview & Core Concept

- **What It Does**: CineMatch ML is an intelligent movie recommendation and tracking platform. It learns from each user interaction (ratings, watch history, likes, and dislikes) to dynamically adjust taste vectors and recommend cinema gems that match the user's specific flavor.
- **Target Audience**: Film enthusiasts, casual moviegoers, and cinephiles who want personalized, transparent recommendations rather than generic algorithmic noise.
- **Key Value**:
  - Transparent ML scoring: every recommendation displays an explainable match percentage and rationale.
  - Interactive taste refinement: instant recalculation when thumbs up/down or ratings are submitted.
  - Personalized dashboard: tracking "Favorites", "Watched History", "Want to Watch", and genre affinity breakdown.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Discovery & Exploration**: Browse curated collections (Trending, Top Rated, Hidden Gems, Modern Classics) with responsive poster grids and subtle hover depth.
2. **Hybrid Search & Dynamic Filtering**: Filter concurrently by genre pills, release year era sliders (1970–2026), and TMDB rating thresholds (e.g., $7.5+$), sorted by ML Match Score, Rating, or Popularity.
3. **Taste Training & Interaction**: One-click Like, Dislike, or Star Rating on any film card or detail modal instantly recalculates user preference vectors.
4. **Detailed Film Inspection**: Modal drawer with high-resolution TMDB backdrops, director, top cast, runtime, synopsis, trailer video modal, and personalized "Why Recommended" ML breakdown.
5. **Personalized Dashboard & Profiles**: View watch stats, favorite films, taste radar chart (e.g., 42% Sci-Fi, 28% Neo-Noir, 15% Thriller), and switch between multiple user profiles (e.g., "Main Profile", "Sci-Fi Geek", "Family Night").

#### Visual Identity & Theme
- **Aesthetic Direction**: Cinematic dark room atmosphere with sleek typography and subtle amber/indigo accents, inspired by Criterion Channel and modern film festival archives.
- **Color Palette**:
  - Dominant Canvas (60%): `#090D16` (Deep Midnight Obsidian)
  - Structural Surfaces (30%): `#111827` (Card Charcoal) with `#1F2937` hairline borders (`border-slate-800/80`)
  - Accent Budget (10%): Warm Gold `#F59E0B` (TMDB ratings, primary match indicators) and Electric Violet `#6366F1` (ML badges and active states)
- **Typography & Hierarchy**:
  - Display Font: `Plus Jakarta Sans` (bold weights, tight letter spacing, clean title case)
  - Body Prose: `Plus Jakarta Sans` / `DM Sans` (14px–16px, balanced measure)
  - Tabular Data: `JetBrains Mono` / `tabular-nums` for ratings, runtimes, and match scores
- **Zero-Pill Discipline**: Metadata displayed with clean dot separators (`2024 · 2h 46m · Sci-Fi · 8.6 TMDB`), reserving framed buttons exclusively for functional filter tabs.
- **Top Bar Contract**: Single row adhering to the 3-zone contract:
  - Zone 1: Wordmark `CineMatch ML`
  - Zone 2: Navigation links (`Discover`, `For You`, `Watchlist`, `Taste Profile`)
  - Zone 3: Active Profile Selector & Quick Stats badge

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hybrid Content Vector + Gemini ML Architecture**
  - *Chosen Approach*: Compute cosine similarity over weighted multi-hot genre, keyword, and director vectors on the backend, complemented by Gemini 3.8 Flash for semantic synthesis and natural-language "Why You'll Love This" explanations.
  - *Why*: Instant $<5\text{ms}$ vector scoring for interactive real-time filter sorting, plus deep AI semantic reasoning on movie detail views without latency on list renders.
  - *Alternatives Considered*: Pure LLM recommendations were discarded due to high latency on 100+ item catalog sorting.

- **Decision 2: Express Fullstack Server with MongoDB-Compatible Storage**
  - *Chosen Approach*: Node.js Express server running with Vite middleware or API routes, backed by a persistent file-backed JSON document store that matches MongoDB's BSON collection patterns, with direct support for `MONGODB_URI` if provided.
  - *Why*: Guarantees instant zero-friction execution in the AI Studio container without requiring remote Atlas firewall provisioning, while fulfilling the backend Express + MongoDB architecture specification.

- **Decision 3: Curated TMDB Engine with Optional Live Key Fallthrough**
  - *Chosen Approach*: Bundled rich catalog of 120+ iconic and modern films with verified TMDB artwork and trailers, coupled with an Express proxy `/api/tmdb/search` that allows users to seamlessly plug in their personal TMDB token for live global search.
  - *Why*: Solves the cold-start problem (looks stunning immediately on first launch) while honoring full live TMDB integration.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Client (React + Vite)                         │
│                                                                        │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────┐  │
│  │   TopBar (Nav+Stats) │  │  Hybrid Search & Bar │  │ Genre/Year/  │  │
│  │                      │  │  (Debounced query)   │  │ Rating Filter│  │
│  └──────────────────────┘  └──────────────────────┘  └──────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      Active Viewport Tab                         │  │
│  │  ┌────────────────────┐ ┌──────────────────┐ ┌────────────────┐  │  │
│  │  │  Recommendation   │ │   Movie Detail   │ │   Dashboard    │  │  │
│  │  │  Poster Grid       │ │   Drawer/Modal   │ │   & Analytics  │  │  │
│  │  └────────────────────┘ └──────────────────┘ └────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (/api/*)
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Full-Stack Backend (Node.js Express)                  │
│                                                                        │
│  ┌────────────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  Recommendation Engine │  │ TMDB Proxy API │  │ User Profile &   │  │
│  │  Cosine Sim + Weights  │  │ Cache + Live   │  │ Watchlist API    │  │
│  └───────────┬────────────┘  └────────┬───────┘  └────────┬─────────┘  │
│              │                        │                   │            │
│  ┌───────────▼────────────┐           │          ┌────────▼─────────┐  │
│  │ Gemini 3.8 Flash AI    │           │          │ MongoDB Document │  │
│  │ (Semantic Taste Match) │           │          │ Store (Local/    │  │
│  └────────────────────────┘           │          │ Atlas fallback)  │  │
│                                       ▼          └──────────────────┘  │
│                            ┌─────────────────────┐                     │
│                            │   TMDB Cloud API    │                     │
│                            │ (Posters & Details) │                     │
│                            └─────────────────────┘                     │
└────────────────────────────────────────────────────────────────────────┘
```

#### Key API Endpoints
- `GET /api/movies` — Hybrid search, multi-genre filtering, release year range, TMDB vote threshold, and ML score ranking.
- `GET /api/movies/recommendations/:userId` — Dynamic vector recommendation list based on user likes/dislikes/watch history.
- `POST /api/movies/:id/interact` — Record action (`like`, `dislike`, `watch`, `favorite`, `rate`) and trigger vector re-indexing.
- `GET /api/user/profile/:userId` — Fetch user dashboard stats, taste vector breakdown, and watchlists.
- `POST /api/ai/explain` — Gemini 3.8 Flash generation for personalized film explanations.
- `GET /api/tmdb/search` — TMDB metadata and poster resolver.
