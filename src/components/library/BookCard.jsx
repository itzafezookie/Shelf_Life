import React from 'react';
import { Eye, PlayCircle } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { bookService } from '../../services/bookService';

export function BookCard({ book, isCurrentFocus = false, palette, isDark }) {
  const { openBookDetail } = useUIStore();

  const primaryColor = palette?.primary || '#0284c7';
  const total = book.pages_total || 0;
  const current = book.current_page || 0;
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const handleSetFocus = async (e) => {
    e.stopPropagation();
    await bookService.setCurrentFocusBook(book.id);
  };

  const getStatusBadge = () => {
    if (book.status === 'completed') {
      return (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
          isDark
            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          Completed
        </span>
      );
    }
    if (book.status === 'reading') {
      return (
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
          style={{
            backgroundColor: `${primaryColor}20`,
            color: primaryColor,
            borderColor: `${primaryColor}40`
          }}
        >
          Reading
        </span>
      );
    }
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
        isDark
          ? 'bg-[#22202a] text-stone-400 border-white/10'
          : 'bg-[#f3ece1] text-stone-600 border border-[#e2d9cd]'
      }`}>
        To Read
      </span>
    );
  };

  return (
    <div
      onClick={() => openBookDetail(book.id)}
      className={`p-4 flex flex-col justify-between cursor-pointer relative rounded-2xl border transition-all duration-300 ${
        isDark
          ? 'bg-[#17161c] border-white/10 hover:border-white/20 hover:-translate-y-0.5'
          : 'cozy-card cozy-card-hover bg-white'
      }`}
      style={
        isCurrentFocus
          ? {
              borderColor: `${primaryColor}65`,
              boxShadow: isDark
                ? `0 8px 24px -2px ${primaryColor}25, 0 0 16px -2px ${primaryColor}20`
                : `0 4px 16px -2px ${primaryColor}20`
            }
          : undefined
      }
    >
      {/* Top Badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {getStatusBadge()}
        {isCurrentFocus && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs"
            style={{
              backgroundColor: `${primaryColor}25`,
              color: primaryColor,
              borderColor: `${primaryColor}50`
            }}
          >
            ★ Active Focus
          </span>
        )}
      </div>

      {/* Book Cover with Spine & Info */}
      <div className="flex gap-3.5 mb-4">
        <div
          className="book-cover-frame w-16 h-24 shrink-0 bg-[#ede7dd] transition-all"
          style={
            isDark && isCurrentFocus
              ? { boxShadow: `0 4px 14px -1px ${primaryColor}30` }
              : undefined
          }
        >
          <img
            src={book.cover_url || './default-cover-small.svg'}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = './default-cover-small.svg';
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-bold font-editorial tracking-tight line-clamp-2 leading-snug ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}>
            {book.title}
          </h4>
          <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {book.author || 'Unknown Author'}
          </p>

          {book.genres && book.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {book.genres.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className={`text-[9px] py-0.5 px-1.5 rounded-full border ${
                    isDark
                      ? 'bg-[#22202a] text-stone-300 border-white/10'
                      : 'cozy-tag'
                  }`}
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress & Quick Actions */}
      <div className={`space-y-1.5 mt-auto pt-2 border-t ${isDark ? 'border-white/10' : 'border-[#ede7dd]'}`}>
        <div className={`flex items-center justify-between text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          <span>{current} / {total > 0 ? `${total} p` : '—'}</span>
          <span
            className="font-bold font-mono"
            style={{ color: isCurrentFocus ? primaryColor : undefined }}
          >
            {percentage}%
          </span>
        </div>

        <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#26242e]' : 'cozy-progress-bg'}`}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
              backgroundColor: isCurrentFocus ? primaryColor : '#10b981'
            }}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {!isCurrentFocus && book.status !== 'completed' ? (
            <button
              onClick={handleSetFocus}
              className="text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              style={{ color: primaryColor }}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Make Focus</span>
            </button>
          ) : (
            <span />
          )}

          <span className={`text-xs flex items-center gap-1 transition-colors ${
            isDark ? 'text-stone-400 hover:text-white' : 'text-stone-400 hover:text-stone-700'
          }`}>
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </span>
        </div>
      </div>
    </div>
  );
}
