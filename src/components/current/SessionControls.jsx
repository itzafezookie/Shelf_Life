import React from 'react';
import { Play, Pause, Square, Coffee } from 'lucide-react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useUIStore } from '../../stores/useUIStore';

export function SessionControls({ book, palette }) {
  const { status, formattedTime, start, pause, resume, stop } = useSessionStore();
  const { openFinishSession } = useUIStore();

  const isDark = Boolean(palette?.isDark);
  const primaryColor = palette?.primary || '#0284c7';
  const secondaryColor = palette?.secondary || '#ec4899';
  const tertiaryColor = palette?.tertiary || '#06b6d4';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  if (!book) return null;

  const handleStart = () => {
    start(book);
  };

  const handlePause = () => {
    pause();
  };

  const handleResume = () => {
    resume();
  };

  const handleStop = () => {
    const summary = stop();
    if (summary) {
      openFinishSession(summary);
    }
  };

  const isReading = status === 'reading';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  return (
    <div
      className={`p-6 text-center max-w-2xl mx-auto rounded-2xl border relative overflow-hidden transition-all duration-500 ${
        isDark
          ? 'bg-[#17161c] border-white/10 shadow-2xl'
          : 'cozy-card'
      }`}
      style={
        isDark && primaryColor
          ? {
              boxShadow: `0 14px 40px -6px rgba(0, 0, 0, 0.75), 0 0 24px -4px ${primaryColor}25`
            }
          : undefined
      }
    >
      {/* Top 3-Color Gradient Frame Line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-10"
        style={{
          background: `linear-gradient(90deg, ${tertiaryColor} 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`
        }}
      />

      {/* Timer Display */}
      <div className="mb-4 pt-1">
        <div
          className={`font-mono text-4xl sm:text-5xl font-extrabold tracking-tight mb-2 transition-colors duration-500 ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}
          style={isDark ? { textShadow: `0 0 24px ${primaryColor}30` } : undefined}
        >
          {formattedTime}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold">
          {isReading && (
            <span
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition-colors ${
                isDark
                  ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-800/80'
                  : 'text-emerald-800 bg-emerald-50 border border-emerald-200/80'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Focusing on your reading session...
            </span>
          )}
          {isPaused && (
            <span
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition-colors ${
                isDark
                  ? 'text-amber-300 bg-amber-950/60 border border-amber-800/80'
                  : 'text-amber-800 bg-amber-50 border border-amber-200/80'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              Taking a break • Session paused
            </span>
          )}
          {isIdle && (
            <span className={`font-medium transition-colors ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Ready to sink into your next chapter
            </span>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3">
        {isIdle && (
          <button
            onClick={handleStart}
            className="btn-cozy px-7 py-3 text-sm font-bold transition-all duration-300 transform active:scale-95"
            style={{
              backgroundColor: primaryColor,
              color: textOnPrimary,
              boxShadow: isDark
                ? `0 4px 26px ${primaryColor}75, 0 1px 3px rgba(0,0,0,0.5)`
                : `0 4px 14px ${primaryColor}40`
            }}
          >
            <Play className="w-4 h-4" style={{ fill: textOnPrimary }} />
            <span>Start Reading Session</span>
          </button>
        )}

        {isReading && (
          <>
            <button
              onClick={handlePause}
              className={`px-5 py-2.5 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all ${
                isDark
                  ? 'bg-[#282532] text-stone-200 hover:bg-[#343040] border border-white/10'
                  : 'btn-cozy btn-cozy-secondary'
              }`}
            >
              <Pause className="w-4 h-4" />
              <span>Pause Break</span>
            </button>
            <button
              onClick={handleStop}
              className={`px-5 py-2.5 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all ${
                isDark
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/50'
                  : 'btn-cozy bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Square className="w-4 h-4 fill-rose-700" />
              <span>Finish Session</span>
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={handleResume}
              className="btn-cozy px-6 py-2.5 text-xs font-semibold transition-all duration-300"
              style={{
                backgroundColor: primaryColor,
                color: textOnPrimary,
                boxShadow: isDark
                  ? `0 4px 24px ${primaryColor}70`
                  : `0 4px 14px ${primaryColor}40`
              }}
            >
              <Play className="w-4 h-4" style={{ fill: textOnPrimary }} />
              <span>Resume Reading</span>
            </button>
            <button
              onClick={handleStop}
              className={`px-5 py-2.5 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all ${
                isDark
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/50'
                  : 'btn-cozy bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Square className="w-4 h-4 fill-rose-700" />
              <span>Finish Session</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
