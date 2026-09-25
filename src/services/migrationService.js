import { db } from '../db/db';

/**
 * Migration Service
 * Safely transfers existing 1.0 localStorage data into the 2.0 Dexie IndexedDB.
 */
export async function runLegacyMigrationIfNeeded() {
  try {
    const isMigrated = await db.settings.get('legacy_migrated_v2');
    if (isMigrated && isMigrated.value) {
      return { migrated: false, reason: 'Already migrated' };
    }

    const legacyBooksRaw = localStorage.getItem('shelfLife_books');
    const legacySessionsRaw = localStorage.getItem('shelfLife_sessions');
    const legacyGenresRaw = localStorage.getItem('shelfLife_genres');
    const legacyCurrentBookId = localStorage.getItem('currentBookId');
    const legacyBaselineWPM = localStorage.getItem('shelfLife_baselineWPM');

    let migratedBooksCount = 0;
    let migratedSessionsCount = 0;
    let migratedGenresCount = 0;

    // Migrate Books
    if (legacyBooksRaw) {
      try {
        const books = JSON.parse(legacyBooksRaw);
        if (Array.isArray(books) && books.length > 0) {
          const standardizedBooks = books.map(b => ({
            id: b.id || `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: b.title || 'Untitled Book',
            author: b.author || 'Unknown Author',
            pages_total: Number(b.pages_total || b.totalPages || 0),
            current_page: Number(b.current_page || b.currentPage || 0),
            status: b.status || (b.current_page >= b.pages_total && b.pages_total > 0 ? 'completed' : 'to-read'),
            cover_url: b.cover_url || b.coverUrl || '',
            genres: Array.isArray(b.genres) ? b.genres : (b.genre ? [b.genre] : []),
            due_date: b.due_date || b.dueDate || '',
            rating: b.rating || null,
            created_at: b.created_at || new Date().toISOString()
          }));
          await db.books.bulkPut(standardizedBooks);
          migratedBooksCount = standardizedBooks.length;
        }
      } catch (err) {
        console.warn('[MigrationService] Failed to parse legacy books:', err);
      }
    }

    // Migrate Sessions
    if (legacySessionsRaw) {
      try {
        const sessions = JSON.parse(legacySessionsRaw);
        if (Array.isArray(sessions) && sessions.length > 0) {
          const standardizedSessions = sessions.map(s => {
            const duration = Number(s.duration_seconds || s.elapsedTime || s.duration || 0);
            const startP = Number(s.start_page ?? s.startPage ?? 0);
            const endP = Number(s.end_page ?? s.endPage ?? 0);
            const pagesRead = Number(s.pages_read ?? s.pagesRead ?? Math.max(0, endP - startP));
            const durationMin = duration / 60;
            const pace = durationMin > 0 ? Number((pagesRead / durationMin).toFixed(2)) : 0;

            return {
              id: s.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              book_id: s.book_id || s.bookId || '',
              start_time: s.start_time || s.startTime || new Date().toISOString(),
              end_time: s.end_time || s.endTime || new Date().toISOString(),
              duration_seconds: duration,
              start_page: startP,
              end_page: endP,
              pages_read: pagesRead,
              pace_ppm: s.pace_ppm || pace,
              exclude_from_pace: Boolean(s.exclude_from_pace ?? s.excludeFromPace ?? false),
              created_at: s.created_at || new Date().toISOString()
            };
          });
          await db.sessions.bulkPut(standardizedSessions);
          migratedSessionsCount = standardizedSessions.length;
        }
      } catch (err) {
        console.warn('[MigrationService] Failed to parse legacy sessions:', err);
      }
    }

    // Migrate Genres
    if (legacyGenresRaw) {
      try {
        const genres = JSON.parse(legacyGenresRaw);
        if (Array.isArray(genres) && genres.length > 0) {
          const standardizedGenres = genres.map((g, idx) => {
            const name = typeof g === 'string' ? g : g.name || `Genre ${idx + 1}`;
            return {
              id: typeof g === 'object' && g.id ? g.id : `genre_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
              name,
              color: (typeof g === 'object' && g.color) ? g.color : '#f59e0b',
              created_at: new Date().toISOString()
            };
          });
          await db.genres.bulkPut(standardizedGenres);
          migratedGenresCount = standardizedGenres.length;
        }
      } catch (err) {
        console.warn('[MigrationService] Failed to parse legacy genres:', err);
      }
    }

    // Migrate Current Focus Book ID
    if (legacyCurrentBookId) {
      await db.settings.put({ key: 'currentBookId', value: legacyCurrentBookId });
    }

    // Migrate Baseline WPM
    if (legacyBaselineWPM) {
      await db.settings.put({ key: 'baselineWPM', value: parseFloat(legacyBaselineWPM) || 250 });
    }

    // Mark as migrated
    await db.settings.put({
      key: 'legacy_migrated_v2',
      value: true,
      timestamp: new Date().toISOString(),
      summary: {
        books: migratedBooksCount,
        sessions: migratedSessionsCount,
        genres: migratedGenresCount
      }
    });

    console.info(`[MigrationService] Completed: Migrated ${migratedBooksCount} books, ${migratedSessionsCount} sessions, ${migratedGenresCount} genres.`);
    return { migrated: true, books: migratedBooksCount, sessions: migratedSessionsCount };
  } catch (error) {
    console.error('[MigrationService] Error running migration:', error);
    return { migrated: false, error };
  }
}
