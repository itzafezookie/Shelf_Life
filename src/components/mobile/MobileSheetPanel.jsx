import React, { useState } from 'react';
import { 
  Play, Pause, Square, BookOpen, Plus, Check, Search, 
  ChevronLeft, ChevronRight, ArrowUpRight, Sliders, Calendar, Flame
} from 'lucide-react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useUIStore } from '../../stores/useUIStore';
import { bookService } from '../../services/bookService';
import { analyticsEngine } from '../../services/analyticsEngine';
import confetti from 'canvas-confetti';

/**
 * Mobile-First Cozy Light Sheet Panel
 * Docks at the bottom on mobile (leaving the 3D diorama visible above)
 * and floats on the left on desktop. 100% Cozy Light Theme.
 */
export function MobileSheetPanel({ 
  books = [], 
  currentBook, 
  sessions = [], 
  baselineWPM = 250, 
  etaText = '',
  sceneManager
}) {
  const { 
    activeTab, 
    openBookDetail, 
    setAddBookOpen, 
    openFinishSession,
    setSpeedOverrideOpen,
    librarySearchQuery,
    setLibrarySearchQuery,
    libraryFilter,
    setLibraryFilter
  } = useUIStore();

  const { status, formattedTime, start, pause, resume, stop } = useSessionStore();
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState(currentBook?.current_page || 0);

  const isReading = status === 'reading';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  const total = currentBook?.pages_total || 0;
  const current = currentBook?.current_page || 0;
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const pacePPM = analyticsEngine.calculateAveragePacePPM(sessions, baselineWPM);
  const eta = currentBook ? analyticsEngine.calculateBookETA(currentBook, pacePPM) : { formattedDuration: '' };

  const currentIndex = books.findIndex(b => b.id === currentBook?.id);
  const displayIndex = currentIndex !== -1 ? currentIndex + 1 : 1;
  const totalCount = Math.max(1, books.length);

  const handleStart = () => { if (currentBook) start(currentBook); };
  const handlePause = () => pause();
  const handleResume = () => resume();
  const handleStop = () => {
    const summary = stop();
    if (summary) openFinishSession(summary);
  };

  const handleIncrementPage = async () => {
    if (!currentBook || (total > 0 && current >= total)) return;
    const next = current + 1;
    await bookService.updateBook(currentBook.id, { current_page: next });
    if (next === total) {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    }
  };

  const handleSavePage = async (e) => {
    e.preventDefault();
    if (!currentBook) return;
    const newPage = Math.max(0, Math.min(total || 99999, parseInt(pageInput, 10) || 0));
    await bookService.updateBook(currentBook.id, { current_page: newPage });
    setIsEditingPage(false);
  };

  const filteredBooks = books.filter((b) => {
    const matchesSearch = !librarySearchQuery || 
      b.title.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
      (b.author && b.author.toLowerCase().includes(librarySearchQuery.toLowerCase()));
    const matchesFilter = libraryFilter === 'all' || b.status === libraryFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <aside className="fixed bottom-14 sm:bottom-6 left-0 right-0 sm:left-6 sm:right-auto sm:top-20 z-20 pointer-events-auto sm:w-96">
      {/* Cozy Light Card / Bottom Sheet */}
      <div className="bg-white/95 backdrop-blur-xl border-t sm:border border-[#eae3d8] rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-5 text-stone-900 max-h-[44vh] sm:max-h-[calc(100vh-7.5rem)] overflow-y-auto">
        
        {/* ================= TAB 1: READING NOOK ================= */}
        {activeTab === 'current' && (
          <div className="space-y-3.5">
            {/* Header: Title & Inspect */}
            <div className="flex items-center justify-between border-b border-[#eae3d8] pb-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Current Focus
                  </span>
                  {etaText && (
                    <span className="text-[11px] text-stone-500 font-mono">
                      {etaText} left
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold font-editorial text-stone-900 truncate">
                  {currentBook ? currentBook.title : 'No Book Selected'}
                </h2>
                <p className="text-xs text-stone-500 truncate">
                  {currentBook?.author || 'Select a book from your library'}
                </p>
              </div>

              {currentBook && (
                <button
                  onClick={() => openBookDetail(currentBook.id)}
                  className="btn-cozy btn-cozy-secondary py-1 px-2.5 text-xs font-semibold shrink-0 cursor-pointer"
                  title="Inspect Volume Details"
                >
                  <BookOpen className="w-3.5 h-3.5 text-stone-600" />
                  <ArrowUpRight className="w-3 h-3 text-stone-400" />
                </button>
              )}
            </div>

            {/* Reading Timer & Actions */}
            <div className="flex items-center justify-between gap-3 bg-[#fbf9f6] p-3 rounded-2xl border border-[#ede7dd]">
              <div className="font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                {formattedTime}
              </div>

              <div className="flex items-center gap-1.5">
                {isIdle && (
                  <button
                    onClick={handleStart}
                    disabled={!currentBook}
                    className="btn-cozy btn-cozy-primary py-2 px-4 text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start Reading</span>
                  </button>
                )}

                {isReading && (
                  <>
                    <button
                      onClick={handlePause}
                      className="btn-cozy btn-cozy-secondary py-2 px-3 text-xs font-semibold cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleStop}
                      className="btn-cozy bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 py-2 px-3 text-xs font-bold cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-rose-700" />
                      <span>Finish</span>
                    </button>
                  </>
                )}

                {isPaused && (
                  <>
                    <button
                      onClick={handleResume}
                      className="btn-cozy btn-cozy-primary py-2 px-3 text-xs font-semibold cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                    </button>
                    <button
                      onClick={handleStop}
                      className="btn-cozy bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 py-2 px-3 text-xs font-bold cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-rose-700" />
                      <span>Finish</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Progress Bar & Quick Step */}
            {currentBook && (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
                  <span>Page <strong className="text-stone-900 font-mono">{current}</strong> of {total || '—'}</span>
                  <span className="text-emerald-700 font-mono font-bold">{percentage}%</span>
                </div>

                <div className="w-full h-2 cozy-progress-bg">
                  <div className="cozy-progress-fill" style={{ width: `${percentage}%` }} />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {isEditingPage ? (
                    <form onSubmit={handleSavePage} className="flex items-center gap-1.5 w-full">
                      <input
                        type="number"
                        min="0"
                        max={total || 99999}
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs font-mono rounded-lg bg-white border border-[#eae3d8] text-stone-900"
                        autoFocus
                      />
                      <button type="submit" className="btn-cozy btn-cozy-primary py-1 px-2.5 text-xs font-bold">
                        <Check className="w-3 h-3" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <button
                        onClick={() => { setPageInput(current); setIsEditingPage(true); }}
                        className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 cursor-pointer"
                      >
                        Edit page…
                      </button>
                      <button
                        onClick={handleIncrementPage}
                        className="btn-cozy btn-cozy-secondary py-1 px-2.5 text-[11px] font-bold cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-stone-600" />
                        <span>+1 Page</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: LIBRARY SHELVES ================= */}
        {activeTab === 'library' && (
          <div className="space-y-3">
            {/* Shelf Volume Navigation Bar */}
            <div className="flex items-center justify-between gap-2 bg-[#fbf9f6] p-2 rounded-2xl border border-[#ede7dd]">
              <button
                onClick={() => sceneManager?.previousVolume()}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 hover:bg-[#ede7dd] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center min-w-0 flex-1 px-1 cursor-pointer" onClick={() => currentBook && openBookDetail(currentBook.id)}>
                <span className="text-[10px] font-mono font-bold text-amber-800 uppercase block">
                  Volume {String(displayIndex).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}
                </span>
                <span className="text-xs font-bold font-editorial text-stone-900 truncate block">
                  {currentBook ? currentBook.title : 'Select Volume'}
                </span>
              </div>

              <button
                onClick={() => sceneManager?.nextVolume()}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 hover:bg-[#ede7dd] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => currentBook && openBookDetail(currentBook.id)}
                className="btn-cozy btn-cozy-primary py-1 px-2.5 text-xs font-semibold rounded-full shrink-0 cursor-pointer"
              >
                <span>Inspect</span>
              </button>
            </div>

            {/* Search & Add */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search books…"
                  value={librarySearchQuery}
                  onChange={(e) => setLibrarySearchQuery(e.target.value)}
                  className="w-full bg-[#fbf9f6] border border-[#ede7dd] rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              <button
                onClick={() => setAddBookOpen(true)}
                className="btn-cozy btn-cozy-primary py-1.5 px-3 text-xs font-bold shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Quick List */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {filteredBooks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => openBookDetail(b.id)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                    b.id === currentBook?.id
                      ? 'bg-amber-50/70 border-amber-300 font-bold text-amber-950'
                      : 'bg-white border-[#ede7dd] hover:bg-[#fbf9f6] text-stone-800'
                  }`}
                >
                  <span className="truncate pr-2">{b.title}</span>
                  <span className="text-[10px] font-mono text-stone-500 shrink-0">
                    {b.pages_total ? `${Math.round(((b.current_page || 0) / b.pages_total) * 100)}%` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: INSIGHTS ================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#eae3d8] pb-2">
              <span className="text-xs font-bold font-editorial text-stone-900">
                Reading Analytics
              </span>
              <button
                onClick={() => setSpeedOverrideOpen(true)}
                className="btn-cozy btn-cozy-secondary py-1 px-2.5 text-[11px] font-semibold cursor-pointer"
              >
                <Sliders className="w-3 h-3 text-stone-600" />
                <span>Pace</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="cozy-stat-box p-2.5">
                <span className="text-[10px] text-stone-500 uppercase font-mono block">Finished</span>
                <span className="text-base font-bold font-mono text-stone-900">
                  {books.filter(b => b.status === 'completed').length} volumes
                </span>
              </div>
              <div className="cozy-stat-box p-2.5">
                <span className="text-[10px] text-stone-500 uppercase font-mono block">Pages Read</span>
                <span className="text-base font-bold font-mono text-stone-900">
                  {sessions.reduce((acc, s) => acc + (s.pages_read || 0), 0)} p
                </span>
              </div>
            </div>

            <div className="cozy-stat-box p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">Calculated Reading Pace</span>
                <span className="font-mono text-stone-900 font-bold">{pacePPM} p/min</span>
              </div>
              <p className="text-[10px] text-stone-500">
                Estimated reading time is calibrated to {baselineWPM} words/min.
              </p>
            </div>
          </div>
        )}

        {/* ================= TAB 4: ARCHIVE ================= */}
        {activeTab === 'history' && (
          <div className="space-y-2.5">
            <div className="border-b border-[#eae3d8] pb-2">
              <span className="text-xs font-bold font-editorial text-stone-900">
                Reading Sessions ({sessions.length})
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {sessions.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-4">No reading sessions recorded yet.</p>
              ) : (
                sessions.map((s) => {
                  const book = books.find(b => b.id === s.book_id);
                  const durationMins = Math.round((s.duration_seconds || 0) / 60);
                  return (
                    <div key={s.id} className="p-2 rounded-xl bg-[#fbf9f6] border border-[#ede7dd] text-xs">
                      <div className="flex items-center justify-between font-bold text-stone-900 mb-0.5">
                        <span className="truncate pr-2">{book ? book.title : 'Reading Session'}</span>
                        <span className="text-emerald-700 font-mono shrink-0">+{s.pages_read || 0} p</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
                        <span>{new Date(s.created_at).toLocaleDateString()}</span>
                        <span>{durationMins}m read</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
