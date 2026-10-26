import React, { useState } from 'react';
import { Filter, Star, Calendar, ArrowUpDown, X, Check, SlidersHorizontal, Film, RotateCcw } from 'lucide-react';
import { FilterState } from '../types/movie';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableGenres: string[];
  totalMatches: number;
}

const ERA_PRESETS = [
  { label: 'All Eras', range: [1950, 2030] as [number, number] },
  { label: 'Classic Era (<2000)', range: [1950, 1999] as [number, number] },
  { label: '2000s - 2010s', range: [2000, 2019] as [number, number] },
  { label: 'Recent (2020+)', range: [2020, 2030] as [number, number] },
];

const RATING_PRESETS = [
  { label: 'All Ratings', min: 0 },
  { label: '★ 7.5+ Good', min: 7.5 },
  { label: '★ 8.0+ Great', min: 8.0 },
  { label: '★ 8.5+ Masterpiece', min: 8.5 },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableGenres,
  totalMatches,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleGenre = (genre: string) => {
    const exists = filters.selectedGenres.includes(genre);
    const updated = exists
      ? filters.selectedGenres.filter((g) => g !== genre)
      : [...filters.selectedGenres, genre];
    onFilterChange({ ...filters, selectedGenres: updated });
  };

  const clearGenres = () => {
    onFilterChange({ ...filters, selectedGenres: [] });
  };

  const setSortBy = (sortBy: FilterState['sortBy']) => {
    onFilterChange({ ...filters, sortBy });
  };

  const setStatus = (status: FilterState['statusFilter']) => {
    onFilterChange({ ...filters, statusFilter: status });
  };

  const setCollection = (col: FilterState['collectionFilter']) => {
    onFilterChange({ ...filters, collectionFilter: col });
  };

  const resetAllFilters = () => {
    onFilterChange({
      search: '',
      selectedGenres: [],
      yearRange: [1950, 2030],
      minRating: 0,
      sortBy: 'recommended',
      statusFilter: 'all',
      collectionFilter: 'all',
    });
  };

  const hasActiveFilters =
    filters.selectedGenres.length > 0 ||
    filters.minRating > 0 ||
    filters.yearRange[0] > 1950 ||
    filters.yearRange[1] < 2030 ||
    (filters.statusFilter && filters.statusFilter !== 'all') ||
    (filters.collectionFilter && filters.collectionFilter !== 'all') ||
    Boolean(filters.search);

  return (
    <div className="w-full bg-[#0d1424] border border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 space-y-4 shadow-md">
      {/* 1. Quick Category Buttons & Status View */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Films' },
            { id: 'bollywood', label: '🇮🇳 Bollywood' },
            { id: 'viral', label: '🔥 Viral Hits' },
            { id: 'limited_hollywood', label: '🎬 Hollywood' },
          ].map((col) => {
            const isSelected = (filters.collectionFilter || 'all') === col.id;
            return (
              <button
                key={col.id}
                onClick={() => setCollection(col.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {col.label}
              </button>
            );
          })}
        </div>

        {/* Sort & Count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => setSortBy(e.target.value as FilterState['sortBy'])}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="recommended">Best Matches For You</option>
              <option value="rating">Highest Rated First</option>
              <option value="popularity">Most Popular</option>
              <option value="newest">Newest Releases</option>
              <option value="title">Alphabetical (A - Z)</option>
            </select>
          </div>

          <div className="text-xs font-mono text-slate-400 border-l border-slate-800 pl-3">
            <span className="text-white font-bold">{totalMatches}</span> movies
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 hover:text-white hover:bg-rose-950/40 rounded-md border border-rose-900/40 transition-colors cursor-pointer"
              title="Reset all filters to default"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Genre Chips */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-medium text-slate-300">Filter by Genre:</span>
          {filters.selectedGenres.length > 0 && (
            <button
              onClick={clearGenres}
              className="text-xs text-indigo-400 hover:underline cursor-pointer"
            >
              Clear genres ({filters.selectedGenres.length})
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={clearGenres}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filters.selectedGenres.length === 0
                ? 'bg-slate-700 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Genres
          </button>

          {availableGenres.map((genre) => {
            const isSelected = filters.selectedGenres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
                <span>{genre}</span>
              </button>
            );
          })}

          {/* Toggle More Filters */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`ml-auto px-3 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showAdvanced || filters.minRating > 0 || filters.yearRange[0] > 1950
                ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Hide Era & Rating' : 'More Filters (Era & Rating)'}</span>
          </button>
        </div>
      </div>

      {/* 3. Collapsible Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
          {/* Release Era */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Release Era:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ERA_PRESETS.map((era) => {
                const isActive =
                  filters.yearRange[0] === era.range[0] && filters.yearRange[1] === era.range[1];
                return (
                  <button
                    key={era.label}
                    onClick={() => onFilterChange({ ...filters, yearRange: era.range })}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-slate-700 text-white font-medium border border-slate-600'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {era.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating threshold */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Minimum Rating:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {RATING_PRESETS.map((rate) => {
                const isActive = filters.minRating === rate.min;
                return (
                  <button
                    key={rate.label}
                    onClick={() => onFilterChange({ ...filters, minRating: rate.min })}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {rate.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
