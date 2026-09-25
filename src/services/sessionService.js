import { db } from '../db/db';
import { bookService } from './bookService';

export const sessionService = {
  async getAllSessions() {
    return await db.sessions.reverse().sortBy('created_at');
  },

  async getSessionsForBook(bookId) {
    return await db.sessions.where('book_id').equals(bookId).reverse().sortBy('created_at');
  },

  async logCompletedSession({ bookId, startTime, endTime, durationSeconds, startPage, endPage, excludeFromPace = false }) {
    const durationMin = durationSeconds / 60;
    const pagesRead = Math.max(0, endPage - startPage);
    const pace = durationMin > 0 ? Number((pagesRead / durationMin).toFixed(2)) : 0;

    const newSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      book_id: bookId,
      start_time: startTime,
      end_time: endTime,
      duration_seconds: durationSeconds,
      start_page: startPage,
      end_page: endPage,
      pages_read: pagesRead,
      pace_ppm: pace,
      exclude_from_pace: Boolean(excludeFromPace),
      created_at: new Date().toISOString()
    };

    await db.sessions.add(newSession);

    // Update book current page
    if (bookId) {
      const book = await bookService.getBookById(bookId);
      if (book) {
        const updatedCurrentPage = Math.max(book.current_page || 0, endPage);
        await bookService.updateBook(bookId, {
          current_page: updatedCurrentPage
        });
      }
    }

    return newSession;
  },

  async deleteSession(sessionId) {
    await db.sessions.delete(sessionId);
  },

  async toggleExcludeFromPace(sessionId, exclude) {
    await db.sessions.update(sessionId, { exclude_from_pace: exclude });
  }
};
