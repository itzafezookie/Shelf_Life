import React from 'react';
import { BookOpen, Library, BarChart2, History } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

export function Navigation({ palette, isDark }) {
  const { activeTab, setActiveTab } = useUIStore();

  const primaryColor = palette?.primary || '#0284c7';

  const navItems = [
    { id: 'current', label: 'Reading', icon: BookOpen },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'analytics', label: 'Stats', icon: BarChart2 }
  ];

  return (
    <>
      {/* Desktop / Tablet Navigation Bar */}
      <nav className="py-3 hidden sm:flex justify-center transition-colors duration-500">
        <div
          className={`flex items-center gap-1.5 p-1.5 rounded-2xl shadow-2xs transition-colors duration-500 ${
            isDark
              ? 'bg-[#1a1822]/90 border border-white/10'
              : 'bg-[#ede7dd]/80 border border-[#e2d9cd]'
          }`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'bg-white/15 text-white shadow-sm border border-white/15'
                      : 'bg-white text-stone-900 shadow-sm border border-[#e2d9cd]'
                    : isDark
                    ? 'text-stone-400 hover:text-white hover:bg-white/5'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                }`}
              >
                <Icon
                  className="w-3.5 h-3.5 transition-colors"
                  style={{
                    color: isActive ? primaryColor : undefined
                  }}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Fixed Bottom Navigation Bar for PWA */}
      <nav
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md shadow-lg safe-bottom transition-colors duration-500 ${
          isDark
            ? 'bg-[#121116]/95 border-t border-white/10 text-white'
            : 'bg-[#fbf8f3]/95 border-t border-[#eae3d8] text-[#292524]'
        }`}
      >
        <div className="grid grid-cols-3 h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  isActive
                    ? 'font-bold'
                    : isDark
                    ? 'text-stone-400 hover:text-white'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                style={isActive ? { color: primaryColor } : undefined}
              >
                <div
                  className="p-1 rounded-lg transition-colors"
                  style={
                    isActive
                      ? { backgroundColor: `${primaryColor}20` }
                      : undefined
                  }
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
