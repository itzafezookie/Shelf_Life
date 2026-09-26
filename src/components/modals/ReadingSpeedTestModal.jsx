import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  BookOpen,
  RotateCw,
  Play,
  CheckCircle2,
  Timer,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  BookmarkCheck,
  Type
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { speedTestService } from '../../services/speedTestService';
import { db } from '../../db/db';
import { analyticsEngine } from '../../services/analyticsEngine';

export function ReadingSpeedTestModal({ palette, isDark }) {
  const { isSpeedTestOpen, closeSpeedTest } = useUIStore();

  // Test state: 'ready' | 'reading' | 'result'
  const [phase, setPhase] = useState('ready');
  const [currentExcerpt, setCurrentExcerpt] = useState(null);
  const [isLoadingExcerpt, setIsLoadingExcerpt] = useState(false);

  // Reader Customization
  const [fontSize, setFontSize] = useState('medium'); // 'small' | 'medium' | 'large'
  const [paperTheme, setPaperTheme] = useState('sepia'); // 'sepia' | 'dark' | 'cream'
  const [showTimer, setShowTimer] = useState(true);

  // Timer & Results
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [calculatedWpm, setCalculatedWpm] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const textContainerRef = useRef(null);

  const primaryColor = palette?.primary || '#0284c7';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  // Load a fresh excerpt when opened
  useEffect(() => {
    if (isSpeedTestOpen) {
      setPhase('ready');
      setElapsedSeconds(0);
      setIsSaved(false);
      loadFreshExcerpt();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isSpeedTestOpen]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadFreshExcerpt = async () => {
    setIsLoadingExcerpt(true);
    try {
      const excerpt = await speedTestService.fetchFreshOnlineExcerpt(currentExcerpt?.title);
      setCurrentExcerpt(excerpt);
    } catch {
      const fallback = speedTestService.getRandomClassicExcerpt(currentExcerpt?.title);
      setCurrentExcerpt(fallback);
    } finally {
      setIsLoadingExcerpt(false);
    }
  };

  const handleStartReading = () => {
    setPhase('reading');
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();

    // Scroll to top of text container
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = 0;
    }

    timerRef.current = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(seconds);
    }, 1000);
  };

  const handleFinishReading = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = Math.max(1, (Date.now() - (startTimeRef.current || Date.now())) / 1000);
    const words = currentExcerpt?.wordCount || speedTestService.countWords(currentExcerpt?.text || '');
    const wpm = speedTestService.calculateWPM(words, duration);

    setElapsedSeconds(Math.round(duration));
    setCalculatedWpm(wpm);
    setPhase('result');
  };

  const handleSaveBaseline = async () => {
    if (calculatedWpm > 0) {
      await db.settings.put({ key: 'baselineWPM', value: calculatedWpm });
      setIsSaved(true);
      setTimeout(() => {
        closeSpeedTest();
      }, 1200);
    }
  };

  if (!isSpeedTestOpen) return null;

  // Format elapsed time string
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Font size styling for reader
  const fontClasses = {
    small: 'text-base sm:text-lg leading-relaxed',
    medium: 'text-lg sm:text-xl leading-loose',
    large: 'text-xl sm:text-2xl leading-loose'
  }[fontSize];

  // Theme styling for paper container
  const paperThemeStyles = {
    sepia: {
      bg: isDark ? 'bg-[#1e1b18]' : 'bg-[#f7f2e8]',
      card: isDark ? 'bg-[#181512] text-[#e8e0d5] border-[#2e2924]' : 'bg-[#fffcf7] text-[#2c2724] border-[#e8dfcf]',
      subtext: isDark ? 'text-[#a39686]' : 'text-[#87796a]',
      highlight: isDark ? 'bg-[#2b241e]' : 'bg-[#f0e7d8]'
    },
    dark: {
      bg: 'bg-[#0f0e13]',
      card: 'bg-[#15141b] text-[#f2efe9] border-white/10',
      subtext: 'text-stone-400',
      highlight: 'bg-white/5'
    },
    cream: {
      bg: isDark ? 'bg-[#141818]' : 'bg-[#f5f6f4]',
      card: isDark ? 'bg-[#111616] text-[#e0e6e6] border-[#202929]' : 'bg-[#ffffff] text-[#1f2937] border-[#e5e7eb]',
      subtext: isDark ? 'text-stone-400' : 'text-stone-500',
      highlight: isDark ? 'bg-[#1a2323]' : 'bg-[#f3f4f6]'
    }
  }[paperTheme];

  const paceCategory = speedTestService.getPaceCategory(calculatedWpm);
  const calculatedPpm = analyticsEngine.calculatePPMFromWPM(calculatedWpm);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 ${paperThemeStyles.card}`}
      >
        {/* Header Bar */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
            isDark ? 'border-white/10' : 'border-[#e8dfcf]'
          } ${paperThemeStyles.highlight}`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-editorial flex items-center gap-2">
                Reading Pace Test
                {phase === 'reading' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider animate-pulse">
                    Reading Mode
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Font Size Selector (Available in Ready & Reading) */}
            {phase !== 'result' && (
              <div className="flex items-center rounded-lg border border-stone-300/40 dark:border-white/10 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFontSize('small')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer font-serif ${
                    fontSize === 'small' ? 'bg-stone-200 dark:bg-white/20 font-bold' : 'opacity-60 hover:opacity-100'
                  }`}
                  title="Small text"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('medium')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer font-serif ${
                    fontSize === 'medium' ? 'bg-stone-200 dark:bg-white/20 font-bold' : 'opacity-60 hover:opacity-100'
                  }`}
                  title="Medium text"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('large')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer font-serif font-bold text-sm ${
                    fontSize === 'large' ? 'bg-stone-200 dark:bg-white/20' : 'opacity-60 hover:opacity-100'
                  }`}
                  title="Large text"
                >
                  A+
                </button>
              </div>
            )}

            {/* Theme selector */}
            {phase !== 'result' && (
              <div className="hidden sm:flex items-center gap-1 rounded-lg border border-stone-300/40 dark:border-white/10 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPaperTheme('sepia')}
                  className={`w-5 h-5 rounded-md transition-all cursor-pointer bg-[#f7f2e8] border border-[#e8dfcf] ${
                    paperTheme === 'sepia' ? 'ring-2 ring-amber-500 scale-105' : 'opacity-70'
                  }`}
                  title="Sepia Paper"
                />
                <button
                  type="button"
                  onClick={() => setPaperTheme('dark')}
                  className={`w-5 h-5 rounded-md transition-all cursor-pointer bg-[#15141b] border border-stone-700 ${
                    paperTheme === 'dark' ? 'ring-2 ring-purple-500 scale-105' : 'opacity-70'
                  }`}
                  title="Night Velvet"
                />
                <button
                  type="button"
                  onClick={() => setPaperTheme('cream')}
                  className={`w-5 h-5 rounded-md transition-all cursor-pointer bg-white border border-stone-300 ${
                    paperTheme === 'cream' ? 'ring-2 ring-sky-500 scale-105' : 'opacity-70'
                  }`}
                  title="Clean Neutral"
                />
              </div>
            )}

            {/* Close */}
            <button
              onClick={closeSpeedTest}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-white/10 text-stone-400 hover:text-white' : 'hover:bg-black/5 text-stone-500 hover:text-stone-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =============================================================== */}
        {/* PHASE 1: READY / INSTRUCTIONS */}
        {/* =============================================================== */}
        {phase === 'ready' && (
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
            <div className="text-center max-w-lg mx-auto space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Fresh Sample Generator
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-editorial">
                Measure Your Natural Reading Pace
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${paperThemeStyles.subtext}`}>
                Read the excerpt at your natural, everyday pace. Don’t rush or skim—the goal is comfortable, authentic comprehension.
              </p>
            </div>

            {/* Excerpt Meta Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${paperThemeStyles.highlight} ${
                isDark ? 'border-white/10' : 'border-[#e8dfcf]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-stone-500/10">
                      {currentExcerpt?.source || 'Excerpt'}
                    </span>
                    <span className={`text-xs font-mono ${paperThemeStyles.subtext}`}>
                      ≈ {currentExcerpt?.wordCount || 0} words
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold font-editorial mt-1">
                    {currentExcerpt?.title || 'Loading excerpt...'}
                  </h4>
                  <p className={`text-xs ${paperThemeStyles.subtext}`}>
                    {currentExcerpt?.author ? `by ${currentExcerpt.author}` : currentExcerpt?.genre || ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadFreshExcerpt}
                  disabled={isLoadingExcerpt}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-200'
                      : 'bg-white hover:bg-stone-50 border-[#e8dfcf] text-stone-700 shadow-2xs'
                  }`}
                  title="Load a completely different randomized passage"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoadingExcerpt ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Shuffle Text</span>
                </button>
              </div>

              {/* Sneak peek / preview */}
              <div className="mt-3 pt-3 border-t border-dashed border-stone-300/50 dark:border-white/10">
                <p className={`text-xs line-clamp-2 italic ${paperThemeStyles.subtext}`}>
                  "{currentExcerpt?.text?.slice(0, 140)}..."
                </p>
              </div>
            </div>

            {/* Ready Call To Action */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={closeSpeedTest}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border ${
                  isDark
                    ? 'border-white/10 hover:bg-white/5 text-stone-400'
                    : 'border-stone-300 hover:bg-stone-100 text-stone-600'
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartReading}
                disabled={isLoadingExcerpt || !currentExcerpt}
                className="w-full sm:flex-1 py-3 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer hover:opacity-95 active:scale-98"
                style={{
                  backgroundColor: primaryColor,
                  color: textOnPrimary,
                  boxShadow: `0 4px 18px ${primaryColor}40`
                }}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Begin Reading Now</span>
              </button>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* PHASE 2: DISTRACTION-FREE READING VIEW */}
        {/* =============================================================== */}
        {phase === 'reading' && (
          <div className="flex flex-col flex-1 overflow-hidden relative">
            {/* Subtle E-Book Top Bar */}
            <div
              className={`flex items-center justify-between px-6 py-2 border-b text-xs shrink-0 select-none ${
                isDark ? 'border-white/5 bg-black/20' : 'border-[#e8dfcf]/60 bg-black/2'
              }`}
            >
              <div className={`text-[11px] font-mono truncate max-w-[200px] ${paperThemeStyles.subtext}`}>
                {currentExcerpt?.title}
              </div>

              <div className="flex items-center gap-3">
                {showTimer ? (
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-stone-500 dark:text-stone-400">
                    <Timer className="w-3.5 h-3.5" />
                    <span>{formatTime(elapsedSeconds)}</span>
                  </div>
                ) : (
                  <span className={`text-[11px] italic ${paperThemeStyles.subtext}`}>Timer hidden</span>
                )}

                <button
                  type="button"
                  onClick={() => setShowTimer(!showTimer)}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/10 text-stone-400' : 'hover:bg-black/5 text-stone-500'
                  }`}
                  title={showTimer ? 'Hide timer for zero distraction' : 'Show timer'}
                >
                  {showTimer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* E-Book Text Container */}
            <div
              ref={textContainerRef}
              className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 sm:py-10 max-w-xl mx-auto w-full select-text"
            >
              {/* Subtle title ornament */}
              <div className="text-center mb-8 select-none">
                <h3 className="font-editorial text-lg sm:text-xl font-bold tracking-tight">
                  {currentExcerpt?.title}
                </h3>
                {currentExcerpt?.author && (
                  <p className={`text-xs mt-1 font-serif italic ${paperThemeStyles.subtext}`}>
                    {currentExcerpt.author}
                  </p>
                )}
                <div className="w-12 h-0.5 mx-auto mt-3 bg-stone-300 dark:bg-stone-700/60 rounded-full" />
              </div>

              {/* Passage Paragraphs */}
              <div className={`font-serif tracking-normal text-justify ${fontClasses} space-y-4`}>
                {currentExcerpt?.text.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="indent-6 sm:indent-8">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* End of Passage Ornament */}
              <div className="my-10 text-center select-none">
                <span className={`text-sm tracking-widest ${paperThemeStyles.subtext}`}>❦ ❦ ❦</span>
              </div>

              {/* Big "Finished Reading" Button */}
              <div className="pt-2 pb-6">
                <button
                  type="button"
                  onClick={handleFinishReading}
                  className="w-full py-4 px-6 rounded-2xl text-base font-bold flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer hover:opacity-95 active:scale-98"
                  style={{
                    backgroundColor: primaryColor,
                    color: textOnPrimary,
                    boxShadow: `0 6px 24px ${primaryColor}40`
                  }}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>I'm Finished Reading</span>
                </button>
                <p className={`text-center text-[11px] mt-2 ${paperThemeStyles.subtext}`}>
                  Click as soon as you finish the last word.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* PHASE 3: RESULTS & BASELINE CALIBRATION */}
        {/* =============================================================== */}
        {phase === 'result' && (
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <BookmarkCheck className="w-3.5 h-3.5" />
                Test Completed
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold font-editorial">
                Your Reading Pace Result
              </h3>
            </div>

            {/* Hero Pace Display */}
            <div
              className={`p-6 rounded-3xl border text-center transition-all ${paperThemeStyles.highlight} ${
                isDark ? 'border-white/10' : 'border-[#e8dfcf]'
              }`}
            >
              <div className="text-xs uppercase font-bold tracking-wider text-stone-500 mb-1">
                Calculated Pace
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl sm:text-6xl font-extrabold font-mono" style={{ color: primaryColor }}>
                  {calculatedWpm}
                </span>
                <span className="text-lg font-bold text-stone-500 font-sans">WPM</span>
              </div>

              {/* Literary Pace Badge & Description */}
              <div className="mt-4 pt-4 border-t border-stone-200/60 dark:border-white/10 max-w-md mx-auto">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-stone-500/10 text-stone-700 dark:text-stone-300 mb-2">
                  {paceCategory.label} • {paceCategory.badge}
                </span>
                <p className={`text-xs sm:text-sm leading-relaxed ${paperThemeStyles.subtext}`}>
                  {paceCategory.description}
                </p>
              </div>
            </div>

            {/* Test Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div
                className={`p-3.5 rounded-2xl border text-center ${
                  isDark ? 'border-white/10 bg-white/5' : 'border-[#e8dfcf] bg-white'
                }`}
              >
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${paperThemeStyles.subtext}`}>
                  Elapsed Time
                </div>
                <div className="text-lg font-bold font-mono">
                  {formatTime(elapsedSeconds)}
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border text-center ${
                  isDark ? 'border-white/10 bg-white/5' : 'border-[#e8dfcf] bg-white'
                }`}
              >
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${paperThemeStyles.subtext}`}>
                  Words Read
                </div>
                <div className="text-lg font-bold font-mono">
                  {currentExcerpt?.wordCount || 0}
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border text-center ${
                  isDark ? 'border-white/10 bg-white/5' : 'border-[#e8dfcf] bg-white'
                }`}
              >
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${paperThemeStyles.subtext}`}>
                  Pages / Min
                </div>
                <div className="text-lg font-bold font-mono" style={{ color: primaryColor }}>
                  ≈ {calculatedPpm}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleSaveBaseline}
                disabled={isSaved}
                className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer hover:opacity-95 active:scale-98"
                style={{
                  backgroundColor: isSaved ? '#10b981' : primaryColor,
                  color: isSaved ? '#ffffff' : textOnPrimary,
                  boxShadow: `0 4px 18px ${isSaved ? '#10b98140' : `${primaryColor}40`}`
                }}
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Saved as Your Baseline Pace!</span>
                  </>
                ) : (
                  <>
                    <span>Apply as Default Baseline WPM ({calculatedWpm})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPhase('ready');
                    loadFreshExcerpt();
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isDark
                      ? 'border-white/10 hover:bg-white/5 text-stone-300'
                      : 'border-stone-300 hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Try Another Sample</span>
                </button>

                <button
                  type="button"
                  onClick={closeSpeedTest}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isDark
                      ? 'border-white/10 hover:bg-white/5 text-stone-400'
                      : 'border-stone-300 hover:bg-stone-100 text-stone-500'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
