import { db } from '../db/db';

export const exportImportService = {
  async exportData() {
    const books = await db.books.toArray();
    const sessions = await db.sessions.toArray();
    const genres = await db.genres.toArray();
    const settings = await db.settings.toArray();

    const payload = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      books,
      sessions,
      genres,
      settings
    };

    const dataBlob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shelf-life-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return payload;
  },

  async importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = JSON.parse(e.target.result);
          if (!content.books && !content.sessions) {
            throw new Error('Invalid Shelf Life backup file format.');
          }

          if (Array.isArray(content.books) && content.books.length > 0) {
            await db.books.bulkPut(content.books);
          }
          if (Array.isArray(content.sessions) && content.sessions.length > 0) {
            await db.sessions.bulkPut(content.sessions);
          }
          if (Array.isArray(content.genres) && content.genres.length > 0) {
            await db.genres.bulkPut(content.genres);
          }
          if (Array.isArray(content.settings) && content.settings.length > 0) {
            await db.settings.bulkPut(content.settings);
          }

          resolve({
            booksCount: content.books?.length || 0,
            sessionsCount: content.sessions?.length || 0
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
};
