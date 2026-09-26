import { create } from 'zustand';

export const useUIStore = create((set) => ({
  activeTab: 'current',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Modals & Panels
  isAddBookOpen: false,
  setAddBookOpen: (open) => set({ isAddBookOpen: open }),

  selectedBookId: null,
  isDetailModalOpen: false,
  openBookDetail: (bookId) => set({ selectedBookId: bookId, isDetailModalOpen: true }),
  closeBookDetail: () => set({ selectedBookId: null, isDetailModalOpen: false }),

  // Session Completion Flow
  isFinishSessionOpen: false,
  pendingSessionSummary: null,
  openFinishSession: (summary) => set({ pendingSessionSummary: summary, isFinishSessionOpen: true }),
  closeFinishSession: () => set({ pendingSessionSummary: null, isFinishSessionOpen: false }),

  // Speed Override Modal
  isSpeedOverrideOpen: false,
  setSpeedOverrideOpen: (open) => set({ isSpeedOverrideOpen: open }),

  // Reading Speed Test Modal
  isSpeedTestOpen: false,
  openSpeedTest: () => set({ isSpeedTestOpen: true }),
  closeSpeedTest: () => set({ isSpeedTestOpen: false }),

  // Data Backup / Restore Modal
  isDataManagementOpen: false,
  setDataManagementOpen: (open) => set({ isDataManagementOpen: open }),

  // Book Density / Page Scanner Modal
  isPageScannerOpen: false,
  pageScannerBook: null,
  pageScannerCallback: null,
  openPageScanner: (book, callback = null) => set({ pageScannerBook: book, pageScannerCallback: callback, isPageScannerOpen: true }),
  closePageScanner: () => set({ pageScannerBook: null, pageScannerCallback: null, isPageScannerOpen: false }),

  // Palette Customizer Modal
  isPaletteCustomizerOpen: false,
  paletteCustomizerBook: null,
  openPaletteCustomizer: (book) => set({ paletteCustomizerBook: book, isPaletteCustomizerOpen: true }),
  closePaletteCustomizer: () => set({ paletteCustomizerBook: null, isPaletteCustomizerOpen: false }),


  // Shareable Book Completed Card Modal
  isCompletedCardOpen: false,
  completedCardBook: null,
  openCompletedCard: (book) => set({ completedCardBook: book, isCompletedCardOpen: true }),
  closeCompletedCard: () => set({ completedCardBook: null, isCompletedCardOpen: false }),

  // Library Filtering & Search
  libraryFilter: 'all', // 'all' | 'reading' | 'to-read' | 'completed'
  setLibraryFilter: (filter) => set({ libraryFilter: filter }),

  selectedGenreFilter: null,
  setSelectedGenreFilter: (genre) => set({ selectedGenreFilter: genre }),

  librarySearchQuery: '',
  setLibrarySearchQuery: (query) => set({ librarySearchQuery: query })
}));
