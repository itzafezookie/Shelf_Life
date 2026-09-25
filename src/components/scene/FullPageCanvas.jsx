import React, { useEffect, useRef } from 'react';
import { DioramaSceneManager } from '../../scene/diorama/DioramaSceneManager';
import { useUIStore } from '../../stores/useUIStore';

export function FullPageCanvas({ books, currentBook, onSceneReady }) {
  const containerRef = useRef(null);
  const sceneManagerRef = useRef(null);
  const { activeTab, openBookDetail } = useUIStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const manager = new DioramaSceneManager(containerRef.current, (selectedBook) => {
      if (selectedBook?.id) {
        openBookDetail(selectedBook.id);
      }
    });

    sceneManagerRef.current = manager;
    if (onSceneReady) {
      onSceneReady(manager);
    }

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

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-auto">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* ThreeUI Ambient Vignette Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background: 'radial-gradient(125% 95% at 50% 45%, transparent 52%, rgba(45, 30, 15, 0.08) 100%)'
        }}
      />
    </div>
  );
}
