import { create } from 'zustand';
import type { LogEntry, LogLevel, LogCategory } from '../lib/types';

interface LogState {
  logs: LogEntry[];
  selectedLog: LogEntry | null;
  selectedLevel: LogLevel | 'all';
  selectedCategory: LogCategory | 'all';
  searchQuery: string;
  isPaused: boolean;
  currentFolder: string | null;
  isLoading: boolean;

  setLogs: (logs: LogEntry[]) => void;
  appendLogs: (newLogs: LogEntry[]) => void;
  clearLogs: () => void;
  setSelectedLog: (log: LogEntry | null) => void;
  setSelectedLevel: (level: LogLevel | 'all') => void;
  setSelectedCategory: (category: LogCategory | 'all') => void;
  setSearchQuery: (query: string) => void;
  setIsPaused: (paused: boolean) => void;
  togglePaused: () => void;
  setCurrentFolder: (folder: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  selectedLog: null,
  selectedLevel: 'all',
  selectedCategory: 'all',
  searchQuery: '',
  isPaused: false,
  currentFolder: null,
  isLoading: false,

  setLogs: (logs) => set({ logs }),
  appendLogs: (newLogs) =>
    set((state) => {
      if (state.isPaused) return state;
      return { logs: [...newLogs, ...state.logs] };
    }),
  clearLogs: () => set({ logs: [], selectedLog: null }),
  setSelectedLog: (log) => set({ selectedLog: log }),
  setSelectedLevel: (level) => set({ selectedLevel: level }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsPaused: (paused) => set({ isPaused: paused }),
  togglePaused: () => set((state) => ({ isPaused: !state.isPaused })),
  setCurrentFolder: (folder) => set({ currentFolder: folder }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
