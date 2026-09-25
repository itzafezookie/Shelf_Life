import React, { useEffect, useRef } from 'react';
import { SceneManager } from '../../scene/SceneManager';
import { useUIStore } from '../../stores/useUIStore';

export function Library3DView({ books, currentBook }) {
  const containerRef = useRef(null);
  const sceneManagerRef = useRef(null);
  const { activeTab, openBookDetail } = useUIStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const manager = new SceneManager(containerRef.current, (selectedBook) => {
      if (selectedBook?.id) {
        openBookDetail(selectedBook.id);
      }
    });

    sceneManagerRef.current = manager;

    return () => {
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  // Tween camera whenever active tab changes
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.tweenToTab(activeTab);
    }
  }, [activeTab]);

  // Update shelf books
  useEffect(() => {
    if (sceneManagerRef.current && books) {
      sceneManagerRef.current.updateBooks(books);
    }
  }, [books]);

  // Update current book in reading nook
  useEffect(() => {
    if (sceneManagerRef.current && currentBook) {
      sceneManagerRef.current.updateCurrentBook(currentBook);
    }
  }, [currentBook]);

  const areaTitles = {
    current: 'The Reading Nook',
    library: 'The Grand Shelves',
    analytics: 'The Study Alcove',
    history: 'The Archive Vault'
  };

  return (
    <div className="relative w-full h-[52vh] sm:h-[58vh] min-h-[340px] rounded-3xl overflow-hidden border border-[#eae3d8] shadow-sm mb-6 bg-[#fbf8f3]">
      {/* Three.js WebGL Canvas Mount */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Area Title Indicator */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-white/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#ded5c7] shadow-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0284c7] animate-pulse" />
          <span className="text-xs font-bold font-editorial text-stone-900 tracking-wide">
            {areaTitles[activeTab] || 'Library'}
          </span>
          {activeTab === 'library' && (
            <span className="text-[10px] text-stone-500 font-sans border-l border-stone-300 pl-2">
              Hover & click books
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
