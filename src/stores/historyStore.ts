import { get, writable } from "svelte/store";
import type { Settings } from "../types/settings";

interface HistoryState {
  undoStack: string[];
  redoStack: string[];
  maxHistory: number;
}

interface HistoryActions {
  pushSnapshot: (settings: Settings) => void;
  undo: () => Settings | null;
  redo: () => Settings | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export type HistoryStoreApi = HistoryState & HistoryActions;

const state = writable<HistoryState>({
  undoStack: [],
  redoStack: [],
  maxHistory: 50,
});

export const historyActions: HistoryActions = {
  pushSnapshot: (settings) => {
    const json = JSON.stringify(settings);
    state.update((current) => ({
      ...current,
      undoStack: [...current.undoStack.slice(-current.maxHistory + 1), json],
      redoStack: [],
    }));
  },

  undo: () => {
    const { undoStack } = get(state);
    if (undoStack.length < 2) return null;

    const newUndoStack = [...undoStack];
    const current = newUndoStack.pop();
    const previous = newUndoStack[newUndoStack.length - 1];
    if (!current || !previous) return null;

    state.update((currentState) => ({
      ...currentState,
      undoStack: newUndoStack,
      redoStack: [...currentState.redoStack, current],
    }));

    return JSON.parse(previous) as Settings;
  },

  redo: () => {
    const { redoStack } = get(state);
    if (redoStack.length === 0) return null;

    const newRedoStack = [...redoStack];
    const next = newRedoStack.pop();
    if (!next) return null;

    state.update((currentState) => ({
      ...currentState,
      undoStack: [...currentState.undoStack, next],
      redoStack: newRedoStack,
    }));

    return JSON.parse(next) as Settings;
  },

  canUndo: () => get(state).undoStack.length >= 2,
  canRedo: () => get(state).redoStack.length > 0,
  clear: () => state.set({ undoStack: [], redoStack: [], maxHistory: 50 }),
};

export const historyStore = {
  subscribe: state.subscribe,
  ...historyActions,
};

function getState(): HistoryStoreApi {
  return {
    ...get(state),
    ...historyActions,
  };
}

interface UseHistoryStore {
  (): HistoryStoreApi;
  <T>(selector: (state: HistoryStoreApi) => T): T;
  getState: () => HistoryStoreApi;
}

export const useHistoryStore = ((
  selector?: (state: HistoryStoreApi) => unknown,
) => {
  const current = getState();
  return selector ? selector(current) : current;
}) as UseHistoryStore;

useHistoryStore.getState = getState;
