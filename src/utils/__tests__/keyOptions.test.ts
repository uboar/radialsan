import { describe, expect, it } from "vitest";
import {
  buildKeyCombo,
  parseKeyCombo,
  SEND_KEY_OPTIONS,
  toggleModifier,
} from "../keyOptions";

describe("keyOptions", () => {
  it("parses and normalizes key combos", () => {
    expect(parseKeyCombo("shift+ctrl+a")).toEqual({
      modifiers: ["Ctrl", "Shift"],
      key: "A",
    });
    expect(parseKeyCombo("meta+pagedown")).toEqual({
      modifiers: ["Meta"],
      key: "PageDown",
    });
    expect(buildKeyCombo(["Shift", "Ctrl"], "A")).toBe("Ctrl+Shift+A");
  });

  it("keeps modifier-only drafts until a key is selected", () => {
    expect(buildKeyCombo(["Ctrl"], "")).toBe("Ctrl+");
    expect(parseKeyCombo("Ctrl+")).toEqual({ modifiers: ["Ctrl"], key: "" });
    expect(buildKeyCombo(parseKeyCombo("Ctrl+").modifiers, "c")).toBe("Ctrl+C");
  });

  it("toggles modifiers in canonical order", () => {
    expect(toggleModifier(["Shift"], "Ctrl")).toEqual(["Ctrl", "Shift"]);
    expect(toggleModifier(["Ctrl", "Shift"], "Shift")).toEqual(["Ctrl"]);
  });

  it("offers sendable navigation keys", () => {
    expect(SEND_KEY_OPTIONS).toContain("Home");
    expect(SEND_KEY_OPTIONS).toContain("PageDown");
  });
});
