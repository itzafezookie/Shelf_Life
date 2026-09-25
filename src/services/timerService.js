/**
 * Headless Session Timer Engine
 * Adheres to Guardrail #3: All clocks run inside headless services or dedicated workers.
 * Zero setInterval/setTimeout inside React components.
 */

class TimerService {
  constructor() {
    this.intervalId = null;
    this.status = 'idle'; // 'idle' | 'reading' | 'paused'
    this.activeBook = null;
    this.startTime = null;
    this.pausedAt = null;
    this.totalPausedDurationMs = 0;
    this.elapsedSeconds = 0;
    this.subscribers = new Set();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const state = this.getState();
    this.subscribers.forEach(cb => {
      try {
        cb(state);
      } catch (err) {
        console.error('[TimerService] Subscriber notification error:', err);
      }
    });
  }

  getState() {
    return {
      status: this.status,
      activeBook: this.activeBook,
      startTime: this.startTime ? this.startTime.toISOString() : null,
      elapsedSeconds: this.elapsedSeconds,
      formattedTime: this.formatDuration(this.elapsedSeconds)
    };
  }

  formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  startSession(book) {
    if (!book) return;
    this.activeBook = book;
    this.status = 'reading';
    this.startTime = new Date();
    this.pausedAt = null;
    this.totalPausedDurationMs = 0;
    this.elapsedSeconds = 0;

    this.startTicker();
    this.notify();
  }

  pauseSession() {
    if (this.status !== 'reading') return;
    this.status = 'paused';
    this.pausedAt = Date.now();
    this.stopTicker();
    this.notify();
  }

  resumeSession() {
    if (this.status !== 'paused') return;
    if (this.pausedAt) {
      this.totalPausedDurationMs += Date.now() - this.pausedAt;
      this.pausedAt = null;
    }
    this.status = 'reading';
    this.startTicker();
    this.notify();
  }

  stopSession() {
    if (this.status === 'idle') return null;

    if (this.status === 'paused' && this.pausedAt) {
      this.totalPausedDurationMs += Date.now() - this.pausedAt;
    }

    this.stopTicker();
    const endTime = new Date();
    const finalSeconds = this.elapsedSeconds;
    const book = this.activeBook;
    const startIso = this.startTime ? this.startTime.toISOString() : endTime.toISOString();

    const summary = {
      book,
      startTime: startIso,
      endTime: endTime.toISOString(),
      durationSeconds: finalSeconds,
      startPage: book ? book.current_page || 0 : 0
    };

    this.reset();
    return summary;
  }

  discardSession() {
    this.stopTicker();
    this.reset();
  }

  reset() {
    this.status = 'idle';
    this.activeBook = null;
    this.startTime = null;
    this.pausedAt = null;
    this.totalPausedDurationMs = 0;
    this.elapsedSeconds = 0;
    this.notify();
  }

  startTicker() {
    this.stopTicker();
    this.intervalId = setInterval(() => {
      if (this.status === 'reading' && this.startTime) {
        const now = Date.now();
        const grossMs = now - this.startTime.getTime();
        const netMs = Math.max(0, grossMs - this.totalPausedDurationMs);
        this.elapsedSeconds = Math.floor(netMs / 1000);
        this.notify();
      }
    }, 1000);
  }

  stopTicker() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const timerService = new TimerService();
