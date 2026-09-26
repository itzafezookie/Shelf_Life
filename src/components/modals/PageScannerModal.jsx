import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, Sparkles, Check, RefreshCw, Sliders, BookOpen, AlertCircle, Eye, Plus, Layers, Trash2 } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { bookService } from '../../services/bookService';
import confetti from 'canvas-confetti';
import { createWorker } from 'tesseract.js';

export function PageScannerModal({ palette, isDark }) {
  const { isPageScannerOpen, pageScannerBook, pageScannerCallback, closePageScanner } = useUIStore();

  const [step, setStep] = useState('capture'); // 'capture' | 'processing' | 'result'
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  // Multi-page samples array: [{ id, pageNum, wordCount, lineCount, wordsPerLine }]
  const [scannedPages, setScannedPages] = useState([]);

  // Result stats (average of samples or manual adjustment)
  const [detectedWords, setDetectedWords] = useState(250);
  const [detectedLines, setDetectedLines] = useState(0);
  const [wordsPerLine, setWordsPerLine] = useState(0);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' | 'user'

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const primaryColor = palette?.primary || '#0284c7';
  const secondaryColor = palette?.secondary || '#ec4899';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  // Preset densities
  const PRESETS = [
    { label: 'Mass-Market Paperback', sub: 'Pocket size, dense text', words: 380 },
    { label: 'Trade Paperback', sub: 'Standard fiction/nonfiction', words: 300 },
    { label: 'Hardcover Novel', sub: 'Standard margins & leading', words: 250 },
    { label: 'Large Print / YA', sub: 'Generous spacing & large font', words: 200 }
  ];

  // Reset modal state when opened
  useEffect(() => {
    if (isPageScannerOpen) {
      setStep('capture');
      setImagePreview(null);
      setOcrStatus('');
      setOcrProgress(0);
      setErrorMessage(null);
      setScannedPages([]);
      setDetectedWords(pageScannerBook?.words_per_page || 250);
      setDetectedLines(0);
      setWordsPerLine(0);
      setIsLiveCameraActive(false);
      setIsCameraLoading(false);
    } else {
      stopLiveCamera();
    }
  }, [isPageScannerOpen, pageScannerBook]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsLiveCameraActive(false);
    setIsCameraLoading(false);
  };

  const startLiveCamera = () => {
    setErrorMessage(null);
    setIsLiveCameraActive(true);
  };

  // Robust camera stream management once viewfinder mounts
  useEffect(() => {
    if (!isLiveCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    async function initCameraStream() {
      setIsCameraLoading(true);
      setErrorMessage(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      let stream = null;

      // Try progressive camera constraints for mobile compatibility
      const attempts = [
        {
          video: {
            facingMode: { ideal: cameraFacing },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        },
        {
          video: {
            facingMode: cameraFacing
          },
          audio: false
        },
        {
          video: {
            facingMode: { ideal: cameraFacing }
          },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ];

      for (const constraints of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch {
          // Try next constraint
        }
      }

      if (!isSubscribed) {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (!stream) {
        setErrorMessage(
          'Could not access camera viewfinder. Please ensure camera permissions are allowed, or use "Snap / Upload Photo".'
        );
        setIsCameraLoading(false);
        setIsLiveCameraActive(false);
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');

        video.onloadedmetadata = async () => {
          if (!isSubscribed) return;
          try {
            await video.play();
            setIsCameraLoading(false);
          } catch (playErr) {
            console.warn('[PageScanner] Auto-play was prevented:', playErr);
            setIsCameraLoading(false);
          }
        };

        // Safety fallback if onloadedmetadata is delayed
        setTimeout(() => {
          if (isSubscribed) {
            setIsCameraLoading(false);
            video.play().catch(() => {});
          }
        }, 1200);
      } else {
        setIsCameraLoading(false);
      }
    }

    initCameraStream();

    return () => {
      isSubscribed = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isLiveCameraActive, cameraFacing]);

  const captureFromVideo = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Verify video stream actually has rendered frames
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
      setErrorMessage('Camera preview is still warming up. Please wait a moment and tap again.');
      return;
    }

    try {
      let captureCanvas = null;
      const track = streamRef.current?.getVideoTracks()?.[0];

      // 1. Try ImageCapture API for full-sensor camera photo with autofocus
      if (window.ImageCapture && track) {
        try {
          const imageCapture = new window.ImageCapture(track);
          const blob = await imageCapture.takePhoto();
          const imgBitmap = await createImageBitmap(blob);
          const fullCanvas = document.createElement('canvas');
          fullCanvas.width = imgBitmap.width;
          fullCanvas.height = imgBitmap.height;
          const fCtx = fullCanvas.getContext('2d');
          fCtx.drawImage(imgBitmap, 0, 0);
          captureCanvas = fullCanvas;
        } catch (e) {
          console.warn('[PageScanner] ImageCapture takePhoto fallback:', e);
        }
      }

      // 2. Fallback to video frame
      if (!captureCanvas) {
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = video.videoWidth;
        fullCanvas.height = video.videoHeight;
        const fCtx = fullCanvas.getContext('2d');
        fCtx.drawImage(video, 0, 0);
        captureCanvas = fullCanvas;
      }

      // 3. Coordinate mapping: crop to what was actually inside the dashed guide on screen
      const container = video.parentElement;
      const cWidth = container?.clientWidth || 300;
      const cHeight = container?.clientHeight || 400;
      const guidePadding = 24; // matches inset-6 (1.5rem = 24px)

      const guideLeft = guidePadding;
      const guideTop = guidePadding;
      const guideW = Math.max(50, cWidth - guidePadding * 2);
      const guideH = Math.max(50, cHeight - guidePadding * 2);

      const imgWidth = captureCanvas.width;
      const imgHeight = captureCanvas.height;

      // Handle object-cover scaling ratio
      const scale = Math.max(cWidth / imgWidth, cHeight / imgHeight);
      const renderedW = imgWidth * scale;
      const renderedH = imgHeight * scale;
      const offsetX = (renderedW - cWidth) / 2;
      const offsetY = (renderedH - cHeight) / 2;

      const cropX = Math.max(0, Math.round((guideLeft + offsetX) / scale));
      const cropY = Math.max(0, Math.round((guideTop + offsetY) / scale));
      const cropW = Math.min(imgWidth - cropX, Math.round(guideW / scale));
      const cropH = Math.min(imgHeight - cropY, Math.round(guideH / scale));

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropW;
      croppedCanvas.height = cropH;
      const cCtx = croppedCanvas.getContext('2d');
      cCtx.drawImage(captureCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.95);
      stopLiveCamera();
      processImage(dataUrl);
    } catch (err) {
      console.error('[PageScanner] Capture error:', err);
      stopLiveCamera();
      setErrorMessage('Could not capture viewfinder frame. Please try "Snap / Upload Photo".');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      processImage(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Preprocess image on canvas (upscale to optimal OCR resolution, enhance contrast) and run OCR
  const processImage = async (dataUrl) => {
    setImagePreview(dataUrl);
    setStep('processing');
    setOcrProgress(10);
    setOcrStatus('Preparing image for analysis...');
    setErrorMessage(null);

    // Continuous smooth animation timer so progress never stalls while OCR initializes
    let currentP = 10;
    const smoothTimer = setInterval(() => {
      // Asymptotically glide towards 88% smoothly
      currentP = currentP + (88 - currentP) * 0.08 + 0.4;
      setOcrProgress((prev) => Math.max(prev, Math.min(88, Math.round(currentP))));
    }, 100);

    try {
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Scale to optimal OCR resolution (book page x-height sweet spot: ~2400px height)
      const targetScale = Math.min(3, Math.max(1, 2400 / img.height));
      const optWidth = Math.round(img.width * targetScale);
      const optHeight = Math.round(img.height * targetScale);

      const canvas = document.createElement('canvas');
      canvas.width = optWidth;
      canvas.height = optHeight;

      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, optWidth, optHeight);

      // Contrast enhancement pass to sharpen print ink against paper
      try {
        const imgData = ctx.getImageData(0, 0, optWidth, optHeight);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // S-curve contrast boost
          let val;
          if (luma < 128) {
            val = (luma * luma) / 128; // deepen ink
          } else {
            val = 255 - ((255 - luma) * (255 - luma)) / 128; // brighten paper
          }
          d[i] = val;
          d[i + 1] = val;
          d[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (procErr) {
        console.warn('[PageScanner] Image preprocessing fallback:', procErr);
      }

      setOcrStatus('Analyzing typography lines & characters...');

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

      setOcrStatus('Scanning typography & counting words...');
      const ret = await worker.recognize(canvas);
      await worker.terminate();

      clearInterval(smoothTimer);
      setOcrProgress(94);
      setOcrStatus('Calculating typography metrics...');

      const text = ret.data?.text || '';

      // Clean and split words
      const rawWords = text
        .replace(/[^\w\s'-]/g, ' ')
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0 && !/^\d+$/.test(w)); // exclude isolated numbers

      // Find lines with meaningful text
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 5);

      if (rawWords.length < 10) {
        throw new Error(
          'Could not detect enough clear text from this capture. Please ensure good lighting, avoid glare or blur, and frame the full page of text.'
        );
      }

      const count = rawWords.length;
      const lineCount = Math.max(1, lines.length);
      const avgWpl = Number((count / lineCount).toFixed(1));

      // Append new sample to multi-page scannedPages
      const newSample = {
        id: `sample_${Date.now()}`,
        pageNum: scannedPages.length + 1,
        wordCount: count,
        lineCount,
        wordsPerLine: avgWpl
      };

      const nextSamples = [...scannedPages, newSample];
      setScannedPages(nextSamples);

      // Average across all scanned pages
      const avgDensity = Math.round(
        nextSamples.reduce((sum, s) => sum + s.wordCount, 0) / nextSamples.length
      );
      const avgLines = Math.round(
        nextSamples.reduce((sum, s) => sum + s.lineCount, 0) / nextSamples.length
      );
      const avgWplTotal = Number(
        (nextSamples.reduce((sum, s) => sum + s.wordsPerLine, 0) / nextSamples.length).toFixed(1)
      );

      setDetectedWords(avgDensity);
      setDetectedLines(avgLines);
      setWordsPerLine(avgWplTotal);

      // Smoothly animate from current progress to 100% over ~300ms
      await new Promise((resolve) => {
        let p = Math.max(88, currentP);
        const finishTimer = setInterval(() => {
          p += 2.5;
          if (p >= 100) {
            clearInterval(finishTimer);
            setOcrProgress(100);
            setTimeout(resolve, 220); // 220ms pause at 100% to let user see completion
          } else {
            setOcrProgress(Math.round(p));
          }
        }, 18);
      });

      setStep('result');
    } catch (err) {
      clearInterval(smoothTimer);
      console.error('[PageScanner] OCR failure:', err);
      setErrorMessage('Could not recognize text clearly from this image. You can try another photo or choose a preset below.');
      setStep('capture');
    }
  };

  const handleRemoveSample = (sampleId) => {
    const nextSamples = scannedPages.filter((s) => s.id !== sampleId);
    setScannedPages(nextSamples);

    if (nextSamples.length > 0) {
      const avgDensity = Math.round(
        nextSamples.reduce((sum, s) => sum + s.wordCount, 0) / nextSamples.length
      );
      const avgLines = Math.round(
        nextSamples.reduce((sum, s) => sum + s.lineCount, 0) / nextSamples.length
      );
      const avgWplTotal = Number(
        (nextSamples.reduce((sum, s) => sum + s.wordsPerLine, 0) / nextSamples.length).toFixed(1)
      );
      setDetectedWords(avgDensity);
      setDetectedLines(avgLines);
      setWordsPerLine(avgWplTotal);
    } else {
      setStep('capture');
    }
  };

  const handleApplyPreset = (words) => {
    setScannedPages([]);
    setDetectedWords(words);
    setDetectedLines(Math.round(words / 10));
    setWordsPerLine(10);
    setStep('result');
  };

  const handleSave = async () => {
    const finalDensity = Math.max(50, Math.min(1000, parseInt(detectedWords, 10) || 250));

    if (pageScannerBook?.id) {
      await bookService.updateBook(pageScannerBook.id, {
        words_per_page: finalDensity
      });
    }

    if (typeof pageScannerCallback === 'function') {
      pageScannerCallback(finalDensity);
    }

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    closePageScanner();
  };

  if (!isPageScannerOpen) return null;

  const totalPages = pageScannerBook?.pages_total || 300;
  const estimatedBookWords = Math.round(detectedWords * totalPages);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-colors duration-300 ${
          isDark
            ? 'bg-[#15141b] border-white/10 text-[#f5f5f4]'
            : 'bg-white border-[#eae3d8] text-[#292524]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-white/10 bg-[#1c1a24]' : 'border-[#eae3d8] bg-[#fbf9f6]'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className="p-1.5 rounded-lg text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-editorial">Page Density Scanner</h3>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {pageScannerBook?.title ? `Calibrate for "${pageScannerBook.title}"` : 'Calibrate words-per-page'}
              </p>
            </div>
          </div>
          <button
            onClick={closePageScanner}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-stone-400 hover:text-white hover:bg-white/10'
                : 'text-stone-400 hover:text-stone-700 hover:bg-[#ede7dd]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl text-xs font-medium bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: CAPTURE / UPLOAD */}
          {step === 'capture' && (
            <div className="space-y-4">
              {scannedPages.length > 0 ? (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-medium ${
                    isDark
                      ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                      : 'bg-amber-50/80 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span>Adding Sample #{scannedPages.length + 1} to refine average</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('result')}
                    className="underline text-[11px] hover:opacity-80 cursor-pointer"
                  >
                    View existing ({scannedPages.length})
                  </button>
                </div>
              ) : (
                <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  Snap or upload a photo of a typical, full page of text from this book. Shelf_Life will count the words and calibrate your reading speed specifically for its font and layout.
                </p>
              )}

              {/* Hidden file input supporting mobile native camera directly */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Live Camera Viewfinder (if active) */}
              {isLiveCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black aspect-3/4 flex flex-col items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    webkit-playsinline="true"
                    className="w-full h-full object-cover"
                  />

                  {/* Loading overlay if stream is starting */}
                  {isCameraLoading && (
                    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-2 z-10">
                      <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                      <span className="text-xs text-stone-300 font-medium">Opening camera...</span>
                    </div>
                  )}

                  {/* Target frame guide */}
                  <div className="absolute inset-6 border-2 border-dashed border-amber-400/80 rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="bg-black/60 text-amber-300 text-[11px] font-mono px-2 py-0.5 rounded-full">
                      Align full page here
                    </span>
                  </div>

                  {/* Flip Camera button in top-right */}
                  <button
                    type="button"
                    onClick={() => setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs cursor-pointer z-10"
                    title="Switch camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  {/* Camera control buttons overlay */}
                  <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-10">
                    <button
                      type="button"
                      onClick={stopLiveCamera}
                      className="px-3 py-1.5 text-xs rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={captureFromVideo}
                      disabled={isCameraLoading}
                      className="px-5 py-2 text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer text-white disabled:opacity-50"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Primary Capture Buttons */
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group ${
                      isDark
                        ? 'border-white/15 hover:border-amber-400/60 bg-[#1c1a24] hover:bg-[#22202c]'
                        : 'border-[#eae3d8] hover:border-[#0284c7] bg-[#fbf9f6] hover:bg-[#f4efe8]'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    >
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold">
                        {scannedPages.length > 0 ? `Snap Sample #${scannedPages.length + 1}` : 'Snap / Upload Photo'}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        Camera or file gallery
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={startLiveCamera}
                    className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group ${
                      isDark
                        ? 'border-white/15 hover:border-amber-400/60 bg-[#1c1a24] hover:bg-[#22202c]'
                        : 'border-[#eae3d8] hover:border-[#0284c7] bg-[#fbf9f6] hover:bg-[#f4efe8]'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}
                    >
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold">Live Viewfinder</span>
                      <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        Align directly in browser
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {/* Presets Alternative (Shown when no multi-page scanning active) */}
              {scannedPages.length === 0 && (
                <div className="pt-2 border-t border-dashed border-stone-300/30">
                  <span className={`block text-[11px] font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Or Pick a Standard Format Preset
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleApplyPreset(preset.words)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isDark
                            ? 'bg-[#1c1a24] border-white/10 hover:border-white/25 hover:bg-[#23212d]'
                            : 'bg-white border-[#eae3d8] hover:border-stone-400 hover:bg-[#faf7f2]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{preset.words} w/page</span>
                        </div>
                        <div className="text-[11px] font-medium truncate mt-0.5">{preset.label}</div>
                        <div className={`text-[9px] truncate ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                          {preset.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROCESSING / OCR SCANNING */}
          {step === 'processing' && (
            <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
              {/* Animated scanning box with thumbnail */}
              <div className="relative w-44 h-60 rounded-xl overflow-hidden border border-white/20 shadow-xl bg-black">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Page preview"
                    className="w-full h-full object-cover opacity-75 filter grayscale"
                  />
                )}
                {/* Laser scan line animation with smooth fluid travel */}
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

          {/* STEP 3: RESULT & FINE-TUNING */}
          {step === 'result' && (
            <div className="space-y-4 animate-fade-in">
              {/* Highlight Banner */}
              <div
                className={`p-3.5 rounded-2xl border text-center transition-colors ${
                  isDark
                    ? 'bg-amber-950/20 border-amber-800/40'
                    : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                    Calibrated Typography Density
                  </span>
                  {scannedPages.length > 1 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {scannedPages.length} Pages Averaged
                    </span>
                  )}
                </div>
                <div className="text-3xl font-extrabold font-mono" style={{ color: primaryColor }}>
                  {detectedWords} <span className="text-sm font-sans font-medium text-stone-400">words / page</span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  ≈ <strong className={isDark ? 'text-white' : 'text-stone-900'}>{estimatedBookWords.toLocaleString()}</strong> estimated total words in this {totalPages}-page book
                </p>
              </div>

              {/* Multi-Page Scanned Samples Chips */}
              {scannedPages.length > 0 && (
                <div className={`p-3 rounded-xl border space-y-2 ${isDark ? 'bg-[#1c1a24] border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'}`}>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                      <span>Scanned Samples ({scannedPages.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep('capture')}
                      className="text-[11px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      style={{ color: primaryColor }}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Another Page</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {scannedPages.map((sample, idx) => (
                      <div
                        key={sample.id}
                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-mono border ${
                          isDark ? 'bg-[#201e29] border-white/15 text-stone-200' : 'bg-white border-[#eae3d8] text-stone-800'
                        }`}
                      >
                        <span className="font-bold">Page {idx + 1}:</span>
                        <span>{sample.wordCount} words</span>
                        <span className="text-[10px] opacity-60">({sample.lineCount} lines)</span>
                        {scannedPages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSample(sample.id)}
                            className="p-0.5 rounded text-stone-400 hover:text-rose-400 cursor-pointer"
                            title="Remove this sample"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected breakdown stats */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#1c1a24] border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'}`}>
                  <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Avg Lines / Page
                  </span>
                  <span className="text-lg font-bold font-mono">
                    {detectedLines > 0 ? detectedLines : '—'}
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#1c1a24] border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'}`}>
                  <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Avg Words / Line
                  </span>
                  <span className="text-lg font-bold font-mono">
                    {wordsPerLine > 0 ? wordsPerLine : '—'}
                  </span>
                </div>
              </div>

              {/* Manual Fine-Tuning Slider / Input */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${isDark ? 'bg-[#1c1a24] border-white/10' : 'bg-[#fbf9f6] border-[#eae3d8]'}`}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    <span>Fine-Tune Words Per Page</span>
                  </span>
                  <span className={`text-[11px] font-mono ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    (Industry avg: 250)
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDetectedWords((prev) => Math.max(50, prev - 10))}
                    className={`w-9 h-9 rounded-xl font-bold text-sm border flex items-center justify-center cursor-pointer transition-colors ${
                      isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    value={detectedWords}
                    onChange={(e) => setDetectedWords(parseInt(e.target.value, 10) || 0)}
                    className={`flex-1 py-1.5 px-3 rounded-xl font-mono text-center font-bold text-lg border focus:outline-none ${
                      isDark
                        ? 'bg-[#15141b] border-white/15 text-white'
                        : 'bg-white border-stone-200 text-stone-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setDetectedWords((prev) => Math.min(1000, prev + 10))}
                    className={`w-9 h-9 rounded-xl font-bold text-sm border flex items-center justify-center cursor-pointer transition-colors ${
                      isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    +10
                  </button>
                </div>
              </div>

              {/* Action Buttons: Scan Another vs Rescan fresh */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('capture')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#201e29] hover:bg-[#2c2937] text-white border-white/15'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  <span>Scan Another Page to Average</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScannedPages([]);
                    setStep('capture');
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    isDark ? 'text-stone-400 hover:text-white border-white/10' : 'text-stone-500 hover:text-stone-800 border-[#eae3d8]'
                  }`}
                  title="Clear samples and start fresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`flex items-center justify-between p-4 border-t ${
            isDark ? 'border-white/10 bg-[#1c1a24]' : 'border-[#eae3d8] bg-[#fbf9f6]'
          }`}
        >
          <button
            type="button"
            onClick={closePageScanner}
            className={`py-2 px-4 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              isDark
                ? 'bg-[#22202c] text-stone-300 hover:bg-[#2c2938] border border-white/10'
                : 'btn-cozy btn-cozy-secondary'
            }`}
          >
            Cancel
          </button>

          {step === 'result' ? (
            <button
              type="button"
              onClick={handleSave}
              className="py-2 px-5 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              style={{
                backgroundColor: primaryColor,
                color: textOnPrimary,
                boxShadow: isDark ? `0 4px 16px ${primaryColor}40` : undefined
              }}
            >
              <Check className="w-4 h-4" />
              <span>
                {scannedPages.length > 1
                  ? `Apply Averaged (${detectedWords} w/p)`
                  : 'Apply Density to Book'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleApplyPreset(250)}
              className={`py-2 px-3 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Skip (Use 250 w/p)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
