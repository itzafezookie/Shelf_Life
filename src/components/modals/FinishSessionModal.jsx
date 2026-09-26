import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { sessionService } from '../../services/sessionService';
import confetti from 'canvas-confetti';

export function FinishSessionModal({ palette, isDark }) {
  const { isFinishSessionOpen, pendingSessionSummary, closeFinishSession, openCompletedCard } = useUIStore();
  const [endPage, setEndPage] = useState('');
  const [excludeFromPace, setExcludeFromPace] = useState(false);

  const primaryColor = palette?.primary || '#0284c7';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  useEffect(() => {
    if (pendingSessionSummary) {
      setEndPage(pendingSessionSummary.startPage || '');
      setExcludeFromPace(false);
    }
  }, [pendingSessionSummary]);

  if (!isFinishSessionOpen || !pendingSessionSummary) return null;

  const { book, startTime, endTime, durationSeconds, startPage } = pendingSessionSummary;
  const durationMins = Math.max(1, Math.round(durationSeconds / 60));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalEndPage = Math.max(startPage, parseInt(endPage, 10) || startPage);

    await sessionService.logCompletedSession({
      bookId: book ? book.id : null,
      startTime,
      endTime,
      durationSeconds,
      startPage,
      endPage: finalEndPage,
      excludeFromPace
    });

    closeFinishSession();

    if (book && book.pages_total && finalEndPage >= book.pages_total) {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => {
        openCompletedCard(book);
      }, 400);
    }
  };

  const pagesReadPreview = Math.max(0, (parseInt(endPage, 10) || startPage) - startPage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-colors duration-300 ${
          isDark
            ? 'bg-[#15141b] border-white/10 text-[#f5f5f4]'
            : 'bg-white border-[#eae3d8] text-[#292524]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-white/10 bg-[#1c1a24]' : 'border-[#eae3d8] bg-[#fbf9f6]'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold font-editorial">Session Complete</h3>
          </div>
          <button
            onClick={closeFinishSession}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-stone-400 hover:text-white hover:bg-white/10'
                : 'text-stone-400 hover:text-stone-700 hover:bg-[#ede7dd]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#1c1a24] border-white/10' : 'bg-[#fbf9f6] border-[#ede7dd]'
            }`}
          >
            <div className="min-w-0">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                Book
              </span>
              <h4 className="text-sm font-bold font-editorial truncate">
                {book ? book.title : 'General Reading'}
              </h4>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                Duration
              </span>
              <div
                className="text-sm font-bold font-mono flex items-center gap-1 justify-end"
                style={{ color: primaryColor }}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{durationMins}m</span>
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
              Ending Page (Started at p. {startPage})
            </label>
            <input
              type="number"
              min={startPage}
              max={book?.pages_total || 99999}
              required
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl font-mono text-lg font-bold text-center focus:outline-none ${
                isDark
                  ? 'bg-[#201e29] border border-white/20 text-white'
                  : 'bg-white border border-[#0284c7] text-stone-900'
              }`}
              style={{ borderColor: primaryColor }}
              autoFocus
            />
            <p className={`text-[11px] mt-1 text-center ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              🎉 <strong>{pagesReadPreview} pages</strong> read during this session.
            </p>
          </div>

          <label
            className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
              isDark
                ? 'bg-[#1c1a24] border-white/10 hover:bg-[#22202c]'
                : 'bg-[#fbf9f6] border-[#ede7dd] hover:bg-[#f7f3ec]'
            }`}
          >
            <input
              type="checkbox"
              checked={excludeFromPace}
              onChange={(e) => setExcludeFromPace(e.target.checked)}
              className="mt-0.5 rounded border-stone-400 cursor-pointer"
              style={{ accentColor: primaryColor }}
            />
            <div className="text-xs">
              <span className={`font-semibold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                Exclude from pace calculations
              </span>
              <p className={`text-[11px] mt-0.5 leading-snug ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Check this if you skimmed or were paused frequently during this read.
              </p>
            </div>
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={closeFinishSession}
              className={`flex-1 py-2 text-xs rounded-xl font-semibold transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#22202c] text-stone-300 hover:bg-[#2c2938] border border-white/10'
                  : 'btn-cozy btn-cozy-secondary'
              }`}
            >
              Discard
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              style={{
                backgroundColor: primaryColor,
                color: textOnPrimary,
                boxShadow: isDark ? `0 4px 16px ${primaryColor}40` : undefined
              }}
            >
              Log to Journal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
