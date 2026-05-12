import { describe, expect, it } from "vitest";
import {
  canEnterSubmenu,
  normalizeSubmenuActivation,
  getParentPopState,
  shouldOpenSubmenuOnClick,
  shouldOpenSubmenuOnHover,
  shouldOpenSubmenuOnThreshold,
} from "../submenuNavigation";

describe("submenu navigation", () => {
  it("does not pop to parent immediately after entering a submenu", () => {
    expect(getParentPopState(0, 20, 1, false)).toEqual({
      shouldPop: false,
      armed: false,
    });
  });

  it("arms parent pop after moving outside the submenu dead zone", () => {
    expect(getParentPopState(21, 20, 1, false)).toEqual({
      shouldPop: false,
      armed: true,
    });
  });

  it("pops only after returning to the center once armed", () => {
    expect(getParentPopState(10, 20, 1, true)).toEqual({
      shouldPop: true,
      armed: true,
    });
  });

  it("blocks duplicate submenu entry while a submenu load is pending", () => {
    expect(canEnterSubmenu(true, 0, 3)).toBe(false);
    expect(canEnterSubmenu(false, 3, 3)).toBe(false);
    expect(canEnterSubmenu(false, 2, 3)).toBe(true);
  });

  it("normalizes submenu activation settings from persisted values", () => {
    expect(
      normalizeSubmenuActivation({
        submenuOpenMode: "onThreshold",
        submenuHoverDelayMs: 250.8,
        maxSubmenuDepth: 4.2,
      }),
    ).toEqual({
      submenuOpenMode: "onThreshold",
      submenuHoverDelayMs: 250,
      maxSubmenuDepth: 4,
    });
  });

  it("falls back to safe defaults for invalid submenu activation values", () => {
    expect(
      normalizeSubmenuActivation({
        submenuOpenMode: "invalid" as "onHover",
        submenuHoverDelayMs: -1,
        maxSubmenuDepth: Number.NaN,
      }),
    ).toEqual({
      submenuOpenMode: "onHover",
      submenuHoverDelayMs: 0,
      maxSubmenuDepth: 3,
    });
  });

  it("opens on threshold only after crossing the outer radius", () => {
    expect(shouldOpenSubmenuOnThreshold("onThreshold", 141, 140)).toBe(true);
    expect(shouldOpenSubmenuOnThreshold("onThreshold", 140, 140)).toBe(false);
    expect(shouldOpenSubmenuOnThreshold("onHover", 141, 140)).toBe(false);
  });

  it("keeps hover and click open modes distinct", () => {
    expect(shouldOpenSubmenuOnHover("onHover")).toBe(true);
    expect(shouldOpenSubmenuOnHover("onClick")).toBe(false);
    expect(shouldOpenSubmenuOnClick("onClick")).toBe(true);
    expect(shouldOpenSubmenuOnClick("onHover")).toBe(false);
  });
});
