import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, Check } from 'lucide-react';
import { getTextOnColor } from '../../services/colorExtractor';

// Color conversion utilities
export function hexToHsl(hex) {
  if (!hex || typeof hex !== 'string') return { h: 200, s: 75, l: 50 };
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return { h: 200, s: 75, l: 50 };

  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function hslToHex(h, s, l) {
  const sRatio = s / 100;
  const lRatio = l / 100;
  const a = sRatio * Math.min(lRatio, 1 - lRatio);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = lRatio - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

const CURATED_PRESETS = [
  '#DC2626', // Crimson
  '#EA580C', // Rust
  '#D97706', // Amber Gold
  '#059669', // Emerald
  '#0D9488', // Teal
  '#0284C7', // Ocean Sky
  '#4F46E5', // Indigo
  '#7C3AED', // Violet
  '#DB2777', // Rose Pink
  '#475569'  // Slate Noir
];

export function CustomColorPicker({ value = '#0284c7', onChange, isDark, label = 'Custom Color' }) {
  const [hsl, setHsl] = useState(() => hexToHsl(value));
  const [hexInput, setHexInput] = useState(value);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync state if external value changes
  useEffect(() => {
    if (value && value.toUpperCase() !== hexInput.toUpperCase()) {
      setHexInput(value);
      setHsl(hexToHsl(value));
    }
  }, [value]);

  const updateFromHsl = (newHsl) => {
    setHsl(newHsl);
    const hex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
    setHexInput(hex);
    if (onChange) onChange(hex);
  };

  const handleHexChange = (e) => {
    let input = e.target.value.toUpperCase();
    if (!input.startsWith('#')) input = `#${input}`;
    setHexInput(input);

    const clean = input.replace('#', '');
    if (clean.length === 6 && /^[0-9A-F]{6}$/i.test(clean)) {
      setHsl(hexToHsl(input));
      if (onChange) onChange(input);
    }
  };

  const textColor = getTextOnColor(value);

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isDark ? 'bg-[#181622] border-white/10' : 'bg-[#faf8f4] border-[#eae3d8]'
      }`}
    >
      {/* Header bar: Swatch, Hex input & toggle */}
      <div className="p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Custom circular color button that toggles picker */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 rounded-xl border border-black/20 shadow-xs flex items-center justify-center transition-transform hover:scale-105 cursor-pointer relative"
            style={{ backgroundColor: value }}
            title="Click to toggle color mixer sliders"
          >
            <Sliders className="w-3.5 h-3.5 drop-shadow-sm" style={{ stroke: textColor }} />
          </button>

          <div>
            <span className="text-xs font-semibold block leading-tight">{label}</span>
            <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              {isExpanded ? 'Click to collapse mixer' : 'Click to adjust sliders'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Hex Input */}
          <input
            type="text"
            maxLength={7}
            value={hexInput}
            onChange={handleHexChange}
            className={`w-22 px-2 py-1 text-xs font-mono font-bold rounded-lg border text-center uppercase tracking-wider ${
              isDark ? 'bg-[#121117] border-white/15 text-white' : 'bg-white border-stone-300 text-stone-900'
            }`}
          />

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-2 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              isExpanded
                ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                : isDark
                ? 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {isExpanded ? 'Done' : 'Adjust'}
          </button>
        </div>
      </div>

      {/* Expanded In-App Sliders (No native OS popups!) */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-dashed border-stone-200 dark:border-white/10 animate-fade-in">
          {/* 1. Hue Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>Hue</span>
              <span className="font-bold">{hsl.h}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={hsl.h}
              onChange={(e) => updateFromHsl({ ...hsl, h: parseInt(e.target.value, 10) })}
              className="w-full h-3 rounded-full appearance-none cursor-pointer outline-none shadow-inner"
              style={{
                background:
                  'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
              }}
            />
          </div>

          {/* 2. Saturation Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>Saturation</span>
              <span className="font-bold">{hsl.s}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={hsl.s}
              onChange={(e) => updateFromHsl({ ...hsl, s: parseInt(e.target.value, 10) })}
              className="w-full h-3 rounded-full appearance-none cursor-pointer outline-none shadow-inner"
              style={{
                background: `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`
              }}
            />
          </div>

          {/* 3. Lightness / Brightness Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>Lightness</span>
              <span className="font-bold">{hsl.l}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="95"
              value={hsl.l}
              onChange={(e) => updateFromHsl({ ...hsl, l: parseInt(e.target.value, 10) })}
              className="w-full h-3 rounded-full appearance-none cursor-pointer outline-none shadow-inner"
              style={{
                background: `linear-gradient(to right, #000000, hsl(${hsl.h}, ${hsl.s}%, 50%), #ffffff)`
              }}
            />
          </div>

          {/* Curated Presets Bar */}
          <div className="pt-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Curated Accents:
            </span>
            <div className="grid grid-cols-10 gap-1.5">
              {CURATED_PRESETS.map((preset) => {
                const isSelected = value.toLowerCase() === preset.toLowerCase();
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setHsl(hexToHsl(preset));
                      setHexInput(preset);
                      if (onChange) onChange(preset);
                    }}
                    className={`h-5 w-full rounded-md border transition-transform hover:scale-110 cursor-pointer ${
                      isSelected ? 'ring-2 ring-amber-400 border-white scale-105' : 'border-black/20'
                    }`}
                    style={{ backgroundColor: preset }}
                    title={preset}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
