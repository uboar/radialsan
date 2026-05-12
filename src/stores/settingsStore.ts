import { get, writable } from "svelte/store";
import type { Settings, PieMenu, Profile } from "../types/settings";

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
}

interface SettingsActions {
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  clearError: () => void;
  setSettings: (settings: Settings) => void;
  addMenu: (menu: PieMenu) => void;
  updateMenu: (menuId: string, updates: Partial<PieMenu>) => void;
  deleteMenu: (menuId: string) => void;
  addProfile: (profile: Profile) => void;
  updateProfile: (profileId: string, updates: Partial<Profile>) => void;
  deleteProfile: (profileId: string) => void;
  updateGlobalSettings: (updates: Partial<Settings["global"]>) => void;
}

export type SettingsStoreApi = SettingsState & SettingsActions;

const initialState: SettingsState = {
  settings: null,
  loading: false,
  error: null,
};

const state = writable<SettingsState>(initialState);

function mutateSettings(mutator: (settings: Settings) => Settings) {
  state.update((current) => {
    if (!current.settings) return current;
    return { ...current, settings: mutator(current.settings) };
  });
}

export const settingsActions: SettingsActions = {
  loadSettings: async () => {
    state.update((current) => ({ ...current, loading: true, error: null }));
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const settings = await invoke<Settings>("get_settings");
      state.set({ settings, loading: false, error: null });
    } catch (e) {
      if (isTauriRuntime()) {
        console.error("Failed to load settings from Tauri", e);
        state.update((current) => ({
          ...current,
          loading: false,
          error: String(e),
        }));
        return;
      }

      console.warn("Tauri settings API unavailable, using dev defaults", e);
      state.set({
        settings: getDefaultSettings(),
        loading: false,
        error: null,
      });
    }
  },

  saveSettings: async () => {
    const { settings } = get(state);
    if (!settings) return;

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_settings", { settings });
      state.update((current) => ({ ...current, error: null }));
    } catch (e) {
      console.error("Failed to save settings", e);
      state.update((current) => ({ ...current, error: String(e) }));
    }
  },

  clearError: () => {
    state.update((current) => ({ ...current, error: null }));
  },

  setSettings: (settings) => {
    state.update((current) => ({ ...current, settings }));
  },

  addMenu: (menu) => {
    mutateSettings((settings) => ({
      ...settings,
      menus: [...settings.menus, menu],
    }));
  },

  updateMenu: (menuId, updates) => {
    mutateSettings((settings) => ({
      ...settings,
      menus: settings.menus.map((menu) =>
        menu.id === menuId ? { ...menu, ...updates } : menu,
      ),
    }));
  },

  deleteMenu: (menuId) => {
    mutateSettings((settings) => ({
      ...settings,
      menus: settings.menus.filter((menu) => menu.id !== menuId),
      profiles: settings.profiles.map((profile) => ({
        ...profile,
        pieKeys: profile.pieKeys.filter((pieKey) => pieKey.menuId !== menuId),
      })),
    }));
  },

  addProfile: (profile) => {
    mutateSettings((settings) => ({
      ...settings,
      profiles: [...settings.profiles, profile],
    }));
  },

  updateProfile: (profileId, updates) => {
    mutateSettings((settings) => ({
      ...settings,
      profiles: settings.profiles.map((profile) =>
        profile.id === profileId ? { ...profile, ...updates } : profile,
      ),
    }));
  },

  deleteProfile: (profileId) => {
    mutateSettings((settings) => ({
      ...settings,
      profiles: settings.profiles.filter((profile) => profile.id !== profileId),
    }));
  },

  updateGlobalSettings: (updates) => {
    mutateSettings((settings) => ({
      ...settings,
      global: { ...settings.global, ...updates },
    }));
  },
};

export const settingsStore = {
  subscribe: state.subscribe,
  ...settingsActions,
};

function getState(): SettingsStoreApi {
  return {
    ...get(state),
    ...settingsActions,
  };
}

interface UseSettingsStore {
  (): SettingsStoreApi;
  <T>(selector: (state: SettingsStoreApi) => T): T;
  getState: () => SettingsStoreApi;
}

export const useSettingsStore = ((
  selector?: (state: SettingsStoreApi) => unknown,
) => {
  const current = getState();
  return selector ? selector(current) : current;
}) as UseSettingsStore;

useSettingsStore.getState = getState;

function isTauriRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

function getPrimaryModifier(): "meta" | "ctrl" {
  if (typeof navigator === "undefined") {
    return "ctrl";
  }

  const platform = navigator.platform || navigator.userAgent;
  return /mac|iphone|ipad/i.test(platform) ? "meta" : "ctrl";
}

function getDefaultSettings(): Settings {
  const modifier = getPrimaryModifier();

  return {
    version: 1,
    global: {
      launchAtStartup: false,
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
    profiles: [
      {
        id: "default",
        name: "デフォルト",
        isDefault: true,
        matchRules: [],
        pieKeys: [{ id: "piekey_1", hotkey: "CapsLock", menuId: "menu_1" }],
      },
    ],
    menus: [
      {
        id: "menu_1",
        name: "クイックアクション",
        appearanceOverrides: null,
        slices: [
          {
            id: "slice_copy",
            label: "コピー",
            icon: "copy",
            actions: [{ type: "clipboard", params: { operation: "copy" } }],
          },
          {
            id: "slice_paste",
            label: "貼り付け",
            icon: "clipboard",
            actions: [{ type: "clipboard", params: { operation: "paste" } }],
          },
          {
            id: "slice_undo",
            label: "元に戻す",
            icon: "undo",
            actions: [{ type: "sendKey", params: { keys: `${modifier}+z` } }],
          },
          {
            id: "slice_redo",
            label: "やり直す",
            icon: "redo",
            actions: [
              { type: "sendKey", params: { keys: `${modifier}+shift+z` } },
            ],
          },
        ],
      },
    ],
  };
}
