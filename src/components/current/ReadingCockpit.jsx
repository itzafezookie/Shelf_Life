import React, { useState } from 'react';
import { Play, Pause, Square, BookOpen, Plus, Check, ArrowUpRight } from 'lucide-react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useUIStore } from '../../stores/useUIStore';
import { bookService } from '../../services/bookService';
import confetti from 'canvas-confetti';

/**
 * Unified Reading Cockpit
 * Cohesive, single-card reading controller: Stopwatch, Page Progress, and Session Actions.
 * Eliminates duplicate timers and giant scrolling stacks.
 */
export function ReadingCockpit({ book, etaText }) {
  const { status, formattedTime, start, pause, resume, stop } = useSessionStore();
  const { openBookDetail, openFinishSession, setAddBookOpen } = useUIStore();
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState(book?.current_page || 0);

  if (!book) {
    return (
      <div className="cozy-card p-6 text-center max-w-md mx-auto backdrop-blur-xl bg-white/95 border border-[#eae3d8] shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3 text-2xl">
          📖
        </div>
        <h3 className="text-xl font-bold font-editorial text-stone-900 mb-1">
          Your Reading Nook is Waiting
        </h3>
        <p className="text-stone-500 text-xs mb-4">
          Add a book to start tracking your reading sessions with cozy focus.
        </p>
        <button
          onClick={() => setAddBookOpen(true)}
          className="btn-cozy btn-cozy-primary px-4 py-2 text-xs font-semibold shadow-xs"
        >
          Add Your First Book
        </button>
      </div>
    );
  }

  const isReading = status === 'reading';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  const total = book.pages_total || 0;
  const current = book.current_page || 0;
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const handleStart = () => start(book);
  const handlePause = () => pause();
  const handleResume = () => resume();
  const handleStop = () => {
    const summary = stop();
    if (summary) openFinishSession(summary);
  };

  const handleIncrementPage = async () => {
    if (total > 0 && current >= total) return;
    const next = current + 1;
    await bookService.updateBook(book.id, { current_page: next });
    if (next === total) {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    }
  };

  const handleSavePage = async (e) => {
    e.preventDefault();
    const newPage = Math.max(0, Math.min(total || 99999, parseInt(pageInput, 10) || 0));
    await bookService.updateBook(book.id, { current_page: newPage });
    setIsEditingPage(false);
  };

  return (
    <div className="max-w-md w-full mx-auto backdrop-blur-xl bg-white/95 rounded-3xl border border-[#eae3d8] shadow-2xl p-5 sm:p-6 space-y-4">
      {/* 1. Header: Volume Info & Inspect */}
      <div className="flex items-center justify-between gap-3 border-b border-[#eae3d8] pb-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Current Focus
            </span>
            {etaText && (
              <span className="text-[11px] text-stone-500 font-mono">
                {etaText} left
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold font-editorial text-stone-900 truncate">
            {book.title}
          </h2>
          <p className="text-xs text-stone-500 truncate">{book.author || 'Unknown Author'}</p>
        </div>

        <button
          onClick={() => openBookDetail(book.id)}
          className="btn-cozy btn-cozy-secondary py-1.5 px-2.5 text-xs font-semibold shrink-0 cursor-pointer"
          title="Inspect Volume Details"
        >
          <BookOpen className="w-3.5 h-3.5 text-stone-600" />
          <ArrowUpRight className="w-3 h-3 text-stone-400" />
        </button>
      </div>

      {/* 2. Reading Stopwatch & Primary Actions */}
      <div className="text-center py-1">
        <div className="font-mono text-4xl sm:text-5xl font-black text-stone-900 tracking-tight">
          {formattedTime}
        </div>

        <div className="text-xs font-semibold mt-1 mb-4">
          {isReading && (
            <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Focusing on your reading session…
            </span>
          )}
          {isPaused && (
            <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-full text-[11px]">
              Session paused • Taking a break
            </span>
          )}
          {isIdle && (
            <span className="text-stone-500 text-[11px]">
              Ready to sink into your next chapter
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-2.5">
          {isIdle && (
            <button
              onClick={handleStart}
              className="btn-cozy btn-cozy-primary w-full py-2.5 px-4 text-xs font-bold shadow-sm justify-center cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Reading Session</span>
            </button>
          )}

          {isReading && (
            <>
              <button
                onClick={handlePause}
                className="btn-cozy btn-cozy-secondary flex-1 py-2 px-3 text-xs font-semibold justify-center cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
              <button
                onClick={handleStop}
                className="btn-cozy bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 flex-1 py-2 px-3 text-xs font-bold justify-center cursor-pointer"
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
                className="btn-cozy btn-cozy-primary flex-1 py-2 px-3 text-xs font-semibold justify-center cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Resume</span>
              </button>
              <button
                onClick={handleStop}
                className="btn-cozy bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 flex-1 py-2 px-3 text-xs font-bold justify-center cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-rose-700" />
                <span>Finish</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. Progress Bar & Inline Page Step */}
      <div className="bg-[#fbf9f6] p-3 rounded-2xl border border-[#eae3d8] space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
          <span>Page <strong className="text-stone-900 font-mono">{current}</strong> of {total > 0 ? total : '—'}</span>
          <span className="text-emerald-700 font-mono font-bold">{percentage}%</span>
        </div>

        <div className="w-full h-2 cozy-progress-bg">
          <div className="cozy-progress-fill" style={{ width: `${percentage}%` }} />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
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
              <button
                type="submit"
                className="btn-cozy btn-cozy-primary py-1 px-2.5 text-xs font-bold"
              >
                <Check className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <>
              <button
                onClick={() => {
                  setPageInput(current);
                  setIsEditingPage(true);
                }}
                className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                Edit Page…
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
    </div>
  );
}
