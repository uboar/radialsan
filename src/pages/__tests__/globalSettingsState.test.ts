import { describe, expect, it } from "vitest";
import {
  getDisplayedAutoLaunch,
  shouldSyncAutoLaunchSetting,
} from "../globalSettingsState";
import type { Settings } from "../../types/settings";

function makeSettings(launchAtStartup: boolean): Settings {
  return {
    version: 1,
    global: {
      launchAtStartup,
      showTrayIcon: true,
      theme: "dark",
      defaultProfileId: "default",
      menuActivation: {
        mode: "holdRelease",
        quickTapThresholdMs: 200,
        submenuOpenMode: "onHover",
        submenuHoverDelayMs: 400,
        maxSubmenuDepth: 3,
        suppressTriggerKeyInput: true,
      },
      appearance: {
        innerRadius: 40,
        outerRadius: 120,
        deadZoneRadius: 30,
        backgroundColor: "#00000080",
        sliceFillColor: "#1e1e2e",
        sliceHoverColor: "#313244",
        sliceBorderColor: "#585b70",
        sliceBorderWidth: 1,
        labelFont: "sans-serif",
        labelSize: 13,
        labelColor: "#cdd6f4",
        iconSize: 20,
        animationDurationMs: 120,
        opacity: 1,
      },
    },
    profiles: [],
    menus: [],
  };
}

describe("global settings state helpers", () => {
  it("prefers the OS auto-launch state when it has been loaded", () => {
    expect(getDisplayedAutoLaunch(true, makeSettings(false))).toBe(true);
    expect(getDisplayedAutoLaunch(false, makeSettings(true))).toBe(false);
  });

  it("falls back to persisted launchAtStartup until the OS state is loaded", () => {
    expect(getDisplayedAutoLaunch(null, makeSettings(true))).toBe(true);
    expect(getDisplayedAutoLaunch(null, makeSettings(false))).toBe(false);
    expect(getDisplayedAutoLaunch(null, null)).toBe(false);
  });

  it("syncs settings only when the persisted value differs", () => {
    expect(shouldSyncAutoLaunchSetting(makeSettings(false), true)).toBe(true);
    expect(shouldSyncAutoLaunchSetting(makeSettings(true), true)).toBe(false);
    expect(shouldSyncAutoLaunchSetting(null, true)).toBe(false);
  });
});
