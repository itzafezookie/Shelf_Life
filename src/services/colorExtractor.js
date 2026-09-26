/**
 * Dynamic Book Cover Palette Extractor
 * Identifies top 3 dominant colors from the active book cover to dynamically
 * theme the Reading tab so the interface is directly tied to the book.
 * Automatically analyzes cover luminance to determine if dark or light mode styling is needed.
 */

const paletteCache = new Map();

export function getTextOnColor(hex) {
  if (!hex || typeof hex !== 'string') return 'rgba(255, 255, 255, 0.7)';
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // If brightness is high (like yellow, cream, light cyan), use dark text at 70% opacity
  // Otherwise use light text at 70% opacity
  return luminance > 0.55 ? 'rgba(0, 0, 0, 0.70)' : 'rgba(255, 255, 255, 0.70)';
}

export async function extractPaletteFromImage(imageUrl, bookTitle = '', themePreference = 'auto') {
  const cacheKey = `${imageUrl || 'no-img'}_${bookTitle || 'no-title'}_${themePreference}`;
  if (paletteCache.has(cacheKey)) return paletteCache.get(cacheKey);

  if (!imageUrl) {
    const fallback = generateHarmoniousPalette(bookTitle, themePreference);
    paletteCache.set(cacheKey, fallback);
    return fallback;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const fallbackTimeout = setTimeout(() => {
      const fallback = generateHarmoniousPalette(bookTitle || imageUrl, themePreference);
      paletteCache.set(cacheKey, fallback);
      resolve(fallback);
    }, 1200);

    img.onload = () => {
      clearTimeout(fallbackTimeout);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 64;
        const height = 64;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height).data;

        // Color quantization bucket map
        const vibrantMap = new Map();
        const allColorsMap = new Map();

        let darkPixelCount = 0;
        let edgeDarkPixelCount = 0;
        let totalEdgePixels = 0;
        let totalSampledPixels = 0;
        let totalBrightnessSum = 0;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];
            const a = imgData[idx + 3];

            if (a < 128) continue; // Skip transparency

            totalSampledPixels++;
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            totalBrightnessSum += brightness;

            const isDarkPixel = brightness < 95;
            if (isDarkPixel) {
              darkPixelCount++;
            }

            // Outer perimeter check (first/last 4 rows and columns)
            const isEdge = x < 4 || x >= width - 4 || y < 4 || y >= height - 4;
            if (isEdge) {
              totalEdgePixels++;
              if (isDarkPixel) {
                edgeDarkPixelCount++;
              }
            }

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;

            // Quantize into 24-step color buckets
            const qr = Math.min(255, Math.max(0, Math.round(r / 24) * 24));
            const qg = Math.min(255, Math.max(0, Math.round(g / 24) * 24));
            const qb = Math.min(255, Math.max(0, Math.round(b / 24) * 24));
            const key = `${qr},${qg},${qb}`;

            allColorsMap.set(key, (allColorsMap.get(key) || 0) + 1);

            // Vibrant bucket: exclude near-blacks (<25), near-whites (>245), and dull grays (delta < 20)
            if (brightness >= 25 && brightness <= 245 && delta >= 20) {
              vibrantMap.set(key, (vibrantMap.get(key) || 0) + 1);
            }
          }
        }

        // Cover darkness analysis
        const edgeDarkRatio = totalEdgePixels > 0 ? edgeDarkPixelCount / totalEdgePixels : 0;
        const overallDarkRatio = totalSampledPixels > 0 ? darkPixelCount / totalSampledPixels : 0;
        const avgBrightness = totalSampledPixels > 0 ? totalBrightnessSum / totalSampledPixels : 128;

        let isDark = false;
        if (themePreference === 'dark') {
          isDark = true;
        } else if (themePreference === 'light') {
          isDark = false;
        } else {
          // Automatic detection from cover:
          // Covers with dark edges (>48%), majority dark pixels (>42%), or low avg brightness (<115)
          isDark = edgeDarkRatio > 0.48 || overallDarkRatio > 0.42 || avgBrightness < 115;
        }

        // Favor vibrant colors, fallback to general dominant colors
        const activeCounts = vibrantMap.size >= 2 ? vibrantMap : allColorsMap;

        const sortedColors = Array.from(activeCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([key]) => key.split(',').map(Number));

        if (sortedColors.length === 0) {
          const fallback = generateHarmoniousPalette(bookTitle || imageUrl, themePreference);
          paletteCache.set(cacheKey, fallback);
          return resolve(fallback);
        }

        // Top 1: Dominant primary color
        const [r1, g1, b1] = sortedColors[0];
        const primary = rgbToHex(r1, g1, b1);

        // Top 2: Distinct secondary color (Euclidean distance > 60)
        let secondary = null;
        let [r2, g2, b2] = [r1, g1, b1];
        for (let i = 1; i < sortedColors.length; i++) {
          const [cr, cg, cb] = sortedColors[i];
          const dist = Math.sqrt(Math.pow(r1 - cr, 2) + Math.pow(g1 - cg, 2) + Math.pow(b1 - cb, 2));
          if (dist > 60) {
            r2 = cr; g2 = cg; b2 = cb;
            secondary = rgbToHex(cr, cg, cb);
            break;
          }
        }
        if (!secondary) {
          secondary = adjustColor(r1, g1, b1, 40);
        }

        // Top 3: Distinct tertiary color (distance > 50 from both primary and secondary)
        let tertiary = null;
        for (let i = 1; i < sortedColors.length; i++) {
          const [cr, cg, cb] = sortedColors[i];
          const dist1 = Math.sqrt(Math.pow(r1 - cr, 2) + Math.pow(g1 - cg, 2) + Math.pow(b1 - cb, 2));
          const dist2 = Math.sqrt(Math.pow(r2 - cr, 2) + Math.pow(g2 - cg, 2) + Math.pow(b2 - cb, 2));
          if (dist1 > 50 && dist2 > 50) {
            tertiary = rgbToHex(cr, cg, cb);
            break;
          }
        }
        if (!tertiary) {
          tertiary = adjustColor(r1, g1, b1, -35);
        }

        // Dynamic tints & theme tokens
        const tint = `rgba(${r1}, ${g1}, ${b1}, ${isDark ? 0.12 : 0.05})`;
        const tintMedium = `rgba(${r1}, ${g1}, ${b1}, ${isDark ? 0.22 : 0.12})`;

        // Perceived brightness of primary for text on primary button
        const textOnPrimary = getTextOnColor(primary);

        // Extract genuinely distinct candidate colors from the image
        const distinctCandidates = [];
        const candidateSource = vibrantMap.size >= 3 ? vibrantMap : allColorsMap;

        for (const [key] of Array.from(candidateSource.entries()).sort((a, b) => b[1] - a[1])) {
          const [cr, cg, cb] = key.split(',').map(Number);
          const isDistinct = distinctCandidates.every(([dr, dg, db]) => {
            return Math.sqrt(Math.pow(cr - dr, 2) + Math.pow(cg - dg, 2) + Math.pow(cb - db, 2)) > 32;
          });
          if (isDistinct) {
            distinctCandidates.push([cr, cg, cb]);
          }
          if (distinctCandidates.length >= 8) break;
        }

        // Also add top 2 neutral or background tones if distinct
        for (const [key] of Array.from(allColorsMap.entries()).sort((a, b) => b[1] - a[1])) {
          if (distinctCandidates.length >= 10) break;
          const [cr, cg, cb] = key.split(',').map(Number);
          const isDistinct = distinctCandidates.every(([dr, dg, db]) => {
            return Math.sqrt(Math.pow(cr - dr, 2) + Math.pow(cg - dg, 2) + Math.pow(cb - db, 2)) > 32;
          });
          if (isDistinct) {
            distinctCandidates.push([cr, cg, cb]);
          }
        }

        const candidateColors = distinctCandidates.map(([cr, cg, cb]) => rgbToHex(cr, cg, cb));

        const result = {
          primary,
          secondary,
          tertiary,
          topColors: [primary, secondary, tertiary],
          candidates: candidateColors,
          isDark,
          themeMode: isDark ? 'dark' : 'light',
          bgApp: isDark ? '#0e0d12' : '#fbf8f3',
          bgCard: isDark ? '#17161c' : '#ffffff',
          bgCardSubtle: isDark ? '#201e26' : '#fbf9f6',
          cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#eae3d8',
          cardBorderSubtle: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ede7dd',
          textPrimary: isDark ? '#f5f5f4' : '#292524',
          textSecondary: isDark ? '#a8a29e' : '#78716c',
          textMuted: isDark ? '#78716c' : '#a8a29e',
          ringTrack: isDark ? '#26242e' : '#ede7dd',
          tint,
          tintMedium,
          textOnPrimary
        };

        paletteCache.set(cacheKey, result);
        resolve(result);
      } catch (err) {
        const fallback = generateHarmoniousPalette(bookTitle || imageUrl, themePreference);
        paletteCache.set(cacheKey, fallback);
        resolve(fallback);
      }
    };

    img.onerror = () => {
      clearTimeout(fallbackTimeout);
      const fallback = generateHarmoniousPalette(bookTitle || imageUrl, themePreference);
      paletteCache.set(cacheKey, fallback);
      resolve(fallback);
    };

    img.src = imageUrl;
  });
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => {
    const hex = Math.min(255, Math.max(0, x)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function adjustColor(r, g, b, delta) {
  const nr = Math.min(255, Math.max(0, r + delta));
  const ng = Math.min(255, Math.max(0, g + (delta > 0 ? -Math.round(delta * 0.5) : Math.round(Math.abs(delta) * 0.5))));
  const nb = Math.min(255, Math.max(0, b + delta));
  return rgbToHex(nr, ng, nb);
}

function generateHarmoniousPalette(seed = '', themePreference = 'auto') {
  const isDark = themePreference === 'dark' || (themePreference !== 'light' && seed.toLowerCase().includes('crawler'));

  const curatedPalettes = [
    { primary: '#facc15', secondary: '#ec4899', tertiary: '#06b6d4' }, // DCC vibe
    { primary: '#0284c7', secondary: '#d97706', tertiary: '#059669' },
    { primary: '#e11d48', secondary: '#ca8a04', tertiary: '#2563eb' },
    { primary: '#7c3aed', secondary: '#db2777', tertiary: '#0284c7' },
    { primary: '#059669', secondary: '#d97706', tertiary: '#2563eb' }
  ];

  const hash = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const selected = curatedPalettes[Math.abs(hash) % curatedPalettes.length];

  return {
    ...selected,
    topColors: [selected.primary, selected.secondary, selected.tertiary],
    candidates: [selected.primary, selected.secondary, selected.tertiary],
    isDark,
    themeMode: isDark ? 'dark' : 'light',
    bgApp: isDark ? '#0e0d12' : '#fbf8f3',
    bgCard: isDark ? '#17161c' : '#ffffff',
    bgCardSubtle: isDark ? '#201e26' : '#fbf9f6',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#eae3d8',
    cardBorderSubtle: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ede7dd',
    textPrimary: isDark ? '#f5f5f4' : '#292524',
    textSecondary: isDark ? '#a8a29e' : '#78716c',
    textMuted: isDark ? '#78716c' : '#a8a29e',
    ringTrack: isDark ? '#26242e' : '#ede7dd',
    tint: isDark ? 'rgba(250, 204, 21, 0.12)' : 'rgba(2, 132, 199, 0.05)',
    tintMedium: isDark ? 'rgba(250, 204, 21, 0.22)' : 'rgba(2, 132, 199, 0.12)',
    textOnPrimary: getTextOnColor(selected.primary)
  };
}
