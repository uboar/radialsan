import { describe, expect, it } from "vitest";
import { useSettingsStore } from "../settingsStore";
import type { Settings } from "../../types/settings";

const mockSettings = (): Settings => ({
  version: 1,
  global: {
    launchAtStartup: false,
    showTrayIcon: true,
    theme: "dark",
    defaultProfileId: "default",
    menuActivation: {
      mode: "holdRelease",
      quickTapThresholdMs: 200,
      submenuOpenMode: "onThreshold",
      submenuHoverDelayMs: 300,
      maxSubmenuDepth: 3,
      suppressTriggerKeyInput: true,
    },
    appearance: {
      innerRadius: 40,
      outerRadius: 140,
      deadZoneRadius: 20,
      backgroundColor: "#00000080",
      sliceFillColor: "#2a2a2aCC",
      sliceHoverColor: "#4a9eff99",
      sliceBorderColor: "#555555",
      sliceBorderWidth: 1,
      labelFont: "system-ui",
      labelSize: 13,
      labelColor: "#FFFFFF",
      iconSize: 28,
      animationDurationMs: 100,
      opacity: 0.95,
    },
  },
  profiles: [
    {
      id: "default",
      name: "Default",
      isDefault: true,
      matchRules: [],
      pieKeys: [
        { id: "pk_1", hotkey: "CapsLock", menuId: "menu_deleted" },
        { id: "pk_2", hotkey: "F1", menuId: "menu_kept" },
      ],
    },
    {
      id: "design",
      name: "Design",
      isDefault: false,
      matchRules: [],
      pieKeys: [
        { id: "pk_3", hotkey: "F2", menuId: "menu_deleted" },
        { id: "pk_4", hotkey: "F3", menuId: "menu_other" },
      ],
    },
  ],
  menus: [
    {
      id: "menu_deleted",
      name: "Deleted",
      appearanceOverrides: null,
      slices: [],
    },
    {
      id: "menu_kept",
      name: "Kept",
      appearanceOverrides: null,
      slices: [],
    },
    {
      id: "menu_other",
      name: "Other",
      appearanceOverrides: null,
      slices: [],
    },
  ],
});

describe("settingsStore", () => {
  it("deleteMenu removes profile pieKeys that reference the deleted menu", () => {
    useSettingsStore.getState().setSettings(mockSettings());

    useSettingsStore.getState().deleteMenu("menu_deleted");

    const settings = useSettingsStore.getState().settings;
    expect(settings?.menus.map((menu) => menu.id)).toEqual([
      "menu_kept",
      "menu_other",
    ]);
    expect(settings?.profiles[0].pieKeys).toEqual([
      { id: "pk_2", hotkey: "F1", menuId: "menu_kept" },
    ]);
    expect(settings?.profiles[1].pieKeys).toEqual([
      { id: "pk_4", hotkey: "F3", menuId: "menu_other" },
    ]);
    expect(
      settings?.profiles.flatMap((profile) =>
        profile.pieKeys.map((pieKey) => pieKey.menuId),
      ),
    ).not.toContain("menu_deleted");
  });
});
