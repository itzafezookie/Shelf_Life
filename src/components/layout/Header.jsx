import React from 'react';
import { Sliders, Database, BookOpen } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { ShelfLifeLogo } from './ShelfLifeLogo';

export function Header({ palette, isDark }) {
  const { setDataManagementOpen, setSpeedOverrideOpen, openSpeedTest } = useUIStore();

  const primaryColor = palette?.primary || '#0284c7';
  const secondaryColor = palette?.secondary || '#0284c7';

  return (
    <header
      className={`backdrop-blur-md sticky top-0 z-30 transition-colors duration-500 ${
        isDark
          ? 'bg-[#121117]/90 border-b border-white/10 text-[#f5f5f4]'
          : 'bg-[#fbf8f3]/90 border-b border-[#eae3d8] text-[#292524]'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4">
        {/* Left: Dynamic App Logo */}
        <div className="flex items-center">
          <ShelfLifeLogo
            primaryColor={palette?.primary || '#37a0f7'}
            secondaryColor={palette?.secondary || '#0284c7'}
            isDark={isDark}
            className="app-icon hover:scale-[1.02] transition-transform cursor-pointer"
          />
        </div>

        {/* Right: Quick Utilities (Desktop Pills & Mobile Icons) */}
        <div className="flex items-center gap-2">
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setSpeedOverrideOpen(true)}
              title="Reading Pace Settings"
              className={`py-1.5 px-3 text-xs rounded-xl font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#201e28] text-stone-300 hover:bg-[#2c2937] border border-white/10'
                  : 'btn-cozy btn-cozy-secondary'
              }`}
            >
              <Sliders className={`w-3.5 h-3.5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`} />
              <span>Pace</span>
            </button>

            <button
              onClick={openSpeedTest}
              title="Reading Pace Speed Test"
              className={`py-1.5 px-3 text-xs rounded-xl font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#201e28] text-stone-300 hover:bg-[#2c2937] border border-white/10'
                  : 'btn-cozy btn-cozy-secondary'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`} />
              <span>Speed Test</span>
            </button>

            <button
              onClick={() => setDataManagementOpen(true)}
              title="Backup & Restore Data"
              className={`py-1.5 px-3 text-xs rounded-xl font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#201e28] text-stone-300 hover:bg-[#2c2937] border border-white/10'
                  : 'btn-cozy btn-cozy-secondary'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`} />
              <span>Backup</span>
            </button>
          </div>

          {/* Mobile Utility Icons */}
          <div className="flex sm:hidden items-center gap-1">
            <button
              onClick={openSpeedTest}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDark
                  ? 'text-stone-300 hover:bg-white/10 border border-white/10'
                  : 'text-stone-600 hover:bg-[#ede7dd] border border-[#eae3d8]'
              }`}
              title="Reading Pace Test"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSpeedOverrideOpen(true)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDark
                  ? 'text-stone-300 hover:bg-white/10 border border-white/10'
                  : 'text-stone-600 hover:bg-[#ede7dd] border border-[#eae3d8]'
              }`}
              title="Pace"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDataManagementOpen(true)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDark
                  ? 'text-stone-300 hover:bg-white/10 border border-white/10'
                  : 'text-stone-600 hover:bg-[#ede7dd] border border-[#eae3d8]'
              }`}
              title="Data"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
