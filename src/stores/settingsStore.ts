import { create } from 'zustand';
import type { Settings, PieMenu, Profile } from '../types/settings';

interface SettingsStore {
  settings: Settings | null;
  loading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;

  // Direct state replacement (used for undo/redo)
  setSettings: (settings: Settings) => void;

  // Menu operations
  addMenu: (menu: PieMenu) => void;
  updateMenu: (menuId: string, updates: Partial<PieMenu>) => void;
  deleteMenu: (menuId: string) => void;

  // Profile operations
  addProfile: (profile: Profile) => void;
  updateProfile: (profileId: string, updates: Partial<Profile>) => void;
  deleteProfile: (profileId: string) => void;

  // Global settings
  updateGlobalSettings: (updates: Partial<Settings['global']>) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  loadSettings: async () => {
    set({ loading: true, error: null });
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const settings = await invoke<Settings>('get_settings');
      set({ settings, loading: false });
    } catch (e) {
      // Fallback for non-Tauri environment (dev browser)
      console.warn('Failed to load settings from Tauri, using defaults', e);
      set({ settings: getDefaultSettings(), loading: false });
    }
  },

  saveSettings: async () => {
    const { settings } = get();
    if (!settings) return;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('save_settings', { settings });
    } catch (e) {
      console.error('Failed to save settings', e);
      set({ error: String(e) });
    }
  },

  setSettings: (settings) => set({ settings }),

  addMenu: (menu) => set((state) => {
    if (!state.settings) return state;
    return {
      settings: {
        ...state.settings,
        menus: [...state.settings.menus, menu],
      },
    };
  }),

  updateMenu: (menuId, updates) => set((state) => {
    if (!state.settings) return state;
    return {
      settings: {
        ...state.settings,
        menus: state.settings.menus.map((m) =>
          m.id === menuId ? { ...m, ...updates } : m
        ),
      },
    };
  }),

  deleteMenu: (menuId) => set((state) => {
    if (!state.settings) return state;
    return {
      settings: {
        ...state.settings,
        menus: state.settings.menus.filter((m) => m.id !== menuId),
      },
    };
  }),

  addProfile: (profile) => set((state) => {
    if (!state.settings) return state;
    return {
      settings: {
        ...state.settings,
        profiles: [...state.settings.profiles, profile],
      },
    };
  }),

  updateProfile: (profileId, updates) => set((state) => {
    if (!state.settings) return state;
    return {
      settings: {
        ...state.settings,
        profiles: state.settings.profiles.map((p) =>
          p.id === profileId ? { ...p, ...updates } : p
        ),
      },
    };
  }),

  deleteProfile: (profileId) => set((state) => {
    if (!state.settings) return state;
    return {
      settings: {
        ...state.settings,
        profiles: state.settings.profiles.filter((p) => p.id !== profileId),
      },
    };
  }),

  updateGlobalSettings: (updates) => set((state) => {
    if (!state.settings) return state;
    return {
      settings: {
        ...state.settings,
        global: { ...state.settings.global, ...updates },
      },
    };
  }),
}));

function getDefaultSettings(): Settings {
  return {
    version: 1,
    global: {
      launchAtStartup: false,
      showTrayIcon: true,
      theme: 'dark',
      defaultProfileId: 'default',
      menuActivation: {
        mode: 'holdRelease',
        quickTapThresholdMs: 200,
        submenuOpenMode: 'onThreshold',
        submenuHoverDelayMs: 300,
        maxSubmenuDepth: 3,
      },
      appearance: {
        innerRadius: 40,
        outerRadius: 140,
        deadZoneRadius: 20,
        backgroundColor: '#00000080',
        sliceFillColor: '#2a2a2aCC',
        sliceHoverColor: '#4a9eff99',
        sliceBorderColor: '#555555',
        sliceBorderWidth: 1,
        labelFont: 'system-ui',
        labelSize: 13,
        labelColor: '#FFFFFF',
        iconSize: 28,
        animationDurationMs: 100,
        opacity: 0.95,
      },
    },
    profiles: [{
      id: 'default',
      name: 'Default',
      isDefault: true,
      matchRules: [],
      pieKeys: [{ id: 'pk_1', hotkey: 'CapsLock', menuId: 'menu_1' }],
    }],
    menus: [{
      id: 'menu_1',
      name: 'Quick Actions',
      appearanceOverrides: null,
      slices: [
        { id: 's1', label: 'Copy', icon: '📋', actions: [{ type: 'sendKey', params: { keys: 'ctrl+c' } }] },
        { id: 's2', label: 'Paste', icon: '📌', actions: [{ type: 'sendKey', params: { keys: 'ctrl+v' } }] },
        { id: 's3', label: 'Undo', icon: '↩️', actions: [{ type: 'sendKey', params: { keys: 'ctrl+z' } }] },
        { id: 's4', label: 'Redo', icon: '↪️', actions: [{ type: 'sendKey', params: { keys: 'ctrl+shift+z' } }] },
      ],
    }],
  };
}
