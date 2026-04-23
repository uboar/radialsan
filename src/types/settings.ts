// Settings types mirroring the Rust structs (camelCase field names).

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type AppTheme = "dark" | "light" | "system";

export type ActivationMode = "holdRelease" | "clickSelect";

export type SubmenuOpenMode = "onHover" | "onThreshold" | "onClick";

export type MatchField = "processName" | "windowTitle";

export type MatchMode = "contains" | "exact" | "regex";

export type ActionType =
  | "sendKey"
  | "sendText"
  | "mouseClick"
  | "openUrl"
  | "openFolder"
  | "openFile"
  | "runCommand"
  | "runScript"
  | "runLua"
  | "clipboard"
  | "mediaControl"
  | "submenu"
  | "noop"
  | "delay";

// ---------------------------------------------------------------------------
// Core interfaces
// ---------------------------------------------------------------------------

export interface MenuActivation {
  mode: ActivationMode;
  quickTapThresholdMs: number;
  submenuOpenMode: SubmenuOpenMode;
  submenuHoverDelayMs: number;
  maxSubmenuDepth: number;
}

export interface Appearance {
  innerRadius: number;
  outerRadius: number;
  deadZoneRadius: number;
  backgroundColor: string;
  sliceFillColor: string;
  sliceHoverColor: string;
  sliceBorderColor: string;
  sliceBorderWidth: number;
  labelFont: string;
  labelSize: number;
  labelColor: string;
  iconSize: number;
  animationDurationMs: number;
  opacity: number;
}

export interface GlobalSettings {
  launchAtStartup: boolean;
  showTrayIcon: boolean;
  theme: AppTheme;
  defaultProfileId: string;
  menuActivation: MenuActivation;
  appearance: Appearance;
}

export interface MatchRule {
  field: MatchField;
  matchMode: MatchMode;
  value: string;
}

export interface PieKey {
  id: string;
  hotkey: string;
  menuId: string;
}

export interface Profile {
  id: string;
  name: string;
  isDefault: boolean;
  matchRules: MatchRule[];
  pieKeys: PieKey[];
}

export interface AppearanceOverrides {
  innerRadius?: number;
  outerRadius?: number;
  deadZoneRadius?: number;
  backgroundColor?: string;
  sliceFillColor?: string;
  sliceHoverColor?: string;
  sliceBorderColor?: string;
  sliceBorderWidth?: number;
  labelFont?: string;
  labelSize?: number;
  labelColor?: string;
  iconSize?: number;
  animationDurationMs?: number;
  opacity?: number;
}

export interface Action {
  type: ActionType;
  params: unknown;
}

export interface Slice {
  id: string;
  label: string;
  icon: string;
  actions: Action[];
}

export interface PieMenu {
  id: string;
  name: string;
  appearanceOverrides: AppearanceOverrides | null;
  slices: Slice[];
}

export interface Settings {
  version: number;
  global: GlobalSettings;
  profiles: Profile[];
  menus: PieMenu[];
}

export interface RuntimeStatus {
  inputMonitoringAvailable: boolean;
  activeWindowMonitoringAvailable: boolean;
  inputMonitoringDetail: string | null;
  activeWindowMonitoringDetail: string | null;
}
