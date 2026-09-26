import React from 'react';
import { Tag, PieChart } from 'lucide-react';
import { analyticsEngine } from '../../services/analyticsEngine';

export function GenreBreakdown({ books, palette, isDark }) {
  const genreStats = analyticsEngine.calculateGenreStats(books);

  const primaryColor = palette?.primary || '#d97706';
  const secondaryColor = palette?.secondary || '#0284c7';

  const defaultGradients = [
    'from-amber-600 to-amber-500',
    'from-[#0284c7] to-sky-500',
    'from-emerald-600 to-emerald-500',
    'from-rose-600 to-rose-500',
    'from-stone-700 to-stone-500',
    'from-indigo-600 to-indigo-500'
  ];

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
          <PieChart
            className="w-4 h-4 transition-colors"
            style={{ color: primaryColor }}
          />
          <h3
            className={`text-base sm:text-lg font-bold font-editorial ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}
          >
            Genre Landscape
          </h3>
        </div>
        <span className={`text-[11px] sm:text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          {genreStats.length} Genres Explored
        </span>
      </div>

      {genreStats.length > 0 ? (
        <div className="space-y-2.5">
          {genreStats.map((item, index) => {
            const gradient = defaultGradients[index % defaultGradients.length];
            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Tag className={`w-3.5 h-3.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`} />
                    <span className={`font-semibold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>
                      {item.bookCount} {item.bookCount === 1 ? 'book' : 'books'}
                    </span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                <div
                  className={`w-full h-2.5 rounded-full overflow-hidden ${
                    isDark ? 'bg-white/10' : 'cozy-progress-bg'
                  }`}
                >
                  <div
                    className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500`}
                    style={
                      index === 0 && palette?.primary && palette?.secondary
                        ? {
                            backgroundImage: `linear-gradient(90deg, ${palette.primary}, ${palette.secondary})`
                          }
                        : undefined
                    }
                  >
                    <div style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`text-center py-8 text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
          No genre data logged yet. Tag your books with genres to see your reading taste take shape!
        </div>
      )}
    </div>
  );
}

