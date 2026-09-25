import React, { useState } from 'react';
import { 
  BookOpen, Plus, Check, Search, ChevronDown, ChevronUp, 
  BarChart2, History, Library, Sparkles, Sliders, Calendar, Flame
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { bookService } from '../../services/bookService';
import { analyticsEngine } from '../../services/analyticsEngine';
import confetti from 'canvas-confetti';

/**
 * Side-Docked Control Panel (Look-Ahead Architecture)
 * Floats on the left, keeping the center 3D diorama completely unobstructed.
 */
export function LeftDockPanel({ 
  books = [], 
  currentBook, 
  sessions = [], 
  baselineWPM = 250, 
  etaText = '' 
}) {
  const { 
    activeTab, 
    openBookDetail, 
    setAddBookOpen, 
    setSpeedOverrideOpen,
    librarySearchQuery,
    setLibrarySearchQuery,
    libraryFilter,
    setLibraryFilter
  } = useUIStore();

  const [isMobileCollapsed, setIsMobileCollapsed] = useState(false);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState(currentBook?.current_page || 0);

  const total = currentBook?.pages_total || 0;
  const current = currentBook?.current_page || 0;
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const pacePPM = analyticsEngine.calculateAveragePacePPM(sessions, baselineWPM);
  const eta = currentBook ? analyticsEngine.calculateBookETA(currentBook, pacePPM) : { formattedDuration: '' };

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

  // Filtered books for library tab
  const filteredBooks = books.filter((b) => {
    const matchesSearch = !librarySearchQuery || 
      b.title.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
      (b.author && b.author.toLowerCase().includes(librarySearchQuery.toLowerCase()));
    const matchesFilter = libraryFilter === 'all' || b.status === libraryFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <aside className="fixed left-3 sm:left-6 top-16 sm:top-20 z-20 pointer-events-auto">
      {/* Mobile Toggle Handle */}
      <div className="sm:hidden mb-2">
        <button
          onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}
          className="bg-stone-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-stone-800 text-[11px] font-semibold text-stone-300 flex items-center gap-1.5 shadow-md"
        >
          <span>{isMobileCollapsed ? '▲ Show Controls' : '▼ Hide Controls'}</span>
          {isMobileCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Frosted Panel */}
      <div className={`w-[calc(100vw-1.5rem)] max-w-[340px] sm:w-88 md:w-96 max-h-[calc(100vh-10rem)] sm:max-h-[calc(100vh-7.5rem)] overflow-y-auto rounded-3xl bg-stone-950/80 backdrop-blur-2xl border border-stone-800/80 shadow-2xl p-4 sm:p-5 text-stone-200 transition-all duration-300 ${
        isMobileCollapsed ? 'hidden sm:block' : 'block'
      }`}>
        {/* ================= TAB 1: CURRENT READ ================= */}
        {activeTab === 'current' && (
          <div className="space-y-4">
            {/* Header Tag */}
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Active Read
                </span>
              </div>
              <button
                onClick={() => currentBook && openBookDetail(currentBook.id)}
                className="text-[11px] font-semibold text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Inspect</span>
                <span className="text-xs">↗</span>
              </button>
            </div>

            {currentBook ? (
              <>
                {/* Book Header */}
                <div>
                  <h2 className="text-lg font-bold font-editorial text-white leading-snug line-clamp-2">
                    {currentBook.title}
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">{currentBook.author || 'Unknown Author'}</p>
                </div>

                {/* Progress Card */}
                <div className="bg-stone-900/80 rounded-2xl p-3.5 border border-stone-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">Progress</span>
                    <span className="text-emerald-400 font-mono font-bold">{percentage}%</span>
                  </div>

                  <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-400 font-mono pt-0.5">
                    <span>Page {current} / {total || '—'}</span>
                    <span>{eta.formattedDuration || 'Calculating…'}</span>
                  </div>

                  {/* Inline Step Form */}
                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-stone-800/60">
                    {isEditingPage ? (
                      <form onSubmit={handleSavePage} className="flex items-center gap-1.5 w-full">
                        <input
                          type="number"
                          value={pageInput}
                          onChange={(e) => setPageInput(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs font-mono rounded-lg bg-stone-800 border border-stone-700 text-white"
                          autoFocus
                        />
                        <button type="submit" className="bg-emerald-600 text-white p-1 rounded-lg">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <button
                          onClick={() => { setPageInput(current); setIsEditingPage(true); }}
                          className="text-[11px] text-stone-400 hover:text-white cursor-pointer"
                        >
                          Edit page…
                        </button>
                        <button
                          onClick={handleIncrementPage}
                          className="bg-stone-800 hover:bg-stone-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-stone-400" />
                          <span>+1 Page</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Reading Pace Stats */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-stone-900/60 p-2.5 rounded-xl border border-stone-800">
                    <div className="text-[10px] uppercase text-stone-500 font-mono">Pace</div>
                    <div className="text-sm font-bold font-mono text-white mt-0.5">{pacePPM} p/min</div>
                  </div>
                  <div className="bg-stone-900/60 p-2.5 rounded-xl border border-stone-800">
                    <div className="text-[10px] uppercase text-stone-500 font-mono">Daily Target</div>
                    <div className="text-sm font-bold font-mono text-white mt-0.5">{eta.dailyTarget ? `${eta.dailyTarget} p/d` : 'Self-paced'}</div>
                  </div>
                </div>

                {/* Notes Snippet */}
                {currentBook.notes && (
                  <div className="bg-stone-900/50 p-3 rounded-xl border border-stone-800/80 text-xs italic text-stone-300 font-editorial">
                    "{currentBook.notes}"
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-stone-400 mb-3">No active book selected.</p>
                <button
                  onClick={() => setAddBookOpen(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  + Add Book
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: LIBRARY CATALOG ================= */}
        {activeTab === 'library' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                Shelf Catalog ({books.length})
              </span>
              <button
                onClick={() => setAddBookOpen(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
              <input
                type="text"
                placeholder="Search volumes…"
                value={librarySearchQuery}
                onChange={(e) => setLibrarySearchQuery(e.target.value)}
                className="w-full bg-stone-900/80 border border-stone-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {['all', 'reading', 'to-read', 'completed'].map((f) => (
                <button
                  key={f}
                  onClick={() => setLibraryFilter(f)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg capitalize transition-colors whitespace-nowrap cursor-pointer ${
                    libraryFilter === f ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-stone-900 text-stone-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Volume List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredBooks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => openBookDetail(b.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                    b.id === currentBook?.id
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-stone-900/60 border-stone-800/80 hover:bg-stone-900'
                  }`}
                >
                  <div className="w-7 h-10 bg-stone-800 rounded shrink-0 overflow-hidden">
                    <img
                      src={b.cover_url || './default-cover-small.svg'}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = './default-cover-small.svg'; }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">{b.title}</h4>
                    <p className="text-[10px] text-stone-400 truncate">{b.author || 'Unknown'}</p>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400">
                    {b.pages_total ? `${Math.round(((b.current_page || 0) / b.pages_total) * 100)}%` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: STATS & INSIGHTS ================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Reading Insights
              </span>
              <button
                onClick={() => setSpeedOverrideOpen(true)}
                className="text-[11px] text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                <span>Pace</span>
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase block font-mono">Volumes Read</span>
                <span className="text-xl font-bold font-mono text-white">
                  {books.filter(b => b.status === 'completed').length}
                </span>
              </div>
              <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase block font-mono">Pages Logged</span>
                <span className="text-xl font-bold font-mono text-white">
                  {sessions.reduce((acc, s) => acc + (s.pages_read || 0), 0)}
                </span>
              </div>
            </div>

            <div className="bg-stone-900/80 p-3.5 rounded-xl border border-stone-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Average Reading Pace</span>
                <span className="font-mono text-white font-bold">{pacePPM} p/min</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Calibrated to {baselineWPM} words/min baseline.
              </p>
            </div>
          </div>
        )}

        {/* ================= TAB 4: READING HISTORY ================= */}
        {activeTab === 'history' && (
          <div className="space-y-3.5">
            <div className="border-b border-stone-800/80 pb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                Reading Log ({sessions.length})
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {sessions.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-6">No reading sessions recorded yet.</p>
              ) : (
                sessions.map((s) => {
                  const book = books.find(b => b.id === s.book_id);
                  const durationMins = Math.round((s.duration_seconds || 0) / 60);
                  return (
                    <div key={s.id} className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 text-xs">
                      <div className="flex items-center justify-between font-bold text-white mb-0.5">
                        <span className="truncate pr-2">{book ? book.title : 'Reading Session'}</span>
                        <span className="text-emerald-400 font-mono shrink-0">+{s.pages_read || 0} p</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
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
