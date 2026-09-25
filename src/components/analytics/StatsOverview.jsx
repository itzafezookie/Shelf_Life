import React from 'react';
import { BookCheck, FileText, Clock, Flame } from 'lucide-react';
import { analyticsEngine } from '../../services/analyticsEngine';

export function StatsOverview({ books, sessions, baselineWPM, palette, isDark }) {
  const primaryColor = palette?.primary || '#0284c7';
  const secondaryColor = palette?.secondary || '#ec4899';
  const tertiaryColor = palette?.tertiary || '#06b6d4';

  const completedBooks = (books || []).filter((b) => b.status === 'completed').length;
  const totalPagesRead = (sessions || []).reduce((acc, s) => acc + (s.pages_read || 0), 0);
  const totalSeconds = (sessions || []).reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
  const formattedReadingTime = totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes}m`;

  const streak = analyticsEngine.calculateStreak(sessions);

  const stats = [
    {
      label: 'Volumes Finished',
      value: completedBooks,
      sub: `${books?.length || 0} books in library`,
      icon: BookCheck,
      color: isDark ? primaryColor : '#059669',
      border: isDark ? `${primaryColor}40` : undefined
    },
    {
      label: 'Pages Devoured',
      value: totalPagesRead.toLocaleString(),
      sub: 'Across recorded sessions',
      icon: FileText,
      color: isDark ? secondaryColor : '#0284c7',
      border: isDark ? `${secondaryColor}40` : undefined
    },
    {
      label: 'Time with Books',
      value: formattedReadingTime,
      sub: `${sessions?.length || 0} reading sessions`,
      icon: Clock,
      color: isDark ? tertiaryColor : '#d97706',
      border: isDark ? `${tertiaryColor}40` : undefined
    },
    {
      label: 'Reading Streak',
      value: `${streak} ${streak === 1 ? 'day' : 'days'}`,
      sub: streak > 0 ? 'Daily habit in full swing' : 'Read today to start a streak',
      icon: Flame,
      color: isDark ? primaryColor : '#e11d48',
      border: isDark ? `${primaryColor}40` : undefined
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className={`p-4 sm:p-5 flex flex-col justify-between text-left rounded-2xl border transition-all duration-300 ${
              isDark ? 'bg-[#17161c] border-white/10' : 'cozy-card'
            }`}
            style={
              isDark && s.border
                ? {
                    borderColor: s.border,
                    boxShadow: `0 4px 16px -2px ${s.color}20`
                  }
                : undefined
            }
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {s.label}
              </span>
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: `${s.color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
            </div>
            <div>
              <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                isDark ? 'text-white' : 'text-stone-900'
              }`}>
                {s.value}
              </div>
              <div className={`text-[11px] mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{s.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
