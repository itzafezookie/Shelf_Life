import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Star,
  Clock,
  Gauge,
  Bookmark,
  Calendar,
  Quote,
  Sparkles
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { analyticsEngine } from '../../services/analyticsEngine';
import { extractPaletteFromImage, getTextOnColor } from '../../services/colorExtractor';
import confetti from 'canvas-confetti';

export function BookCompletedCardModal({ books, sessions = [], baselineWPM = 250, isDarkApp }) {
  const { isCompletedCardOpen, completedCardBook, closeCompletedCard } = useUIStore();
  const cardRef = useRef(null);
  const canvasRef = useRef(null);

  const [copiedText, setCopiedText] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [cardPalette, setCardPalette] = useState(null);

  const book = useMemo(() => {
    if (!completedCardBook) return null;
    return (books || []).find((b) => b.id === completedCardBook.id) || completedCardBook;
  }, [books, completedCardBook]);

  // Extract palette for the completed book
  useEffect(() => {
    let isCancelled = false;
    async function loadPalette() {
      if (!book) return;
      try {
        const pal = await extractPaletteFromImage(
          book.cover_url,
          book.title,
          book.theme_mode || 'auto'
        );
        if (!isCancelled) {
          if (book.custom_palette) {
            setCardPalette({
              ...pal,
              primary: book.custom_palette.primary || pal.primary,
              secondary: book.custom_palette.secondary || pal.secondary,
              tertiary: book.custom_palette.tertiary || pal.tertiary,
              textOnPrimary: getTextOnColor(book.custom_palette.primary || pal.primary)
            });
          } else {
            setCardPalette(pal);
          }
        }
      } catch (e) {
        console.warn('[CompletedCard] Palette extraction error:', e);
      }
    }
    loadPalette();
    return () => {
      isCancelled = true;
    };
  }, [book]);

  // Fire celebratory confetti when card opens
  useEffect(() => {
    if (isCompletedCardOpen && book) {
      confetti({
        particleCount: 70,
        spread: 75,
        origin: { y: 0.55 }
      });
    }
  }, [isCompletedCardOpen, book]);

  if (!isCompletedCardOpen || !book) return null;

  const primaryColor = cardPalette?.primary || '#0284c7';
  const secondaryColor = cardPalette?.secondary || '#ec4899';
  const textOnPrimary = cardPalette?.textOnPrimary || '#ffffff';
  const isCardDark = cardPalette?.isDark ?? true;

  // Book sessions & stats
  const bookSessions = (sessions || []).filter((s) => s.book_id === book.id);
  const totalSeconds = bookSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMins = Math.round((totalSeconds % 3600) / 60);
  const formattedReadingTime = totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`;

  const bookDensity = book.words_per_page || 250;
  const bookPacePPM = analyticsEngine.calculateAveragePacePPM(bookSessions, baselineWPM, bookDensity);
  const bookWPM = analyticsEngine.calculateWPM(bookPacePPM, bookDensity);

  // Favorite Quote resolution (either explicitly marked favorite, or most recent quote)
  const quotesList = Array.isArray(book.quotes) ? book.quotes : [];
  const favoriteQuote = quotesList.find((q) => q.is_favorite) || (quotesList.length > 0 ? quotesList[quotesList.length - 1] : null);

  const completedDateFormatted = book.completed_date
    ? new Date(book.completed_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

  // Render high-res 1080x1350 canvas for clean native image sharing
  const generateCanvasImage = async () => {
    const width = 1080;
    const height = 1350;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (isCardDark) {
      bgGrad.addColorStop(0, '#13111a');
      bgGrad.addColorStop(0.5, '#191724');
      bgGrad.addColorStop(1, '#0e0c14');
    } else {
      bgGrad.addColorStop(0, '#fdfbf7');
      bgGrad.addColorStop(0.5, '#f5efe6');
      bgGrad.addColorStop(1, '#ede5d8');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient radial glow from primary color
    const glowGrad = ctx.createRadialGradient(width / 2, 280, 50, width / 2, 280, 550);
    glowGrad.addColorStop(0, `${primaryColor}40`);
    glowGrad.addColorStop(0.8, `${primaryColor}05`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, height);

    // 3. Top Header Badge
    ctx.fillStyle = isCardDark ? '#a8a29e' : '#78716c';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHELF_LIFE • READING LOG', width / 2, 75);

    ctx.fillStyle = isCardDark ? '#e7e5e4' : '#44403c';
    ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Completed on ${completedDateFormatted}`, width / 2, 110);

    // 4. Book Cover Image (load image with crossOrigin or fallback placeholder)
    const coverWidth = 260;
    const coverHeight = 390;
    const coverX = (width - coverWidth) / 2;
    const coverY = 160;

    let coverLoaded = false;
    if (book.cover_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = book.cover_url;
        await new Promise((resolve) => {
          img.onload = () => {
            coverLoaded = true;
            resolve();
          };
          img.onerror = () => resolve();
        });

        if (coverLoaded) {
          // Draw cover shadow
          ctx.save();
          ctx.shadowColor = `${primaryColor}60`;
          ctx.shadowBlur = 35;
          ctx.shadowOffsetY = 15;
          ctx.fillStyle = '#000000';
          roundRect(ctx, coverX, coverY, coverWidth, coverHeight, 16);
          ctx.fill();
          ctx.restore();

          // Clip and draw image
          ctx.save();
          roundRect(ctx, coverX, coverY, coverWidth, coverHeight, 16);
          ctx.clip();
          ctx.drawImage(img, coverX, coverY, coverWidth, coverHeight);
          ctx.restore();
        }
      } catch (err) {
        console.warn('[CompletedCard] Cover draw fallback:', err);
      }
    }

    if (!coverLoaded) {
      // Draw placeholder cover
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = primaryColor;
      roundRect(ctx, coverX, coverY, coverWidth, coverHeight, 16);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = textOnPrimary;
      ctx.font = 'bold 28px serif';
      ctx.textAlign = 'center';
      wrapText(ctx, book.title, width / 2, coverY + 160, coverWidth - 40, 36);
      ctx.font = '20px sans-serif';
      ctx.fillText(book.author || '', width / 2, coverY + 280);
    }

    // 5. Headline: "I just finished..."
    ctx.textAlign = 'center';
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('I JUST FINISHED', width / 2, 600);

    // Book Title
    ctx.fillStyle = isCardDark ? '#f5f5f4' : '#1c1917';
    ctx.font = 'bold 44px "Playfair Display", Georgia, serif';
    wrapText(ctx, book.title, width / 2, 655, width - 160, 52);

    // Book Author
    ctx.fillStyle = isCardDark ? '#d6d3d1' : '#57534e';
    ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`by ${book.author || 'Unknown Author'}`, width / 2, 730);

    // 6. Rating Stars
    if (book.rating) {
      const starText = '★'.repeat(book.rating) + '☆'.repeat(5 - book.rating);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '36px sans-serif';
      ctx.fillText(`${starText}  (${book.rating}.0 / 5)`, width / 2, 785);
    }

    // 7. Favorite Quote Card (if exists)
    let statsY = 840;
    if (favoriteQuote) {
      const quoteBoxWidth = width - 160;
      const quoteBoxX = 80;
      const quoteBoxY = 820;
      const quoteBoxHeight = 150;

      ctx.fillStyle = isCardDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
      roundRect(ctx, quoteBoxX, quoteBoxY, quoteBoxWidth, quoteBoxHeight, 20);
      ctx.fill();

      // Quote accent line
      ctx.fillStyle = primaryColor;
      roundRect(ctx, quoteBoxX, quoteBoxY, 8, quoteBoxHeight, 4);
      ctx.fill();

      ctx.fillStyle = isCardDark ? '#e7e5e4' : '#292524';
      ctx.font = 'italic 25px Georgia, serif';
      ctx.textAlign = 'left';
      wrapText(ctx, `“${favoriteQuote.text}”`, quoteBoxX + 35, quoteBoxY + 45, quoteBoxWidth - 60, 34);

      if (favoriteQuote.page) {
        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`— Page ${favoriteQuote.page}`, quoteBoxX + 35, quoteBoxY + quoteBoxHeight - 20);
      }

      statsY = 1010;
    }

    // 8. Stats Badges Row (Time, Pages, Pace, Sessions)
    const stats = [
      { label: 'TIME READ', value: totalSeconds > 0 ? formattedReadingTime : '—' },
      { label: 'PAGES READ', value: `${book.pages_total || book.current_page || 0}` },
      { label: 'READING PACE', value: `${bookPacePPM} p/m` },
      { label: 'SESSIONS', value: `${bookSessions.length}` }
    ];

    const statBoxWidth = 205;
    const statBoxHeight = 100;
    const gap = 20;
    const startX = (width - (statBoxWidth * 4 + gap * 3)) / 2;

    stats.forEach((st, i) => {
      const sx = startX + i * (statBoxWidth + gap);
      ctx.fillStyle = isCardDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
      roundRect(ctx, sx, statsY, statBoxWidth, statBoxHeight, 16);
      ctx.fill();

      ctx.fillStyle = isCardDark ? '#a8a29e' : '#78716c';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(st.label, sx + statBoxWidth / 2, statsY + 34);

      ctx.fillStyle = primaryColor;
      ctx.font = 'bold 30px monospace';
      ctx.fillText(st.value, sx + statBoxWidth / 2, statsY + 75);
    });

    // 9. Watermark Footer
    ctx.fillStyle = isCardDark ? '#78716c' : '#a8a29e';
    ctx.font = '19px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Tracked with Shelf_Life • Cozy Personal Reading Tracker', width / 2, height - 45);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  // Helper: Canvas rounded rectangle
  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Helper: Canvas text wrapping
  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let curY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, curY);
        line = words[n] + ' ';
        curY += lineHeight;
        if (curY > y + lineHeight * 3) {
          // Truncate if very long
          ctx.fillText('...', x, curY);
          return;
        }
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, curY);
  }

  // Handle Android Native Share Sheet
  const handleShare = async () => {
    setIsSharing(true);
    try {
      const blob = await generateCanvasImage();
      const fileName = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}_Completed.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      const shareText = `I just finished ${book.title} by ${book.author} and rated it ${
        book.rating ? `${book.rating}/5 stars` : '5/5 stars'
      }! Tracked with Shelf_Life.`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Finished reading ${book.title}!`,
          text: shareText,
          files: [file]
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else if (navigator.share) {
        // Fallback for browsers that support text share but not file share
        await navigator.share({
          title: `Finished reading ${book.title}!`,
          text: shareText
        });
        handleDownload();
      } else {
        // Fallback download
        handleDownload();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[CompletedCard] Share error:', err);
        handleDownload();
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Direct PNG download fallback
  const handleDownload = async () => {
    const blob = await generateCanvasImage();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}_Finished_Card.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy share text to clipboard
  const handleCopyText = () => {
    const text = `“I just finished ${book.title} by ${book.author}${
      book.rating ? ` and rated it ${book.rating}/5 stars!` : '!'
    }”\n⏱️ Read time: ${formattedReadingTime}\n📖 Pages: ${book.pages_total || book.current_page}\n⚡ Pace: ${bookPacePPM} p/min\nTracked with Shelf_Life.`;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl flex flex-col max-h-[94vh] overflow-hidden transition-colors duration-300 ${
          isCardDark
            ? 'bg-[#15141b] border-white/10 text-[#f5f5f4]'
            : 'bg-white border-[#eae3d8] text-[#292524]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
            isCardDark ? 'border-white/10 bg-[#1c1a24]' : 'border-[#eae3d8] bg-[#fbf9f6]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="p-1.5 rounded-xl text-white shadow-xs shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-editorial">
                Shareable Book Card
              </h3>
              <p className={`text-[11px] truncate ${isCardDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Palette-themed graphic celebrating your completed read
              </p>
            </div>
          </div>

          <button
            onClick={closeCompletedCard}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isCardDark
                ? 'text-stone-400 hover:text-white hover:bg-white/10'
                : 'text-stone-400 hover:text-stone-700 hover:bg-[#ede7dd]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body: Live Card Preview */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col items-center">
          {/* Card Preview Container */}
          <div
            ref={cardRef}
            className={`w-full max-w-sm rounded-3xl border shadow-xl p-6 relative overflow-hidden transition-all duration-300 ${
              isCardDark
                ? 'bg-[#181622] border-white/15 text-[#f5f5f4]'
                : 'bg-[#faf8f4] border-[#eae3d8] text-[#292524]'
            }`}
            style={{
              backgroundImage: `radial-gradient(ellipse 90% 50% at 50% 0%, ${primaryColor}25 0%, transparent 75%)`
            }}
          >
            {/* Top Badge */}
            <div className="text-center mb-4">
              <span
                className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full border inline-block"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  borderColor: `${primaryColor}30`
                }}
              >
                Shelf_Life • Reading Log
              </span>
              <div className={`text-[10px] mt-1 ${isCardDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Finished on {completedDateFormatted}
              </div>
            </div>

            {/* Book Cover */}
            <div className="flex justify-center mb-4">
              <div
                className="w-28 h-42 rounded-2xl overflow-hidden shadow-2xl border-2 transition-transform duration-300 hover:scale-105"
                style={{ borderColor: `${primaryColor}60` }}
              >
                <img
                  src={book.cover_url || './default-cover-large.svg'}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = './default-cover-large.svg';
                  }}
                />
              </div>
            </div>

            {/* Headline */}
            <div className="text-center space-y-1 mb-4">
              <span className={`text-[11px] font-bold tracking-wider uppercase ${isCardDark ? 'text-stone-400' : 'text-stone-500'}`}>
                I just finished
              </span>
              <h4 className="text-xl font-bold font-editorial leading-tight">
                {book.title}
              </h4>
              <p className={`text-xs ${isCardDark ? 'text-stone-300' : 'text-stone-600'}`}>
                by {book.author || 'Unknown Author'}
              </p>

              {/* Star Rating */}
              <div className="flex items-center justify-center gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= (book.rating || 5)
                        ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                        : 'text-stone-400/40'
                    }`}
                  />
                ))}
                {book.rating && (
                  <span className="text-xs font-mono font-bold text-amber-500 ml-1">
                    {book.rating}.0
                  </span>
                )}
              </div>
            </div>

            {/* Featured Quote (if exists) */}
            {favoriteQuote && (
              <div
                className={`p-3 rounded-2xl border text-xs mb-4 relative ${
                  isCardDark
                    ? 'bg-white/5 border-white/10 text-stone-200'
                    : 'bg-white border-[#eae3d8] text-stone-800'
                }`}
                style={{ borderLeftColor: primaryColor, borderLeftWidth: '4px' }}
              >
                <Quote className="w-3.5 h-3.5 mb-1 opacity-70" style={{ color: primaryColor }} />
                <p className="font-serif italic leading-relaxed line-clamp-3 select-text">
                  “{favoriteQuote.text}”
                </p>
                {favoriteQuote.page && (
                  <span className={`block text-[10px] font-mono mt-1 ${isCardDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    — Page {favoriteQuote.page}
                  </span>
                )}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div
                className={`p-2 rounded-xl border ${
                  isCardDark ? 'bg-white/5 border-white/10' : 'bg-white border-[#eae3d8]'
                }`}
              >
                <div className={`text-[9px] font-bold uppercase ${isCardDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Time Read
                </div>
                <div className="font-mono font-bold text-sm" style={{ color: primaryColor }}>
                  {totalSeconds > 0 ? formattedReadingTime : '—'}
                </div>
              </div>

              <div
                className={`p-2 rounded-xl border ${
                  isCardDark ? 'bg-white/5 border-white/10' : 'bg-white border-[#eae3d8]'
                }`}
              >
                <div className={`text-[9px] font-bold uppercase ${isCardDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Pages
                </div>
                <div className="font-mono font-bold text-sm" style={{ color: primaryColor }}>
                  {book.pages_total || book.current_page || 0}
                </div>
              </div>

              <div
                className={`p-2 rounded-xl border ${
                  isCardDark ? 'bg-white/5 border-white/10' : 'bg-white border-[#eae3d8]'
                }`}
              >
                <div className={`text-[9px] font-bold uppercase ${isCardDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Pace
                </div>
                <div className="font-mono font-bold text-sm" style={{ color: primaryColor }}>
                  {bookPacePPM} <span className="text-[10px] font-normal">p/m</span>
                </div>
              </div>

              <div
                className={`p-2 rounded-xl border ${
                  isCardDark ? 'bg-white/5 border-white/10' : 'bg-white border-[#eae3d8]'
                }`}
              >
                <div className={`text-[9px] font-bold uppercase ${isCardDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Sessions
                </div>
                <div className="font-mono font-bold text-sm" style={{ color: primaryColor }}>
                  {bookSessions.length}
                </div>
              </div>
            </div>

            {/* Footer watermark */}
            <div className={`text-center text-[10px] mt-4 ${isCardDark ? 'text-stone-500' : 'text-stone-400'}`}>
              shelf-life.app • Cozy Personal Reading Tracker
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className={`flex items-center justify-between p-4 border-t gap-2 ${
            isCardDark ? 'border-white/10 bg-[#1c1a24]' : 'border-[#eae3d8] bg-[#fbf9f6]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownload}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isCardDark
                  ? 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
              title="Save PNG image file"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isCardDark
                  ? 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
              title="Copy text summary to clipboard"
            >
              {copiedText ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{copiedText ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          {/* Primary Android Share Button */}
          <button
            type="button"
            onClick={handleShare}
            disabled={isSharing}
            className="py-2.5 px-5 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            style={{
              backgroundColor: primaryColor,
              color: textOnPrimary,
              boxShadow: isCardDark ? `0 4px 16px ${primaryColor}40` : undefined
            }}
          >
            <Share2 className="w-4 h-4" />
            <span>{isSharing ? 'Preparing Graphic...' : 'Share Graphic'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
