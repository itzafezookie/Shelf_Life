import { create } from 'zustand';
import { timerService } from '../services/timerService';

export const useSessionStore = create((set) => {
  // Sync state with timerService
  timerService.subscribe((state) => {
    set({
      status: state.status,
      activeBook: state.activeBook,
      startTime: state.startTime,
      elapsedSeconds: state.elapsedSeconds,
      formattedTime: state.formattedTime
    });
  });

  return {
    status: 'idle',
    activeBook: null,
    startTime: null,
    elapsedSeconds: 0,
    formattedTime: '00:00',

    // Intent dispatchers delegating directly to headless engine
    start: (book) => timerService.startSession(book),
    pause: () => timerService.pauseSession(),
    resume: () => timerService.resumeSession(),
    stop: () => timerService.stopSession(),
    discard: () => timerService.discardSession()
  };
});
