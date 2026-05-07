import { describe, it, expect, beforeEach } from "vitest";
import { useHistoryStore } from "../historyStore";

const mockSettings = (version: number) => ({
  version,
  global: {} as any,
  profiles: [],
  menus: [],
});

describe("historyStore", () => {
  beforeEach(() => {
    useHistoryStore.getState().clear();
  });

  it("pushSnapshot adds to undo stack", () => {
    useHistoryStore.getState().pushSnapshot(mockSettings(1));
    useHistoryStore.getState().pushSnapshot(mockSettings(2));
    expect(useHistoryStore.getState().undoStack.length).toBe(2);
  });

  it("initialize seeds the baseline undo target", () => {
    useHistoryStore.getState().initialize(mockSettings(1));
    expect(useHistoryStore.getState().undoStack.length).toBe(1);
    expect(useHistoryStore.getState().canUndo()).toBe(false);

    useHistoryStore.getState().pushSnapshot(mockSettings(2));
    expect(useHistoryStore.getState().canUndo()).toBe(true);

    const restored = useHistoryStore.getState().undo();
    expect(restored?.version).toBe(1);
  });

  it("initialize replaces old history and clears redo", () => {
    useHistoryStore.getState().initialize(mockSettings(1));
    useHistoryStore.getState().pushSnapshot(mockSettings(2));
    useHistoryStore.getState().undo();
    expect(useHistoryStore.getState().canRedo()).toBe(true);

    useHistoryStore.getState().initialize(mockSettings(10));
    expect(useHistoryStore.getState().undoStack.length).toBe(1);
    expect(useHistoryStore.getState().canUndo()).toBe(false);
    expect(useHistoryStore.getState().canRedo()).toBe(false);
    expect(JSON.parse(useHistoryStore.getState().undoStack[0]).version).toBe(10);
  });

  it("does not append duplicate snapshots", () => {
    useHistoryStore.getState().initialize(mockSettings(1));
    useHistoryStore.getState().pushSnapshot(mockSettings(1));
    expect(useHistoryStore.getState().undoStack.length).toBe(1);
  });

  it("undo restores previous state", () => {
    useHistoryStore.getState().pushSnapshot(mockSettings(1));
    useHistoryStore.getState().pushSnapshot(mockSettings(2));
    const restored = useHistoryStore.getState().undo();
    expect(restored?.version).toBe(1);
  });

  it("undo returns null when no history", () => {
    expect(useHistoryStore.getState().undo()).toBeNull();
  });

  it("redo restores after undo", () => {
    useHistoryStore.getState().pushSnapshot(mockSettings(1));
    useHistoryStore.getState().pushSnapshot(mockSettings(2));
    useHistoryStore.getState().undo();
    const restored = useHistoryStore.getState().redo();
    expect(restored?.version).toBe(2);
  });

  it("redo restores the first edit after undoing to baseline", () => {
    useHistoryStore.getState().initialize(mockSettings(1));
    useHistoryStore.getState().pushSnapshot(mockSettings(2));

    expect(useHistoryStore.getState().undo()?.version).toBe(1);
    expect(useHistoryStore.getState().redo()?.version).toBe(2);
  });

  it("canUndo/canRedo return correct values", () => {
    expect(useHistoryStore.getState().canUndo()).toBe(false);
    expect(useHistoryStore.getState().canRedo()).toBe(false);

    useHistoryStore.getState().pushSnapshot(mockSettings(1));
    useHistoryStore.getState().pushSnapshot(mockSettings(2));
    expect(useHistoryStore.getState().canUndo()).toBe(true);
    expect(useHistoryStore.getState().canRedo()).toBe(false);

    useHistoryStore.getState().undo();
    expect(useHistoryStore.getState().canRedo()).toBe(true);
  });

  it("new snapshot clears redo stack", () => {
    useHistoryStore.getState().pushSnapshot(mockSettings(1));
    useHistoryStore.getState().pushSnapshot(mockSettings(2));
    useHistoryStore.getState().undo();
    expect(useHistoryStore.getState().canRedo()).toBe(true);

    useHistoryStore.getState().pushSnapshot(mockSettings(3));
    expect(useHistoryStore.getState().canRedo()).toBe(false);
  });

  it("clear resets all stacks", () => {
    useHistoryStore.getState().pushSnapshot(mockSettings(1));
    useHistoryStore.getState().pushSnapshot(mockSettings(2));
    useHistoryStore.getState().clear();
    expect(useHistoryStore.getState().undoStack.length).toBe(0);
    expect(useHistoryStore.getState().canUndo()).toBe(false);
  });
});
