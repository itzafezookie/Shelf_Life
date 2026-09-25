import Dexie from 'dexie';

export class ShelfLifeDB extends Dexie {
  constructor() {
    super('ShelfLifeDB');
    this.version(1).stores({
      books: 'id, title, author, status, due_date, created_at, *genres',
      sessions: 'id, book_id, start_time, end_time, created_at, exclude_from_pace',
      genres: 'id, &name',
      settings: '&key'
    });
  }
}

export const db = new ShelfLifeDB();
