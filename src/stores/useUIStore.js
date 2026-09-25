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

  // Data Backup / Restore Modal
  isDataManagementOpen: false,
  setDataManagementOpen: (open) => set({ isDataManagementOpen: open }),

  // Library Filtering & Search
  libraryFilter: 'all', // 'all' | 'reading' | 'to-read' | 'completed'
  setLibraryFilter: (filter) => set({ libraryFilter: filter }),

  selectedGenreFilter: null,
  setSelectedGenreFilter: (genre) => set({ selectedGenreFilter: genre }),

  librarySearchQuery: '',
  setLibrarySearchQuery: (query) => set({ librarySearchQuery: query })
}));
