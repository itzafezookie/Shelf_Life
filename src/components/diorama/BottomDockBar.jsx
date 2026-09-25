import React from 'react';
import { Play, Pause, Square, ChevronLeft, ChevronRight, BookOpen, ArrowUpRight } from 'lucide-react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useUIStore } from '../../stores/useUIStore';

/**
 * Sleek Minimal Floating Bottom Dock (Look-Ahead Architecture)
 * Sits at bottom center without obstructing the 3D diorama.
 */
export function BottomDockBar({ sceneManager, currentBook, books = [] }) {
  const { activeTab, openBookDetail, openFinishSession } = useUIStore();
  const { status, formattedTime, start, pause, resume, stop } = useSessionStore();

  const isReading = status === 'reading';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  const currentIndex = books.findIndex(b => b.id === currentBook?.id);
  const displayIndex = currentIndex !== -1 ? currentIndex + 1 : 1;
  const totalCount = Math.max(1, books.length);

  const formattedIndex = String(displayIndex).padStart(2, '0');
  const formattedTotal = String(totalCount).padStart(2, '0');

  const handleStart = (e) => {
    e.stopPropagation();
    if (currentBook) start(currentBook);
  };

  const handlePause = (e) => {
    e.stopPropagation();
    pause();
  };

  const handleResume = (e) => {
    e.stopPropagation();
    resume();
  };

  const handleStop = (e) => {
    e.stopPropagation();
    const summary = stop();
    if (summary) openFinishSession(summary);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (sceneManager) sceneManager.previousVolume();
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (sceneManager) sceneManager.nextVolume();
  };

  const handleInspect = (e) => {
    e.stopPropagation();
    if (currentBook) openBookDetail(currentBook.id);
  };

  return (
    <aside className="fixed bottom-16 sm:bottom-6 left-0 right-0 z-30 px-4 pointer-events-none safe-bottom">
      <div className="max-w-fit mx-auto pointer-events-auto flex items-center gap-2 bg-stone-950/85 backdrop-blur-xl px-3 py-1.5 rounded-full border border-stone-800/80 shadow-2xl text-stone-100">
        {/* Current Tab: Reading Session Controller */}
        {activeTab === 'current' && (
          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className="flex items-center gap-1.5 pl-1.5">
              <span className={`w-2 h-2 rounded-full ${isReading ? 'bg-emerald-400 animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-stone-500'}`} />
              <span className="font-mono text-sm font-bold tracking-tight text-white px-1">
                {formattedTime}
              </span>
            </div>

            {/* Action Buttons */}
            {isIdle && (
              <button
                onClick={handleStart}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-1.5 px-3.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Reading</span>
              </button>
            )}

            {isReading && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePause}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs py-1 px-2.5 rounded-full transition-colors cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleStop}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs py-1 px-3 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-white" />
                  <span>Finish</span>
                </button>
              </div>
            )}

            {isPaused && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleResume}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-1 px-2.5 rounded-full transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                </button>
                <button
                  onClick={handleStop}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs py-1 px-3 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-white" />
                  <span>Finish</span>
                </button>
              </div>
            )}

            {/* Quick Inspect */}
            <button
              onClick={handleInspect}
              title="Inspect Book"
              className="text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Library Tab: Volume Navigation */}
        {activeTab === 'library' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              title="Previous Volume"
              className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-2 text-center cursor-pointer min-w-[140px]" onClick={handleInspect}>
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                VOL. {formattedIndex} / {formattedTotal}
              </span>
              <span className="text-xs font-bold text-white truncate max-w-[160px] block">
                {currentBook ? currentBook.title : 'Select a Volume'}
              </span>
            </div>

            <button
              onClick={handleNext}
              title="Next Volume"
              className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleInspect}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs py-1 px-2.5 rounded-full flex items-center gap-1 shadow-sm transition-all cursor-pointer ml-1"
            >
              <BookOpen className="w-3 h-3" />
              <span>Inspect</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
