import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useTranslation } from 'react-i18next';

export const GlobalSettings: React.FC = () => {
  const { settings, updateGlobalSettings, saveSettings } = useSettingsStore();
  const [autoLaunch, setAutoLaunch] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Load auto-launch state
    (async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const enabled = await invoke<boolean>('get_auto_launch_enabled');
        setAutoLaunch(enabled);
      } catch {
        // Not running in Tauri
      }
    })();
  }, []);

  const handleAutoLaunchToggle = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const newValue = !autoLaunch;
      await invoke('set_auto_launch_enabled', { enabled: newValue });
      setAutoLaunch(newValue);
    } catch (e) {
      console.error('Failed to set auto-launch', e);
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('radialsan-lang', lang);
  };

  if (!settings) return <div className="text-zinc-400">{t('common.loading')}</div>;

  const handleAppearanceChange = (key: string, value: number) => {
    updateGlobalSettings({
      appearance: { ...settings.global.appearance, [key]: value },
    });
    saveSettings();
  };

  const handleActivationChange = (key: string, value: number) => {
    updateGlobalSettings({
      menuActivation: { ...settings.global.menuActivation, [key]: value },
    });
    saveSettings();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t('settings.title')}</h2>
      <div className="space-y-6 max-w-lg">
        {/* General */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h3 className="font-semibold mb-3">{t('settings.general')}</h3>
          <label className="flex items-center justify-between py-2">
            <span className="text-sm">{t('settings.launchAtStartup')}</span>
            <button
              onClick={handleAutoLaunchToggle}
              className={`w-10 h-5 rounded-full transition-colors ${autoLaunch ? 'bg-blue-600' : 'bg-zinc-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${autoLaunch ? 'translate-x-5' : ''}`} />
            </button>
          </label>
          <label className="flex items-center justify-between py-2">
            <span className="text-sm">{t('settings.showTrayIcon')}</span>
            <div className={`w-10 h-5 rounded-full bg-blue-600`}>
              <div className="w-4 h-4 bg-white rounded-full translate-x-5 mx-0.5" />
            </div>
          </label>
        </div>

        {/* Activation */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h3 className="font-semibold mb-3">{t('settings.activation')}</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                {t('settings.quickTapThreshold')}: {settings.global.menuActivation.quickTapThresholdMs}ms
              </label>
              <input
                type="range"
                min={50}
                max={500}
                step={10}
                value={settings.global.menuActivation.quickTapThresholdMs}
                onChange={(e) => handleActivationChange('quickTapThresholdMs', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                {t('settings.submenuHoverDelay')}: {settings.global.menuActivation.submenuHoverDelayMs}ms
              </label>
              <input
                type="range"
                min={100}
                max={1000}
                step={50}
                value={settings.global.menuActivation.submenuHoverDelayMs}
                onChange={(e) => handleActivationChange('submenuHoverDelayMs', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                {t('settings.maxSubmenuDepth')}: {settings.global.menuActivation.maxSubmenuDepth}
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={settings.global.menuActivation.maxSubmenuDepth}
                onChange={(e) => handleActivationChange('maxSubmenuDepth', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Default Appearance */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h3 className="font-semibold mb-3">{t('settings.defaultAppearance')}</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                {t('settings.innerRadius')}: {settings.global.appearance.innerRadius}px
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={settings.global.appearance.innerRadius}
                onChange={(e) => handleAppearanceChange('innerRadius', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                {t('settings.outerRadius')}: {settings.global.appearance.outerRadius}px
              </label>
              <input
                type="range"
                min={60}
                max={300}
                value={settings.global.appearance.outerRadius}
                onChange={(e) => handleAppearanceChange('outerRadius', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                {t('settings.opacity')}: {settings.global.appearance.opacity}
              </label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={settings.global.appearance.opacity}
                onChange={(e) => handleAppearanceChange('opacity', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h3 className="font-semibold mb-3">{t('settings.language')}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                i18n.language === 'en' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageChange('ja')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                i18n.language === 'ja' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              日本語
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h3 className="font-semibold mb-3">{t('settings.about')}</h3>
          <p className="text-sm text-zinc-400">radialsan {t('settings.version')}</p>
          <p className="text-sm text-zinc-500 mt-1">{t('settings.description')}</p>
          <p className="text-sm text-zinc-500">{t('settings.autoBackupNote')}</p>
        </div>
      </div>
    </div>
  );
};
