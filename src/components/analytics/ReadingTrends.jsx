import React from 'react';
import { TrendingUp, Gauge, Calendar } from 'lucide-react';
import { analyticsEngine } from '../../services/analyticsEngine';

export function ReadingTrends({ sessions, baselineWPM, palette, isDark }) {
  const validSessions = (sessions || []).filter(
    (s) => !s.exclude_from_pace && s.duration_seconds > 60 && s.pages_read > 0
  );

  const primaryColor = palette?.primary || '#0284c7';
  const secondaryColor = palette?.secondary || '#ec4899';
  const tertiaryColor = palette?.tertiary || '#06b6d4';

  const avgPPM = analyticsEngine.calculateAveragePacePPM(sessions, baselineWPM);
  const avgWPM = analyticsEngine.calculateWPM(avgPPM);

  const avgSessionSeconds =
    sessions && sessions.length > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / sessions.length
        )
      : 0;

  const avgSessionMin = Math.round(avgSessionSeconds / 60);
  const recentPaces = validSessions.slice(0, 5).map((s) => s.pace_ppm);
  const highestPace = recentPaces.length > 0 ? Math.max(...recentPaces) : avgPPM;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-colors duration-500 ${
        isDark
          ? 'bg-[#17161c] border-white/10 text-white shadow-xl'
          : 'cozy-card'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 transition-colors" style={{ color: primaryColor }} />
          <h3
            className={`text-base sm:text-lg font-bold font-editorial ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}
          >
            Reading Rhythm
          </h3>
        </div>
        <span className={`text-[11px] sm:text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          {validSessions.length} Active Sessions
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
        <div
          className={`p-2.5 sm:p-4 text-center rounded-xl border transition-colors duration-500 ${
            isDark ? 'bg-[#201e28] border-white/10' : 'cozy-stat-box'
          }`}
        >
          <div
            className={`flex items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold mb-1 ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}
          >
            <Gauge className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" style={{ color: primaryColor }} />
            <span className="truncate">Average Pace</span>
          </div>
          <div
            className={`text-lg sm:text-2xl font-bold font-mono ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}
          >
            {avgPPM}{' '}
            <span
              className={`text-[10px] sm:text-xs font-sans font-normal ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              p/min
            </span>
          </div>
          <p className={`text-[9px] sm:text-[11px] mt-0.5 truncate ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            ≈ {avgWPM} wpm
          </p>
        </div>

        <div
          className={`p-2.5 sm:p-4 text-center rounded-xl border transition-colors duration-500 ${
            isDark ? 'bg-[#201e28] border-white/10' : 'cozy-stat-box'
          }`}
        >
          <div
            className={`flex items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold mb-1 ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}
          >
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" style={{ color: secondaryColor }} />
            <span className="truncate">Typical Session</span>
          </div>
          <div
            className={`text-lg sm:text-2xl font-bold font-mono ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}
          >
            {avgSessionMin}{' '}
            <span
              className={`text-[10px] sm:text-xs font-sans font-normal ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              mins
            </span>
          </div>
          <p className={`text-[9px] sm:text-[11px] mt-0.5 truncate ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            Comfortable stretch
          </p>
        </div>

        <div
          className={`p-2.5 sm:p-4 text-center rounded-xl border transition-colors duration-500 ${
            isDark ? 'bg-[#201e28] border-white/10' : 'cozy-stat-box'
          }`}
        >
          <div
            className={`flex items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold mb-1 ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}
          >
            <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" style={{ color: tertiaryColor }} />
            <span className="truncate">Peak Flow</span>
          </div>
          <div
            className={`text-lg sm:text-2xl font-bold font-mono ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}
          >
            {highestPace}{' '}
            <span
              className={`text-[10px] sm:text-xs font-sans font-normal ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              p/min
            </span>
          </div>
          <p className={`text-[9px] sm:text-[11px] mt-0.5 truncate ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            Deep absorption
          </p>
        </div>
      </div>
    </div>
  );
}

