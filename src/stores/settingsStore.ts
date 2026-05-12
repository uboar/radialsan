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
      console.warn("Failed to load settings from Tauri, using defaults", e);
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

function getPrimaryModifier(): "meta" | "ctrl" {
  if (typeof navigator === "undefined") {
    return "ctrl";
  }

  const platform = navigator.platform || navigator.userAgent;
  return /mac|iphone|ipad/i.test(platform) ? "meta" : "ctrl";
}

function makeSendKeySlice(
  id: string,
  label: string,
  icon: string,
  keys: string,
) {
  return {
    id,
    label,
    icon,
    actions: [{ type: "sendKey" as const, params: { keys } }],
  };
}

function makeSendKeyMenu(
  id: string,
  name: string,
  slices: Array<[string, string, string, string]>,
): PieMenu {
  return {
    id,
    name,
    appearanceOverrides: null,
    slices: slices.map(([sliceId, label, icon, keys]) =>
      makeSendKeySlice(sliceId, label, icon, keys),
    ),
  };
}

function makeAppProfile(
  id: string,
  name: string,
  processPattern: string,
  menuId: string,
): Profile {
  return {
    id,
    name,
    isDefault: false,
    matchRules: [
      {
        field: "processName",
        matchMode: "regex",
        value: processPattern,
      },
    ],
    pieKeys: [{ id: `piekey_${id}`, hotkey: "CapsLock", menuId }],
  };
}

function getDefaultSettings(): Settings {
  const modifier = getPrimaryModifier();
  const clipStudioMenu = makeSendKeyMenu(
    "menu_clip_studio_paint",
    "CLIP STUDIO PAINT",
    [
      ["slice_csp_pen", "ペン", "lucide:pen-tool", "p"],
      ["slice_csp_brush", "ブラシ", "lucide:brush", "b"],
      ["slice_csp_eraser", "消しゴム", "lucide:eraser", "e"],
      ["slice_csp_fill", "塗りつぶし", "lucide:palette", "g"],
      ["slice_csp_selection", "選択範囲", "lucide:mouse", "m"],
      ["slice_csp_eyedropper", "スポイト", "lucide:pipette", "i"],
      ["slice_csp_hand", "手のひら", "lucide:move", "h"],
      ["slice_csp_rotate", "回転", "lucide:rotate-cw", "r"],
    ],
  );
  const photoshopMenu = makeSendKeyMenu(
    "menu_adobe_photoshop",
    "Adobe Photoshop",
    [
      ["slice_ps_move", "移動", "lucide:move", "v"],
      ["slice_ps_brush", "ブラシ", "lucide:brush", "b"],
      ["slice_ps_eraser", "消しゴム", "lucide:eraser", "e"],
      ["slice_ps_lasso", "なげなわ", "lucide:mouse", "l"],
      ["slice_ps_crop", "切り抜き", "lucide:crop", "c"],
      ["slice_ps_eyedropper", "スポイト", "lucide:pipette", "i"],
      ["slice_ps_hand", "手のひら", "lucide:move", "h"],
      ["slice_ps_zoom", "ズーム", "lucide:zoom-in", "z"],
    ],
  );
  const illustratorMenu = makeSendKeyMenu(
    "menu_adobe_illustrator",
    "Adobe Illustrator",
    [
      ["slice_ai_selection", "選択", "lucide:mouse", "v"],
      ["slice_ai_direct_selection", "ダイレクト選択", "lucide:mouse", "a"],
      ["slice_ai_pen", "ペン", "lucide:pen-tool", "p"],
      ["slice_ai_type", "文字", "lucide:type", "t"],
      ["slice_ai_rectangle", "長方形", "lucide:maximize-2", "m"],
      ["slice_ai_ellipse", "楕円形", "lucide:minimize-2", "l"],
      ["slice_ai_eyedropper", "スポイト", "lucide:pipette", "i"],
      ["slice_ai_zoom", "ズーム", "lucide:zoom-in", "z"],
    ],
  );
  const afterEffectsMenu = makeSendKeyMenu(
    "menu_adobe_after_effects",
    "Adobe After Effects",
    [
      ["slice_ae_anchor", "アンカー", "lucide:flag", "a"],
      ["slice_ae_position", "位置", "lucide:move", "p"],
      ["slice_ae_scale", "スケール", "lucide:maximize-2", "s"],
      ["slice_ae_rotation", "回転", "lucide:rotate-cw", "r"],
      ["slice_ae_opacity", "不透明度", "lucide:eye", "t"],
      ["slice_ae_effects", "エフェクト", "lucide:zap", "e"],
      ["slice_ae_keyframes", "キーフレーム", "lucide:key", "u"],
      ["slice_ae_preview", "プレビュー", "lucide:play", "space"],
    ],
  );

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
        name: "デフォルト",
        isDefault: true,
        matchRules: [],
        pieKeys: [{ id: "pk_1", hotkey: "CapsLock", menuId: "menu_1" }],
      },
      makeAppProfile(
        "clip_studio_paint",
        "CLIP STUDIO PAINT",
        "(?i)clip\\s*studio\\s*paint|clipstudiopaint",
        "menu_clip_studio_paint",
      ),
      makeAppProfile(
        "adobe_photoshop",
        "Adobe Photoshop",
        "(?i)photoshop",
        "menu_adobe_photoshop",
      ),
      makeAppProfile(
        "adobe_illustrator",
        "Adobe Illustrator",
        "(?i)illustrator",
        "menu_adobe_illustrator",
      ),
      makeAppProfile(
        "adobe_after_effects",
        "Adobe After Effects",
        "(?i)after\\s*effects|afterfx|aerender",
        "menu_adobe_after_effects",
      ),
    ],
    menus: [
      {
        id: "menu_1",
        name: "クイックアクション",
        appearanceOverrides: null,
        slices: [
          {
            id: "s1",
            label: "コピー",
            icon: "📋",
            actions: [{ type: "clipboard", params: { operation: "copy" } }],
          },
          {
            id: "s2",
            label: "貼り付け",
            icon: "📌",
            actions: [{ type: "clipboard", params: { operation: "paste" } }],
          },
          {
            id: "s3",
            label: "元に戻す",
            icon: "↩️",
            actions: [{ type: "sendKey", params: { keys: `${modifier}+z` } }],
          },
          {
            id: "s4",
            label: "やり直す",
            icon: "↪️",
            actions: [
              { type: "sendKey", params: { keys: `${modifier}+shift+z` } },
            ],
          },
        ],
      },
      clipStudioMenu,
      photoshopMenu,
      illustratorMenu,
      afterEffectsMenu,
    ],
  };
}
