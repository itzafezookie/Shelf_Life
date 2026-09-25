import React, { useState, useEffect } from 'react';
import { X, Sliders } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { db } from '../../db/db';
import { analyticsEngine } from '../../services/analyticsEngine';

export function SpeedOverrideModal({ baselineWPM = 250, onSave, palette, isDark }) {
  const { isSpeedOverrideOpen, setSpeedOverrideOpen } = useUIStore();
  const [wpmInput, setWpmInput] = useState(baselineWPM);

  const primaryColor = palette?.primary || '#0284c7';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  useEffect(() => {
    setWpmInput(baselineWPM);
  }, [baselineWPM]);

  if (!isSpeedOverrideOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    const parsed = Math.max(50, Math.min(1200, parseInt(wpmInput, 10) || 250));
    await db.settings.put({ key: 'baselineWPM', value: parsed });
    if (onSave) onSave(parsed);
    setSpeedOverrideOpen(false);
  };

  const calculatedPPM = analyticsEngine.calculatePPMFromWPM(wpmInput);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden transition-colors duration-300 ${
          isDark
            ? 'bg-[#15141b] border-white/10 text-[#f5f5f4]'
            : 'bg-white border-[#eae3d8] text-[#292524]'
        }`}
      >
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-white/10 bg-[#1c1a24]' : 'border-[#eae3d8] bg-[#fbf9f6]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5" style={{ color: primaryColor }} />
            <h3 className="text-base font-bold font-editorial">Reading Pace Calibration</h3>
          </div>
          <button
            onClick={() => setSpeedOverrideOpen(false)}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-stone-400 hover:text-white hover:bg-white/10'
                : 'text-stone-400 hover:text-stone-700 hover:bg-[#ede7dd]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            Your baseline speed is used to project completion dates, estimated times, and daily targets when not enough session data has been recorded.
          </p>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
              Words Per Minute (WPM)
            </label>
            <input
              type="number"
              min="50"
              max="1200"
              value={wpmInput}
              onChange={(e) => setWpmInput(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl font-mono text-xl font-bold text-center focus:outline-none ${
                isDark
                  ? 'bg-[#201e29] border border-white/10 text-white'
                  : 'bg-white border border-[#eae3d8] text-stone-900'
              }`}
              style={{ borderColor: isDark ? undefined : primaryColor }}
            />
            <div className={`flex items-center justify-between text-[11px] mt-1.5 px-1 font-mono ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              <span>≈ {calculatedPPM} pages/min</span>
              <span>(Avg: 200–300 wpm)</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSpeedOverrideOpen(false)}
              className={`flex-1 py-2 text-xs rounded-xl font-semibold transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#22202c] text-stone-300 hover:bg-[#2c2938] border border-white/10'
                  : 'btn-cozy btn-cozy-secondary'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              style={{
                backgroundColor: primaryColor,
                color: textOnPrimary,
                boxShadow: isDark ? `0 4px 16px ${primaryColor}40` : undefined
              }}
            >
              Save Setting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
