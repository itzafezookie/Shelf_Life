import React, { useState, useMemo } from 'react';
import { Search, Plus, BookOpen, SlidersHorizontal, X, Check, Filter } from 'lucide-react';
import { BookCard } from './BookCard';
import { useUIStore } from '../../stores/useUIStore';

/**
 * Chronological Library History
 * Displays your reading history chronologically with centered controls and popup filter modal.
 */
export function BookList({ books = [], palette, isDark }) {
  const {
    libraryFilter,
    setLibraryFilter,
    librarySearchQuery,
    setLibrarySearchQuery,
    selectedGenreFilter,
    setSelectedGenreFilter,
    setAddBookOpen
  } = useUIStore();

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const primaryColor = palette?.primary || '#0284c7';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  // Extract all unique genres across books
  const availableGenres = useMemo(() => {
    const set = new Set();
    (books || []).forEach((b) => {
      (b.genres || []).forEach((g) => {
        if (g && g.trim()) set.add(g.trim());
      });
    });
    return Array.from(set).sort();
  }, [books]);

  // Filtered & Chronologically Sorted
  const sortedBooks = useMemo(() => {
    const list = (books || []).filter((b) => {
      if (libraryFilter !== 'all' && b.status !== libraryFilter) return false;
      if (selectedGenreFilter && (!b.genres || !b.genres.includes(selectedGenreFilter))) return false;
      if (librarySearchQuery.trim()) {
        const query = librarySearchQuery.toLowerCase();
        const titleMatch = (b.title || '').toLowerCase().includes(query);
        const authorMatch = (b.author || '').toLowerCase().includes(query);
        const genreMatch = (b.genres || []).some((g) => g.toLowerCase().includes(query));
        if (!titleMatch && !authorMatch && !genreMatch) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      // Active status 'reading' at the top
      if (a.status === 'reading' && b.status !== 'reading') return -1;
      if (b.status === 'reading' && a.status !== 'reading') return 1;

      // Chronological by updated/created date descending
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [books, libraryFilter, selectedGenreFilter, librarySearchQuery]);

  const filterButtons = [
    { id: 'all', label: 'All Books' },
    { id: 'reading', label: 'Reading' },
    { id: 'completed', label: 'Completed' }
  ];

  const hasActiveFilters = Boolean(selectedGenreFilter || (libraryFilter !== 'all' && libraryFilter !== 'reading' && libraryFilter !== 'completed'));

  const handleClearAllFilters = () => {
    setSelectedGenreFilter(null);
    setLibraryFilter('all');
  };

  return (
    <div className="space-y-3.5">
      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search titles, authors, or genres..."
          value={librarySearchQuery}
          onChange={(e) => setLibrarySearchQuery(e.target.value)}
          className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none transition-colors shadow-2xs ${
            isDark
              ? 'bg-[#17161c] border border-white/10 text-white placeholder-stone-500 focus:border-white/30'
              : 'bg-white border border-[#eae3d8] text-stone-900 placeholder-stone-400 focus:border-[#0284c7]'
          }`}
        />
      </div>

      {/* Control Bar: In-line Add Book + Centered 3-Option Toggle + Popup Filter Button */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {/* Left: Add Book Button */}
        <button
          type="button"
          onClick={() => setAddBookOpen(true)}
          className="py-1.5 px-3 sm:px-3.5 text-xs font-bold rounded-xl shadow-xs shrink-0 cursor-pointer transition-all flex items-center gap-1.5"
          style={{ backgroundColor: primaryColor, color: textOnPrimary }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Book</span>
        </button>

        {/* Center: 3-Option Toggle */}
        <div
          className={`flex items-center gap-0.5 p-1 rounded-xl border transition-colors ${
            isDark ? 'bg-[#1a1822] border-white/10' : 'bg-[#ede7dd]/70 border-[#e2d9cd]'
          }`}
        >
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setLibraryFilter(btn.id)}
              className={`px-2.5 sm:px-3.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                libraryFilter === btn.id
                  ? isDark
                    ? 'bg-white/15 text-white font-bold border border-white/15 shadow-2xs'
                    : 'bg-white text-stone-900 shadow-2xs font-bold border border-[#ded5c7]'
                  : isDark
                  ? 'text-stone-400 hover:text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Right: Popup Filter Button */}
        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
          className={`py-1.5 px-2.5 sm:px-3 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            hasActiveFilters || selectedGenreFilter
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
              : isDark
              ? 'bg-[#1a1822] border-white/10 hover:bg-white/10 text-stone-300'
              : 'bg-white border-[#eae3d8] hover:bg-stone-50 text-stone-700 shadow-2xs'
          }`}
          title="Filter by genres and DNF status"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" style={selectedGenreFilter ? { color: primaryColor } : undefined} />
          <span className="hidden sm:inline">Filter</span>
          {selectedGenreFilter && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          )}
        </button>
      </div>

      {/* Active Filter Chip Indicator (if any active) */}
      {selectedGenreFilter && (
        <div className="flex items-center gap-2 pt-1 animate-fade-in">
          <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            Filtered by genre:
          </span>
          <button
            type="button"
            onClick={() => setSelectedGenreFilter(null)}
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 cursor-pointer hover:bg-amber-500/30 transition-colors"
          >
            <span>{selectedGenreFilter}</span>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Chronological Book List */}
      {sortedBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sortedBooks.map((b) => (
            <BookCard
              key={b.id}
              book={b}
              palette={palette}
              isDark={isDark}
            />
          ))}
        </div>
      ) : (
        <div
          className={`p-10 text-center rounded-2xl border ${
            isDark ? 'bg-[#17161c] border-white/10 text-stone-400' : 'cozy-card text-stone-500'
          }`}
        >
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <h4 className="text-base font-bold font-editorial">No books found</h4>
          <p className="text-xs mt-1 max-w-sm mx-auto">
            {librarySearchQuery || selectedGenreFilter || libraryFilter !== 'all'
              ? 'Try clearing your search query or filters to view your books.'
              : 'Add your first book to build your personal library catalog!'}
          </p>
          {(librarySearchQuery || selectedGenreFilter || libraryFilter !== 'all') && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="mt-3 px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-500/40 text-amber-400 bg-amber-500/10 cursor-pointer hover:bg-amber-500/20 transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* POPUP FILTER MODAL (COLLAPSED GENRES & EXTENDED STATUS)   */}
      {/* ========================================================= */}
      {isFilterModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div
            className={`w-full max-w-sm rounded-3xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
              isDark ? 'bg-[#15131e] border-white/10 text-white' : 'bg-white border-[#eae3d8] text-stone-900'
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-[#eae3d8]'}`}>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" style={{ color: primaryColor }} />
                <h3 className="text-sm font-bold font-editorial">Library Filters</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                  isDark ? 'border-white/10 hover:bg-white/10 text-stone-400' : 'border-stone-200 hover:bg-stone-100 text-stone-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Filter by Status (including DNF) */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  Status
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', label: 'All Books' },
                    { id: 'reading', label: 'Reading' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'dnf', label: 'Abandoned (DNF)' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setLibraryFilter(st.id)}
                      className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                        libraryFilter === st.id
                          ? isDark
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter by Genre Tags */}
              <div className="pt-2 border-t border-dashed border-stone-200/60 dark:border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    Genres ({availableGenres.length})
                  </label>
                  {selectedGenreFilter && (
                    <button
                      type="button"
                      onClick={() => setSelectedGenreFilter(null)}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                    >
                      Clear Genre
                    </button>
                  )}
                </div>

                {availableGenres.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {availableGenres.map((g) => {
                      const isSelected = selectedGenreFilter === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setSelectedGenreFilter(isSelected ? null : g)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-xs'
                              : isDark
                              ? 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <span>{g}</span>
                          {isSelected && <Check className="w-3 h-3 stroke-3" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className={`text-xs italic ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    No genres tagged on your books yet.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t flex items-center justify-between gap-2 ${isDark ? 'border-white/10' : 'border-[#eae3d8]'}`}>
              <button
                type="button"
                onClick={handleClearAllFilters}
                className={`py-1.5 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  isDark ? 'border-white/10 text-stone-400 hover:text-white' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                Reset All
              </button>

              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="py-1.5 px-4 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                style={{ backgroundColor: primaryColor, color: textOnPrimary }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
