import React, { useState } from 'react';
import { X, Search, Book, Loader2, ArrowLeft, PlayCircle, Sparkles, Check, Globe, Calculator, Sliders } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { bookService } from '../../services/bookService';
import confetti from 'canvas-confetti';

export function AddBookModal({ palette, isDark }) {
  const { isAddBookOpen, setAddBookOpen, setActiveTab, openPageScanner } = useUIStore();
  const [step, setStep] = useState('search'); // 'search' | 'configure'

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);

  const primaryColor = palette?.primary || '#0284c7';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  const [configForm, setConfigForm] = useState({
    title: '',
    author: '',
    pages_total: 300,
    current_page: 0,
    words_per_page: 250,
    genres: '',
    due_date: '',
    cover_url: '',
    theme_mode: 'auto'
  });

  if (!isAddBookOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await bookService.searchOpenLibrary(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError('No matching books found on Open Library. You can still enter details manually below.');
      }
    } catch (err) {
      setSearchError('Failed to search Open Library. Check your internet connection or enter manually.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (bookResult) => {
    setConfigForm({
      title: bookResult.title || '',
      author: bookResult.author || '',
      pages_total: bookResult.pages_total || 300,
      current_page: 0,
      words_per_page: 250,
      genres: Array.isArray(bookResult.genres) ? bookResult.genres.join(', ') : 'Fiction',
      due_date: '',
      cover_url: bookResult.cover_url || '',
      theme_mode: 'auto'
    });
    setStep('configure');
  };

  const handleStartManual = () => {
    setConfigForm({
      title: searchQuery.trim() || '',
      author: '',
      pages_total: 300,
      current_page: 0,
      words_per_page: 250,
      genres: 'Fiction',
      due_date: '',
      cover_url: '',
      theme_mode: 'auto'
    });
    setStep('configure');
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!configForm.title.trim()) return;

    const parsedGenres = configForm.genres
      ? configForm.genres.split(',').map((g) => g.trim()).filter(Boolean)
      : ['General'];

    const newBook = await bookService.addBook({
      title: configForm.title.trim(),
      author: configForm.author.trim() || 'Unknown Author',
      pages_total: parseInt(configForm.pages_total, 10) || 0,
      current_page: parseInt(configForm.current_page, 10) || 0,
      words_per_page: parseInt(configForm.words_per_page, 10) || 250,
      genres: parsedGenres,
      due_date: configForm.due_date || '',
      cover_url: configForm.cover_url.trim() || '',
      theme_mode: configForm.theme_mode || 'auto',
      status: 'reading',
      setAsActiveFocus: true
    });

    // Celebratory confetti feedback
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });

    // Close modal and navigate immediately to the active reading page
    setAddBookOpen(false);
    setActiveTab('current');
    resetState();
  };

  const resetState = () => {
    setStep('search');
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setConfigForm({
      title: '',
      author: '',
      pages_total: 300,
      current_page: 0,
      genres: '',
      due_date: '',
      cover_url: '',
      theme_mode: 'auto'
    });
  };

  const inputClass = isDark
    ? 'w-full px-3 py-2 rounded-xl bg-[#201e29] border border-white/10 text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-white/20'
    : 'w-full px-3 py-2 rounded-xl bg-white border border-[#eae3d8] text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#0284c7]';

  const labelClass = `block text-xs font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-stone-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors duration-300 ${
          isDark
            ? 'bg-[#15141b] border-white/10 text-[#f5f5f4]'
            : 'bg-white border-[#eae3d8] text-[#292524]'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-white/10 bg-[#1c1a24]' : 'border-[#eae3d8] bg-[#fbf9f6]'
          }`}
        >
          <div className="flex items-center gap-2">
            {step === 'configure' ? (
              <button
                type="button"
                onClick={() => setStep('search')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer mr-1 ${
                  isDark ? 'hover:bg-white/10 text-stone-300' : 'hover:bg-[#ede7dd] text-stone-600'
                }`}
                title="Back to search"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <Book className="w-5 h-5" style={{ color: primaryColor }} />
            )}
            <div>
              <h3 className="text-base font-bold font-editorial">
                {step === 'search' ? 'Search for a Book' : 'Configure Book & Start Reading'}
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {step === 'search'
                  ? 'Find your next title or enter details manually'
                  : 'Confirm pages and details to set as your active book'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setAddBookOpen(false);
              resetState();
            }}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-stone-400 hover:text-white hover:bg-white/10'
                : 'text-stone-400 hover:text-stone-700 hover:bg-[#ede7dd]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {step === 'search' ? (
            <div className="space-y-4">
              {/* Search input form */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search by title, author, or ISBN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${inputClass} pl-9`}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                  style={{
                    backgroundColor: primaryColor,
                    color: textOnPrimary,
                    boxShadow: isDark ? `0 2px 10px ${primaryColor}40` : undefined
                  }}
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </form>

              {/* Manual Entry Fallback Button */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>
                  Can't find your specific edition?
                </span>
                <button
                  type="button"
                  onClick={handleStartManual}
                  className="font-semibold underline cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ color: primaryColor }}
                >
                  Enter details manually →
                </button>
              </div>

              {searchError && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    isDark
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {searchError}
                </div>
              )}

              {/* Search Results List */}
              <div className="space-y-2.5">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectBook(item)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all gap-3 cursor-pointer group ${
                      isDark
                        ? 'bg-[#1b1924] border-white/10 hover:border-white/30 hover:bg-[#211f2d]'
                        : 'bg-[#fbf9f6] border-[#eae3d8] hover:border-stone-400 hover:bg-[#f7f3ec]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-12 h-16 rounded-lg shrink-0 overflow-hidden border flex items-center justify-center ${
                          isDark ? 'bg-[#282633] border-white/10' : 'bg-stone-200 border-stone-300'
                        }`}
                      >
                        <img
                          src={item.cover_url || './default-cover-small.svg'}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.target.src = './default-cover-small.svg';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold font-editorial truncate">{item.title}</h4>
                        <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                          {item.author || 'Unknown Author'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[11px] font-mono ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                            {item.pages_total ? `${item.pages_total} pages` : 'Pages unknown'}
                          </span>
                          {item.genres && item.genres.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {item.genres.map((g) => (
                                <span
                                  key={g}
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                    isDark
                                      ? 'bg-white/10 text-stone-300 border border-white/10'
                                      : 'bg-stone-200/70 text-stone-700 border border-stone-300/80'
                                  }`}
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectBook(item);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl shrink-0 inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer group-hover:scale-102"
                      style={{
                        backgroundColor: primaryColor,
                        color: textOnPrimary
                      }}
                    >
                      <span>Select</span>
                      <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* STEP 2: CONFIGURE BOOK DETAILS */
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              {/* Selected Book Preview Card */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center gap-3.5 ${
                  isDark ? 'bg-[#1b1924] border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'
                }`}
              >
                <div
                  className={`w-12 h-16 rounded-lg shrink-0 overflow-hidden border flex items-center justify-center ${
                    isDark ? 'bg-[#282633] border-white/10' : 'bg-stone-200 border-stone-300'
                  }`}
                >
                  <img
                    src={configForm.cover_url || './default-cover-small.svg'}
                    alt={configForm.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = './default-cover-small.svg';
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-emerald-500">
                    <Sparkles className="w-3 h-3" />
                    <span>Ready to activate</span>
                  </div>
                  <h4 className="text-sm font-bold font-editorial truncate">{configForm.title || 'Untitled'}</h4>
                  <p className={`text-xs truncate ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    {configForm.author || 'Unknown Author'}
                  </p>
                </div>
              </div>

              {/* Title & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Book Title *</label>
                  <input
                    type="text"
                    required
                    value={configForm.title}
                    onChange={(e) => setConfigForm({ ...configForm, title: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Author</label>
                  <input
                    type="text"
                    value={configForm.author}
                    onChange={(e) => setConfigForm({ ...configForm, author: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Page Configuration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Total Pages *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={configForm.pages_total}
                    onChange={(e) => setConfigForm({ ...configForm, pages_total: e.target.value })}
                    className={`${inputClass} font-mono font-bold`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Starting / Current Page</label>
                  <input
                    type="number"
                    min="0"
                    max={configForm.pages_total || 99999}
                    value={configForm.current_page}
                    onChange={(e) => setConfigForm({ ...configForm, current_page: e.target.value })}
                    className={`${inputClass} font-mono font-bold`}
                  />
                </div>
              </div>

              {/* Typography Density & OCR Calibration */}
              <div
                className={`p-3.5 rounded-xl border space-y-2 ${
                  isDark ? 'bg-[#1c1a24] border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    <span className="text-xs font-semibold">Density Calibration</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openPageScanner({ ...configForm }, (density) =>
                        setConfigForm((prev) => ({ ...prev, words_per_page: density }))
                      )
                    }
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-[#201e29] hover:bg-[#2c2937] text-white border-white/15'
                        : 'bg-white hover:bg-stone-50 text-stone-800 border-[#eae3d8] shadow-2xs'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    <span>Density Calculator</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-28">
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      value={configForm.words_per_page}
                      onChange={(e) => setConfigForm({ ...configForm, words_per_page: e.target.value })}
                      className={`${inputClass} font-mono text-center font-bold`}
                    />
                  </div>
                  <div className="text-xs">
                    <span className="font-medium text-stone-400">words / page</span>
                    <span className={`block text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      ≈ {Math.round((parseInt(configForm.words_per_page, 10) || 250) * (parseInt(configForm.pages_total, 10) || 0)).toLocaleString()} total words
                    </span>
                  </div>
                </div>
              </div>

              {/* Genres & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Genres (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sci-Fi, Fantasy"
                    value={configForm.genres}
                    onChange={(e) => setConfigForm({ ...configForm, genres: e.target.value })}
                    className={inputClass}
                  />
                  {/* Quick Genre Suggestion Chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Fantasy', 'Sci-Fi', 'LitRPG', 'Mystery', 'Thriller', 'Horror', 'Romance', 'Biography', 'Self-Help'].map(
                      (g) => {
                        const isSelected = configForm.genres
                          .split(',')
                          .map((x) => x.trim().toLowerCase())
                          .includes(g.toLowerCase());
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              const existing = configForm.genres
                                .split(',')
                                .map((x) => x.trim())
                                .filter(Boolean);
                              if (isSelected) {
                                setConfigForm({
                                  ...configForm,
                                  genres: existing.filter((x) => x.toLowerCase() !== g.toLowerCase()).join(', ')
                                });
                              } else {
                                setConfigForm({
                                  ...configForm,
                                  genres: [...existing, g].join(', ')
                                });
                              }
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-white font-bold'
                                : isDark
                                ? 'bg-white/10 text-stone-400 hover:text-white hover:bg-white/15'
                                : 'bg-stone-200/60 text-stone-700 hover:bg-stone-300'
                            }`}
                          >
                            {isSelected ? `✓ ${g}` : `+ ${g}`}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Due Date (Optional)</label>
                  <input
                    type="date"
                    value={configForm.due_date}
                    onChange={(e) => setConfigForm({ ...configForm, due_date: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Cover URL */}
              <div>
                <label className={labelClass}>Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://covers.openlibrary.org/..."
                  value={configForm.cover_url}
                  onChange={(e) => setConfigForm({ ...configForm, cover_url: e.target.value })}
                  className={inputClass}
                />
              </div>

              {/* Theme Styling Preference */}
              <div>
                <label className={labelClass}>Cover Theme Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfigForm({ ...configForm, theme_mode: 'auto' })}
                    className={`py-1.5 px-2 text-xs rounded-xl border font-medium text-center transition-all cursor-pointer ${
                      configForm.theme_mode === 'auto'
                        ? isDark
                          ? 'bg-white/15 border-white/20 text-white font-bold'
                          : 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                        : isDark
                        ? 'bg-[#201e29] border-white/10 text-stone-400 hover:text-white'
                        : 'bg-white border-[#eae3d8] text-stone-700 hover:bg-[#ede7dd]'
                    }`}
                  >
                    Auto Detect
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfigForm({ ...configForm, theme_mode: 'dark' })}
                    className={`py-1.5 px-2 text-xs rounded-xl border font-medium text-center transition-all cursor-pointer ${
                      configForm.theme_mode === 'dark'
                        ? 'bg-stone-900 border-amber-400 text-amber-400 font-bold'
                        : isDark
                        ? 'bg-[#201e29] border-white/10 text-stone-400 hover:text-white'
                        : 'bg-white border-[#eae3d8] text-stone-700 hover:bg-[#ede7dd]'
                    }`}
                  >
                    Punchy Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfigForm({ ...configForm, theme_mode: 'light' })}
                    className={`py-1.5 px-2 text-xs rounded-xl border font-medium text-center transition-all cursor-pointer ${
                      configForm.theme_mode === 'light'
                        ? 'bg-amber-100 border-amber-600 text-amber-900 font-bold'
                        : isDark
                        ? 'bg-[#201e29] border-white/10 text-stone-400 hover:text-white'
                        : 'bg-white border-[#eae3d8] text-stone-700 hover:bg-[#ede7dd]'
                    }`}
                  >
                    Cozy Light
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('search')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isDark
                      ? 'bg-[#22202c] text-stone-300 hover:bg-[#2c2938] border border-white/10'
                      : 'btn-cozy btn-cozy-secondary'
                  }`}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition-all shadow-lg inline-flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: primaryColor,
                    color: textOnPrimary,
                    boxShadow: isDark ? `0 4px 20px ${primaryColor}50` : undefined
                  }}
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Start Reading This Book</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
