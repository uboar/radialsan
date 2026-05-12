import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "../settingsStore";
import type { Settings } from "../../types/settings";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

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
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    delete (window as Window & { __TAURI_INTERNALS__?: unknown })
      .__TAURI_INTERNALS__;
    delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
    useSettingsStore.getState().setSettings(mockSettings());
    useSettingsStore.getState().clearError();
  });

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

  it("keeps error state and does not replace settings with defaults when Tauri get_settings fails", async () => {
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ =
      {};
    const existingSettings = mockSettings();
    invokeMock.mockRejectedValueOnce(new Error("settings read failed"));
    useSettingsStore.getState().setSettings(existingSettings);

    await useSettingsStore.getState().loadSettings();

    const state = useSettingsStore.getState();
    expect(invokeMock).toHaveBeenCalledWith("get_settings");
    expect(state.loading).toBe(false);
    expect(state.error).toBe("Error: settings read failed");
    expect(state.settings).toBe(existingSettings);
  });

  it("uses explicit dev defaults when the Tauri settings API is unavailable outside Tauri", async () => {
    invokeMock.mockRejectedValueOnce(new Error("not running in Tauri"));

    await useSettingsStore.getState().loadSettings();

    const state = useSettingsStore.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.settings).toMatchObject({
      global: {
        menuActivation: {
          submenuOpenMode: "onHover",
          submenuHoverDelayMs: 400,
        },
        appearance: {
          outerRadius: 120,
          deadZoneRadius: 30,
          sliceFillColor: "#1e1e2e",
          labelFont: "sans-serif",
          iconSize: 20,
          animationDurationMs: 120,
          opacity: 1,
        },
      },
      profiles: [
        {
          id: "default",
          pieKeys: [{ id: "piekey_1", hotkey: "CapsLock", menuId: "menu_1" }],
        },
      ],
      menus: [
        {
          id: "menu_1",
          slices: [
            { id: "slice_copy", icon: "copy" },
            { id: "slice_paste", icon: "clipboard" },
            { id: "slice_undo", icon: "undo" },
            { id: "slice_redo", icon: "redo" },
          ],
        },
      ],
    });
  });
});
