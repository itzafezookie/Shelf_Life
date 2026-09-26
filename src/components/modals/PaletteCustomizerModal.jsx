import React, { useState, useEffect } from 'react';
import { X, Palette, RefreshCw, Check, Sparkles, Sliders } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { bookService } from '../../services/bookService';
import { extractPaletteFromImage, getTextOnColor } from '../../services/colorExtractor';
import confetti from 'canvas-confetti';
import { CustomColorPicker } from './CustomColorPicker';

export function PaletteCustomizerModal({ palette, isDark }) {
  const { isPaletteCustomizerOpen, paletteCustomizerBook, closePaletteCustomizer } = useUIStore();

  const [primary, setPrimary] = useState('#0284c7');
  const [secondary, setSecondary] = useState('#ec4899');
  const [tertiary, setTertiary] = useState('#06b6d4');
  const [detectedSwatches, setDetectedSwatches] = useState([]);
  const [activeSlot, setActiveSlot] = useState('primary'); // 'primary' | 'secondary' | 'tertiary'
  const [autoPalette, setAutoPalette] = useState(null);

  const textOnPrimary = getTextOnColor(primary);

  useEffect(() => {
    if (!isPaletteCustomizerOpen || !paletteCustomizerBook) return;

    async function loadColors() {
      const extracted = await extractPaletteFromImage(
        paletteCustomizerBook.cover_url,
        paletteCustomizerBook.title,
        paletteCustomizerBook.theme_mode || 'auto'
      );
      setAutoPalette(extracted);

      const custom = paletteCustomizerBook.custom_palette;
      setPrimary(custom?.primary || extracted.primary);
      setSecondary(custom?.secondary || extracted.secondary);
      setTertiary(custom?.tertiary || extracted.tertiary);

      // Collect ONLY genuine detected swatches from the book cover
      const allSwatches = Array.from(
        new Set([
          extracted.primary,
          extracted.secondary,
          extracted.tertiary,
          ...(extracted.candidates || [])
        ].filter(Boolean))
      );
      setDetectedSwatches(allSwatches);
    }

    loadColors();
  }, [isPaletteCustomizerOpen, paletteCustomizerBook]);

  if (!isPaletteCustomizerOpen || !paletteCustomizerBook) return null;

  const handleSelectSwatch = (color) => {
    if (activeSlot === 'primary') setPrimary(color);
    else if (activeSlot === 'secondary') setSecondary(color);
    else if (activeSlot === 'tertiary') setTertiary(color);
  };

  const handleResetToAuto = () => {
    if (autoPalette) {
      setPrimary(autoPalette.primary);
      setSecondary(autoPalette.secondary);
      setTertiary(autoPalette.tertiary);
    }
  };

  const handleSave = async () => {
    const isCustomized =
      autoPalette &&
      (primary !== autoPalette.primary ||
        secondary !== autoPalette.secondary ||
        tertiary !== autoPalette.tertiary);

    await bookService.updateBook(paletteCustomizerBook.id, {
      custom_palette: isCustomized ? { primary, secondary, tertiary } : null
    });

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    closePaletteCustomizer();
  };

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
              style={{ backgroundColor: primary }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-editorial">Book Color Palette</h3>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Fine-tune detected cover colors for "{paletteCustomizerBook.title}"
              </p>
            </div>
          </div>
          <button
            onClick={closePaletteCustomizer}
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
          {/* Live Preview Card */}
          <div
            className="p-4 rounded-xl border relative overflow-hidden transition-all duration-300"
            style={{
              background: isDark
                ? `linear-gradient(135deg, ${primary}25 0%, #17161c 50%, ${secondary}20 100%)`
                : `linear-gradient(135deg, ${primary}12 0%, #ffffff 50%, ${secondary}12 100%)`,
              borderColor: `${primary}40`
            }}
          >
            {/* Top gradient line preview */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(90deg, ${primary} 0%, ${secondary} 50%, ${tertiary} 100%)`
              }}
            />

            <div className="flex items-center gap-3">
              <div
                className="w-12 h-16 rounded-lg overflow-hidden border shadow-sm shrink-0 bg-stone-200"
                style={{ borderColor: primary }}
              >
                <img
                  src={paletteCustomizerBook.cover_url || './default-cover-small.svg'}
                  alt={paletteCustomizerBook.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = './default-cover-small.svg';
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: `${primary}20`,
                    color: primary,
                    borderColor: `${primary}40`
                  }}
                >
                  Live Preview
                </span>
                <h4 className="text-sm font-bold truncate mt-1">{paletteCustomizerBook.title}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs transition-colors"
                    style={{ backgroundColor: primary, color: textOnPrimary }}
                  >
                    Primary Button
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-md border"
                    style={{ borderColor: `${secondary}60`, color: secondary }}
                  >
                    Secondary
                  </span>
                  <span
                    className="text-xs font-mono font-bold"
                    style={{ color: tertiary }}
                  >
                    Tertiary
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active 3 Color Slots Selector */}
          <div>
            <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
              Select Color Slot to Edit:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Primary Slot */}
              <button
                type="button"
                onClick={() => setActiveSlot('primary')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  activeSlot === 'primary'
                    ? 'ring-2 ring-amber-400 font-bold shadow-sm'
                    : isDark
                    ? 'border-white/10 bg-[#1c1a24] opacity-80 hover:opacity-100'
                    : 'border-[#eae3d8] bg-[#fbf9f6] opacity-80 hover:opacity-100'
                }`}
                style={activeSlot === 'primary' ? { borderColor: primary } : undefined}
              >
                <div
                  className="w-6 h-6 rounded-full border border-black/20 shadow-2xs"
                  style={{ backgroundColor: primary }}
                />
                <span className="text-xs">Primary</span>
                <span className="text-[10px] font-mono opacity-60 uppercase">{primary}</span>
              </button>

              {/* Secondary Slot */}
              <button
                type="button"
                onClick={() => setActiveSlot('secondary')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  activeSlot === 'secondary'
                    ? 'ring-2 ring-amber-400 font-bold shadow-sm'
                    : isDark
                    ? 'border-white/10 bg-[#1c1a24] opacity-80 hover:opacity-100'
                    : 'border-[#eae3d8] bg-[#fbf9f6] opacity-80 hover:opacity-100'
                }`}
                style={activeSlot === 'secondary' ? { borderColor: secondary } : undefined}
              >
                <div
                  className="w-6 h-6 rounded-full border border-black/20 shadow-2xs"
                  style={{ backgroundColor: secondary }}
                />
                <span className="text-xs">Secondary</span>
                <span className="text-[10px] font-mono opacity-60 uppercase">{secondary}</span>
              </button>

              {/* Tertiary Slot */}
              <button
                type="button"
                onClick={() => setActiveSlot('tertiary')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  activeSlot === 'tertiary'
                    ? 'ring-2 ring-amber-400 font-bold shadow-sm'
                    : isDark
                    ? 'border-white/10 bg-[#1c1a24] opacity-80 hover:opacity-100'
                    : 'border-[#eae3d8] bg-[#fbf9f6] opacity-80 hover:opacity-100'
                }`}
                style={activeSlot === 'tertiary' ? { borderColor: tertiary } : undefined}
              >
                <div
                  className="w-6 h-6 rounded-full border border-black/20 shadow-2xs"
                  style={{ backgroundColor: tertiary }}
                />
                <span className="text-xs">Tertiary</span>
                <span className="text-[10px] font-mono opacity-60 uppercase">{tertiary}</span>
              </button>
            </div>
          </div>

          {/* In-App Custom Color Mixer (Zero OS native popups) */}
          <CustomColorPicker
            label={`Custom ${activeSlot.charAt(0).toUpperCase() + activeSlot.slice(1)} Color`}
            value={activeSlot === 'primary' ? primary : activeSlot === 'secondary' ? secondary : tertiary}
            onChange={(color) => handleSelectSwatch(color)}
            isDark={isDark}
          />

          {/* Swatches from Detected Cover Colors (Strictly 2 rows of 5) */}
          <div>
            <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
              Detected Palette Swatches ({Math.min(10, detectedSwatches.length)}):
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {detectedSwatches.slice(0, 10).map((color, idx) => {
                const currentSlotColor =
                  activeSlot === 'primary' ? primary : activeSlot === 'secondary' ? secondary : tertiary;
                const isSelected = currentSlotColor.toLowerCase() === color.toLowerCase();
                const iconColor = getTextOnColor(color);

                return (
                  <button
                    key={`${color}_${idx}`}
                    type="button"
                    onClick={() => handleSelectSwatch(color)}
                    className={`h-11 w-full rounded-xl border transition-all hover:scale-105 flex items-center justify-center cursor-pointer shadow-2xs relative ${
                      isSelected ? 'ring-2 ring-amber-400 scale-102 font-bold' : 'border-black/20'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {isSelected && <Check className="w-4 h-4 drop-shadow-md" style={{ stroke: iconColor }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetToAuto}
            className={`w-full py-1.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Auto-Detected Cover Colors</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div
          className={`flex items-center justify-between p-4 border-t ${
            isDark ? 'border-white/10 bg-[#1c1a24]' : 'border-[#eae3d8] bg-[#fbf9f6]'
          }`}
        >
          <button
            type="button"
            onClick={closePaletteCustomizer}
            className={`py-2 px-4 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              isDark
                ? 'bg-[#22202c] text-stone-300 hover:bg-[#2c2938] border border-white/10'
                : 'btn-cozy btn-cozy-secondary'
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="py-2 px-5 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            style={{
              backgroundColor: primary,
              color: textOnPrimary,
              boxShadow: isDark ? `0 4px 16px ${primary}40` : undefined
            }}
          >
            <Check className="w-4 h-4" style={{ stroke: textOnPrimary }} />
            <span>Apply Palette</span>
          </button>
        </div>
      </div>
    </div>
  );
}
