import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import { runLegacyMigrationIfNeeded } from './services/migrationService';
import { useUIStore } from './stores/useUIStore';
import { analyticsEngine } from './services/analyticsEngine';
import { extractPaletteFromImage, getTextOnColor } from './services/colorExtractor';

// Layout
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';

// Tab Views (Cozy Modern Light Interface)
import { CurrentBookHero } from './components/current/CurrentBookHero';
import { SessionControls } from './components/current/SessionControls';
import { PaceStatsCard } from './components/current/PaceStatsCard';
import { BookList } from './components/library/BookList';
import { StatsOverview } from './components/analytics/StatsOverview';
import { GenreBreakdown } from './components/analytics/GenreBreakdown';
import { ReadingTrends } from './components/analytics/ReadingTrends';

// Global Modals
import { AddBookModal } from './components/library/AddBookModal';
import { BookDetailModal } from './components/library/BookDetailModal';
import { FinishSessionModal } from './components/modals/FinishSessionModal';
import { SpeedOverrideModal } from './components/modals/SpeedOverrideModal';
import { DataManagementModal } from './components/modals/DataManagementModal';
import { PageScannerModal } from './components/modals/PageScannerModal';
import { PaletteCustomizerModal } from './components/modals/PaletteCustomizerModal';
import { ReadingSpeedTestModal } from './components/modals/ReadingSpeedTestModal';

export function App() {
  const { activeTab } = useUIStore();
  const [bookPalette, setBookPalette] = useState(null);

  // Reactive IndexedDB queries via Dexie
  const books = useLiveQuery(() => db.books.toArray(), []) || [];
  const sessions = useLiveQuery(() => db.sessions.reverse().sortBy('created_at'), []) || [];
  const currentFocusSetting = useLiveQuery(() => db.settings.get('currentBookId'), []);
  const baselineWPMSetting = useLiveQuery(() => db.settings.get('baselineWPM'), []);

  const currentFocusBookId = currentFocusSetting?.value;
  const baselineWPM = baselineWPMSetting?.value || 250;

  // Active reading book resolution: only returns a book currently being read
  const currentBook = useMemo(() => {
    if (currentFocusBookId) {
      const match = books.find((b) => b.id === currentFocusBookId);
      if (match && match.status !== 'completed') return match;
    }
    return books.find((b) => b.status === 'reading') || null;
  }, [books, currentFocusBookId]);

  // Extract top 3 cover colors whenever the active book, theme_mode, or custom_palette changes
  useEffect(() => {
    let isCancelled = false;
    async function loadPalette() {
      if (!currentBook) {
        setBookPalette(null);
        return;
      }
      try {
        const palette = await extractPaletteFromImage(
          currentBook.cover_url,
          currentBook.title,
          currentBook.theme_mode || 'auto'
        );
        if (!isCancelled) {
          if (currentBook.custom_palette) {
            const cp = currentBook.custom_palette;
            const primary = cp.primary || palette.primary;
            const secondary = cp.secondary || palette.secondary;
            const tertiary = cp.tertiary || palette.tertiary;

            const clean = (primary || '#0284c7').replace('#', '');
            const r1 = parseInt(clean.substring(0, 2), 16) || 2;
            const g1 = parseInt(clean.substring(2, 4), 16) || 132;
            const b1 = parseInt(clean.substring(4, 6), 16) || 199;

            // Calculate text contrast for primary button
            const textOnPrimary = getTextOnColor(primary);

            setBookPalette({
              ...palette,
              primary,
              secondary,
              tertiary,
              topColors: [primary, secondary, tertiary],
              textOnPrimary,
              tint: `rgba(${r1}, ${g1}, ${b1}, ${palette?.isDark ? 0.12 : 0.05})`,
              tintMedium: `rgba(${r1}, ${g1}, ${b1}, ${palette?.isDark ? 0.22 : 0.12})`
            });
          } else {
            setBookPalette(palette);
          }
        }
      } catch (e) {
        console.warn('[App] Palette extraction error:', e);
      }
    }
    loadPalette();
    return () => {
      isCancelled = true;
    };
  }, [
    currentBook?.cover_url,
    currentBook?.title,
    currentBook?.theme_mode,
    currentBook?.custom_palette?.primary,
    currentBook?.custom_palette?.secondary,
    currentBook?.custom_palette?.tertiary
  ]);

  // ETA text for active book
  const etaText = useMemo(() => {
    if (!currentBook) return '';
    const pacePPM = analyticsEngine.calculateAveragePacePPM(sessions, baselineWPM, currentBook.words_per_page);
    const eta = analyticsEngine.calculateBookETA(currentBook, pacePPM);
    return eta.formattedDuration;
  }, [currentBook, sessions, baselineWPM]);

  // One-time legacy migration check
  useEffect(() => {
    async function initApp() {
      try {
        await runLegacyMigrationIfNeeded();
      } catch (err) {
        console.error('[App] Migration initialization failed:', err);
      }
    }
    initApp();
  }, []);

  // Full app theme derived from current active book (reverts cleanly if no active book)
  const isDarkApp = Boolean(currentBook && bookPalette?.isDark);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none pb-20 sm:pb-8 transition-colors duration-500 ${
        isDarkApp
          ? 'bg-[#0e0d12] text-[#f5f5f4]'
          : 'bg-[#fbf8f3] text-[#292524]'
      }`}
      style={
        isDarkApp && bookPalette?.primary
          ? {
              backgroundImage: `radial-gradient(ellipse 90% 45% at 50% 0%, ${bookPalette.primary}18 0%, transparent 65%)`
            }
          : undefined
      }
    >
      {/* 1. Header with Official Dynamic Logo & Quick Actions */}
      <Header palette={bookPalette} isDark={isDarkApp} />

      {/* 2. Top Navigation for Desktop */}
      <Navigation palette={bookPalette} isDark={isDarkApp} />

      {/* 3. Main Content Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {/* TAB 1: READING */}
        {activeTab === 'current' && (
          <div className="space-y-5 max-w-xl mx-auto animate-fade-in">
            <CurrentBookHero book={currentBook} etaText={etaText} palette={bookPalette} />
            <SessionControls book={currentBook} palette={bookPalette} />
            <PaceStatsCard
              book={currentBook}
              sessions={sessions}
              baselineWPM={baselineWPM}
              palette={bookPalette}
            />
          </div>
        )}

        {/* TAB 2: LIBRARY & READING LOG */}
        {activeTab === 'library' && (
          <div className="w-full animate-fade-in">
            <BookList
              books={books}
              currentFocusBookId={currentFocusBookId}
              sessions={sessions}
              palette={bookPalette}
              isDark={isDarkApp}
            />
          </div>
        )}

        {/* TAB 3: STATS */}
        {activeTab === 'analytics' && (
          <div className="space-y-5 max-w-2xl mx-auto animate-fade-in">
            <StatsOverview
              books={books}
              sessions={sessions}
              baselineWPM={baselineWPM}
              palette={bookPalette}
              isDark={isDarkApp}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <GenreBreakdown books={books} palette={bookPalette} isDark={isDarkApp} />
              <ReadingTrends
                sessions={sessions}
                baselineWPM={baselineWPM}
                palette={bookPalette}
                isDark={isDarkApp}
              />
            </div>
          </div>
        )}
      </main>

      {/* 4. Global Modals (Themed with active book palette & mode) */}
      <AddBookModal palette={bookPalette} isDark={isDarkApp} />
      <BookDetailModal
        books={books}
        currentFocusBookId={currentFocusBookId}
        palette={bookPalette}
        isDark={isDarkApp}
      />
      <FinishSessionModal palette={bookPalette} isDark={isDarkApp} />
      <SpeedOverrideModal
        baselineWPM={baselineWPM}
        palette={bookPalette}
        isDark={isDarkApp}
      />
      <DataManagementModal palette={bookPalette} isDark={isDarkApp} />
      <PageScannerModal palette={bookPalette} isDark={isDarkApp} />
      <PaletteCustomizerModal palette={bookPalette} isDark={isDarkApp} />
      <ReadingSpeedTestModal palette={bookPalette} isDark={isDarkApp} />
    </div>
  );
}

export default App;
