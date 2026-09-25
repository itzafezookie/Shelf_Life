import React, { useState } from 'react';
import { Edit3, Info, Check, X } from 'lucide-react';
import { bookService } from '../../services/bookService';
import { useUIStore } from '../../stores/useUIStore';

/**
 * Condensed Hero Container with Book-Driven Palette Theming
 */
export function CurrentBookHero({ book, etaText, palette }) {
  const { openBookDetail, setAddBookOpen } = useUIStore();
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState(book?.current_page || 0);

  const isDark = Boolean(palette?.isDark);
  const primaryColor = palette?.primary || '#0284c7';
  const secondaryColor = palette?.secondary || '#ec4899';
  const tertiaryColor = palette?.tertiary || '#06b6d4';
  const tintColor = palette?.tint || 'rgba(2, 132, 199, 0.04)';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  if (!book) {
    return (
      <div className={`p-6 text-center max-w-xl mx-auto rounded-2xl border transition-colors duration-500 ${
        isDark ? 'bg-[#17161c] border-white/10 text-white' : 'cozy-card'
      }`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-2xs ${
          isDark ? 'bg-[#22202a] border border-white/10' : 'bg-[#f7f3ec] border border-[#ede7dd]'
        }`}>
          📖
        </div>
        <h2 className="text-xl font-bold font-editorial mb-1">
          Your Reading Nook is Waiting
        </h2>
        <p className={`text-xs mb-4 max-w-xs mx-auto ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          Add a book to settle in and track your reading journey with cozy focus.
        </p>
        <button
          onClick={() => setAddBookOpen(true)}
          className="btn-cozy px-4 py-2 text-xs font-semibold shadow-xs"
          style={{ backgroundColor: primaryColor, color: textOnPrimary }}
        >
          Add Your First Book
        </button>
      </div>
    );
  }

  const total = book.pages_total || 0;
  const current = book.current_page || 0;
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  // Circular progress math (r = 21, circumference ≈ 131.95)
  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleSavePage = async (e) => {
    e.preventDefault();
    const newPage = Math.max(0, Math.min(total || 99999, parseInt(pageInput, 10) || 0));
    await bookService.updateBook(book.id, { current_page: newPage });
    setIsEditingPage(false);
  };

  return (
    <div
      className="p-4 sm:p-5 max-w-xl mx-auto relative overflow-hidden rounded-2xl border transition-all duration-500"
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${primaryColor}24 0%, #17161c 45%, ${secondaryColor}18 100%)`
          : `linear-gradient(135deg, ${tintColor} 0%, #ffffff 45%, #ffffff 100%)`,
        borderColor: isDark ? `${primaryColor}45` : `${primaryColor}22`,
        boxShadow: isDark
          ? `0 14px 36px -4px rgba(0, 0, 0, 0.75), 0 0 24px -2px ${primaryColor}25`
          : '0 2px 8px -2px rgba(60, 45, 30, 0.04), 0 12px 24px -6px rgba(60, 45, 30, 0.03)'
      }}
    >
      {/* Top 3-Color Gradient Frame Line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-10"
        style={{
          background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${tertiaryColor} 100%)`
        }}
      />

      {/* Dynamic Ribbon Accent (Tied to Book's Secondary Color) */}
      <div
        className="absolute top-0 right-6 w-5 h-9 shadow-sm flex items-end justify-center pb-0.5 transition-colors duration-500 z-10"
        style={{ backgroundColor: secondaryColor }}
      >
        <div
          className={`w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[6px] absolute bottom-0 transition-colors duration-500 ${
            isDark ? 'border-b-[#17161c]' : 'border-b-white'
          }`}
        />
      </div>

      {/* Condensed Horizontal Layout: Cover to the Left, Text to the Right */}
      <div className="flex items-center gap-4 sm:gap-5 pt-0.5">
        {/* Left: Clean, Punchy Book Cover */}
        <div className="shrink-0 my-0.5">
          <div
            className="book-cover-punchy w-22 h-32 sm:w-26 sm:h-38 bg-[#ede7dd] transition-all duration-300"
            style={
              isDark
                ? {
                    boxShadow: `0 8px 24px -2px rgba(0,0,0,0.8), 0 0 16px -2px ${primaryColor}30`,
                    borderColor: `${primaryColor}40`
                  }
                : undefined
            }
          >
            <div className="book-inner">
              <img
                src={book.cover_url || './default-cover-large.svg'}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = './default-cover-large.svg';
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: Book Details & Circular Progress */}
        <div className="flex-1 min-w-0 pr-4 sm:pr-2">
          {/* Dynamic Focus Badge & Cover Palette Indicator */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-all duration-500"
              style={{
                backgroundColor: isDark ? `${primaryColor}25` : `${primaryColor}16`,
                color: primaryColor,
                borderColor: `${primaryColor}50`,
                boxShadow: isDark ? `0 0 10px ${primaryColor}25` : undefined
              }}
            >
              Current Focus
            </span>
            {etaText && (
              <span
                className="text-[11px] font-mono font-bold tracking-tight"
                style={{ color: isDark ? secondaryColor : undefined }}
              >
                {etaText} left
              </span>
            )}

            {/* Top 3 cover palette indicator */}
            {palette?.topColors && palette.topColors.length >= 3 && (
              <div
                className={`ml-auto hidden xs:flex sm:flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-colors duration-500 ${
                  isDark ? 'bg-[#201e28] border-white/10' : 'bg-[#fbf9f6] border-[#ede7dd]'
                }`}
                title="Top 3 colors extracted from cover"
              >
                {palette.topColors.slice(0, 3).map((col, idx) => (
                  <span
                    key={idx}
                    className="w-2.5 h-2.5 rounded-full border border-black/15 transition-transform hover:scale-125 shadow-2xs"
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Title & Author */}
          <h2 className={`text-lg sm:text-xl font-bold font-editorial tracking-tight leading-snug truncate transition-colors duration-500 ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}>
            {book.title}
          </h2>
          <p className={`text-xs font-medium truncate mb-2.5 transition-colors duration-500 ${
            isDark ? 'text-stone-400' : 'text-stone-500'
          }`}>
            {book.author || 'Unknown Author'}
          </p>

          {/* Circular Progress & Page Stats Row */}
          <div
            className={`flex items-center gap-3.5 mb-3 p-2 sm:p-2.5 rounded-2xl border transition-all duration-500 ${
              isDark ? 'bg-[#201e28]/90' : 'bg-[#fbf9f6]'
            }`}
            style={{
              borderColor: isDark ? `${primaryColor}35` : '#ede7dd',
              boxShadow: isDark ? `0 4px 14px -2px ${primaryColor}15` : undefined
            }}
          >
            {/* Circular Progress Ring (Tied to Book's Primary Color) */}
            <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r={radius}
                  className="transition-colors duration-500"
                  stroke={isDark ? '#2c2937' : '#ede7dd'}
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="24"
                  cy="24"
                  r={radius}
                  stroke={primaryColor}
                  className="transition-all duration-500 ease-out"
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Progress Text Inside Circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-mono text-[11px] font-extrabold"
                  style={{ color: isDark ? primaryColor : undefined }}
                >
                  {percentage}%
                </span>
              </div>
            </div>

            {/* Page Count Detail */}
            <div className="min-w-0 flex-1">
              <div className={`text-xs font-bold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                Page <span className={`font-mono font-extrabold ${isDark ? 'text-white' : 'text-stone-900'}`}>{current}</span> of {total > 0 ? total : '—'}
              </div>
              <div
                className="text-[11px] font-medium"
                style={{ color: isDark ? tertiaryColor : undefined }}
              >
                {total > current ? `${total - current} pages remaining` : 'Volume completed!'}
              </div>
            </div>
          </div>

          {/* Compact Action Buttons */}
          <div className="flex items-center gap-2">
            {isEditingPage ? (
              <form onSubmit={handleSavePage} className="flex items-center gap-1.5 w-full">
                <input
                  type="number"
                  min="0"
                  max={total || 99999}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  className={`w-16 px-2 py-1 text-xs rounded-lg font-mono text-center focus:outline-none ${
                    isDark
                      ? 'bg-[#18171d] text-white border border-white/20'
                      : 'bg-white text-stone-900 border border-[#0284c7]'
                  }`}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn-cozy py-1 px-2.5 text-xs shadow-xs"
                  style={{ backgroundColor: primaryColor, color: textOnPrimary }}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPage(false)}
                  className={`py-1 px-2.5 text-xs rounded-xl inline-flex items-center transition-all ${
                    isDark
                      ? 'bg-[#282532] text-stone-300 hover:bg-[#343040] border border-white/10'
                      : 'btn-cozy btn-cozy-secondary'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <>
                <button
                  onClick={() => {
                    setPageInput(current);
                    setIsEditingPage(true);
                  }}
                  className={`py-1.5 px-3 text-xs font-semibold cursor-pointer rounded-xl inline-flex items-center gap-1.5 transition-all ${
                    isDark
                      ? 'bg-[#282532] hover:bg-[#343040] text-stone-200'
                      : 'btn-cozy btn-cozy-secondary'
                  }`}
                  style={
                    isDark
                      ? {
                          border: `1px solid ${primaryColor}60`,
                          boxShadow: `0 2px 8px -1px ${primaryColor}20`
                        }
                      : undefined
                  }
                >
                  <Edit3 className="w-3 h-3" style={{ color: primaryColor }} />
                  <span>Update Page</span>
                </button>

                <button
                  onClick={() => openBookDetail(book.id)}
                  className={`py-1.5 px-3 text-xs font-semibold cursor-pointer rounded-xl inline-flex items-center gap-1.5 transition-all ${
                    isDark
                      ? 'bg-[#282532] hover:bg-[#343040] text-stone-200'
                      : 'btn-cozy btn-cozy-outline'
                  }`}
                  style={
                    isDark
                      ? {
                          border: `1px solid ${secondaryColor}60`,
                          boxShadow: `0 2px 8px -1px ${secondaryColor}20`
                        }
                      : undefined
                  }
                >
                  <Info className="w-3 h-3" style={{ color: secondaryColor }} />
                  <span>Book Notes</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
