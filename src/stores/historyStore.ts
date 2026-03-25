import { create } from 'zustand';
import type { Settings } from '../types/settings';

interface HistoryStore {
  undoStack: string[];  // JSON snapshots
  redoStack: string[];
  maxHistory: number;

  /** Save current state as a snapshot */
  pushSnapshot: (settings: Settings) => void;

  /** Undo: restore previous snapshot */
  undo: () => Settings | null;

  /** Redo: restore next snapshot */
  redo: () => Settings | null;

  /** Check if undo/redo available */
  canUndo: () => boolean;
  canRedo: () => boolean;

  /** Clear history */
  clear: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  undoStack: [],
  redoStack: [],
  maxHistory: 50,

  pushSnapshot: (settings) => {
    const json = JSON.stringify(settings);
    set((state) => ({
      undoStack: [...state.undoStack.slice(-state.maxHistory + 1), json],
      redoStack: [], // Clear redo on new action
    }));
  },

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length < 2) return null; // Need at least 2: previous + current
    const newStack = [...undoStack];
    const current = newStack.pop()!;
    const previous = newStack[newStack.length - 1];
    set((state) => ({
      undoStack: newStack,
      redoStack: [...state.redoStack, current],
    }));
    return JSON.parse(previous) as Settings;
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return null;
    const newRedo = [...redoStack];
    const next = newRedo.pop()!;
    set((state) => ({
      undoStack: [...state.undoStack, next],
      redoStack: newRedo,
    }));
    return JSON.parse(next) as Settings;
  },

  canUndo: () => get().undoStack.length >= 2,
  canRedo: () => get().redoStack.length > 0,
  clear: () => set({ undoStack: [], redoStack: [] }),
}));
