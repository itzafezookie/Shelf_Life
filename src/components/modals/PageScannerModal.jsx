import React, { useState, useEffect } from 'react';
import { X, Calculator, Check, BookOpen, Hash, AlignLeft, Layers, Sparkles } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { bookService } from '../../services/bookService';
import confetti from 'canvas-confetti';

export function PageScannerModal({ palette, isDark }) {
  const { isPageScannerOpen, pageScannerBook, pageScannerCallback, closePageScanner } = useUIStore();

  // Manual entry fields
  const [linesPerPage, setLinesPerPage] = useState('35');
  const [wordsLine1, setWordsLine1] = useState('10');
  const [wordsLine2, setWordsLine2] = useState('10');
  const [wordsLine3, setWordsLine3] = useState('10');

  const primaryColor = palette?.primary || '#0284c7';
  const secondaryColor = palette?.secondary || '#ec4899';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  // Standard presets
  const PRESETS = [
    { label: 'Mass-Market Paperback', sub: 'Dense layout, tight margins', words: 380, lines: 38, avgWords: 10 },
    { label: 'Trade Paperback', sub: 'Standard fiction & nonfiction', words: 300, lines: 33, avgWords: 9 },
    { label: 'Hardcover Novel', sub: 'Generous margins & spacing', words: 250, lines: 28, avgWords: 9 },
    { label: 'Large Print / YA', sub: 'Large typography & spacing', words: 200, lines: 25, avgWords: 8 }
  ];

  // Initialize values when modal opens
  useEffect(() => {
    if (isPageScannerOpen) {
      const existingDensity = pageScannerBook?.words_per_page || 250;
      // Default to standard 33 lines and derive words
      const defaultLines = 33;
      const defaultAvg = Math.max(5, Math.round(existingDensity / defaultLines));
      setLinesPerPage(String(defaultLines));
      setWordsLine1(String(defaultAvg));
      setWordsLine2(String(defaultAvg));
      setWordsLine3(String(defaultAvg));
    }
  }, [isPageScannerOpen, pageScannerBook]);

  if (!isPageScannerOpen) return null;

  // Calculation math
  const numLines = Math.max(1, parseInt(linesPerPage, 10) || 0);
  const w1 = Math.max(0, parseInt(wordsLine1, 10) || 0);
  const w2 = Math.max(0, parseInt(wordsLine2, 10) || 0);
  const w3 = Math.max(0, parseInt(wordsLine3, 10) || 0);

  const avgWordsPerLine = (w1 + w2 + w3) / 3;
  const estimatedWordsPerPage = Math.max(50, Math.min(1000, Math.round(avgWordsPerLine * numLines)));
  const totalPages = pageScannerBook?.pages_total || 0;
  const totalBookWordsEstimate = totalPages > 0 ? Math.round(estimatedWordsPerPage * totalPages) : null;

  // Handle Preset selection
  const handleApplyPreset = (preset) => {
    setLinesPerPage(String(preset.lines));
    setWordsLine1(String(preset.avgWords));
    setWordsLine2(String(preset.avgWords));
    setWordsLine3(String(preset.avgWords));
  };

  // Save / Apply handler
  const handleApplyEstimate = async () => {
    if (pageScannerCallback) {
      pageScannerCallback(estimatedWordsPerPage);
    } else if (pageScannerBook?.id) {
      await bookService.updateBook(pageScannerBook.id, {
        words_per_page: estimatedWordsPerPage
      });
    }

    confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    closePageScanner();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="page-scanner-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
          isDark ? 'bg-[#14121d] border-white/10 text-white' : 'bg-white border-[#eae3d8] text-stone-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-[#eae3d8]'}`}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            >
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 id="page-scanner-title" className="text-sm font-bold font-editorial">
                Page Density & Word Estimator
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {pageScannerBook?.title ? `For "${pageScannerBook.title}"` : 'Calculate accurate words per page'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closePageScanner}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              isDark ? 'border-white/10 hover:bg-white/10 text-stone-400' : 'border-stone-200 hover:bg-stone-100 text-stone-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Instructions banner */}
          <div
            className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-[11px] leading-relaxed ${
              isDark ? 'bg-amber-950/20 border-amber-500/30 text-amber-200/90' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Count total lines on any full page of text, then count words in 3 typical lines.
            </span>
          </div>

          {/* Manual Entry Form */}
          <div className="space-y-3">
            {/* Field 1: Total Lines */}
            <div>
              <label className={`block text-[11px] font-bold mb-1 flex items-center gap-1.5 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                <AlignLeft className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                <span>Number of lines on full page:</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="80"
                  value={linesPerPage}
                  onChange={(e) => setLinesPerPage(e.target.value)}
                  className={`w-full p-2.5 rounded-xl font-mono text-sm font-bold border focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#1c1a26] border-white/10 text-white focus:border-amber-400/50'
                      : 'bg-[#faf8f4] border-[#eae3d8] text-stone-900 focus:border-[#0284c7]'
                  }`}
                  placeholder="e.g. 34"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-stone-400 font-sans">lines</span>
              </div>
            </div>

            {/* Fields 2, 3, 4: Word counts on lines 1, 2, 3 */}
            <div className="space-y-2 pt-1">
              <span className={`block text-xs font-bold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                Sample 3 typical lines (word count):
              </span>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Line 1 words:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={wordsLine1}
                    onChange={(e) => setWordsLine1(e.target.value)}
                    className={`w-full p-2.5 rounded-xl font-mono text-sm font-bold text-center border focus:outline-none ${
                      isDark
                        ? 'bg-[#1c1a26] border-white/10 text-white focus:border-amber-400/50'
                        : 'bg-[#faf8f4] border-[#eae3d8] text-stone-900 focus:border-[#0284c7]'
                    }`}
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Line 2 words:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={wordsLine2}
                    onChange={(e) => setWordsLine2(e.target.value)}
                    className={`w-full p-2.5 rounded-xl font-mono text-sm font-bold text-center border focus:outline-none ${
                      isDark
                        ? 'bg-[#1c1a26] border-white/10 text-white focus:border-amber-400/50'
                        : 'bg-[#faf8f4] border-[#eae3d8] text-stone-900 focus:border-[#0284c7]'
                    }`}
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Line 3 words:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={wordsLine3}
                    onChange={(e) => setWordsLine3(e.target.value)}
                    className={`w-full p-2.5 rounded-xl font-mono text-sm font-bold text-center border focus:outline-none ${
                      isDark
                        ? 'bg-[#1c1a26] border-white/10 text-white focus:border-amber-400/50'
                        : 'bg-[#faf8f4] border-[#eae3d8] text-stone-900 focus:border-[#0284c7]'
                    }`}
                    placeholder="10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Calculation Results Card */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#1c1a26] border-white/10' : 'bg-[#faf8f4] border-[#eae3d8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Calculated Estimate
              </span>
              <span className="text-[11px] font-mono text-stone-400">
                Avg: {avgWordsPerLine.toFixed(1)} words/line
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-stone-200'}`}>
                <span className={`block text-[9px] font-bold uppercase ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Page Density
                </span>
                <span className="font-mono text-xl font-bold block mt-0.5" style={{ color: primaryColor }}>
                  {estimatedWordsPerPage}
                </span>
                <span className={`text-[9px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  words / page
                </span>
              </div>

              <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-stone-200'}`}>
                <span className={`block text-[9px] font-bold uppercase ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  {totalPages > 0 ? `Total Words (${totalPages}p)` : 'Total Book Words'}
                </span>
                <span className="font-mono text-xl font-bold block mt-0.5" style={{ color: secondaryColor }}>
                  {totalBookWordsEstimate ? totalBookWordsEstimate.toLocaleString() : '—'}
                </span>
                <span className={`text-[9px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  {totalPages > 0 ? 'calculated book length' : 'set pages to see total'}
                </span>
              </div>
            </div>

            {/* Formula explanation */}
            <div className={`text-[10px] font-mono text-center pt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              ({w1} + {w2} + {w3}) ÷ 3 = {avgWordsPerLine.toFixed(1)} w/line × {numLines} lines = <strong>{estimatedWordsPerPage} words/page</strong>
            </div>
          </div>

          {/* Quick Preset Shortcuts */}
          <div className="space-y-1.5">
            <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Or choose standard book preset:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => {
                const isSelected = estimatedWordsPerPage === p.words;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-amber-950/30 border-amber-500/50 shadow-xs'
                          : 'bg-amber-50 border-amber-300 shadow-xs'
                        : isDark
                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                        : 'bg-white border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold block">{p.label}</span>
                      <span className="text-[10px] font-mono font-bold" style={{ color: primaryColor }}>
                        {p.words} w/p
                      </span>
                    </div>
                    <span className={`text-[9px] block mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      {p.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-end gap-2.5 ${isDark ? 'border-white/10' : 'border-[#eae3d8]'}`}>
          <button
            type="button"
            onClick={closePageScanner}
            className={`py-2 px-4 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              isDark
                ? 'bg-[#22202c] text-stone-300 hover:bg-[#2c2938] border border-white/10'
                : 'btn-cozy btn-cozy-secondary'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyEstimate}
            className="py-2 px-5 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            style={{
              backgroundColor: primaryColor,
              color: textOnPrimary,
              boxShadow: isDark ? `0 4px 16px ${primaryColor}40` : undefined
            }}
          >
            <Check className="w-4 h-4" />
            <span>Apply {estimatedWordsPerPage} Words / Page</span>
          </button>
        </div>
      </div>
    </div>
  );
}
