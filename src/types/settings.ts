// Placeholder: settings types mirroring the Rust Settings structs

export type ActionType =
  | "launch_app"
  | "open_url"
  | "keystroke"
  | "shell_command"
  | "text_expand";

export interface Action {
  id: string;
  label: string;
  icon?: string;
  actionType: ActionType;
  payload: string;
}

export interface PieMenuConfig {
  id: string;
  name: string;
  triggerKey: string;
  actions: Action[];
}

export interface Settings {
  menus: PieMenuConfig[];
  deadZoneRadius: number;
  activationDelayMs: number;
}

export const DEFAULT_SETTINGS: Settings = {
  menus: [],
  deadZoneRadius: 30,
  activationDelayMs: 150,
};
