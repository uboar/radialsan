import type { Settings } from "../types/settings";

export function getDisplayedAutoLaunch(
  osAutoLaunch: boolean | null,
  settings: Settings | null | undefined,
): boolean {
  return osAutoLaunch ?? settings?.global.launchAtStartup ?? false;
}

export function shouldSyncAutoLaunchSetting(
  settings: Settings | null | undefined,
  enabled: boolean,
): settings is Settings {
  return Boolean(settings && settings.global.launchAtStartup !== enabled);
}
