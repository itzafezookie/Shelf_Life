import React, { useMemo } from 'react';
import { Search, Plus, BookOpen } from 'lucide-react';
import { BookCard } from './BookCard';
import { useUIStore } from '../../stores/useUIStore';

/**
 * Chronological Library History
 * Displays your reading history chronologically with your active read at the top.
 */
export function BookList({ books = [], currentFocusBookId, palette, isDark }) {
  const {
    libraryFilter,
    setLibraryFilter,
    librarySearchQuery,
    setLibrarySearchQuery,
    selectedGenreFilter,
    setSelectedGenreFilter,
    setAddBookOpen
  } = useUIStore();

  const primaryColor = palette?.primary || '#0284c7';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  const availableGenres = useMemo(() => {
    const set = new Set();
    (books || []).forEach((b) => {
      (b.genres || []).forEach((g) => set.add(g));
    });
    return Array.from(set);
  }, [books]);

  // Filtered & Chronologically Sorted (Active book pinned at the top)
  const sortedBooks = useMemo(() => {
    const list = (books || []).filter((b) => {
      if (libraryFilter !== 'all' && b.status !== libraryFilter) return false;
      if (selectedGenreFilter && (!b.genres || !b.genres.includes(selectedGenreFilter))) return false;
      if (librarySearchQuery.trim()) {
        const query = librarySearchQuery.toLowerCase();
        const titleMatch = (b.title || '').toLowerCase().includes(query);
        const authorMatch = (b.author || '').toLowerCase().includes(query);
        if (!titleMatch && !authorMatch) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      // Active book always at the top
      if (a.id === currentFocusBookId) return -1;
      if (b.id === currentFocusBookId) return 1;

      // Active status 'reading' next
      if (a.status === 'reading' && b.status !== 'reading') return -1;
      if (b.status === 'reading' && a.status !== 'reading') return 1;

      // Chronological by updated/created date descending
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [books, currentFocusBookId, libraryFilter, selectedGenreFilter, librarySearchQuery]);

  const filterButtons = [
    { id: 'all', label: 'All Books' },
    { id: 'reading', label: 'Reading' },
    { id: 'completed', label: 'Completed' }
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar & Add Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
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

        <button
          onClick={() => setAddBookOpen(true)}
          className="btn-cozy py-2 px-4 text-xs font-bold shadow-xs shrink-0 cursor-pointer transition-all"
          style={{ backgroundColor: primaryColor, color: textOnPrimary }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Book</span>
        </button>
      </div>

      {/* Filter Tabs & Genre Tags */}
      <div className={`flex flex-wrap items-center justify-between gap-2.5 border-b pb-3 transition-colors ${
        isDark ? 'border-white/10' : 'border-[#eae3d8]'
      }`}>
        {/* Status Filter Buttons */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border overflow-x-auto transition-colors ${
          isDark ? 'bg-[#1a1822] border-white/10' : 'bg-[#ede7dd]/70 border-[#e2d9cd]'
        }`}>
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setLibraryFilter(btn.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
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

        {/* Genre Tags Strip */}
        {availableGenres.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {selectedGenreFilter && (
              <button
                onClick={() => setSelectedGenreFilter(null)}
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 cursor-pointer"
              >
                Clear: {selectedGenreFilter} ✕
              </button>
            )}
            {availableGenres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenreFilter(selectedGenreFilter === g ? null : g)}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                  selectedGenreFilter === g
                    ? 'font-bold'
                    : isDark
                    ? 'bg-[#22202a] text-stone-300 border-white/10 hover:bg-white/10'
                    : 'cozy-tag hover:bg-[#e7ded2]'
                }`}
                style={
                  selectedGenreFilter === g
                    ? { backgroundColor: primaryColor, color: textOnPrimary, borderColor: primaryColor }
                    : undefined
                }
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chronological Book List */}
      {sortedBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedBooks.map((b) => (
            <BookCard
              key={b.id}
              book={b}
              isCurrentFocus={b.id === currentFocusBookId}
              palette={palette}
              isDark={isDark}
            />
          ))}
        </div>
      ) : (
        <div className="cozy-card p-10 text-center my-6 max-w-md mx-auto">
          <BookOpen className="w-10 h-10 text-stone-400 mx-auto mb-2" />
          <h3 className="text-base font-bold font-editorial text-stone-800">No Books Found</h3>
          <p className="text-xs text-stone-500 mt-1 mb-4 leading-relaxed">
            {books?.length === 0
              ? 'Your library is empty. Click "+ Add Book" to begin building your reading history.'
              : 'No books match the chosen filter or search term.'}
          </p>
          <button
            onClick={() => setAddBookOpen(true)}
            className="btn-cozy btn-cozy-primary text-xs"
          >
            Add a Book
          </button>
        </div>
      )}
    </div>
  );
}
