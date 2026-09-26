import React from 'react';
import { AlertCircle, Clock, Gauge, Calendar, Target, Calculator, Sparkles } from 'lucide-react';
import { analyticsEngine } from '../../services/analyticsEngine';
import { useUIStore } from '../../stores/useUIStore';

export function PaceStatsCard({ book, sessions, baselineWPM = 250, palette }) {
  const { openPageScanner, setSpeedOverrideOpen } = useUIStore();
  if (!book) return null;

  const isDark = Boolean(palette?.isDark);
  const primaryColor = palette?.primary || '#0284c7';
  const secondaryColor = palette?.secondary || '#ec4899';
  const tertiaryColor = palette?.tertiary || '#06b6d4';

  const bookDensity = book.words_per_page || 250;
  const isCalibrated = Boolean(book.words_per_page && book.words_per_page !== 250);
  const pacePPM = analyticsEngine.calculateAveragePacePPM(sessions, baselineWPM, bookDensity);
  const wpm = analyticsEngine.calculateWPM(pacePPM, bookDensity);
  const eta = analyticsEngine.calculateBookETA(book, pacePPM);

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Warm Literary Due Date Warning Card */}
      {eta.risk === 'at-risk' && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium flex items-start gap-3 shadow-2xs transition-colors duration-500 ${
            isDark
              ? 'bg-amber-950/40 border border-amber-800/60 text-amber-200'
              : 'bg-amber-50/90 border border-amber-200/90 text-amber-900'
          }`}
          style={isDark ? { borderColor: `${secondaryColor}60` } : undefined}
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: secondaryColor }} />
          <div className="leading-relaxed">
            <span className="font-bold">Due Date Notice:</span> At your current reading pace, this book may finish after your target due date ({book.due_date}). Reading <strong style={{ color: primaryColor }}>{eta.dailyTarget} pages a day</strong> will comfortably keep you on track.
          </div>
        </div>
      )}

      {eta.risk === 'overdue' && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium flex items-start gap-3 shadow-2xs transition-colors duration-500 ${
            isDark
              ? 'bg-rose-950/40 border border-rose-800/60 text-rose-200'
              : 'bg-rose-50/90 border border-rose-200 text-rose-900'
          }`}
        >
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Overdue Deadline:</span> This book was due on {book.due_date}. You have {eta.remainingPages} pages left to finish.
          </div>
        </div>
      )}

      {/* 4 Stat Boxes Infused with Top 3 Cover Colors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Box 1: Pace (Primary Color) */}
        <div
          onClick={() => setSpeedOverrideOpen(true)}
          title="Click to calibrate reading pace or take reading speed test"
          className={`p-3.5 text-center rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer hover:scale-[1.02] ${
            isDark ? 'bg-[#17161c]' : 'cozy-stat-box'
          }`}
          style={
            isDark
              ? {
                  borderColor: `${primaryColor}45`,
                  boxShadow: `0 6px 20px -2px ${primaryColor}20`
                }
              : undefined
          }
        >
          <div
            className="w-7 h-1 mx-auto mb-2 rounded-full transition-colors"
            style={{ backgroundColor: primaryColor }}
          />
          <div className={`flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-1 ${
            isDark ? 'text-stone-300' : 'text-stone-600'
          }`}>
            <Gauge className="w-3.5 h-3.5 transition-colors duration-500" style={{ color: primaryColor }} />
            <span>Pace</span>
          </div>
          <div className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-stone-900'}`}>
            {pacePPM} <span className="text-xs font-normal font-sans" style={{ color: primaryColor }}>p/min</span>
          </div>
          <div className={`text-[11px] mt-0.5 font-mono ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            ≈ {wpm} wpm
          </div>
        </div>

        {/* Box 2: Time Left (Secondary Color) */}
        <div
          className={`p-3.5 text-center rounded-2xl border transition-all duration-500 relative overflow-hidden ${
            isDark ? 'bg-[#17161c]' : 'cozy-stat-box'
          }`}
          style={
            isDark
              ? {
                  borderColor: `${secondaryColor}45`,
                  boxShadow: `0 6px 20px -2px ${secondaryColor}20`
                }
              : undefined
          }
        >
          <div
            className="w-7 h-1 mx-auto mb-2 rounded-full transition-colors"
            style={{ backgroundColor: secondaryColor }}
          />
          <div className={`flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-1 ${
            isDark ? 'text-stone-300' : 'text-stone-600'
          }`}>
            <Clock className="w-3.5 h-3.5 transition-colors duration-500" style={{ color: secondaryColor }} />
            <span>Time Left</span>
          </div>
          <div className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-stone-900'}`}>
            {eta.formattedDuration}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {eta.remainingPages} pages to go
          </div>
        </div>

        {/* Box 3: Est. Finish (Tertiary Color) */}
        <div
          className={`p-3.5 text-center rounded-2xl border transition-all duration-500 relative overflow-hidden ${
            isDark ? 'bg-[#17161c]' : 'cozy-stat-box'
          }`}
          style={
            isDark
              ? {
                  borderColor: `${tertiaryColor}45`,
                  boxShadow: `0 6px 20px -2px ${tertiaryColor}20`
                }
              : undefined
          }
        >
          <div
            className="w-7 h-1 mx-auto mb-2 rounded-full transition-colors"
            style={{ backgroundColor: tertiaryColor }}
          />
          <div className={`flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-1 ${
            isDark ? 'text-stone-300' : 'text-stone-600'
          }`}>
            <Calendar className="w-3.5 h-3.5 transition-colors duration-500" style={{ color: tertiaryColor }} />
            <span>Est. Finish</span>
          </div>
          <div className={`text-sm sm:text-base font-bold truncate mt-0.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
            {eta.estimatedFinishDate || '—'}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {book.due_date ? `Due ${book.due_date}` : 'Assuming 30m/day'}
          </div>
        </div>

        {/* Box 4: Daily Goal (Gradient Primary -> Secondary) */}
        <div
          className={`p-3.5 text-center rounded-2xl border transition-all duration-500 relative overflow-hidden ${
            isDark ? 'bg-[#17161c]' : 'cozy-stat-box'
          }`}
          style={
            isDark
              ? {
                  borderColor: `${primaryColor}40`,
                  boxShadow: `0 6px 20px -2px ${primaryColor}20`
                }
              : undefined
          }
        >
          <div
            className="w-7 h-1 mx-auto mb-2 rounded-full transition-colors"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
          />
          <div className={`flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-1 ${
            isDark ? 'text-stone-300' : 'text-stone-600'
          }`}>
            <Target className="w-3.5 h-3.5 transition-colors duration-500" style={{ color: primaryColor }} />
            <span>Daily Goal</span>
          </div>
          <div className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-stone-900'}`}>
            {eta.dailyTarget ? `${eta.dailyTarget}` : '—'}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {eta.dailyTarget ? 'pages / day' : 'Self-paced'}
          </div>
        </div>
      </div>

      {/* Book Typography & Density Bar */}
      <div
        className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
          isDark ? 'bg-[#15141b]/80 border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[11px] font-mono truncate ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Density: <strong className={isDark ? 'text-white' : 'text-stone-900'}>{bookDensity}</strong> words/p
            {isCalibrated ? (
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                Calibrated
              </span>
            ) : (
              <span className="ml-1.5 text-[10px] text-stone-400 font-sans">(Default)</span>
            )}
          </span>
          <span className="text-stone-400/50 hidden sm:inline">•</span>
          <span className={`text-[11px] truncate hidden sm:inline ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            ≈ {eta.estimatedTotalWords ? eta.estimatedTotalWords.toLocaleString() : '—'} words total
          </span>
        </div>

        <button
          type="button"
          onClick={() => openPageScanner(book)}
          className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            isDark
              ? 'bg-[#201e29] hover:bg-[#2c2937] text-stone-200 border border-white/10'
              : 'bg-white hover:bg-stone-50 text-stone-700 border border-[#eae3d8] shadow-2xs'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" style={{ color: primaryColor }} />
          <span>Density Calculator</span>
        </button>
      </div>
    </div>
  );
}
