<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import MenuPreview from '../components/Editor/MenuPreview.svelte';
  import SliceList from '../components/Editor/SliceList.svelte';
  import SliceEditor from '../components/Editor/SliceEditor.svelte';
  import AppearancePanel from '../components/Editor/AppearancePanel.svelte';
  import { t } from '../i18n';
  import { navigate } from '../stores/router';
  import { settingsStore } from '../stores/settingsStore';
  import { historyStore } from '../stores/historyStore';
  import type { Appearance, Settings, Slice } from '../types/settings';

  export let id: string | undefined = undefined;

  let settings: Settings | null = null;
  let selectedSliceId: string | null = null;
  let activeTab: 'slices' | 'appearance' = 'slices';
  let canUndoValue = false;
  let canRedoValue = false;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  $: settings = $settingsStore.settings;
  $: canUndoValue = $historyStore.undoStack.length >= 2;
  $: canRedoValue = $historyStore.redoStack.length > 0;
  $: menuId = id;
  $: menu = settings?.menus.find((candidate) => candidate.id === menuId);
  $: selectedSlice = menu?.slices.find((slice) => slice.id === selectedSliceId);
  $: selectedIndex = menu?.slices.findIndex((slice) => slice.id === selectedSliceId) ?? -1;
  $: appearance = settings?.global.appearance;
  $: menuOptions = settings?.menus
    .filter((candidate) => candidate.id !== menuId)
    .map((candidate) => ({ id: candidate.id, name: candidate.name })) ?? [];

  onMount(() => {
    if (!$settingsStore.settings && !$settingsStore.loading) {
      void settingsStore.loadSettings();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  onDestroy(() => {
    if (saveTimer) clearTimeout(saveTimer);
  });

  function pushSnapshot() {
    if (!settings) return;
    historyStore.pushSnapshot(settings);
  }

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      void settingsStore.saveSettings();
    }, 500);
  }

  function restoreSnapshot(snapshot: Settings | null | undefined) {
    if (!snapshot) return;
    settingsStore.setSettings(snapshot);
    void settingsStore.saveSettings();
  }

  function handleUndo() {
    restoreSnapshot(historyStore.undo());
  }

  function handleRedo() {
    restoreSnapshot(historyStore.redo());
  }

  function handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      handleUndo();
    }

    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
      event.preventDefault();
      handleRedo();
    }
  }

  function handleMenuNameChange(name: string) {
    if (!settings || !menuId) return;
    pushSnapshot();
    settingsStore.updateMenu(menuId, { name });
    debouncedSave();
  }

  function handleSliceReorder(slices: Slice[]) {
    if (!settings || !menuId) return;
    pushSnapshot();
    settingsStore.updateMenu(menuId, { slices });
    debouncedSave();
  }

  function handleAddSlice() {
    if (!settings || !menu || !menuId) return;
    pushSnapshot();
    const newSlice: Slice = {
      id: `s_${Date.now()}`,
      label: $t('editor.newSliceLabel', { count: menu.slices.length + 1 }),
      icon: '⚡',
      actions: [{ type: 'noop', params: {} }],
    };
    settingsStore.updateMenu(menuId, { slices: [...menu.slices, newSlice] });
    selectedSliceId = newSlice.id;
    debouncedSave();
  }

  function handleDeleteSlice(sliceId: string) {
    if (!settings || !menu || !menuId) return;
    pushSnapshot();
    settingsStore.updateMenu(menuId, { slices: menu.slices.filter((slice) => slice.id !== sliceId) });
    if (selectedSliceId === sliceId) selectedSliceId = null;
    debouncedSave();
  }

  function handleSliceChange(updates: Partial<Slice>) {
    if (!settings || !menu || !menuId || !selectedSliceId) return;
    pushSnapshot();
    settingsStore.updateMenu(menuId, {
      slices: menu.slices.map((slice) => (slice.id === selectedSliceId ? { ...slice, ...updates } : slice)),
    });
    debouncedSave();
  }

  function handleAppearanceChange(updates: Partial<Appearance>) {
    if (!settings || !appearance) return;
    pushSnapshot();
    settingsStore.updateGlobalSettings({ appearance: { ...appearance, ...updates } });
    debouncedSave();
  }

  function handleDeleteMenu() {
    if (!menuId || !confirm($t('editor.deleteConfirm'))) return;
    settingsStore.deleteMenu(menuId);
    void settingsStore.saveSettings();
    navigate('/');
  }
</script>

{#if !settings || !menu || !appearance}
  <div class="text-theme-text-secondary">{$t('editor.menuNotFound')}</div>
{:else}
  <div class="flex min-h-[calc(100vh-3rem)] flex-col">
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        on:click={() => navigate('/')}
        class="shrink-0 text-sm text-theme-text-secondary hover:text-theme-text-primary"
      >
        {$t('editor.back')}
      </button>
      <input
        type="text"
        value={menu.name}
        on:input={(event) => handleMenuNameChange(event.currentTarget.value)}
        class="min-w-48 flex-1 truncate rounded border-none bg-transparent px-1 text-2xl font-bold leading-tight outline-none focus:ring-1 focus:ring-blue-500"
      />
      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          on:click={handleUndo}
          disabled={!canUndoValue}
          class="rounded bg-theme-bg-tertiary px-2 py-1 text-sm hover:bg-theme-bg-tertiary/80 disabled:cursor-not-allowed disabled:opacity-30"
          title={$t('editor.undoTitle')}
        >
          ↶
        </button>
        <button
          type="button"
          on:click={handleRedo}
          disabled={!canRedoValue}
          class="rounded bg-theme-bg-tertiary px-2 py-1 text-sm hover:bg-theme-bg-tertiary/80 disabled:cursor-not-allowed disabled:opacity-30"
          title={$t('editor.redoTitle')}
        >
          ↷
        </button>
      </div>
      <button
        type="button"
        on:click={handleDeleteMenu}
        class="ml-auto shrink-0 text-sm text-theme-text-muted transition-colors hover:text-red-400"
      >
        {$t('editor.deleteMenu')}
      </button>
    </div>

    <div class="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-[minmax(22rem,0.95fr)_minmax(24rem,1.05fr)]">
      <div class="min-w-0">
        <MenuPreview
          slices={menu.slices}
          selectedIndex={selectedIndex >= 0 ? selectedIndex : null}
          {appearance}
        />
      </div>

      <div class="min-w-0 overflow-auto">
        <div class="mb-4 flex gap-1 rounded-lg bg-theme-bg-secondary p-1">
          <button
            type="button"
            on:click={() => {
              activeTab = 'slices';
            }}
            class="flex-1 rounded-md py-1.5 text-sm leading-none transition-colors {activeTab === 'slices'
              ? 'bg-theme-bg-tertiary text-theme-text-primary'
              : 'text-theme-text-secondary hover:text-theme-text-primary'}"
          >
            {$t('editor.slices')}
          </button>
          <button
            type="button"
            on:click={() => {
              activeTab = 'appearance';
            }}
            class="flex-1 rounded-md py-1.5 text-sm leading-none transition-colors {activeTab === 'appearance'
              ? 'bg-theme-bg-tertiary text-theme-text-primary'
              : 'text-theme-text-secondary hover:text-theme-text-primary'}"
          >
            {$t('editor.appearance')}
          </button>
        </div>

        {#if activeTab === 'slices'}
          <div class="space-y-4">
            <SliceList
              slices={menu.slices}
              selectedId={selectedSliceId}
              onSelect={(sliceId) => {
                selectedSliceId = sliceId;
              }}
              onReorder={handleSliceReorder}
              onAdd={handleAddSlice}
              onDelete={handleDeleteSlice}
            />
            {#if selectedSlice}
              <div class="border-t border-theme-border pt-4">
                <SliceEditor slice={selectedSlice} onChange={handleSliceChange} {menuOptions} />
              </div>
            {/if}
          </div>
        {/if}

        {#if activeTab === 'appearance'}
          <AppearancePanel {appearance} onChange={handleAppearanceChange} />
        {/if}
      </div>
    </div>
  </div>
{/if}
