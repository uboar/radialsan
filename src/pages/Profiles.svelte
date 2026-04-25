<script lang="ts">
  import { t } from '../i18n';
  import { settingsStore } from '../stores/settingsStore';
  import { buildKeyCombo, HOTKEY_OPTIONS, MODIFIER_NAMES, parseKeyCombo, toggleModifier } from '../utils/keyOptions';
  import { exportProfile, parseRadialsanPackage, pickJsonFile } from '../utils/sharing';
  import type { MatchRule, PieKey, Profile, WindowCandidate } from '../types/settings';
  import type { ModifierName } from '../utils/keyOptions';

  let editingId: string | null = null;
  let editName = '';
  let editRules: MatchRule[] = [];
  let editPieKeys: PieKey[] = [];
  let recordingPieKeyId: string | null = null;
  let windowCandidates: WindowCandidate[] = [];
  let isLoadingWindowCandidates = false;
  let windowCandidateError: string | null = null;

  function parseHotkeyString(hotkey: string): { modifiers: ModifierName[]; key: string } {
    return parseKeyCombo(hotkey);
  }

  function buildHotkeyString(modifiers: readonly string[], key: string): string {
    return buildKeyCombo(modifiers, key);
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
    void loadWindowCandidates();
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

  async function loadWindowCandidates() {
    isLoadingWindowCandidates = true;
    windowCandidateError = null;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      windowCandidates = await invoke<WindowCandidate[]>('get_window_candidates');
    } catch (err) {
      windowCandidateError = String(err);
      windowCandidates = [];
    } finally {
      isLoadingWindowCandidates = false;
    }
  }

  function getRuleCandidateValues(field: MatchRule['field']): string[] {
    const values = windowCandidates
      .map((candidate) => field === 'processName' ? candidate.processName : candidate.windowTitle)
      .map((value) => value.trim())
      .filter(Boolean);
    return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
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

  function handleModifierToggle(pieKey: PieKey, modifier: ModifierName) {
    const { modifiers, key } = parseHotkeyString(pieKey.hotkey);
    handleUpdatePieKey(pieKey.id, { hotkey: buildHotkeyString(toggleModifier(modifiers, modifier), key) });
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
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2 class="shrink-0 text-2xl font-bold leading-tight">{$t('profiles.title')}</h2>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <button
          onclick={handleImportProfile}
          class="rounded-lg bg-theme-bg-tertiary px-3 py-2 text-sm font-medium leading-none transition-colors hover:bg-theme-bg-tertiary/80"
        >
          {$t('profiles.importProfile')}
        </button>
        <button
          onclick={handleNewProfile}
          class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium leading-none text-white transition-colors hover:bg-blue-500"
        >
          {$t('profiles.newProfile')}
        </button>
      </div>
    </div>

    <div class="space-y-3">
      {#each $settingsStore.settings.profiles as profile (profile.id)}
        <div class="min-w-0 rounded-lg border border-theme-border bg-theme-bg-secondary p-4">
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
                <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span class="shrink-0 text-xs text-theme-text-secondary">{$t('profiles.matchRules')}</span>
                  <div class="flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onclick={loadWindowCandidates}
                      disabled={isLoadingWindowCandidates}
                      class="text-xs text-theme-text-muted hover:text-theme-text-primary disabled:opacity-50"
                    >
                      {isLoadingWindowCandidates ? $t('profiles.loadingCandidates') : $t('profiles.refreshCandidates')}
                    </button>
                    <button type="button" onclick={handleAddRule} class="text-xs text-blue-400 hover:text-blue-300">
                      {$t('profiles.addRule')}
                    </button>
                  </div>
                </div>
                {#if windowCandidateError}
                  <p class="mb-2 text-xs text-red-400">{$t('profiles.windowCandidatesFailed', { error: windowCandidateError })}</p>
                {/if}
                {#if editRules.length === 0}
                  <p class="text-xs text-theme-text-muted">{$t('profiles.noRules')}</p>
                {/if}
                {#each editRules as rule, index}
                  {@const candidateValues = getRuleCandidateValues(rule.field)}
                  <div class="mb-2 grid grid-cols-1 items-center gap-2 xl:grid-cols-[9rem_8rem_minmax(10rem,1fr)_minmax(10rem,1fr)_auto]">
                    <select
                      value={rule.field}
                      onchange={(event) => handleUpdateRule(index, { field: event.currentTarget.value as MatchRule['field'] })}
                      class="bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="processName">{$t('profiles.processName')}</option>
                      <option value="windowTitle">{$t('profiles.windowTitle')}</option>
                    </select>
                    <select
                      value={rule.matchMode}
                      onchange={(event) => handleUpdateRule(index, { matchMode: event.currentTarget.value as MatchRule['matchMode'] })}
                      class="bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
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
                      class="min-w-0 bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <select
                      value={candidateValues.includes(rule.value) ? rule.value : ''}
                      onchange={(event) => {
                        if (event.currentTarget.value) {
                          handleUpdateRule(index, { value: event.currentTarget.value });
                        }
                      }}
                      disabled={candidateValues.length === 0}
                      class="min-w-0 bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="">{$t('profiles.selectFromRunning')}</option>
                      {#each candidateValues as value}
                        <option value={value}>{value}</option>
                      {/each}
                    </select>
                    <button
                      onclick={() => handleRemoveRule(index)}
                      class="justify-self-start text-xs text-theme-text-muted hover:text-red-400 xl:justify-self-end"
                    >
                      {$t('profiles.removeHotkey')}
                    </button>
                  </div>
                {/each}
              </div>

              <div>
                <div class="mb-2 flex items-center justify-between gap-2">
                  <span class="shrink-0 text-xs text-theme-text-secondary">{$t('profiles.hotkeys')}</span>
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
                    <div class="flex min-w-0 flex-col gap-2 rounded-lg border border-theme-border bg-theme-bg-tertiary p-3">
                      <div class="flex min-w-0 items-center gap-2">
                        <div class="flex min-w-0 flex-wrap items-center gap-1.5">
                          <span class="mr-1 shrink-0 text-xs text-theme-text-secondary">{$t('profiles.hotkeyModifiers')}:</span>
                          {#each MODIFIER_NAMES as modifier}
                            <label class="flex shrink-0 cursor-pointer items-center gap-1 text-xs">
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

                      <div class="flex flex-wrap items-center gap-2">
                        <div class="flex min-w-0 items-center gap-1.5">
                          <span class="shrink-0 text-xs text-theme-text-secondary">{$t('profiles.hotkeyKey')}:</span>
                          <select
                            value={parsed.key}
                            onchange={(event) => handleKeyChange(pieKey, event.currentTarget.value)}
                            class="bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-theme-text-primary"
                          >
                            <option value="" disabled>{$t('profiles.selectKey')}</option>
                            {#each HOTKEY_OPTIONS as key}
                              <option value={key}>{key}</option>
                            {/each}
                          </select>
                        </div>

                        <button
                          onclick={() => handleRecordKey(pieKey)}
                          disabled={recordingPieKeyId === pieKey.id}
                          class={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                            recordingPieKeyId === pieKey.id
                              ? 'bg-red-600/20 text-red-400 border border-red-600/50 animate-pulse'
                              : 'bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 text-theme-text-primary border border-theme-border'
                          }`}
                        >
                          {recordingPieKeyId === pieKey.id ? $t('profiles.recording') : $t('profiles.recordKey')}
                        </button>

                        <span class="rounded border border-theme-border bg-theme-bg-secondary px-2 py-1 font-mono text-xs text-theme-text-primary">
                          {pieKey.hotkey}
                        </span>
                      </div>

                      <div class="flex min-w-0 flex-wrap items-center gap-2">
                        <div class="flex min-w-48 flex-1 items-center gap-1.5">
                          <span class="shrink-0 text-xs text-theme-text-secondary">{$t('profiles.hotkeyMenu')}:</span>
                          <select
                            value={pieKey.menuId}
                            onchange={(event) => handleUpdatePieKey(pieKey.id, { menuId: event.currentTarget.value })}
                            class="min-w-0 flex-1 bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-theme-text-primary"
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
            <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div class="flex min-w-0 items-center gap-2">
                <h3 class="min-w-0 truncate font-semibold">{profile.name}</h3>
                {#if profile.isDefault}
                  <span class="shrink-0 rounded bg-blue-600/20 px-2 py-0.5 text-xs text-blue-400">{$t('profiles.default')}</span>
                {/if}
              </div>
              <div class="flex shrink-0 items-center gap-2">
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
            <p class="mt-1 truncate text-sm text-theme-text-secondary">
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
                    <span class="inline-flex max-w-full items-center gap-1 rounded border border-theme-border bg-theme-bg-tertiary px-2 py-0.5 text-xs">
                      <span class="font-mono text-blue-400">{pieKey.hotkey}</span>
                      <span class="text-theme-text-muted">→</span>
                      <span class="min-w-0 truncate text-theme-text-primary">{menuName}</span>
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
