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
      className={`p-6 rounded-2xl border transition-colors duration-500 ${
        isDark
          ? 'bg-[#17161c] border-white/10 text-white shadow-xl'
          : 'cozy-card'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 transition-colors" style={{ color: primaryColor }} />
          <h3
            className={`text-lg font-bold font-editorial ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}
          >
            Reading Rhythm
          </h3>
        </div>
        <span className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          {validSessions.length} Active Sessions
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div
          className={`p-4 text-center rounded-xl border transition-colors duration-500 ${
            isDark ? 'bg-[#201e28] border-white/10' : 'cozy-stat-box'
          }`}
        >
          <div
            className={`flex items-center justify-center gap-1.5 text-xs font-semibold mb-1 ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>Average Pace</span>
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}
          >
            {avgPPM}{' '}
            <span
              className={`text-xs font-sans font-normal ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              p/min
            </span>
          </div>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            ≈ {avgWPM} words/min
          </p>
        </div>

        <div
          className={`p-4 text-center rounded-xl border transition-colors duration-500 ${
            isDark ? 'bg-[#201e28] border-white/10' : 'cozy-stat-box'
          }`}
        >
          <div
            className={`flex items-center justify-center gap-1.5 text-xs font-semibold mb-1 ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" style={{ color: secondaryColor }} />
            <span>Typical Session</span>
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}
          >
            {avgSessionMin}{' '}
            <span
              className={`text-xs font-sans font-normal ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              mins
            </span>
          </div>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            Comfortable reading stretch
          </p>
        </div>

        <div
          className={`p-4 text-center rounded-xl border transition-colors duration-500 ${
            isDark ? 'bg-[#201e28] border-white/10' : 'cozy-stat-box'
          }`}
        >
          <div
            className={`flex items-center justify-center gap-1.5 text-xs font-semibold mb-1 ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" style={{ color: tertiaryColor }} />
            <span>Peak Flow Pace</span>
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}
          >
            {highestPace}{' '}
            <span
              className={`text-xs font-sans font-normal ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              p/min
            </span>
          </div>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            Deep absorption speed
          </p>
        </div>
      </div>
    </div>
  );
}

