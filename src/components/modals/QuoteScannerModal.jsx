import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Quote,
  Sparkles,
  Check,
  RefreshCw,
  Star,
  AlertCircle,
  FileText,
  Bookmark,
  ChevronRight,
  Sliders,
  Layers,
  Crop,
  Clipboard,
  Lightbulb
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { bookService } from '../../services/bookService';
import confetti from 'canvas-confetti';
import { createWorker } from 'tesseract.js';

export function QuoteScannerModal({ palette, isDark }) {
  const { isQuoteScannerOpen, quoteScannerBook, closeQuoteScanner } = useUIStore();

  // Mode: 'snap' (OCR camera/upload flow) | 'manual' (direct paste/type)
  const [activeTab, setActiveTab] = useState('snap');

  // Step: 'capture' | 'crop' | 'processing' | 'select'
  const [step, setStep] = useState('capture');
  const [rawImageDataUrl, setRawImageDataUrl] = useState(null);
  const [cropMargins, setCropMargins] = useState({ top: 12, bottom: 12, left: 10, right: 10 });

  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  // Tokenized words from OCR
  const [detectedWords, setDetectedWords] = useState([]);
  const [startIndex, setStartIndex] = useState(null);
  const [endIndex, setEndIndex] = useState(null);

  // Quote form fields
  const [quoteText, setQuoteText] = useState('');
  const [quotePage, setQuotePage] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [clipboardFeedback, setClipboardFeedback] = useState(false);

  const fileInputRef = useRef(null);

  const primaryColor = palette?.primary || '#0284c7';
  const secondaryColor = palette?.secondary || '#ec4899';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  // Initialize modal state on open
  useEffect(() => {
    if (isQuoteScannerOpen) {
      setActiveTab('snap');
      setStep('capture');
      setRawImageDataUrl(null);
      setCropMargins({ top: 12, bottom: 12, left: 10, right: 10 });
      setOcrStatus('');
      setOcrProgress(0);
      setErrorMessage(null);
      setDetectedWords([]);
      setStartIndex(null);
      setEndIndex(null);
      setQuoteText('');
      setQuotePage(quoteScannerBook?.current_page ? String(quoteScannerBook.current_page) : '');
      setQuoteNote('');
      setIsFavorite(false);
      setClipboardFeedback(false);
    }
  }, [isQuoteScannerOpen, quoteScannerBook]);

  // Handle image capture / upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setRawImageDataUrl(dataUrl);
      setCropMargins({ top: 12, bottom: 12, left: 10, right: 10 });
      setStep('crop');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Run high-precision OCR on the cropped & preprocessed region
  const executeOcrOnPassage = async () => {
    if (!rawImageDataUrl) return;

    setStep('processing');
    setOcrProgress(15);
    setOcrStatus('Framing passage & optimizing contrast...');
    setErrorMessage(null);

    let currentP = 15;
    const smoothTimer = setInterval(() => {
      currentP = currentP + (88 - currentP) * 0.08 + 0.4;
      setOcrProgress((prev) => Math.max(prev, Math.min(88, Math.round(currentP))));
    }, 100);

    try {
      const img = new Image();
      img.src = rawImageDataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Calculate cropped source coordinates
      const sx = Math.round((cropMargins.left / 100) * img.width);
      const sy = Math.round((cropMargins.top / 100) * img.height);
      const sw = Math.max(50, Math.round(((100 - cropMargins.left - cropMargins.right) / 100) * img.width));
      const sh = Math.max(50, Math.round(((100 - cropMargins.top - cropMargins.bottom) / 100) * img.height));

      // Scale to optimal OCR dimensions (~1500px max)
      const maxDim = 1500;
      const scale = Math.min(1.5, maxDim / Math.max(sw, sh));
      const optWidth = Math.round(sw * scale);
      const optHeight = Math.round(sh * scale);

      const canvas = document.createElement('canvas');
      canvas.width = optWidth;
      canvas.height = optHeight;

      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, optWidth, optHeight);

      // Adaptive Luminance Contrast Stretch (Handles paper shadows & off-white paper stock)
      try {
        const imgData = ctx.getImageData(0, 0, optWidth, optHeight);
        const d = imgData.data;

        let minL = 255;
        let maxL = 0;
        for (let i = 0; i < d.length; i += 4) {
          const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          if (luma < minL) minL = luma;
          if (luma > maxL) maxL = luma;
        }

        const range = Math.max(35, maxL - minL);

        for (let i = 0; i < d.length; i += 4) {
          const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // Smooth normalized stretch preserves anti-aliased character edges for the neural net
          const stretched = Math.min(255, Math.max(0, ((luma - minL) / range) * 255));
          d[i] = stretched;
          d[i + 1] = stretched;
          d[i + 2] = stretched;
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (procErr) {
        console.warn('[QuoteScanner] Contrast stretch fallback:', procErr);
      }

      setOcrStatus('Scanning typography neural network (PSM 6)...');

      // Tesseract Worker with PSM 6 (Single uniform block of text)
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const mapped = 30 + Math.round((m.progress || 0) * 58);
            if (mapped > currentP) {
              currentP = mapped;
              setOcrProgress(mapped);
            }
          }
        }
      });

      // PSM 6 is significantly more accurate for book passages than generic multi-column PSM 3
      await worker.setParameters({
        tessedit_pageseg_mode: 6
      });

      const ret = await worker.recognize(canvas);
      await worker.terminate();

      clearInterval(smoothTimer);
      setOcrProgress(95);
      setOcrStatus('Digitizing quote tokens...');

      const rawText = ret.data?.text || '';
      // Tokenize into clean word tokens preserving punctuation
      const tokens = rawText
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0);

      if (tokens.length < 2) {
        throw new Error(
          'Could not clearly recognize text in this crop. Please adjust the crop frame to focus on the text, or try another photo with even lighting.'
        );
      }

      setDetectedWords(tokens);
      setStartIndex(0);
      setEndIndex(tokens.length - 1);
      setQuoteText(tokens.join(' '));

      setOcrProgress(100);
      setTimeout(() => {
        setStep('select');
      }, 250);
    } catch (err) {
      clearInterval(smoothTimer);
      console.error('[QuoteScanner] OCR failure:', err);
      setErrorMessage(
        'Could not clearly recognize text from this crop. Try adjusting the crop frame to just the text lines, or paste the quote directly.'
      );
      setStep('crop');
    }
  };

  // Word token click handler for highlighting range
  const handleWordClick = (index) => {
    if (startIndex === null) {
      setStartIndex(index);
      setEndIndex(index);
      setQuoteText(detectedWords[index]);
    } else if (startIndex !== null && endIndex === startIndex) {
      const newStart = Math.min(startIndex, index);
      const newEnd = Math.max(startIndex, index);
      setStartIndex(newStart);
      setEndIndex(newEnd);
      setQuoteText(detectedWords.slice(newStart, newEnd + 1).join(' '));
    } else {
      setStartIndex(index);
      setEndIndex(index);
      setQuoteText(detectedWords[index]);
    }
  };

  const handleSelectAll = () => {
    if (!detectedWords.length) return;
    setStartIndex(0);
    setEndIndex(detectedWords.length - 1);
    setQuoteText(detectedWords.join(' '));
  };

  // Paste from clipboard helper
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setQuoteText(text.trim());
        setClipboardFeedback(true);
        setTimeout(() => setClipboardFeedback(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard read permission denied:', err);
    }
  };

  // Save quote to book
  const handleSaveQuote = async (e) => {
    e.preventDefault();
    if (!quoteText.trim()) return;

    if (quoteScannerBook?.id) {
      await bookService.addQuote(quoteScannerBook.id, {
        text: quoteText.trim(),
        page: quotePage ? parseInt(quotePage, 10) : null,
        note: quoteNote.trim(),
        is_favorite: isFavorite
      });
    }

    confetti({ particleCount: 55, spread: 65, origin: { y: 0.6 } });
    closeQuoteScanner();
  };

  if (!isQuoteScannerOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-colors duration-300 ${
          isDark
            ? 'bg-[#15141b] border-white/10 text-[#f5f5f4]'
            : 'bg-white border-[#eae3d8] text-[#292524]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
            isDark ? 'border-white/10 bg-[#1c1a24]' : 'border-[#eae3d8] bg-[#fbf9f6]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="p-1.5 rounded-xl text-white shadow-xs shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Quote className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold font-editorial truncate">
                Quote & Highlight Snapper
              </h3>
              <p className={`text-[11px] truncate ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {quoteScannerBook?.title ? `Saving to "${quoteScannerBook.title}"` : 'Capture memorable book quotes'}
              </p>
            </div>
          </div>

          <button
            onClick={closeQuoteScanner}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'text-stone-400 hover:text-white hover:bg-white/10'
                : 'text-stone-400 hover:text-stone-700 hover:bg-[#ede7dd]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Snap with Camera vs Manual Paste */}
        <div
          className={`flex border-b text-xs font-semibold px-4 pt-2 gap-2 shrink-0 ${
            isDark ? 'border-white/10 bg-[#181622]' : 'border-[#eae3d8] bg-[#faf8f4]'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('snap')}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'snap'
                ? 'border-current font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
            style={activeTab === 'snap' ? { color: primaryColor } : undefined}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>OCR Camera Snapper</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'border-current font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
            style={activeTab === 'manual' ? { color: primaryColor } : undefined}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Type / Paste Directly</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl text-xs font-medium bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: OCR SNAP FLOW                                      */}
          {/* ========================================================= */}
          {activeTab === 'snap' && (
            <>
              {/* STEP 1: CAPTURE / UPLOAD */}
              {step === 'capture' && (
                <div className="space-y-4">
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    Snap a photo of the passage in your book. To get the best recognition on physical books, keep the page flat and avoid shadows from your phone.
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer group ${
                      isDark
                        ? 'border-white/15 hover:border-amber-400/60 bg-[#1c1a24] hover:bg-[#22202c]'
                        : 'border-[#eae3d8] hover:border-[#0284c7] bg-[#fbf9f6] hover:bg-[#f4efe8]'
                    }`}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    >
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="block text-base font-bold font-editorial">
                        Snap or Upload Passage Photo
                      </span>
                      <span className={`text-xs mt-1 block ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        Uses native high-resolution camera autofocus
                      </span>
                    </div>
                  </button>

                  {/* Physical book tip */}
                  <div className={`p-3 rounded-xl border flex items-start gap-2 text-[11px] ${
                    isDark ? 'bg-white/3 border-white/5 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}>
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Physical Book Tip:</strong> You will be able to frame the exact paragraph on the next screen. Cropping out opposite pages, bedsheets, and book gutters dramatically boosts accuracy!
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 2: INTERACTIVE PASSAGE CROP & FRAMING */}
              {step === 'crop' && rawImageDataUrl && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold font-editorial">Frame the Passage</h4>
                      <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        Crop out curved margins, opposite pages, or fingers for clean OCR
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`text-xs font-semibold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                        isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-stone-300' : 'bg-white border-stone-200 text-stone-700'
                      }`}
                    >
                      Retake Photo
                    </button>
                  </div>

                  {/* Visual Image with Crop Frame Overlay */}
                  <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-md bg-black max-h-72 flex items-center justify-center">
                    <img
                      src={rawImageDataUrl}
                      alt="Captured passage"
                      className="w-full h-auto max-h-72 object-contain"
                    />

                    {/* Darkened mask around the crop area */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        boxShadow: `inset 0 0 0 9999px rgba(0, 0, 0, 0.45)`,
                        clipPath: `polygon(
                          0% 0%, 0% 100%, 
                          ${cropMargins.left}% 100%, 
                          ${cropMargins.left}% ${cropMargins.top}%, 
                          ${100 - cropMargins.right}% ${cropMargins.top}%, 
                          ${100 - cropMargins.right}% ${100 - cropMargins.bottom}%, 
                          ${cropMargins.left}% ${100 - cropMargins.bottom}%, 
                          ${cropMargins.left}% 100%, 
                          100% 100%, 100% 0%
                        )`
                      }}
                    />

                    {/* Highlighted bounding box */}
                    <div
                      className="absolute border-2 border-amber-400 rounded-lg pointer-events-none shadow-sm"
                      style={{
                        top: `${cropMargins.top}%`,
                        bottom: `${cropMargins.bottom}%`,
                        left: `${cropMargins.left}%`,
                        right: `${cropMargins.right}%`
                      }}
                    >
                      <div className="absolute -top-2.5 left-2 bg-amber-400 text-black text-[9px] font-bold px-1.5 rounded uppercase tracking-wider">
                        Scan Area
                      </div>
                    </div>
                  </div>

                  {/* Framing Presets */}
                  <div className="space-y-2">
                    <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      Quick Framing Presets
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setCropMargins({ top: 25, bottom: 25, left: 12, right: 12 })}
                        className={`p-1.5 rounded-xl border text-center transition-colors cursor-pointer ${
                          isDark ? 'bg-white/5 border-white/10 hover:bg-white/15' : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        Tight Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => setCropMargins({ top: 10, bottom: 10, left: 10, right: 10 })}
                        className={`p-1.5 rounded-xl border text-center transition-colors cursor-pointer ${
                          isDark ? 'bg-white/5 border-white/10 hover:bg-white/15' : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        Main Page
                      </button>
                      <button
                        type="button"
                        onClick={() => setCropMargins({ top: 5, bottom: 45, left: 8, right: 8 })}
                        className={`p-1.5 rounded-xl border text-center transition-colors cursor-pointer ${
                          isDark ? 'bg-white/5 border-white/10 hover:bg-white/15' : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        Top Half
                      </button>
                      <button
                        type="button"
                        onClick={() => setCropMargins({ top: 45, bottom: 5, left: 8, right: 8 })}
                        className={`p-1.5 rounded-xl border text-center transition-colors cursor-pointer ${
                          isDark ? 'bg-white/5 border-white/10 hover:bg-white/15' : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        Bottom Half
                      </button>
                    </div>
                  </div>

                  {/* Fine Tuning Sliders */}
                  <div className={`p-3 rounded-xl border space-y-2.5 text-xs ${
                    isDark ? 'bg-[#1b1924] border-white/10' : 'bg-[#faf8f4] border-[#eae3d8]'
                  }`}>
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Crop className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                        <span>Fine-Tune Margins</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>Top Cut</span>
                          <span className="font-mono">{cropMargins.top}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="60"
                          value={cropMargins.top}
                          onChange={(e) => setCropMargins((prev) => ({ ...prev, top: parseInt(e.target.value, 10) }))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>Bottom Cut</span>
                          <span className="font-mono">{cropMargins.bottom}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="60"
                          value={cropMargins.bottom}
                          onChange={(e) => setCropMargins((prev) => ({ ...prev, bottom: parseInt(e.target.value, 10) }))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>Left (Gutter)</span>
                          <span className="font-mono">{cropMargins.left}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={cropMargins.left}
                          onChange={(e) => setCropMargins((prev) => ({ ...prev, left: parseInt(e.target.value, 10) }))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>Right Cut</span>
                          <span className="font-mono">{cropMargins.right}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={cropMargins.right}
                          onChange={(e) => setCropMargins((prev) => ({ ...prev, right: parseInt(e.target.value, 10) }))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Scan Passage Button */}
                  <button
                    type="button"
                    onClick={executeOcrOnPassage}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={{
                      backgroundColor: primaryColor,
                      color: textOnPrimary,
                      boxShadow: isDark ? `0 4px 16px ${primaryColor}40` : undefined
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Scan Framed Passage</span>
                  </button>
                </div>
              )}

              {/* STEP 3: PROCESSING OCR */}
              {step === 'processing' && (
                <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="relative w-44 h-56 rounded-xl overflow-hidden border border-white/20 shadow-xl bg-black">
                    {rawImageDataUrl && (
                      <img
                        src={rawImageDataUrl}
                        alt="Passage preview"
                        className="w-full h-full object-cover opacity-75 filter grayscale"
                      />
                    )}
                    <div
                      className="absolute inset-x-0 h-1 shadow-lg transition-all duration-150 ease-out"
                      style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 0 15px 3px ${primaryColor}`,
                        top: `${Math.min(95, Math.max(5, ocrProgress))}%`
                      }}
                    />
                  </div>

                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono font-semibold">
                      <span className={isDark ? 'text-stone-300' : 'text-stone-700'}>{ocrStatus}</span>
                      <span style={{ color: primaryColor }}>{ocrProgress}%</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-stone-200'}`}>
                      <div
                        className="h-full rounded-full transition-all duration-200 ease-out"
                        style={{
                          width: `${ocrProgress}%`,
                          backgroundColor: primaryColor
                        }}
                      />
                    </div>
                    <p className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      Running locally on your device with WebAssembly OCR. No photos leave your phone.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 4: WORD TOKEN HIGHLIGHTER & EDIT */}
              {step === 'select' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Instructions & Actions */}
                  <div
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                      isDark ? 'bg-[#1c1a24] border-white/10' : 'bg-amber-50/70 border-amber-200'
                    }`}
                  >
                    <div>
                      <span className="font-bold block">
                        {startIndex === null
                          ? 'Tap the FIRST word of your quote:'
                          : endIndex === startIndex
                          ? 'Now tap the LAST word to highlight:'
                          : 'Quote passage highlighted!'}
                      </span>
                      <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                        Tap any word to re-adjust range, or polish below.
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                          isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-stone-300' : 'bg-white border-stone-200 text-stone-700'
                        }`}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep('crop')}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isDark ? 'text-stone-400 hover:text-white' : 'text-stone-400 hover:text-stone-700'
                        }`}
                        title="Re-crop passage frame"
                      >
                        <Crop className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep('capture')}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isDark ? 'text-stone-400 hover:text-white' : 'text-stone-400 hover:text-stone-700'
                        }`}
                        title="Rescan another photo"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Interactive Word Tokens Grid */}
                  <div
                    className={`p-3.5 rounded-2xl border max-h-48 overflow-y-auto leading-relaxed select-text font-serif text-sm ${
                      isDark ? 'bg-[#121118] border-white/10' : 'bg-[#fcfbf9] border-[#eae3d8]'
                    }`}
                  >
                    <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                      {detectedWords.map((word, idx) => {
                        const isSelected =
                          startIndex !== null &&
                          endIndex !== null &&
                          idx >= Math.min(startIndex, endIndex) &&
                          idx <= Math.max(startIndex, endIndex);

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleWordClick(idx)}
                            className={`px-1 py-0.5 rounded text-sm transition-all cursor-pointer inline-flex items-center ${
                              isSelected
                                ? isDark
                                  ? 'bg-amber-400/25 text-amber-200 border-b-2 border-amber-400 font-medium shadow-2xs'
                                  : 'bg-amber-200/80 text-amber-950 border-b-2 border-amber-500 font-medium shadow-2xs'
                                : isDark
                                ? 'text-stone-400 hover:text-white hover:bg-white/5'
                                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                            }`}
                          >
                            <span>{word}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* TAB 2: MANUAL ENTRY WITH CLIPBOARD BUTTON                 */}
          {/* ========================================================= */}
          {activeTab === 'manual' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  Type, paste, or grab from your phone's clipboard:
                </span>

                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-stone-200 border-white/10'
                      : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 shadow-2xs'
                  }`}
                >
                  <Clipboard className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  <span>{clipboardFeedback ? 'Pasted!' : 'Paste Clipboard'}</span>
                </button>
              </div>

              {/* Native Google Lens / ML Tip */}
              <div className={`p-3 rounded-xl border flex items-start gap-2 text-[11px] ${
                isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Native Phone ML Tip:</strong> On modern Android (Google Lens / Camera) and iOS (Live Text), you can hold your finger on physical book text directly in your camera to copy it instantly, then tap <strong>Paste Clipboard</strong> above!
                </span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* QUOTE REFINEMENT & SAVE FORM (ALWAYS ACCESSIBLE)          */}
          {/* ========================================================= */}
          {(step === 'select' || activeTab === 'manual') && (
            <form onSubmit={handleSaveQuote} className="space-y-3.5 pt-1">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                  Quote Text (Editable for punctuation & typos)
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    placeholder="“The quote will appear here. You can edit any OCR typo or format lines freely...”"
                    required
                    className={`w-full p-3 rounded-2xl font-serif text-sm leading-relaxed border focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-[#1a1924] border-white/10 text-white placeholder-stone-500 focus:border-amber-400/50'
                        : 'bg-[#faf8f4] border-[#eae3d8] text-stone-900 placeholder-stone-400 focus:border-[#0284c7]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                    Page Number (Optional)
                  </label>
                  <div className="relative">
                    <Bookmark className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 42"
                      value={quotePage}
                      onChange={(e) => setQuotePage(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 rounded-xl font-mono text-xs border focus:outline-none ${
                        isDark
                          ? 'bg-[#1a1924] border-white/10 text-white'
                          : 'bg-white border-[#eae3d8] text-stone-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                    Speaker / Context (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Donut, or Epilogue"
                    value={quoteNote}
                    onChange={(e) => setQuoteNote(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                      isDark
                        ? 'bg-[#1a1924] border-white/10 text-white placeholder-stone-500'
                        : 'bg-white border-[#eae3d8] text-stone-900 placeholder-stone-400'
                    }`}
                  />
                </div>
              </div>

              {/* Favorite Quote Toggle */}
              <div
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isFavorite
                    ? isDark
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                    : isDark
                    ? 'bg-[#1a1924] border-white/10 hover:border-white/20 text-stone-300'
                    : 'bg-[#faf8f4] border-[#eae3d8] hover:border-stone-300 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star
                    className={`w-4 h-4 ${
                      isFavorite
                        ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                        : 'text-stone-400'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-bold block">Favorite Quote</span>
                    <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      Features prominently on your book dossier and shareable card
                    </span>
                  </div>
                </div>

                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isFavorite ? 'bg-amber-500 border-amber-500 text-black' : 'border-stone-400'
                  }`}
                >
                  {isFavorite && <Check className="w-3 h-3 stroke-3" />}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeQuoteScanner}
                  className={`py-2 px-4 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#22202c] text-stone-300 hover:bg-[#2c2938] border border-white/10'
                      : 'btn-cozy btn-cozy-secondary'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!quoteText.trim()}
                  className="py-2 px-5 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: primaryColor,
                    color: textOnPrimary,
                    boxShadow: isDark ? `0 4px 16px ${primaryColor}40` : undefined
                  }}
                >
                  <Check className="w-4 h-4" />
                  <span>Save Quote to Dossier</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
