<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../i18n';
  import { handleLinkClick } from '../stores/router';
  import { settingsStore, useSettingsStore } from '../stores/settingsStore';
  import { convertAutoHotPieSettings } from '../utils/autohotpieImport';
  import { exportMenu, exportBundle, parseRadialsanPackage, pickJsonFile } from '../utils/sharing';
  import type { PieMenu } from '../types/settings';

  onMount(() => {
    if (!$settingsStore.settings && !$settingsStore.loading) {
      void settingsStore.loadSettings();
    }
  });

  function handleNewMenu() {
    const id = `menu_${Date.now()}`;
    settingsStore.addMenu({
      id,
      name: $t('dashboard.newMenuName'),
      appearanceOverrides: null,
      slices: [
        { id: `s_${Date.now()}_1`, label: $t('dashboard.newSliceLabel', { count: 1 }), icon: '⚡', actions: [{ type: 'noop', params: {} }] },
      ],
    });
    void settingsStore.saveSettings();
  }

  async function handleExport(menu: PieMenu, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    try {
      await exportMenu(menu);
    } catch (err) {
      alert($t('dashboard.exportFailed', { error: String(err) }));
    }
  }

  async function handleImport() {
    try {
      const text = await pickJsonFile();
      const data = JSON.parse(text) as Partial<PieMenu> & { format?: string; profiles?: unknown[] };

      if (data.format === 'radialsan') {
        const pkg = parseRadialsanPackage(text);
        for (const menu of pkg.menus) {
          settingsStore.addMenu(menu);
        }
        if (pkg.profiles) {
          for (const profile of pkg.profiles) {
            settingsStore.addProfile(profile);
          }
        }
      } else if (data.name && Array.isArray(data.slices)) {
        const now = Date.now();
        settingsStore.addMenu({
          ...data,
          id: `menu_${now}`,
          name: data.name,
          appearanceOverrides: data.appearanceOverrides ?? null,
          slices: data.slices.map((slice, index) => ({ ...slice, id: `s_${now}_${index}` })),
        } as PieMenu);
      } else {
        alert($t('dashboard.unrecognizedFileFormat'));
        return;
      }

      void settingsStore.saveSettings();
    } catch (err) {
      alert($t('dashboard.importFailed', { error: String(err) }));
    }
  }

  async function handleExportAll() {
    const { settings } = useSettingsStore.getState();
    if (!settings) return;

    try {
      await exportBundle(settings.menus, settings.profiles);
    } catch (err) {
      alert($t('dashboard.exportFailed', { error: String(err) }));
    }
  }

  function handleAutoHotPieImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const ahpSettings = JSON.parse(text) as { appProfiles?: unknown };

        if (!ahpSettings.appProfiles) {
          alert($t('dashboard.invalidAutoHotPieFile'));
          return;
        }

        const converted = convertAutoHotPieSettings(ahpSettings);

        if (converted.menus) {
          for (const menu of converted.menus) {
            settingsStore.addMenu(menu);
          }
        }
        if (converted.profiles) {
          for (const profile of converted.profiles) {
            if (!profile.isDefault) {
              settingsStore.addProfile(profile);
            }
          }
        }

        void settingsStore.saveSettings();
        alert($t('dashboard.importSummary', { menus: converted.menus?.length || 0, profiles: converted.profiles?.length || 0 }));
      } catch (err) {
        alert($t('dashboard.autoHotPieImportFailed', { error: String(err) }));
      }
    };
    input.click();
  }
</script>

{#if $settingsStore.loading || !$settingsStore.settings}
  <div class="text-theme-text-secondary">{$t('common.loading')}</div>
{:else}
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold">{$t('dashboard.title')}</h2>
      <div class="flex items-center gap-2">
        <button
          onclick={handleAutoHotPieImport}
          class="px-4 py-2 bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 rounded-lg text-sm font-medium transition-colors"
        >
          {$t('dashboard.importAutoHotPie')}
        </button>
        <button
          onclick={handleImport}
          class="px-4 py-2 bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 rounded-lg text-sm font-medium transition-colors"
        >
          {$t('dashboard.importMenu')}
        </button>
        <button
          onclick={handleExportAll}
          class="px-4 py-2 bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 rounded-lg text-sm font-medium transition-colors"
        >
          {$t('dashboard.exportAll')}
        </button>
        <button
          onclick={handleNewMenu}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          {$t('dashboard.newMenu')}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each $settingsStore.settings.menus as menu (menu.id)}
        <a
          href={`/menu/${menu.id}`}
          onclick={(event) => handleLinkClick(event, `/menu/${menu.id}`)}
          class="p-4 bg-theme-bg-secondary border border-theme-border rounded-xl hover:border-theme-text-muted transition-colors"
        >
          <div class="flex items-start justify-between mb-1">
            <h3 class="font-semibold">{menu.name}</h3>
            <button
              onclick={(event) => handleExport(menu, event)}
              class="text-xs text-theme-text-muted hover:text-theme-text-primary transition-colors ml-2 shrink-0"
              title={$t('dashboard.exportMenuTitle')}
            >
              {$t('common.export')}
            </button>
          </div>
          <p class="text-sm text-theme-text-secondary">{$t('dashboard.slices', { count: menu.slices.length })}</p>
          <div class="mt-3 flex flex-wrap gap-1">
            {#each menu.slices.slice(0, 6) as slice (slice.id)}
              <span class="text-xs bg-theme-bg-tertiary px-2 py-0.5 rounded">
                {slice.icon} {slice.label}
              </span>
            {/each}
            {#if menu.slices.length > 6}
              <span class="text-xs text-theme-text-muted">{$t('dashboard.moreSlices', { count: menu.slices.length - 6 })}</span>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  </div>
{/if}
