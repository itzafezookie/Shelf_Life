import React, { useState, useMemo } from 'react';
import { Calendar, Clock, BookOpen, Sparkles, Coffee } from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function BookCalendarHeatmap({ sessions = [], book, palette, isDark }) {
  const [activeDay, setActiveDay] = useState(null);

  const primaryColor = palette?.primary || '#0284c7';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  // Aggregate sessions by YYYY-MM-DD
  const sessionsByDate = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      const rawDate = s.created_at || s.start_time;
      if (!rawDate) continue;
      const dateKey = new Date(rawDate).toISOString().split('T')[0];
      if (!map[dateKey]) {
        map[dateKey] = { date: dateKey, minutes: 0, pages: 0, count: 0 };
      }
      map[dateKey].minutes += Math.max(1, Math.round((s.duration_seconds || 0) / 60));
      map[dateKey].pages += s.pages_read || 0;
      map[dateKey].count += 1;
    }
    return map;
  }, [sessions]);

  // Calculate calendar bounds with leading & trailing days/weeks
  const { days, monthLabel, totalReadingDays } = useMemo(() => {
    const sessionDates = Object.keys(sessionsByDate).sort();
    let startDate, endDate;

    if (sessionDates.length > 0) {
      const first = new Date(sessionDates[0] + 'T12:00:00');
      const last = new Date(sessionDates[sessionDates.length - 1] + 'T12:00:00');

      // Leading week: 7 days before first session
      startDate = new Date(first);
      startDate.setDate(startDate.getDate() - 7);

      // Trailing week: 7 days after last session (or today, whichever is later)
      const now = new Date();
      endDate = last > now ? new Date(last) : new Date(now);
      endDate.setDate(endDate.getDate() + 7);
    } else {
      // If no sessions yet, center around book creation or today
      const anchor = book?.created_at ? new Date(book.created_at) : new Date();
      startDate = new Date(anchor);
      startDate.setDate(startDate.getDate() - 14);
      endDate = new Date(anchor);
      endDate.setDate(endDate.getDate() + 7);
    }

    // Align startDate to Sunday
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    // Align endDate to Saturday
    const endDayOfWeek = endDate.getDay();
    if (endDayOfWeek < 6) {
      endDate.setDate(endDate.getDate() + (6 - endDayOfWeek));
    }

    // Ensure minimum 4 weeks (28 days) for a clean, balanced grid
    const totalDaysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    if (totalDaysDiff < 28) {
      endDate.setDate(endDate.getDate() + (28 - totalDaysDiff));
    }

    // Generate days array
    const dayList = [];
    const curr = new Date(startDate);
    const monthsSet = new Set();
    const todayKey = new Date().toISOString().split('T')[0];

    while (curr <= endDate) {
      const key = curr.toISOString().split('T')[0];
      const data = sessionsByDate[key] || null;
      monthsSet.add(
        curr.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
      );

      dayList.push({
        dateKey: key,
        dayNum: curr.getDate(),
        monthName: curr.toLocaleDateString(undefined, { month: 'short' }),
        fullDateStr: curr.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }),
        isToday: key === todayKey,
        data
      });

      curr.setDate(curr.getDate() + 1);
    }

    const monthNames = Array.from(monthsSet);
    const mLabel =
      monthNames.length === 1
        ? monthNames[0]
        : `${monthNames[0]} – ${monthNames[monthNames.length - 1]}`;

    return {
      days: dayList,
      monthLabel: mLabel,
      totalReadingDays: sessionDates.length
    };
  }, [sessionsByDate, book]);

  // Color intensities based on reading minutes
  const getCellStyles = (data) => {
    if (!data || data.minutes <= 0) {
      return {
        bg: isDark ? 'bg-white/4 hover:bg-white/10' : 'bg-stone-100/70 hover:bg-stone-200/70',
        text: isDark ? 'text-stone-400' : 'text-stone-500',
        border: isDark ? 'border-white/5' : 'border-stone-200/50'
      };
    }

    const mins = data.minutes;
    if (mins <= 15) {
      return {
        bg: '',
        style: {
          backgroundColor: `${primaryColor}30`,
          borderColor: `${primaryColor}55`,
          color: isDark ? '#ffffff' : primaryColor
        }
      };
    } else if (mins <= 45) {
      return {
        bg: '',
        style: {
          backgroundColor: `${primaryColor}65`,
          borderColor: `${primaryColor}85`,
          color: '#ffffff'
        }
      };
    } else {
      return {
        bg: '',
        style: {
          backgroundColor: primaryColor,
          borderColor: primaryColor,
          color: textOnPrimary,
          boxShadow: isDark ? `0 0 12px ${primaryColor}50` : `0 2px 8px ${primaryColor}40`
        }
      };
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isDark ? 'bg-[#1a1924] border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'
      }`}
    >
      {/* Heatmap Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
          <h5 className="text-xs font-bold font-editorial">Reading Heatmap</h5>
          <span className={`text-[11px] font-mono ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            ({monthLabel})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-white/5 border-white/10">
            {totalReadingDays} reading day{totalReadingDays === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5">
        {WEEKDAYS.map((wd) => (
          <span
            key={wd}
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}
          >
            {wd.charAt(0)}
          </span>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const cell = getCellStyles(day.data);
          const isSelected = activeDay?.dateKey === day.dateKey;

          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => setActiveDay(day)}
              className={`aspect-square rounded-xl text-xs font-mono font-medium flex flex-col items-center justify-center relative transition-all duration-150 cursor-pointer border ${
                cell.bg
              } ${cell.text || ''} ${cell.border || ''} ${
                isSelected ? 'ring-2 ring-amber-400 scale-105 z-10' : ''
              } ${day.isToday ? 'outline-1 outline-dashed outline-stone-400' : ''}`}
              style={cell.style}
              title={`${day.fullDateStr}: ${
                day.data ? `${day.data.minutes} mins (+${day.data.pages} pages)` : 'Rest day'
              }`}
            >
              <span className="text-[11px] leading-none">{day.dayNum}</span>

              {/* Tiny Dot indicator if reading occurred */}
              {day.data && (
                <span
                  className="w-1 h-1 rounded-full mt-0.5"
                  style={{
                    backgroundColor: cell.style?.color || primaryColor
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Day Detail Pill / Legend */}
      <div className="mt-3 pt-2.5 border-t border-dashed border-stone-200/60 dark:border-white/10 flex items-center justify-between text-xs">
        {activeDay ? (
          <div className="flex items-center gap-2">
            <span className="font-bold">{activeDay.fullDateStr}:</span>
            {activeDay.data ? (
              <span className="flex items-center gap-1.5 font-mono" style={{ color: primaryColor }}>
                <Clock className="w-3 h-3" />
                <span>{activeDay.data.minutes} mins</span>
                <span>•</span>
                <span>+{activeDay.data.pages} pages</span>
                <span>({activeDay.data.count} session{activeDay.data.count === 1 ? '' : 's'})</span>
              </span>
            ) : (
              <span className={`italic text-[11px] flex items-center gap-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                <Coffee className="w-3 h-3" />
                <span>Rest day (reading when the mood hits)</span>
              </span>
            )}
          </div>
        ) : (
          <span className={`text-[11px] italic ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            Tap any date to view reading minutes & pages read
          </span>
        )}

        {/* Legend */}
        <div className="flex items-center gap-1 shrink-0 text-[10px]">
          <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>Less</span>
          <span
            className="w-2.5 h-2.5 rounded-sm border"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
          />
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: `${primaryColor}40` }}
          />
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: `${primaryColor}75` }}
          />
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: primaryColor }}
          />
          <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>More</span>
        </div>
      </div>
    </div>
  );
}
