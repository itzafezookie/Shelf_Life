import { db } from '../db/db';

export const bookService = {
  async getAllBooks() {
    return await db.books.toArray();
  },

  async getBookById(id) {
    return await db.books.get(id);
  },

  async addBook(bookData) {
    const totalPages = Math.max(0, parseInt(bookData.pages_total, 10) || 0);
    const currentPage = Math.min(totalPages, Math.max(0, parseInt(bookData.current_page, 10) || 0));

    let status = bookData.status || 'reading';
    if (currentPage >= totalPages && totalPages > 0) {
      status = 'completed';
    }

    const newBook = {
      id: bookData.id || `book_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      title: (bookData.title || 'Untitled').trim(),
      author: (bookData.author || 'Unknown Author').trim(),
      pages_total: totalPages,
      current_page: currentPage,
      status,
      cover_url: bookData.cover_url || '',
      genres: Array.isArray(bookData.genres) ? bookData.genres : [],
      due_date: bookData.due_date || '',
      rating: bookData.rating ? Number(bookData.rating) : null,
      notes: bookData.notes || '',
      theme_mode: bookData.theme_mode || 'auto',
      words_per_page: Number(bookData.words_per_page) || 250,
      completed_date: status === 'completed' ? new Date().toISOString() : null,
      created_at: new Date().toISOString()
    };

    await db.books.add(newBook);

    // Automatically set as the active focus book if it's currently being read
    if (bookData.setAsActiveFocus !== false && status === 'reading') {
      await this.setCurrentFocusBook(newBook.id);
    }

    return newBook;
  },

  async updateBook(id, updates) {
    const existing = await db.books.get(id);
    if (!existing) throw new Error(`Book ${id} not found`);

    const updated = { ...existing, ...updates };

    // Auto-update status if pages reached total
    if (updated.pages_total > 0 && updated.current_page >= updated.pages_total && updated.status !== 'completed') {
      updated.status = 'completed';
      updated.completed_date = new Date().toISOString();
    } else if (updated.current_page > 0 && updated.current_page < updated.pages_total && updated.status === 'to-read') {
      updated.status = 'reading';
    }

    await db.books.put(updated);
    return updated;
  },

  async deleteBook(id) {
    await db.books.delete(id);
    // Also remove associated sessions
    await db.sessions.where('book_id').equals(id).delete();

    // If current focus book was deleted, clear it
    const currentFocusId = await this.getCurrentFocusBookId();
    if (currentFocusId === id) {
      await db.settings.delete('currentBookId');
    }
  },

  async setCurrentFocusBook(bookId) {
    await db.settings.put({ key: 'currentBookId', value: bookId });
  },

  async getCurrentFocusBookId() {
    const setting = await db.settings.get('currentBookId');
    return setting ? setting.value : null;
  },

  async searchOpenLibrary(query) {
    if (!query || query.trim().length < 2) return [];

    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
      query.trim()
    )}&fields=key,title,author_name,number_of_pages_median,number_of_pages,cover_i,subject,first_publish_year&limit=12`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Open Library API returned status ${response.status}`);
      const data = await response.json();

      return (data.docs || []).map((doc) => {
        const coverId = doc.cover_i;
        const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : '';
        const author = doc.author_name ? doc.author_name.join(', ') : 'Unknown Author';
        const pages = doc.number_of_pages_median || doc.number_of_pages || 0;
        const genres = cleanGenres(doc.subject || []);

        return {
          id: `ol_${doc.key ? doc.key.replace(/\//g, '_') : Date.now()}`,
          title: doc.title,
          author,
          pages_total: pages,
          cover_url: coverUrl,
          genres,
          first_publish_year: doc.first_publish_year
        };
      });
    } catch (err) {
      console.error('[BookService] Open Library search failed:', err);
      return [];
    }
  }
};

/**
 * Normalizes raw library cataloging subjects into clean, readable book genres
 */
function cleanGenres(subjects = []) {
  if (!subjects || !subjects.length) return ['Fiction'];

  const blacklist = /^(nyt:|award:|series:|new york times|overdrive|accessible book|protected daisy|electronic book|large type|reading level|translations? into|audiobook|paperback|hardcover|general$|fiction$)/i;

  const GENRE_RULES = [
    { regex: /\b(litrpg|gamelit)\b/i, name: 'LitRPG' },
    { regex: /\b(sci-?fi|science[ -]fiction)\b/i, name: 'Sci-Fi' },
    { regex: /\b(fantasy|high fantasy|epic fantasy|urban fantasy)\b/i, name: 'Fantasy' },
    { regex: /\b(mystery|detective|crime|whodunit)\b/i, name: 'Mystery' },
    { regex: /\b(thriller|suspense)\b/i, name: 'Thriller' },
    { regex: /\b(horror|gothic|dark fantasy)\b/i, name: 'Horror' },
    { regex: /\b(romance|contemporary romance|love stories)\b/i, name: 'Romance' },
    { regex: /\b(biograph|memoir|autobiograph)/i, name: 'Biography' },
    { regex: /\b(history|historical fiction|historical)\b/i, name: 'History' },
    { regex: /\b(self-?help|personal growth|habit|motivation)\b/i, name: 'Self-Help' },
    { regex: /\b(business|economics|entrepreneur|finance)\b/i, name: 'Business' },
    { regex: /\b(psychology|behavior|mental health)\b/i, name: 'Psychology' },
    { regex: /\b(philosophy|ethics)\b/i, name: 'Philosophy' },
    { regex: /\b(adventure|action)\b/i, name: 'Adventure' },
    { regex: /\b(young adult|ya|teen)\b/i, name: 'Young Adult' },
    { regex: /\b(dystopi(a|an)|post-apocalyptic)\b/i, name: 'Dystopian' },
    { regex: /\b(classic|literature)\b/i, name: 'Classics' }
  ];

  const matched = new Set();

  for (const raw of subjects) {
    if (typeof raw !== 'string') continue;
    const s = raw.replace(/^genre:/i, '').trim();
    if (blacklist.test(s)) continue;

    for (const rule of GENRE_RULES) {
      if (rule.regex.test(s)) {
        matched.add(rule.name);
        break;
      }
    }
    if (matched.size >= 3) break;
  }

  // Fallback: If no recognized genre rule matched, clean and title-case the best non-blacklisted subject
  if (matched.size === 0) {
    for (const raw of subjects) {
      const s = raw.replace(/^genre:/i, '').trim();
      if (!blacklist.test(s) && s.length > 2 && s.length < 25 && !s.includes('=')) {
        const titleCased = s
          .split(/[\s,/-]+/)
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        if (titleCased) matched.add(titleCased);
        if (matched.size >= 2) break;
      }
    }
  }

  return matched.size > 0 ? Array.from(matched).slice(0, 3) : ['Fiction'];
}

