import React, { useState, useEffect } from 'react';
import {
  X,
  Book,
  Trash2,
  PlayCircle,
  Star,
  AlertTriangle,
  Camera,
  Sliders,
  Clock,
  Gauge,
  Calendar,
  History,
  Pencil,
  ArrowLeft,
  CheckCircle2,
  Bookmark,
  MessageSquare
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { bookService } from '../../services/bookService';
import { sessionService } from '../../services/sessionService';
import { analyticsEngine } from '../../services/analyticsEngine';
import confetti from 'canvas-confetti';

export function BookDetailModal({
  books,
  sessions = [],
  baselineWPM = 250,
  currentFocusBookId,
  palette,
  isDark
}) {
  const { isDetailModalOpen, selectedBookId, closeBookDetail, openPageScanner } = useUIStore();
  const book = (books || []).find((b) => b.id === selectedBookId);

  // View state: 'overview' (default dossier & history) | 'edit' (settings form)
  const [viewMode, setViewMode] = useState('overview');

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editPage, setEditPage] = useState(0);
  const [editTotal, setEditTotal] = useState(0);
  const [editWordsPerPage, setEditWordsPerPage] = useState(250);
  const [editDueDate, setEditDueDate] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [editThemeMode, setEditThemeMode] = useState('auto');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState(null);

  const primaryColor = palette?.primary || '#0284c7';
  const secondaryColor = palette?.secondary || '#ec4899';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  useEffect(() => {
    if (book) {
      setViewMode('overview');
      setEditTitle(book.title || '');
      setEditAuthor(book.author || '');
      setEditPage(book.current_page || 0);
      setEditTotal(book.pages_total || 0);
      setEditWordsPerPage(book.words_per_page || 250);
      setEditDueDate(book.due_date || '');
      setEditRating(book.rating || 0);
      setEditNotes(book.notes || '');
      setEditThemeMode(book.theme_mode || 'auto');
      setIsConfirmingDelete(false);
      setDeletingSessionId(null);
    }
  }, [book, isDetailModalOpen]);

  if (!isDetailModalOpen || !book) return null;

  const isCurrentFocus = book.id === currentFocusBookId;
  const isCompleted = book.status === 'completed' || (book.pages_total > 0 && book.current_page >= book.pages_total);

  // Filter sessions logged for this specific book (newest first)
  const bookSessions = (sessions || [])
    .filter((s) => s.book_id === book.id)
    .sort((a, b) => new Date(b.created_at || b.start_time) - new Date(a.created_at || a.start_time));

  // Calculated stats for this book
  const totalSeconds = bookSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMins = Math.round((totalSeconds % 3600) / 60);
  const formattedReadingTime = totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`;

  const totalPagesReadInSessions = bookSessions.reduce((acc, s) => acc + (s.pages_read || 0), 0);
  const bookDensity = book.words_per_page || 250;
  const bookPacePPM = analyticsEngine.calculateAveragePacePPM(bookSessions, baselineWPM, bookDensity);
  const bookWPM = analyticsEngine.calculateWPM(bookPacePPM, bookDensity);

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatSessionTime = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Quick rating update
  const handleRatingChange = async (newRating) => {
    const finalRating = newRating === book.rating ? 0 : newRating;
    setEditRating(finalRating);
    await bookService.updateBook(book.id, { rating: finalRating || null });
    if (finalRating === 5) {
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
    }
  };

  // Save changes from Edit mode
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const newPage = Math.max(0, parseInt(editPage, 10) || 0);
    const newTotal = Math.max(0, parseInt(editTotal, 10) || 0);
    const wasCompleted = book.status === 'completed';
    const isNowCompleted = newPage >= newTotal && newTotal > 0;

    await bookService.updateBook(book.id, {
      title: editTitle.trim() || book.title,
      author: editAuthor.trim() || book.author,
      current_page: newPage,
      pages_total: newTotal,
      words_per_page: Math.max(50, Math.min(1000, parseInt(editWordsPerPage, 10) || 250)),
      due_date: editDueDate,
      rating: editRating || null,
      notes: editNotes,
      theme_mode: editThemeMode
    });

    if (!wasCompleted && isNowCompleted) {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
    }

    setViewMode('overview');
  };

  const handleSetFocus = async () => {
    await bookService.setCurrentFocusBook(book.id);
    closeBookDetail();
  };

  const handleConfirmDelete = async () => {
    await bookService.deleteBook(book.id);
    setIsConfirmingDelete(false);
    closeBookDetail();
  };

  const handleToggleExcludeSession = async (sessionId, currentVal) => {
    await sessionService.toggleExcludeFromPace(sessionId, !currentVal);
  };

  const handleDeleteSession = async (sessionId) => {
    await sessionService.deleteSession(sessionId);
    setDeletingSessionId(null);
  };

  const percentage =
    book.pages_total > 0
      ? Math.min(100, Math.round(((book.current_page || 0) / book.pages_total) * 100))
      : 0;

  const inputClass = isDark
    ? 'w-full px-3 py-1.5 rounded-xl bg-[#201e29] border border-white/10 text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-white/20'
    : 'w-full px-3 py-1.5 rounded-xl bg-white border border-[#eae3d8] text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#0284c7]';

  const labelClass = `block text-xs font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-stone-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-colors duration-300 ${
          isDark
            ? 'bg-[#15141b] border-white/10 text-[#f5f5f4]'
            : 'bg-white border-[#eae3d8] text-[#292524]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
            isDark ? 'border-white/10 bg-[#1c1a24]' : 'border-[#eae3d8] bg-[#fbf9f6]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {viewMode === 'edit' ? (
              <button
                type="button"
                onClick={() => setViewMode('overview')}
                className={`p-1 rounded-lg transition-colors cursor-pointer mr-1 ${
                  isDark ? 'hover:bg-white/10 text-stone-300' : 'hover:bg-stone-200 text-stone-700'
                }`}
                title="Back to Overview"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <Book className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
            )}
            <h3 className="text-sm sm:text-base font-bold font-editorial truncate">
              {viewMode === 'edit' ? `Edit "${book.title}"` : book.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {viewMode === 'overview' ? (
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
                    : 'bg-white border-[#eae3d8] text-stone-700 hover:bg-stone-50 shadow-2xs'
                }`}
                title="Edit book details or page length"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Details</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('overview')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isDark ? 'border-white/10 text-stone-400 hover:text-white' : 'border-stone-300 text-stone-600'
                }`}
              >
                Cancel
              </button>
            )}

            <button
              onClick={closeBookDetail}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-stone-400 hover:text-white hover:bg-white/10'
                  : 'text-stone-400 hover:text-stone-700 hover:bg-[#ede7dd]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: OVERVIEW, RATING, CALCULATED STATS & SESSIONS     */}
        {/* ========================================================= */}
        {viewMode === 'overview' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Hero Banner: Cover, Title, Status & Interactive Rating */}
            <div className="flex gap-4 items-start">
              <div
                className={`w-20 h-28 sm:w-24 sm:h-34 rounded-2xl shrink-0 overflow-hidden border shadow-md flex items-center justify-center ${
                  isDark ? 'bg-[#201e29] border-white/15' : 'bg-stone-100 border-[#eae3d8]'
                }`}
                style={{ borderColor: `${primaryColor}40` }}
              >
                <img
                  src={book.cover_url || './default-cover-large.svg'}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = './default-cover-large.svg';
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {isCompleted ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Completed
                    </span>
                  ) : (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                        borderColor: `${primaryColor}30`
                      }}
                    >
                      {book.status === 'reading' ? 'Reading' : 'To Read'}
                    </span>
                  )}

                  {isCurrentFocus && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      ★ Active Focus
                    </span>
                  )}
                </div>

                <h4 className="text-lg sm:text-xl font-bold leading-tight font-editorial">
                  {book.title}
                </h4>
                <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  {book.author || 'Unknown Author'}
                </p>

                {/* Rating Stars Section */}
                <div className="mt-3 pt-2 border-t border-dashed border-stone-200 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-semibold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      Rating:
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(star)}
                          className="p-0.5 text-stone-400 hover:text-amber-400 cursor-pointer transition-transform hover:scale-115"
                          title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= (book.rating || 0)
                                ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                                : 'text-stone-400/40'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {book.rating ? (
                      <span className="text-xs font-bold font-mono text-amber-500 ml-1">
                        {book.rating}.0
                      </span>
                    ) : (
                      <span className={`text-[10px] italic ml-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        (Click to rate)
                      </span>
                    )}
                  </div>
                </div>

                {/* Set as focus button if not currently focus */}
                {!isCurrentFocus && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleSetFocus}
                      className={`py-1 px-3 text-xs rounded-xl font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#201e28] text-stone-200 hover:bg-[#2c2937] border border-white/10'
                          : 'btn-cozy btn-cozy-secondary'
                      }`}
                    >
                      <PlayCircle className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                      <span>Make Active Book</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Calculated Book Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Stat 1: Reading Pace */}
              <div
                className={`p-3 rounded-2xl border text-center ${
                  isDark ? 'bg-[#1a1924] border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'
                }`}
              >
                <div className={`flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  <Gauge className="w-3 h-3" style={{ color: primaryColor }} />
                  <span>Pace</span>
                </div>
                <div className="text-base sm:text-lg font-bold font-mono">
                  {bookPacePPM} <span className="text-[10px] font-sans font-normal text-stone-400">p/m</span>
                </div>
                <div className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  ≈ {bookWPM} wpm
                </div>
              </div>

              {/* Stat 2: Total Time Spent */}
              <div
                className={`p-3 rounded-2xl border text-center ${
                  isDark ? 'bg-[#1a1924] border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'
                }`}
              >
                <div className={`flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  <Clock className="w-3 h-3 text-pink-500" />
                  <span>Time Read</span>
                </div>
                <div className="text-base sm:text-lg font-bold font-mono">
                  {totalSeconds > 0 ? formattedReadingTime : '—'}
                </div>
                <div className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  {bookSessions.length} session{bookSessions.length === 1 ? '' : 's'}
                </div>
              </div>

              {/* Stat 3: Pages & Completion */}
              <div
                className={`p-3 rounded-2xl border text-center ${
                  isDark ? 'bg-[#1a1924] border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'
                }`}
              >
                <div className={`flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  <Bookmark className="w-3 h-3 text-emerald-500" />
                  <span>Pages</span>
                </div>
                <div className="text-base sm:text-lg font-bold font-mono">
                  {book.current_page || 0} / {book.pages_total || '—'}
                </div>
                <div className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  {percentage}% finished
                </div>
              </div>

              {/* Stat 4: Word Density */}
              <div
                className={`p-3 rounded-2xl border text-center ${
                  isDark ? 'bg-[#1a1924] border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'
                }`}
              >
                <div className={`flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  <Sliders className="w-3 h-3 text-amber-500" />
                  <span>Density</span>
                </div>
                <div className="text-base sm:text-lg font-bold font-mono">
                  {bookDensity} <span className="text-[10px] font-sans font-normal text-stone-400">w/p</span>
                </div>
                <div className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  ≈ {Math.round(bookDensity * (book.pages_total || 0)).toLocaleString()} words
                </div>
              </div>
            </div>

            {/* Session History Log Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" style={{ color: primaryColor }} />
                  <h5 className="text-sm font-bold font-editorial">Reading Session History</h5>
                </div>
                <span className={`text-xs font-mono ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  {bookSessions.length} logged
                </span>
              </div>

              {bookSessions.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {bookSessions.map((session) => {
                    const sessionMins = Math.round((session.duration_seconds || 0) / 60);
                    const isDeleting = deletingSessionId === session.id;

                    return (
                      <div
                        key={session.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                          session.exclude_from_pace
                            ? isDark
                              ? 'bg-white/3 border-white/5 opacity-65'
                              : 'bg-stone-50 border-stone-200 opacity-75'
                            : isDark
                            ? 'bg-[#1b1925] border-white/10 hover:border-white/20'
                            : 'bg-[#faf8f4] border-[#eae3d8] hover:border-stone-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {session.pages_read ? `+${session.pages_read} pages` : 'Session'}
                            </span>
                            <span className={`font-mono text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                              (pp. {session.start_page ?? '—'} → {session.end_page ?? '—'})
                            </span>
                            {session.exclude_from_pace && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                Excluded
                              </span>
                            )}
                          </div>
                          <div className={`flex items-center gap-2 text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                            <span>{formatSessionTime(session.start_time || session.created_at)}</span>
                            <span>•</span>
                            <span className="font-mono">{sessionMins}m duration</span>
                            <span>•</span>
                            <span className="font-mono">{session.pace_ppm || 0} p/min</span>
                          </div>
                        </div>

                        {/* Session Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleExcludeSession(session.id, session.exclude_from_pace)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer border ${
                              session.exclude_from_pace
                                ? 'bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/25'
                                : isDark
                                ? 'bg-white/5 hover:bg-white/10 text-stone-400 border-white/10'
                                : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                            title={session.exclude_from_pace ? 'Include in pace' : 'Exclude from pace'}
                          >
                            {session.exclude_from_pace ? 'Include' : 'Exclude'}
                          </button>

                          {isDeleting ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteSession(session.id)}
                                className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingSessionId(null)}
                                className="px-1 py-0.5 text-[10px] text-stone-400 hover:text-white cursor-pointer"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingSessionId(session.id)}
                              className="p-1 rounded text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete session record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className={`p-4 rounded-2xl border text-center text-xs leading-relaxed ${
                    isDark ? 'bg-white/3 border-white/5 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}
                >
                  <p>No individual reading sessions logged for this title yet.</p>
                  <p className="text-[11px] mt-0.5 opacity-75">
                    Sessions logged while reading in the Reading Nook will appear here with your pace and timing.
                  </p>
                </div>
              )}
            </div>

            {/* Personal Notes Section */}
            {book.notes && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                  isDark ? 'bg-[#1c1a24] border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold font-editorial">
                  <MessageSquare className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  <span>Reader Notes & Impressions</span>
                </div>
                <p className={`leading-relaxed whitespace-pre-wrap ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                  "{book.notes}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: EDIT BOOK SETTINGS (WHEN USER TOGGLES EDIT)       */}
        {/* ========================================================= */}
        {viewMode === 'edit' && (
          <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Book Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Author</label>
                <input
                  type="text"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Progress Slider / Numbers */}
            <div
              className={`p-4 rounded-xl border space-y-2.5 ${
                isDark ? 'bg-[#1c1a24] border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>Pages & Progress</span>
                <span className="font-bold font-mono" style={{ color: primaryColor }}>
                  {editTotal > 0 ? Math.min(100, Math.round((editPage / editTotal) * 100)) : 0}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    Current Page
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={editTotal || 99999}
                    value={editPage}
                    onChange={(e) => setEditPage(e.target.value)}
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    Total Pages
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editTotal}
                    onChange={(e) => setEditTotal(e.target.value)}
                    className={`${inputClass} font-mono`}
                  />
                </div>
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
                  <span className="text-xs font-semibold">Typography Density</span>
                </div>
                <button
                  type="button"
                  onClick={() => openPageScanner(book, (density) => setEditWordsPerPage(density))}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#201e29] hover:bg-[#2c2937] text-white border-white/15'
                      : 'bg-white hover:bg-stone-50 text-stone-800 border-[#eae3d8] shadow-2xs'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  <span>Scan Page</span>
                </button>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-32">
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    value={editWordsPerPage}
                    onChange={(e) => setEditWordsPerPage(e.target.value)}
                    className={`${inputClass} font-mono text-center font-bold`}
                  />
                </div>
                <div className="text-xs">
                  <span className="font-medium text-stone-400">words / page</span>
                  <span className={`block text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    ≈ {Math.round((parseInt(editWordsPerPage, 10) || 250) * (parseInt(editTotal, 10) || 0)).toLocaleString()} total words
                  </span>
                </div>
              </div>
            </div>

            {/* Due Date & Rating */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className={`${inputClass} text-xs`}
                />
              </div>
              <div>
                <label className={labelClass}>Rating</label>
                <div className="flex items-center gap-1 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star === editRating ? 0 : star)}
                      className="p-1 text-stone-400 hover:text-amber-400 cursor-pointer transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= editRating ? 'text-amber-400 fill-amber-400' : 'text-stone-400/50'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cover Theme Styling Preference */}
            <div>
              <label className={labelClass}>Cover Theme Styling</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setEditThemeMode('auto')}
                  className={`py-1.5 px-2 text-xs rounded-xl border font-medium text-center transition-all cursor-pointer ${
                    editThemeMode === 'auto'
                      ? isDark
                        ? 'bg-white/15 border-white/20 text-white font-bold'
                        : 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                      : isDark
                      ? 'bg-[#201e29] border-white/10 text-stone-400 hover:text-white'
                      : 'bg-white border-[#eae3d8] text-stone-700 hover:bg-[#ede7dd]'
                  }`}
                  style={
                    editThemeMode === 'auto' && palette?.primary
                      ? { borderColor: palette.primary, color: isDark ? '#ffffff' : palette.primary }
                      : undefined
                  }
                >
                  Auto Detect
                </button>
                <button
                  type="button"
                  onClick={() => setEditThemeMode('dark')}
                  className={`py-1.5 px-2 text-xs rounded-xl border font-medium text-center transition-all cursor-pointer ${
                    editThemeMode === 'dark'
                      ? 'bg-stone-900 border-amber-400 text-amber-400 font-bold shadow-xs'
                      : isDark
                      ? 'bg-[#201e29] border-white/10 text-stone-400 hover:text-white'
                      : 'bg-white border-[#eae3d8] text-stone-700 hover:bg-[#ede7dd]'
                  }`}
                >
                  Punchy Dark
                </button>
                <button
                  type="button"
                  onClick={() => setEditThemeMode('light')}
                  className={`py-1.5 px-2 text-xs rounded-xl border font-medium text-center transition-all cursor-pointer ${
                    editThemeMode === 'light'
                      ? 'bg-amber-100 border-amber-600 text-amber-900 font-bold shadow-xs'
                      : isDark
                      ? 'bg-[#201e29] border-white/10 text-stone-400 hover:text-white'
                      : 'bg-white border-[#eae3d8] text-stone-700 hover:bg-[#ede7dd]'
                  }`}
                >
                  Cozy Light
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>Personal Notes</label>
              <textarea
                rows="3"
                placeholder="Key thoughts, memorable quotes, or reading notes..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className={`${inputClass} text-xs`}
              />
            </div>

            {/* Footer Buttons for Edit Form */}
            <div
              className={`flex items-center justify-between pt-3 border-t ${
                isDark ? 'border-white/10' : 'border-[#eae3d8]'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isDark
                    ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300'
                    : 'text-rose-600 hover:bg-rose-50'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Book</span>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('overview')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#22202c] text-stone-300 hover:bg-[#2c2938] border border-white/10'
                      : 'btn-cozy btn-cozy-secondary'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  style={{
                    backgroundColor: primaryColor,
                    color: textOnPrimary,
                    boxShadow: isDark ? `0 4px 16px ${primaryColor}40` : undefined
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Dedicated Styled Delete Confirmation Modal */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div
            className={`w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl transition-colors duration-300 ${
              isDark
                ? 'bg-[#181720] border-white/15 text-[#f5f5f4]'
                : 'bg-white border-[#eae3d8] text-[#292524]'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-editorial mb-1">Remove Book?</h3>
            <p className={`text-xs mb-5 leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Are you sure you want to remove <strong className={isDark ? 'text-white' : 'text-stone-800'}>"{book.title}"</strong> from your library?
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className={`flex-1 py-2 text-xs rounded-xl font-semibold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#22202c] text-stone-300 hover:bg-[#2c2938] border border-white/10'
                    : 'btn-cozy btn-cozy-secondary'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md shadow-rose-900/30 cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
