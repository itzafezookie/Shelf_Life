import React from 'react';
import { ChevronLeft, ChevronRight, BookOpen, ArrowUpRight } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

/**
 * Unified Sleek Floating Editorial Shelf Dock
 * Single cohesive pill providing volume pagination and one-click inspection.
 */
export function EditorialHUD({ sceneManager, currentBook, books = [] }) {
  const { openBookDetail } = useUIStore();

  const currentIndex = books.findIndex(b => b.id === currentBook?.id);
  const displayIndex = currentIndex !== -1 ? currentIndex + 1 : 1;
  const totalCount = Math.max(1, books.length);

  const formattedIndex = String(displayIndex).padStart(2, '0');
  const formattedTotal = String(totalCount).padStart(2, '0');

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
      <div className="max-w-md mx-auto pointer-events-auto flex items-center justify-between gap-2 bg-white/95 backdrop-blur-xl px-2.5 py-1.5 rounded-full border border-[#eae3d8] shadow-xl">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          title="Previous Volume"
          className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-[#ede7dd] transition-colors cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Volume Indicator & Title */}
        <div className="min-w-0 flex-1 px-1.5 text-center cursor-pointer" onClick={handleInspect}>
          <div className="text-[10px] font-mono font-bold text-amber-800 tracking-wider uppercase">
            Volume {formattedIndex} / {formattedTotal}
          </div>
          <div className="text-xs font-bold font-editorial text-stone-900 truncate">
            {currentBook ? currentBook.title : 'Select a Volume'}
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          title="Next Volume"
          className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-[#ede7dd] transition-colors cursor-pointer shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Inspect Button */}
        <button
          onClick={handleInspect}
          className="btn-cozy btn-cozy-primary py-1 px-3 text-xs font-semibold rounded-full shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
        >
          <BookOpen className="w-3 h-3" />
          <span>Inspect</span>
          <ArrowUpRight className="w-3 h-3 opacity-70" />
        </button>
      </div>
    </aside>
  );
}
