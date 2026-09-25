import React from 'react';
import { History, Book, Clock, Trash2, CheckCircle2, Ban } from 'lucide-react';
import { sessionService } from '../../services/sessionService';

export function SessionHistoryList({ sessions, books }) {
  const booksMap = (books || []).reduce((acc, b) => {
    acc[b.id] = b;
    return acc;
  }, {});

  const handleToggleExclude = async (sessionId, currentVal) => {
    await sessionService.toggleExcludeFromPace(sessionId, !currentVal);
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to remove this session entry?')) {
      await sessionService.deleteSession(sessionId);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.round(seconds / 60);
    return `${mins} min${mins === 1 ? '' : 's'}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#eae3d8] pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#0284c7]" />
          <h3 className="text-lg font-bold font-editorial text-stone-900">Reading Journal Log</h3>
        </div>
        <span className="text-xs text-stone-500 font-medium">{sessions?.length || 0} Entries</span>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="space-y-2.5">
          {sessions.map((s) => {
            const book = booksMap[s.book_id];
            return (
              <div
                key={s.id}
                className="cozy-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-[#ded5c7] transition-all"
              >
                {/* Book & Timing */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#f7f3ec] border border-[#ede7dd] flex items-center justify-center shrink-0 text-stone-600">
                    <Book className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold font-editorial text-stone-900 truncate">
                      {book ? book.title : 'General Reading Session'}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                      <span>{formatDate(s.start_time || s.created_at)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {formatDuration(s.duration_seconds)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics & Actions */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-[#ede7dd]">
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-bold font-mono text-stone-900">
                      +{s.pages_read} <span className="text-xs font-normal text-stone-500 font-sans">pages</span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono">
                      {s.pace_ppm} p/min (pp. {s.start_page}–{s.end_page})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleExclude(s.id, s.exclude_from_pace)}
                      title={
                        s.exclude_from_pace
                          ? 'Excluded from pace calculations. Click to include.'
                          : 'Included in pace calculations. Click to exclude.'
                      }
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-colors cursor-pointer border ${
                        s.exclude_from_pace
                          ? 'bg-amber-100/70 text-amber-900 border-amber-300'
                          : 'bg-[#f7f3ec] text-stone-600 border-[#ded5c7] hover:bg-white'
                      }`}
                    >
                      {s.exclude_from_pace ? (
                        <span className="flex items-center gap-1">
                          <Ban className="w-3 h-3 text-amber-700" />
                          <span>Excluded</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>In Pace</span>
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteSession(s.id)}
                      title="Delete Session"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="cozy-card p-10 text-center my-4 max-w-md mx-auto">
          <History className="w-10 h-10 text-stone-400 mx-auto mb-2" />
          <h4 className="text-base font-bold font-editorial text-stone-800">Your Reading Journal is Fresh</h4>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Every reading session you record will be preserved here as part of your reading legacy.
          </p>
        </div>
      )}
    </div>
  );
}
