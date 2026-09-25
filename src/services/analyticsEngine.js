/**
 * Pure Analytics Engine
 * Calculates reading speeds, ETAs, completion dates, daily targets, and genre ratios.
 */

export const analyticsEngine = {
  WORDS_PER_PAGE_DEFAULT: 250,

  calculateAveragePacePPM(sessions, fallbackWPM = 250) {
    const validSessions = (sessions || []).filter(
      s => !s.exclude_from_pace && s.duration_seconds > 60 && s.pages_read > 0
    );

    if (validSessions.length === 0) {
      // Return fallback PPM based on WPM (e.g. 250 WPM / 250 words per page = 1.0 PPM)
      return Number((fallbackWPM / this.WORDS_PER_PAGE_DEFAULT).toFixed(2)) || 1.0;
    }

    const totalSeconds = validSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const totalPages = validSessions.reduce((acc, s) => acc + (s.pages_read || 0), 0);
    const totalMinutes = totalSeconds / 60;

    if (totalMinutes <= 0) return 1.0;
    return Number((totalPages / totalMinutes).toFixed(2));
  },

  calculateWPM(ppm) {
    return Math.round(ppm * this.WORDS_PER_PAGE_DEFAULT);
  },

  calculatePPMFromWPM(wpm) {
    return Number((wpm / this.WORDS_PER_PAGE_DEFAULT).toFixed(2));
  },

  calculateBookETA(book, pacePPM) {
    if (!book || !book.pages_total || book.pages_total <= 0) {
      return { remainingPages: 0, remainingMinutes: 0, formattedDuration: '0m', estimatedFinishDate: null, risk: 'no-due-date' };
    }

    const remainingPages = Math.max(0, (book.pages_total || 0) - (book.current_page || 0));
    if (remainingPages === 0) {
      return { remainingPages: 0, remainingMinutes: 0, formattedDuration: 'Completed', estimatedFinishDate: null, risk: 'completed' };
    }

    const safePPM = pacePPM > 0 ? pacePPM : 1.0;
    const remainingMinutes = Math.ceil(remainingPages / safePPM);

    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    const formattedDuration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    // Completion date calculation
    let estimatedFinishDate = null;
    let dailyTarget = null;
    let risk = 'no-due-date';

    if (book.due_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(book.due_date);
      due.setHours(23, 59, 59, 999);

      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      dailyTarget = Math.ceil(remainingPages / diffDays);

      // Estimate finish date assuming ~30 mins of reading per day
      const daysNeededAtNormalReading = Math.max(1, Math.ceil(remainingMinutes / 30));
      const finishDate = new Date();
      finishDate.setDate(finishDate.getDate() + daysNeededAtNormalReading);
      estimatedFinishDate = finishDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

      if (diffTime < 0) {
        risk = 'overdue';
      } else if (dailyTarget > 50 || daysNeededAtNormalReading > diffDays) {
        risk = 'at-risk';
      } else {
        risk = 'on-track';
      }
    } else {
      // No due date: project finish date assuming 30 min daily reading
      const daysNeeded = Math.max(1, Math.ceil(remainingMinutes / 30));
      const finishDate = new Date();
      finishDate.setDate(finishDate.getDate() + daysNeeded);
      estimatedFinishDate = finishDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    return {
      remainingPages,
      remainingMinutes,
      formattedDuration,
      estimatedFinishDate,
      dailyTarget,
      risk
    };
  },

  calculateGenreStats(books) {
    const genreMap = {};

    (books || []).forEach(b => {
      const genres = Array.isArray(b.genres) && b.genres.length > 0 ? b.genres : ['Uncategorized'];
      genres.forEach(g => {
        if (!genreMap[g]) {
          genreMap[g] = { name: g, bookCount: 0, pagesRead: 0 };
        }
        genreMap[g].bookCount += 1;
        genreMap[g].pagesRead += (b.current_page || 0);
      });
    });

    const list = Object.values(genreMap).sort((a, b) => b.bookCount - a.bookCount);
    const totalBooks = list.reduce((acc, item) => acc + item.bookCount, 0);

    return list.map(item => ({
      ...item,
      percentage: totalBooks > 0 ? Math.round((item.bookCount / totalBooks) * 100) : 0
    }));
  },

  calculateStreak(sessions) {
    if (!sessions || sessions.length === 0) return 0;

    const uniqueDays = new Set(
      sessions.map(s => {
        const d = new Date(s.start_time || s.created_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    );

    let streak = 0;
    const checkDate = new Date();

    // Check today first, if not found check yesterday
    const todayStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    let isStreakActive = uniqueDays.has(todayStr);

    if (!isStreakActive) {
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      isStreakActive = uniqueDays.has(yesterdayStr);
    }

    if (!isStreakActive) return 0;

    while (true) {
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (uniqueDays.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }
};
