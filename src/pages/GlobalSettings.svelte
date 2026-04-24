<script lang="ts">
  import { onMount } from 'svelte';
  import { changeLanguage, language, t } from '../i18n';
  import { settingsStore } from '../stores/settingsStore';
  import type { AppTheme } from '../types/settings';

  let autoLaunch = false;

  const themeOptions: Array<{ value: AppTheme; labelKey: string }> = [
    { value: 'dark', labelKey: 'settings.themeDark' },
    { value: 'light', labelKey: 'settings.themeLight' },
    { value: 'system', labelKey: 'settings.themeSystem' },
  ];

  onMount(() => {
    void loadAutoLaunchState();
  });

  async function loadAutoLaunchState() {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      autoLaunch = await invoke<boolean>('get_auto_launch_enabled');
    } catch {
      // Not running in Tauri.
    }
  }

  async function handleAutoLaunchToggle() {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const next = !autoLaunch;
      await invoke('set_auto_launch_enabled', { enabled: next });
      autoLaunch = next;
    } catch (error) {
      console.error('Failed to set auto-launch', error);
    }
  }

  function handleLanguageChange(locale: 'en' | 'ja') {
    changeLanguage(locale);
  }

  function handleThemeChange(theme: AppTheme) {
    settingsStore.updateGlobalSettings({ theme });
    void settingsStore.saveSettings();
  }

  function handleAppearanceChange(key: string, value: number) {
    const settings = $settingsStore.settings;
    if (!settings) return;

    settingsStore.updateGlobalSettings({
      appearance: { ...settings.global.appearance, [key]: value },
    });
    void settingsStore.saveSettings();
  }

  function handleActivationChange(key: string, value: number | boolean) {
    const settings = $settingsStore.settings;
    if (!settings) return;

    settingsStore.updateGlobalSettings({
      menuActivation: { ...settings.global.menuActivation, [key]: value },
    });
    void settingsStore.saveSettings();
  }

  function handleSuppressTriggerKeyInputToggle() {
    const settings = $settingsStore.settings;
    if (!settings) return;

    handleActivationChange(
      'suppressTriggerKeyInput',
      !settings.global.menuActivation.suppressTriggerKeyInput
    );
  }
</script>

{#if !$settingsStore.settings}
  <div class="text-theme-text-muted">{$t('common.loading')}</div>
{:else}
  <div>
    <h2 class="text-2xl font-bold mb-6">{$t('settings.title')}</h2>
    <div class="space-y-6 max-w-lg">
      <div class="p-4 bg-theme-bg-secondary border border-theme-border rounded-xl">
        <h3 class="font-semibold mb-3">{$t('settings.general')}</h3>
        <div class="flex items-center justify-between py-2">
          <span class="text-sm">{$t('settings.launchAtStartup')}</span>
          <button
            type="button"
            aria-label={$t('settings.launchAtStartup')}
            onclick={handleAutoLaunchToggle}
            class={`w-10 h-5 rounded-full transition-colors ${autoLaunch ? 'bg-blue-600' : 'bg-theme-bg-tertiary'}`}
          >
            <div class={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${autoLaunch ? 'translate-x-5' : ''}`}></div>
          </button>
        </div>
        <div class="flex items-center justify-between py-2">
          <span class="text-sm">{$t('settings.showTrayIcon')}</span>
          <div class="w-10 h-5 rounded-full bg-blue-600">
            <div class="w-4 h-4 bg-white rounded-full translate-x-5 mx-0.5"></div>
          </div>
        </div>
      </div>

      <div class="p-4 bg-theme-bg-secondary border border-theme-border rounded-xl">
        <h3 class="font-semibold mb-3">{$t('settings.theme')}</h3>
        <div class="flex gap-2">
          {#each themeOptions as option (option.value)}
            <button
              type="button"
              onclick={() => handleThemeChange(option.value)}
              class={`px-4 py-2 rounded-lg text-sm transition-colors ${
                $settingsStore.settings.global.theme === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary'
              }`}
            >
              {$t(option.labelKey)}
            </button>
          {/each}
        </div>
      </div>

      <div class="p-4 bg-theme-bg-secondary border border-theme-border rounded-xl">
        <h3 class="font-semibold mb-3">{$t('settings.activation')}</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between py-2">
            <span class="text-sm">{$t('settings.suppressTriggerKeyInput')}</span>
            <button
              type="button"
              role="switch"
              aria-checked={$settingsStore.settings.global.menuActivation.suppressTriggerKeyInput}
              aria-label={$t('settings.suppressTriggerKeyInput')}
              onclick={handleSuppressTriggerKeyInputToggle}
              class={`w-10 h-5 rounded-full transition-colors ${
                $settingsStore.settings.global.menuActivation.suppressTriggerKeyInput
                  ? 'bg-blue-600'
                  : 'bg-theme-bg-tertiary'
              }`}
            >
              <div
                class={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${
                  $settingsStore.settings.global.menuActivation.suppressTriggerKeyInput ? 'translate-x-5' : ''
                }`}
              ></div>
            </button>
          </div>
          <div>
            <label class="block text-sm text-theme-text-secondary mb-1" for="quick-tap-threshold">
              {$t('settings.quickTapThreshold')}: {$settingsStore.settings.global.menuActivation.quickTapThresholdMs}ms
            </label>
            <input
              id="quick-tap-threshold"
              type="range"
              min="50"
              max="500"
              step="10"
              value={$settingsStore.settings.global.menuActivation.quickTapThresholdMs}
              oninput={(event) => handleActivationChange('quickTapThresholdMs', Number(event.currentTarget.value))}
              class="w-full accent-blue-600"
            />
          </div>
          <div>
            <label class="block text-sm text-theme-text-secondary mb-1" for="submenu-hover-delay">
              {$t('settings.submenuHoverDelay')}: {$settingsStore.settings.global.menuActivation.submenuHoverDelayMs}ms
            </label>
            <input
              id="submenu-hover-delay"
              type="range"
              min="100"
              max="1000"
              step="50"
              value={$settingsStore.settings.global.menuActivation.submenuHoverDelayMs}
              oninput={(event) => handleActivationChange('submenuHoverDelayMs', Number(event.currentTarget.value))}
              class="w-full accent-blue-600"
            />
          </div>
          <div>
            <label class="block text-sm text-theme-text-secondary mb-1" for="max-submenu-depth">
              {$t('settings.maxSubmenuDepth')}: {$settingsStore.settings.global.menuActivation.maxSubmenuDepth}
            </label>
            <input
              id="max-submenu-depth"
              type="range"
              min="1"
              max="5"
              value={$settingsStore.settings.global.menuActivation.maxSubmenuDepth}
              oninput={(event) => handleActivationChange('maxSubmenuDepth', Number(event.currentTarget.value))}
              class="w-full accent-blue-600"
            />
          </div>
        </div>
      </div>

      <div class="p-4 bg-theme-bg-secondary border border-theme-border rounded-xl">
        <h3 class="font-semibold mb-3">{$t('settings.defaultAppearance')}</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-sm text-theme-text-secondary mb-1" for="default-inner-radius">
              {$t('settings.innerRadius')}: {$settingsStore.settings.global.appearance.innerRadius}px
            </label>
            <input
              id="default-inner-radius"
              type="range"
              min="10"
              max="100"
              value={$settingsStore.settings.global.appearance.innerRadius}
              oninput={(event) => handleAppearanceChange('innerRadius', Number(event.currentTarget.value))}
              class="w-full accent-blue-600"
            />
          </div>
          <div>
            <label class="block text-sm text-theme-text-secondary mb-1" for="default-outer-radius">
              {$t('settings.outerRadius')}: {$settingsStore.settings.global.appearance.outerRadius}px
            </label>
            <input
              id="default-outer-radius"
              type="range"
              min="60"
              max="300"
              value={$settingsStore.settings.global.appearance.outerRadius}
              oninput={(event) => handleAppearanceChange('outerRadius', Number(event.currentTarget.value))}
              class="w-full accent-blue-600"
            />
          </div>
          <div>
            <label class="block text-sm text-theme-text-secondary mb-1" for="default-opacity">
              {$t('settings.opacity')}: {$settingsStore.settings.global.appearance.opacity}
            </label>
            <input
              id="default-opacity"
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={$settingsStore.settings.global.appearance.opacity}
              oninput={(event) => handleAppearanceChange('opacity', Number(event.currentTarget.value))}
              class="w-full accent-blue-600"
            />
          </div>
        </div>
      </div>

      <div class="p-4 bg-theme-bg-secondary border border-theme-border rounded-xl">
        <h3 class="font-semibold mb-3">{$t('settings.language')}</h3>
        <div class="flex gap-2">
          <button
            type="button"
            onclick={() => handleLanguageChange('en')}
            class={`px-4 py-2 rounded-lg text-sm transition-colors ${
              $language === 'en' ? 'bg-blue-600 text-white' : 'bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary'
            }`}
          >
            {$t('settings.languageEnglish')}
          </button>
          <button
            type="button"
            onclick={() => handleLanguageChange('ja')}
            class={`px-4 py-2 rounded-lg text-sm transition-colors ${
              $language === 'ja' ? 'bg-blue-600 text-white' : 'bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary'
            }`}
          >
            {$t('settings.languageJapanese')}
          </button>
        </div>
      </div>

      <div class="p-4 bg-theme-bg-secondary border border-theme-border rounded-xl">
        <h3 class="font-semibold mb-3">{$t('settings.about')}</h3>
        <p class="text-sm text-theme-text-secondary">radialsan {$t('settings.version')}</p>
        <p class="text-sm text-theme-text-muted mt-1">{$t('settings.description')}</p>
        <p class="text-sm text-theme-text-muted">{$t('settings.autoBackupNote')}</p>
      </div>
    </div>
  </div>
{/if}
