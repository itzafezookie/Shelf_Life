import React from 'react';
import { Eye } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

export function BookCard({ book, palette, isDark }) {
  const { openBookDetail } = useUIStore();

  const primaryColor = palette?.primary || '#0284c7';
  const total = book.pages_total || 0;
  const current = book.current_page || 0;
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const getStatusBadge = () => {
    if (book.status === 'completed') {
      return (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block ${
          isDark
            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          Finished
        </span>
      );
    }
    if (book.status === 'dnf') {
      return (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block ${
          isDark
            ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          DNF
        </span>
      );
    }
    if (book.status === 'reading') {
      return (
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block"
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
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block ${
        isDark
          ? 'bg-[#22202a] text-stone-400 border-white/10'
          : 'bg-[#f3ece1] text-stone-600 border border-[#e2d9cd]'
      }`}>
        To Read
      </span>
    );
  };

  // Circular progress stroke calculation
  const radius = 20;
  const circumference = 2 * Math.PI * radius; // ~125.66
  const strokeDashoffset = circumference - (circumference * percentage) / 100;
  const progressColor =
    book.status === 'completed'
      ? '#10b981'
      : book.status === 'dnf'
      ? '#f43f5e'
      : primaryColor;

  return (
    <div
      onClick={() => openBookDetail(book.id)}
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3.5 group ${
        isDark
          ? 'bg-[#17161c] border-white/10 hover:border-white/20 hover:bg-[#1c1a24]'
          : 'cozy-card cozy-card-hover bg-white hover:bg-stone-50/80'
      }`}
    >
      {/* Left side: Book Cover + Book Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Cover Art (5% larger: 70px x 105px) */}
        <div className="book-cover-frame w-[70px] h-[105px] shrink-0 bg-[#ede7dd] shadow-sm overflow-hidden rounded-lg">
          <img
            src={book.cover_url || './default-cover-small.svg'}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.target.src = './default-cover-small.svg';
            }}
          />
        </div>

        {/* Book Info */}
        <div className="min-w-0 flex-1">
          <h4 className={`text-sm sm:text-base font-bold font-editorial tracking-tight line-clamp-1 leading-snug group-hover:text-amber-500 transition-colors ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}>
            {book.title}
          </h4>
          <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {book.author || 'Unknown Author'}
          </p>

          {/* Genre Tags */}
          {book.genres && book.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
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

          {/* Status Tag (Moved Below Genre Tags) */}
          <div className="mt-2">
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Right side: Circular Progress Justified to the Right + Details Icon */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
            <svg className="w-12 h-12 sm:w-14 sm:h-14 -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r={radius}
                className={isDark ? 'stroke-white/10' : 'stroke-stone-200'}
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r={radius}
                stroke={progressColor}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono font-bold text-[11px] sm:text-xs">
                {percentage}%
              </span>
            </div>
          </div>
          <span className={`text-[9px] sm:text-[10px] font-mono mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {current}/{total > 0 ? `${total}p` : '—'}
          </span>
        </div>

        <div className={`p-1.5 rounded-xl border opacity-50 group-hover:opacity-100 transition-opacity ${
          isDark ? 'border-white/10 text-stone-400' : 'border-stone-200 text-stone-500'
        }`}>
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>
    </div>
  );
}
