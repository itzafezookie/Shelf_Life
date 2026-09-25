import React from 'react';
import { Plus, Sliders, Database, BookOpen, Library, BarChart2, History } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

/**
 * Look-Ahead Style Sleek Header
 * Low-profile, dark-translucent header with integrated tab pills and quick actions.
 */
export function LookAheadHeader() {
  const { activeTab, setActiveTab, setAddBookOpen, setDataManagementOpen, setSpeedOverrideOpen } = useUIStore();

  const navItems = [
    { id: 'current', label: 'Reading Nook', icon: BookOpen },
    { id: 'library', label: 'The Shelves', icon: Library },
    { id: 'analytics', label: 'Insights', icon: BarChart2 },
    { id: 'history', label: 'Archive', icon: History }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-stone-950/80 backdrop-blur-xl border-b border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Logo & Subtitle */}
        <div className="flex items-center gap-3">
          <img
            src="./Logo_Header.svg"
            alt="Shelf Life"
            className="h-7 w-auto hover:scale-105 transition-transform cursor-pointer"
          />
          <span className="hidden md:inline-block text-[11px] font-mono font-medium text-stone-400 border-l border-stone-800 pl-3">
            Reading Studio
          </span>
        </div>

        {/* Center: Integrated Navigation Tabs (Look-Ahead Pill Bar) */}
        <nav className="flex items-center gap-1 bg-stone-900/90 p-1 rounded-full border border-stone-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-500'}`} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSpeedOverrideOpen(true)}
            title="Pace Calibration"
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800/80 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setDataManagementOpen(true)}
            title="Data Backup & Restore"
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800/80 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setAddBookOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs py-1.5 px-3 rounded-full flex items-center gap-1 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Book</span>
          </button>
        </div>
      </div>
    </header>
  );
}
