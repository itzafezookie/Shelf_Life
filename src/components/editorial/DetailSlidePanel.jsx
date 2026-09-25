import React, { useState, useEffect } from 'react';
import { X, PlayCircle, Edit3, Trash2, Calendar, Target, Clock, Star, BookOpen } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { bookService } from '../../services/bookService';
import { analyticsEngine } from '../../services/analyticsEngine';
import confetti from 'canvas-confetti';

export function DetailSlidePanel({ books, currentFocusBookId, sessions = [], baselineWPM = 250 }) {
  const { isDetailModalOpen, selectedBookId, closeBookDetail } = useUIStore();
  const book = (books || []).find(b => b.id === selectedBookId);

  const [editPage, setEditPage] = useState(0);
  const [editTotal, setEditTotal] = useState(0);
  const [editDueDate, setEditDueDate] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (book) {
      setEditPage(book.current_page || 0);
      setEditTotal(book.pages_total || 0);
      setEditDueDate(book.due_date || '');
      setEditRating(book.rating || 0);
      setEditNotes(book.notes || '');
      setIsEditing(false);
    }
  }, [book]);

  if (!isDetailModalOpen || !book) return null;

  const isCurrentFocus = book.id === currentFocusBookId;
  const total = book.pages_total || 0;
  const current = book.current_page || 0;
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const pacePPM = analyticsEngine.calculateAveragePacePPM(sessions, baselineWPM);
  const eta = analyticsEngine.calculateBookETA(book, pacePPM);

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
      notes: editNotes
    });

    if (!wasCompleted && isNowCompleted) {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
    }
    setIsEditing(false);
  };

  const handleSetFocus = async () => {
    await bookService.setCurrentFocusBook(book.id);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to remove "${book.title}" from your library?`)) {
      await bookService.deleteBook(book.id);
      closeBookDetail();
    }
  };

  return (
    <>
      <div
        onClick={closeBookDetail}
        className="fixed inset-0 z-30 bg-stone-900/15 backdrop-blur-[1px] transition-opacity cursor-pointer"
      />
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white/95 backdrop-blur-xl border-l border-[#eae3d8] shadow-2xl flex flex-col animate-slide-left">
      {/* Header */}
      <div className="p-5 border-b border-[#eae3d8] flex items-center justify-between bg-[#fbf9f6]/70">
        <div>
          <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-300">
            {book.status === 'completed' ? 'Archived Volume' : 'Active Volume'}
          </span>
          <h2 className="text-xl font-bold font-editorial text-stone-900 mt-1 line-clamp-1">
            {book.title}
          </h2>
        </div>
        <button
          onClick={closeBookDetail}
          className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-[#ede7dd] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
        {/* Book Overview Banner */}
        <div className="flex gap-4 items-start">
          <div className="book-cover-frame w-20 h-30 shrink-0 bg-[#ede7dd]">
            <img
              src={book.cover_url || './default-cover-small.svg'}
              alt={book.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = './default-cover-small.svg'; }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold font-editorial text-stone-900 leading-snug">{book.title}</h3>
            <p className="text-xs text-stone-500 mt-0.5">{book.author || 'Unknown Author'}</p>

            <div className="flex items-center gap-2 mt-3">
              {!isCurrentFocus ? (
                <button
                  onClick={handleSetFocus}
                  className="btn-cozy btn-cozy-primary py-1 px-3 text-xs"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Set as Active Read</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                  ★ Spotlighted Volume
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress & Quick Stats Card */}
        <div className="cozy-card p-4 space-y-3 bg-[#fbf9f6]">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-stone-600">Reading Progress</span>
            <span className="text-emerald-700 font-mono font-bold">{percentage}%</span>
          </div>

          <div className="w-full h-2.5 cozy-progress-bg">
            <div className="cozy-progress-fill" style={{ width: `${percentage}%` }} />
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 font-mono pt-1">
            <span>Page {current} / {total > 0 ? total : '—'}</span>
            <span>{eta.formattedDuration} left</span>
          </div>
        </div>

        {/* Reading Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="cozy-stat-box p-3 text-center">
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">Average Pace</div>
            <div className="text-base font-bold font-mono text-stone-900">{pacePPM} p/min</div>
          </div>
          <div className="cozy-stat-box p-3 text-center">
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">Daily Goal</div>
            <div className="text-base font-bold font-mono text-stone-900">{eta.dailyTarget ? `${eta.dailyTarget} p/d` : 'Self-paced'}</div>
          </div>
        </div>

        {/* Editable Form Fields */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-3.5 pt-2 border-t border-[#eae3d8]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Current Page</label>
                <input
                  type="number"
                  min="0"
                  max={editTotal || 99999}
                  value={editPage}
                  onChange={(e) => setEditPage(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#eae3d8] text-stone-900 font-mono text-xs focus:outline-none focus:border-[#0284c7]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Total Pages</label>
                <input
                  type="number"
                  min="1"
                  value={editTotal}
                  onChange={(e) => setEditTotal(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#eae3d8] text-stone-900 font-mono text-xs focus:outline-none focus:border-[#0284c7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Due Date</label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#eae3d8] text-stone-900 text-xs focus:outline-none focus:border-[#0284c7]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Notes & Quotes</label>
              <textarea
                rows="3"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#eae3d8] text-xs text-stone-900 focus:outline-none focus:border-[#0284c7]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-cozy btn-cozy-secondary flex-1 py-1.5 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-cozy btn-cozy-primary flex-1 py-1.5 text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 pt-2 border-t border-[#eae3d8]">
            {book.notes && (
              <div className="p-3.5 rounded-xl bg-[#f7f3ec] border border-[#ede7dd] text-xs text-stone-700 leading-relaxed font-editorial italic">
                "{book.notes}"
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="btn-cozy btn-cozy-secondary py-1.5 px-3 text-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Volume</span>
              </button>

              <button
                onClick={handleDelete}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
