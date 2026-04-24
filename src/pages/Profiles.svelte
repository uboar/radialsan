<script lang="ts">
  import { t } from '../i18n';
  import { settingsStore } from '../stores/settingsStore';
  import { exportProfile, parseRadialsanPackage, pickJsonFile } from '../utils/sharing';
  import type { MatchRule, PieKey, Profile } from '../types/settings';

  const AVAILABLE_KEYS = [
    'A','B','C','D','E','F','G','H','I','J','K','L','M',
    'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
    '0','1','2','3','4','5','6','7','8','9',
    'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
    'Space','Tab','CapsLock','Escape','Return','Backspace','Delete',
    'Up','Down','Left','Right',
    'Mouse4','Mouse5',
  ];

  const MODIFIER_NAMES = ['Ctrl', 'Shift', 'Alt', 'Meta'] as const;

  let editingId: string | null = null;
  let editName = '';
  let editRules: MatchRule[] = [];
  let editPieKeys: PieKey[] = [];
  let recordingPieKeyId: string | null = null;

  function parseHotkeyString(hotkey: string): { modifiers: string[]; key: string } {
    const parts = hotkey.split('+');
    const key = parts[parts.length - 1] ?? '';
    const modifiers = parts.slice(0, -1);
    return { modifiers, key };
  }

  function buildHotkeyString(modifiers: string[], key: string): string {
    return [...modifiers, key].join('+');
  }

  function handleNewProfile() {
    settingsStore.addProfile({
      id: `profile_${Date.now()}`,
      name: $t('profiles.newProfileName'),
      isDefault: false,
      matchRules: [],
      pieKeys: [],
    });
    void settingsStore.saveSettings();
  }

  async function handleExportProfile(profile: Profile) {
    const settings = $settingsStore.settings;
    if (!settings) return;

    try {
      await exportProfile(profile, settings.menus);
    } catch (err) {
      alert($t('dashboard.exportFailed', { error: String(err) }));
    }
  }

  async function handleImportProfile() {
    try {
      const text = await pickJsonFile();
      const pkg = parseRadialsanPackage(text);

      for (const menu of pkg.menus) {
        settingsStore.addMenu(menu);
      }
      if (pkg.profiles) {
        for (const profile of pkg.profiles) {
          settingsStore.addProfile(profile);
        }
      }

      void settingsStore.saveSettings();
      alert($t('profiles.importSummary', { profiles: pkg.profiles?.length || 0, menus: pkg.menus.length }));
    } catch (err) {
      alert($t('dashboard.importFailed', { error: String(err) }));
    }
  }

  function handleStartEdit(profile: Profile) {
    editingId = profile.id;
    editName = profile.name;
    editRules = profile.matchRules.map((rule) => ({ ...rule }));
    editPieKeys = profile.pieKeys.map((pieKey) => ({ ...pieKey }));
  }

  function handleSaveEdit(profileId: string) {
    settingsStore.updateProfile(profileId, {
      name: editName,
      matchRules: editRules,
      pieKeys: editPieKeys,
    });
    void settingsStore.saveSettings();
    editingId = null;
  }

  function handleDeleteProfile(profileId: string) {
    if (!confirm($t('profiles.deleteConfirm'))) return;
    settingsStore.deleteProfile(profileId);
    void settingsStore.saveSettings();
  }

  function handleAddRule() {
    editRules = [...editRules, { field: 'processName', matchMode: 'contains', value: '' }];
  }

  function handleUpdateRule(index: number, updates: Partial<MatchRule>) {
    editRules = editRules.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, ...updates } : rule);
  }

  function handleRemoveRule(index: number) {
    editRules = editRules.filter((_, ruleIndex) => ruleIndex !== index);
  }

  function handleAddPieKey() {
    const firstMenuId = $settingsStore.settings?.menus[0]?.id ?? '';
    editPieKeys = [...editPieKeys, {
      id: `pk_${Date.now()}`,
      hotkey: 'CapsLock',
      menuId: firstMenuId,
    }];
  }

  function handleUpdatePieKey(pieKeyId: string, updates: Partial<PieKey>) {
    editPieKeys = editPieKeys.map((pieKey) =>
      pieKey.id === pieKeyId ? { ...pieKey, ...updates } : pieKey
    );
  }

  function handleRemovePieKey(pieKeyId: string) {
    editPieKeys = editPieKeys.filter((pieKey) => pieKey.id !== pieKeyId);
  }

  function handleModifierToggle(pieKey: PieKey, modifier: string) {
    const { modifiers, key } = parseHotkeyString(pieKey.hotkey);
    const newModifiers = modifiers.includes(modifier)
      ? modifiers.filter((existing) => existing !== modifier)
      : [...modifiers, modifier];
    const sorted = MODIFIER_NAMES.filter((existing) => newModifiers.includes(existing));
    handleUpdatePieKey(pieKey.id, { hotkey: buildHotkeyString(sorted, key) });
  }

  function handleKeyChange(pieKey: PieKey, key: string) {
    const { modifiers } = parseHotkeyString(pieKey.hotkey);
    handleUpdatePieKey(pieKey.id, { hotkey: buildHotkeyString(modifiers, key) });
  }

  async function handleRecordKey(pieKey: PieKey) {
    recordingPieKeyId = pieKey.id;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { listen } = await import('@tauri-apps/api/event');

      let stopListening: (() => void) | undefined;
      stopListening = await listen<{ hotkey: string | null; timeout?: boolean }>('radialsan://key-detected', (event) => {
        recordingPieKeyId = null;
        if (event.payload.hotkey) {
          handleUpdatePieKey(pieKey.id, { hotkey: event.payload.hotkey });
        }
        stopListening?.();
      });

      await invoke('start_key_detection');
    } catch (err) {
      console.error('Failed to start key detection:', err);
      recordingPieKeyId = null;
    }
  }

  function getMatchFieldLabel(field: MatchRule['field']): string {
    return $t(field === 'processName' ? 'profiles.processName' : 'profiles.windowTitle');
  }

  function getMatchModeLabel(mode: MatchRule['matchMode']): string {
    return $t(`profiles.${mode}`);
  }
</script>

{#if !$settingsStore.settings}
  <div class="text-theme-text-secondary">{$t('common.loading')}</div>
{:else}
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold">{$t('profiles.title')}</h2>
      <div class="flex items-center gap-2">
        <button
          onclick={handleImportProfile}
          class="px-4 py-2 bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 rounded-lg text-sm font-medium transition-colors"
        >
          {$t('profiles.importProfile')}
        </button>
        <button
          onclick={handleNewProfile}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          {$t('profiles.newProfile')}
        </button>
      </div>
    </div>

    <div class="space-y-3">
      {#each $settingsStore.settings.profiles as profile (profile.id)}
        <div class="p-4 bg-theme-bg-secondary border border-theme-border rounded-xl">
          {#if editingId === profile.id}
            <div class="space-y-3">
              <div>
                <label class="block text-xs text-theme-text-secondary mb-1" for="profile-name">{$t('profiles.profileName')}</label>
                <input
                  id="profile-name"
                  type="text"
                  bind:value={editName}
                  class="w-full bg-theme-bg-tertiary border border-theme-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-theme-text-secondary">{$t('profiles.matchRules')}</span>
                  <button type="button" onclick={handleAddRule} class="text-xs text-blue-400 hover:text-blue-300">
                    {$t('profiles.addRule')}
                  </button>
                </div>
                {#if editRules.length === 0}
                  <p class="text-xs text-theme-text-muted">{$t('profiles.noRules')}</p>
                {/if}
                {#each editRules as rule, index}
                  <div class="flex items-center gap-2 mb-2">
                    <select
                      value={rule.field}
                      onchange={(event) => handleUpdateRule(index, { field: event.currentTarget.value as MatchRule['field'] })}
                      class="bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="processName">{$t('profiles.processName')}</option>
                      <option value="windowTitle">{$t('profiles.windowTitle')}</option>
                    </select>
                    <select
                      value={rule.matchMode}
                      onchange={(event) => handleUpdateRule(index, { matchMode: event.currentTarget.value as MatchRule['matchMode'] })}
                      class="bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="contains">{$t('profiles.contains')}</option>
                      <option value="exact">{$t('profiles.exact')}</option>
                      <option value="regex">{$t('profiles.regex')}</option>
                    </select>
                    <input
                      type="text"
                      value={rule.value}
                      oninput={(event) => handleUpdateRule(index, { value: event.currentTarget.value })}
                      placeholder={$t('profiles.valuePlaceholder')}
                      class="flex-1 bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onclick={() => handleRemoveRule(index)}
                      class="text-theme-text-muted hover:text-red-400 text-xs"
                    >
                      {$t('profiles.removeHotkey')}
                    </button>
                  </div>
                {/each}
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-theme-text-secondary">{$t('profiles.hotkeys')}</span>
                  <button type="button" onclick={handleAddPieKey} class="text-xs text-blue-400 hover:text-blue-300">
                    {$t('profiles.addHotkey')}
                  </button>
                </div>
                {#if editPieKeys.length === 0}
                  <p class="text-xs text-theme-text-muted">{$t('profiles.hotkeyBindings', { count: 0 })}</p>
                {/if}
                <div class="space-y-2">
                  {#each editPieKeys as pieKey (pieKey.id)}
                    {@const parsed = parseHotkeyString(pieKey.hotkey)}
                    <div class="flex flex-col gap-2 p-3 bg-theme-bg-tertiary rounded-lg border border-theme-border">
                      <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs text-theme-text-secondary mr-1">{$t('profiles.hotkeyModifiers')}:</span>
                          {#each MODIFIER_NAMES as modifier}
                            <label class="flex items-center gap-1 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={parsed.modifiers.includes(modifier)}
                                onchange={() => handleModifierToggle(pieKey, modifier)}
                                class="rounded border-theme-border bg-theme-bg-tertiary text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                              />
                              <span class="text-theme-text-primary">{modifier}</span>
                            </label>
                          {/each}
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs text-theme-text-secondary">{$t('profiles.hotkeyKey')}:</span>
                          <select
                            value={parsed.key}
                            onchange={(event) => handleKeyChange(pieKey, event.currentTarget.value)}
                            class="bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-theme-text-primary"
                          >
                            <option value="" disabled>{$t('profiles.selectKey')}</option>
                            {#each AVAILABLE_KEYS as key}
                              <option value={key}>{key}</option>
                            {/each}
                          </select>
                        </div>

                        <button
                          onclick={() => handleRecordKey(pieKey)}
                          disabled={recordingPieKeyId === pieKey.id}
                          class={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            recordingPieKeyId === pieKey.id
                              ? 'bg-red-600/20 text-red-400 border border-red-600/50 animate-pulse'
                              : 'bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 text-theme-text-primary border border-theme-border'
                          }`}
                        >
                          {recordingPieKeyId === pieKey.id ? $t('profiles.recording') : $t('profiles.recordKey')}
                        </button>

                        <span class="px-2 py-1 bg-theme-bg-secondary border border-theme-border rounded text-xs text-theme-text-primary font-mono">
                          {pieKey.hotkey}
                        </span>
                      </div>

                      <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1.5 flex-1">
                          <span class="text-xs text-theme-text-secondary">{$t('profiles.hotkeyMenu')}:</span>
                          <select
                            value={pieKey.menuId}
                            onchange={(event) => handleUpdatePieKey(pieKey.id, { menuId: event.currentTarget.value })}
                            class="flex-1 bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-theme-text-primary"
                          >
                            <option value="" disabled>{$t('profiles.selectMenu')}</option>
                            {#each $settingsStore.settings.menus as menu (menu.id)}
                              <option value={menu.id}>{menu.name}</option>
                            {/each}
                          </select>
                        </div>

                        <button
                          onclick={() => handleRemovePieKey(pieKey.id)}
                          class="text-xs text-theme-text-muted hover:text-red-400 transition-colors"
                        >
                          {$t('profiles.removeHotkey')}
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  onclick={() => handleSaveEdit(profile.id)}
                  class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors"
                >
                  {$t('common.save')}
                </button>
                <button
                  onclick={() => (editingId = null)}
                  class="px-3 py-1.5 bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 rounded text-xs font-medium transition-colors"
                >
                  {$t('common.cancel')}
                </button>
              </div>
            </div>
          {:else}
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold">{profile.name}</h3>
                {#if profile.isDefault}
                  <span class="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">{$t('profiles.default')}</span>
                {/if}
              </div>
              <div class="flex items-center gap-2">
                <button
                  onclick={() => handleExportProfile(profile)}
                  class="text-xs text-theme-text-muted hover:text-theme-text-primary transition-colors"
                  title={$t('profiles.exportProfileTitle')}
                >
                  {$t('common.export')}
                </button>
                <button
                  onclick={() => handleStartEdit(profile)}
                  class="text-xs text-theme-text-muted hover:text-theme-text-primary transition-colors"
                >
                  {$t('common.edit')}
                </button>
                {#if !profile.isDefault}
                  <button
                    onclick={() => handleDeleteProfile(profile.id)}
                    class="text-xs text-theme-text-muted hover:text-red-400 transition-colors"
                  >
                    {$t('common.delete')}
                  </button>
                {/if}
              </div>
            </div>
            <p class="text-sm text-theme-text-secondary mt-1">
              {profile.matchRules.length === 0
                ? $t('profiles.matchesAll')
                : profile.matchRules.map((rule) => `${getMatchFieldLabel(rule.field)} ${getMatchModeLabel(rule.matchMode)} "${rule.value}"`).join(', ')}
            </p>
            <div class="mt-2">
              {#if profile.pieKeys.length === 0}
                <p class="text-sm text-theme-text-muted">
                  {$t('profiles.hotkeyBindings', { count: 0 })}
                </p>
              {:else}
                <div class="flex flex-wrap gap-1.5">
                  {#each profile.pieKeys as pieKey (pieKey.id)}
                    {@const menuName = $settingsStore.settings.menus.find((menu) => menu.id === pieKey.menuId)?.name ?? pieKey.menuId}
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-theme-bg-tertiary border border-theme-border rounded text-xs">
                      <span class="font-mono text-blue-400">{pieKey.hotkey}</span>
                      <span class="text-theme-text-muted">→</span>
                      <span class="text-theme-text-primary">{menuName}</span>
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
