import React, { useState, useEffect } from 'react';
import { X, Book, Trash2, PlayCircle, Star } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { bookService } from '../../services/bookService';
import confetti from 'canvas-confetti';

export function BookDetailModal({ books, currentFocusBookId, palette, isDark }) {
  const { isDetailModalOpen, selectedBookId, closeBookDetail } = useUIStore();
  const book = (books || []).find((b) => b.id === selectedBookId);

  const [editPage, setEditPage] = useState(0);
  const [editTotal, setEditTotal] = useState(0);
  const [editDueDate, setEditDueDate] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [editThemeMode, setEditThemeMode] = useState('auto');

  const primaryColor = palette?.primary || '#0284c7';
  const secondaryColor = palette?.secondary || '#ec4899';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  useEffect(() => {
    if (book) {
      setEditPage(book.current_page || 0);
      setEditTotal(book.pages_total || 0);
      setEditDueDate(book.due_date || '');
      setEditRating(book.rating || 0);
      setEditNotes(book.notes || '');
      setEditThemeMode(book.theme_mode || 'auto');
    }
  }, [book]);

  if (!isDetailModalOpen || !book) return null;

  const isCurrentFocus = book.id === currentFocusBookId;

  const handleSave = async (e) => {
    e.preventDefault();
    const newPage = Math.max(0, parseInt(editPage, 10) || 0);
    const newTotal = Math.max(0, parseInt(editTotal, 10) || 0);
    const wasCompleted = book.status === 'completed';
    const isNowCompleted = newPage >= newTotal && newTotal > 0;

    await bookService.updateBook(book.id, {
      current_page: newPage,
      pages_total: newTotal,
      due_date: editDueDate,
      rating: editRating || null,
      notes: editNotes,
      theme_mode: editThemeMode
    });

    if (!wasCompleted && isNowCompleted) {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
    }

    closeBookDetail();
  };

  const handleSetFocus = async () => {
    await bookService.setCurrentFocusBook(book.id);
    closeBookDetail();
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to remove "${book.title}" from your library?`)) {
      await bookService.deleteBook(book.id);
      closeBookDetail();
    }
  };

  const percentage = editTotal > 0 ? Math.min(100, Math.round((editPage / editTotal) * 100)) : 0;

  const inputClass = isDark
    ? 'w-full px-3 py-1.5 rounded-xl bg-[#201e29] border border-white/10 text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-white/20'
    : 'w-full px-3 py-1.5 rounded-xl bg-white border border-[#eae3d8] text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#0284c7]';

  const labelClass = `block text-xs font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-stone-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors duration-300 ${
          isDark
            ? 'bg-[#15141b] border-white/10 text-[#f5f5f4]'
            : 'bg-white border-[#eae3d8] text-[#292524]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-white/10 bg-[#1c1a24]' : 'border-[#eae3d8] bg-[#fbf9f6]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Book className="w-5 h-5 shrink-0" style={{ color: primaryColor }} />
            <h3 className="text-base font-bold font-editorial truncate">{book.title}</h3>
          </div>
          <button
            onClick={closeBookDetail}
            className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ml-2 ${
              isDark
                ? 'text-stone-400 hover:text-white hover:bg-white/10'
                : 'text-stone-400 hover:text-stone-700 hover:bg-[#ede7dd]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Top Info Banner */}
          <div className="flex gap-4 items-center">
            <div
              className={`w-16 h-24 rounded-xl shrink-0 overflow-hidden border flex items-center justify-center ${
                isDark ? 'bg-[#201e29] border-white/10' : 'bg-stone-100 border-[#eae3d8]'
              }`}
            >
              <img
                src={book.cover_url || './default-cover-large.svg'}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = './default-cover-large.svg';
                }}
              />
            </div>
            <div>
              <h4 className="text-base font-bold leading-tight font-editorial">{book.title}</h4>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {book.author || 'Unknown Author'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {!isCurrentFocus ? (
                  <button
                    type="button"
                    onClick={handleSetFocus}
                    className={`py-1 px-3 text-xs rounded-lg font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-[#201e28] text-stone-200 hover:bg-[#2c2937] border border-white/10'
                        : 'btn-cozy btn-cozy-secondary'
                    }`}
                  >
                    <PlayCircle className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    <span>Set as Active Focus</span>
                  </button>
                ) : (
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      isDark
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                    style={
                      palette?.primary
                        ? {
                            borderColor: `${palette.primary}60`,
                            color: palette.primary
                          }
                        : undefined
                    }
                  >
                    Current Focus Book
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Slider / Numbers */}
          <div
            className={`p-4 rounded-xl border space-y-2.5 ${
              isDark ? 'bg-[#1c1a24] border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>Reading Progress</span>
              <span className="font-bold font-mono" style={{ color: primaryColor }}>
                {percentage}%
              </span>
            </div>

            <div
              className={`w-full h-2 rounded-full overflow-hidden ${
                isDark ? 'bg-white/10' : 'cozy-progress-bg'
              }`}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: primaryColor
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  Current Page
                </label>
                <input
                  type="number"
                  min="0"
                  max={editTotal || 99999}
                  value={editPage}
                  onChange={(e) => setEditPage(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  Total Pages
                </label>
                <input
                  type="number"
                  min="1"
                  value={editTotal}
                  onChange={(e) => setEditTotal(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
          </div>

          {/* Due Date & Rating */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className={`${inputClass} text-xs`}
              />
            </div>
            <div>
              <label className={labelClass}>Rating</label>
              <div className="flex items-center gap-1 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditRating(star === editRating ? 0 : star)}
                    className="p-1 text-stone-400 hover:text-amber-400 cursor-pointer transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= editRating ? 'text-amber-400 fill-amber-400' : 'text-stone-400/50'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cover Theme Styling Preference */}
          <div>
            <label className={labelClass}>Cover Theme Styling</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEditThemeMode('auto')}
                className={`py-1.5 px-2 text-xs rounded-xl border font-medium text-center transition-all cursor-pointer ${
                  editThemeMode === 'auto'
                    ? isDark
                      ? 'bg-white/15 border-white/20 text-white font-bold'
                      : 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                    : isDark
                    ? 'bg-[#201e29] border-white/10 text-stone-400 hover:text-white'
                    : 'bg-white border-[#eae3d8] text-stone-700 hover:bg-[#ede7dd]'
                }`}
                style={
                  editThemeMode === 'auto' && palette?.primary
                    ? { borderColor: palette.primary, color: isDark ? '#ffffff' : palette.primary }
                    : undefined
                }
              >
                Auto Detect
              </button>
              <button
                type="button"
                onClick={() => setEditThemeMode('dark')}
                className={`py-1.5 px-2 text-xs rounded-xl border font-medium text-center transition-all cursor-pointer ${
                  editThemeMode === 'dark'
                    ? 'bg-stone-900 border-amber-400 text-amber-400 font-bold shadow-xs'
                    : isDark
                    ? 'bg-[#201e29] border-white/10 text-stone-400 hover:text-white'
                    : 'bg-white border-[#eae3d8] text-stone-700 hover:bg-[#ede7dd]'
                }`}
              >
                Punchy Dark
              </button>
              <button
                type="button"
                onClick={() => setEditThemeMode('light')}
                className={`py-1.5 px-2 text-xs rounded-xl border font-medium text-center transition-all cursor-pointer ${
                  editThemeMode === 'light'
                    ? 'bg-amber-100 border-amber-600 text-amber-900 font-bold shadow-xs'
                    : isDark
                    ? 'bg-[#201e29] border-white/10 text-stone-400 hover:text-white'
                    : 'bg-white border-[#eae3d8] text-stone-700 hover:bg-[#ede7dd]'
                }`}
              >
                Cozy Light
              </button>
            </div>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Auto analyzes the cover art to determine whether dark or light mode looks punchiest.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Personal Notes</label>
            <textarea
              rows="3"
              placeholder="Key thoughts, memorable quotes, or reading notes..."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className={`${inputClass} text-xs`}
            />
          </div>

          {/* Buttons Footer */}
          <div
            className={`flex items-center justify-between pt-3 border-t ${
              isDark ? 'border-white/10' : 'border-[#eae3d8]'
            }`}
          >
            <button
              type="button"
              onClick={handleDelete}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Book</span>
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeBookDetail}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#22202c] text-stone-300 hover:bg-[#2c2938] border border-white/10'
                    : 'btn-cozy btn-cozy-secondary'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-1.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                style={{
                  backgroundColor: primaryColor,
                  color: textOnPrimary,
                  boxShadow: isDark ? `0 4px 16px ${primaryColor}40` : undefined
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
