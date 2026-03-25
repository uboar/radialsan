import React from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export const GlobalSettings: React.FC = () => {
  const { settings } = useSettingsStore();
  if (!settings) return <div className="text-zinc-400">Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      <div className="space-y-6 max-w-lg">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h3 className="font-semibold mb-3">General</h3>
          <label className="flex items-center justify-between py-2">
            <span className="text-sm">Launch at startup</span>
            <input type="checkbox" checked={settings.global.launchAtStartup} readOnly className="accent-blue-600" />
          </label>
          <label className="flex items-center justify-between py-2">
            <span className="text-sm">Show tray icon</span>
            <input type="checkbox" checked={settings.global.showTrayIcon} readOnly className="accent-blue-600" />
          </label>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h3 className="font-semibold mb-3">Activation</h3>
          <div className="text-sm text-zinc-400 space-y-1">
            <p>Mode: {settings.global.menuActivation.mode}</p>
            <p>Quick tap threshold: {settings.global.menuActivation.quickTapThresholdMs}ms</p>
            <p>Submenu open mode: {settings.global.menuActivation.submenuOpenMode}</p>
          </div>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h3 className="font-semibold mb-3">Appearance</h3>
          <div className="text-sm text-zinc-400 space-y-1">
            <p>Inner radius: {settings.global.appearance.innerRadius}px</p>
            <p>Outer radius: {settings.global.appearance.outerRadius}px</p>
            <p>Label font: {settings.global.appearance.labelFont}</p>
            <p>Opacity: {settings.global.appearance.opacity}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
