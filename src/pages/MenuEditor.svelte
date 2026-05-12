<script lang="ts">
  import {
    ArrowLeft,
    Eye,
    Plus,
    Redo2,
    Save,
    Search,
    Trash2,
    Undo2,
  } from "lucide-svelte";
  import { onDestroy, onMount } from "svelte";
  import MenuPreview from "../components/Editor/MenuPreview.svelte";
  import SliceList from "../components/Editor/SliceList.svelte";
  import SliceEditor from "../components/Editor/SliceEditor.svelte";
  import AppearancePanel from "../components/Editor/AppearancePanel.svelte";
  import { t } from "../i18n";
  import { navigate } from "../stores/router";
  import { settingsStore } from "../stores/settingsStore";
  import { historyStore } from "../stores/historyStore";
  import { mergeAppearance } from "../types/settings";
  import type {
    Appearance,
    AppearanceOverrides,
    Settings,
    Slice,
  } from "../types/settings";

  export let id: string | undefined = undefined;

  let settings: Settings | null = null;
  let selectedSliceId: string | null = null;
  let activeTab: "slices" | "appearance" = "slices";
  let menuSearch = "";
  let previewMode = false;
  let canUndoValue = false;
  let canRedoValue = false;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  let initializedMenuId: string | null = null;

  $: settings = $settingsStore.settings;
  $: canUndoValue = $historyStore.undoStack.length >= 2;
  $: canRedoValue = $historyStore.redoStack.length > 0;
  $: menuId = id;
  $: menu = settings?.menus.find((candidate) => candidate.id === menuId);
  $: selectedSlice = menu?.slices.find((slice) => slice.id === selectedSliceId);
  $: selectedIndex =
    menu?.slices.findIndex((slice) => slice.id === selectedSliceId) ?? -1;
  $: if (
    menu &&
    menu.slices.length > 0 &&
    (!selectedSliceId ||
      !menu.slices.some((slice) => slice.id === selectedSliceId))
  ) {
    selectedSliceId = menu.slices[0].id;
  }
  $: appearance =
    settings && menu
      ? mergeAppearance(settings.global.appearance, menu.appearanceOverrides)
      : undefined;
  $: hasAppearanceOverrides =
    !!menu?.appearanceOverrides &&
    Object.keys(menu.appearanceOverrides).length > 0;
  $: menuOptions =
    settings?.menus
      .filter((candidate) => candidate.id !== menuId)
      .map((candidate) => ({ id: candidate.id, name: candidate.name })) ?? [];
  $: filteredMenus =
    settings?.menus.filter((candidate) => {
      const query = menuSearch.trim().toLocaleLowerCase();
      if (!query) return true;
      return (
        candidate.name.toLocaleLowerCase().includes(query) ||
        candidate.slices.some((slice) =>
          slice.label.toLocaleLowerCase().includes(query),
        )
      );
    }) ?? [];
  $: if (settings && menu && menuId && initializedMenuId !== menuId) {
    initializedMenuId = menuId;
    historyStore.initialize(settings);
  }

  onMount(() => {
    if (!$settingsStore.settings && !$settingsStore.loading) {
      void settingsStore.loadSettings();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  onDestroy(() => {
    if (saveTimer) clearTimeout(saveTimer);
    historyStore.clear();
  });

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      void settingsStore.saveSettings();
    }, 500);
  }

  function commitSettings(nextSettings: Settings) {
    settingsStore.setSettings(nextSettings);
    historyStore.pushSnapshot(nextSettings);
    debouncedSave();
  }

  function restoreSnapshot(snapshot: Settings | null | undefined) {
    if (!snapshot) return;
    settingsStore.setSettings(snapshot);
    void settingsStore.saveSettings();
  }

  function handleSaveNow() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = undefined;
    }
    void settingsStore.saveSettings();
  }

  function handleUndo() {
    restoreSnapshot(historyStore.undo());
  }

  function handleRedo() {
    restoreSnapshot(historyStore.redo());
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "z" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleUndo();
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "z" &&
      event.shiftKey
    ) {
      event.preventDefault();
      handleRedo();
    }
  }

  function handleMenuNameChange(name: string) {
    if (!settings || !menuId) return;
    commitSettings({
      ...settings,
      menus: settings.menus.map((menu) =>
        menu.id === menuId ? { ...menu, name } : menu,
      ),
    });
  }

  function handleSliceReorder(slices: Slice[]) {
    if (!settings || !menuId) return;
    commitSettings({
      ...settings,
      menus: settings.menus.map((menu) =>
        menu.id === menuId ? { ...menu, slices } : menu,
      ),
    });
  }

  function handleAddSlice() {
    if (!settings || !menu || !menuId) return;
    const newSlice: Slice = {
      id: `s_${Date.now()}`,
      label: $t("editor.newSliceLabel", { count: menu.slices.length + 1 }),
      icon: "⚡",
      actions: [{ type: "noop", params: {} }],
    };
    commitSettings({
      ...settings,
      menus: settings.menus.map((candidate) =>
        candidate.id === menuId
          ? { ...candidate, slices: [...menu.slices, newSlice] }
          : candidate,
      ),
    });
    selectedSliceId = newSlice.id;
  }

  function handleDeleteSlice(sliceId: string) {
    if (!settings || !menu || !menuId) return;
    commitSettings({
      ...settings,
      menus: settings.menus.map((candidate) =>
        candidate.id === menuId
          ? {
              ...candidate,
              slices: menu.slices.filter((slice) => slice.id !== sliceId),
            }
          : candidate,
      ),
    });
    if (selectedSliceId === sliceId) selectedSliceId = null;
  }

  function handleSliceChange(updates: Partial<Slice>) {
    if (!settings || !menu || !menuId || !selectedSliceId) return;
    commitSettings({
      ...settings,
      menus: settings.menus.map((candidate) =>
        candidate.id === menuId
          ? {
              ...candidate,
              slices: menu.slices.map((slice) =>
                slice.id === selectedSliceId ? { ...slice, ...updates } : slice,
              ),
            }
          : candidate,
      ),
    });
  }

  function handleAppearanceChange(updates: Partial<Appearance>) {
    if (!settings || !menu || !menuId) return;
    commitSettings({
      ...settings,
      menus: settings.menus.map((candidate) =>
        candidate.id === menuId
          ? {
              ...candidate,
              appearanceOverrides: {
                ...(menu.appearanceOverrides ?? {}),
                ...(updates as AppearanceOverrides),
              },
            }
          : candidate,
      ),
    });
  }

  function handleAppearanceReset() {
    if (!settings || !menuId || !hasAppearanceOverrides) return;
    commitSettings({
      ...settings,
      menus: settings.menus.map((menu) =>
        menu.id === menuId ? { ...menu, appearanceOverrides: null } : menu,
      ),
    });
  }

  function handleDeleteMenu() {
    if (!menuId || !confirm($t("editor.deleteConfirm"))) return;
    settingsStore.deleteMenu(menuId);
    void settingsStore.saveSettings();
    navigate("/");
  }

  function getActionLabel(type: string | undefined): string {
    return $t(`actions.${type ?? "noop"}`);
  }

  function getProfileBindingCount(profileId: string): number {
    const profile = settings?.profiles.find(
      (candidate) => candidate.id === profileId,
    );
    return (
      profile?.pieKeys.filter((pieKey) => pieKey.menuId === menuId).length ?? 0
    );
  }
</script>

{#if !settings || !menu || !appearance}
  <div class="text-theme-text-secondary">{$t("editor.menuNotFound")}</div>
{:else}
  <div
    class="grid min-h-[calc(100vh-5.5rem)] grid-cols-1 gap-3 xl:grid-cols-[280px_minmax(28rem,1fr)_340px] xl:grid-rows-[auto_minmax(0,1fr)_8.25rem]"
  >
    <header
      class="glass-panel-strong flex min-w-0 flex-wrap items-center gap-3 rounded-[10px] p-3 xl:col-span-3"
    >
      <button
        type="button"
        on:click={() => navigate("/")}
        class="icon-button shrink-0"
        title={$t("editor.back")}
      >
        <ArrowLeft size={16} />
      </button>
      <div class="min-w-0 shrink-0">
        <div
          class="text-[0.68rem] font-bold uppercase leading-none tracking-[0.08em] text-cyan-200"
        >
          {$t("app.name")}
        </div>
        <div class="mt-1 text-xs leading-none text-theme-text-muted">
          {$t("editor.slices")}
        </div>
      </div>
      <input
        type="text"
        value={menu.name}
        on:input={(event) => handleMenuNameChange(event.currentTarget.value)}
        class="min-w-48 flex-1 truncate rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-xl font-bold leading-tight text-theme-text-primary outline-none transition-colors focus:border-cyan-300/50 focus:bg-theme-bg-tertiary/50"
      />
      <div
        class="workbench-field flex min-w-44 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 xl:max-w-64"
      >
        <Search size={15} class="shrink-0 text-theme-text-muted" />
        <input
          type="search"
          bind:value={menuSearch}
          placeholder={$t("common.search")}
          class="min-w-0 flex-1 bg-transparent text-sm text-theme-text-primary outline-none placeholder:text-theme-text-muted"
        />
      </div>
      <div class="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          on:click={handleUndo}
          disabled={!canUndoValue}
          class="icon-button"
          title={$t("editor.undoTitle")}
        >
          <Undo2 size={15} />
        </button>
        <button
          type="button"
          on:click={handleRedo}
          disabled={!canRedoValue}
          class="icon-button"
          title={$t("editor.redoTitle")}
        >
          <Redo2 size={15} />
        </button>
      </div>
      <button
        type="button"
        on:click={() => {
          previewMode = !previewMode;
        }}
        class={`secondary-command shrink-0 ${previewMode ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100" : ""}`}
        aria-pressed={previewMode}
        title={$t("editor.preview")}
      >
        <Eye size={15} />
        {$t("editor.preview")}
      </button>
      <button type="button" on:click={handleSaveNow} class="primary-command">
        <Save size={15} />
        {$t("common.save")}
      </button>
    </header>

    <aside
      class="glass-panel thin-scrollbar min-h-0 overflow-auto rounded-[10px] p-3 xl:row-start-2"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <h2 class="section-label">{$t("dashboard.title")}</h2>
        <span
          class="rounded-full bg-cyan-300/10 px-2 py-0.5 text-[0.68rem] font-bold text-cyan-200"
        >
          {settings.menus.length}
        </span>
      </div>

      <div class="mb-4 space-y-1.5">
        {#each filteredMenus as candidate (candidate.id)}
          <button
            type="button"
            on:click={() => navigate(`/menu/${candidate.id}`)}
            class={`flex w-full min-w-0 items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
              candidate.id === menuId
                ? "border-cyan-300/50 bg-cyan-300/15 text-theme-text-primary"
                : "border-transparent bg-theme-bg-tertiary/35 text-theme-text-secondary hover:border-theme-border hover:bg-theme-bg-tertiary/75 hover:text-theme-text-primary"
            }`}
          >
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#0b1018] text-xs font-bold text-cyan-200"
            >
              {candidate.slices.length}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold"
                >{candidate.name}</span
              >
              <span class="block truncate text-xs text-theme-text-muted"
                >{$t("dashboard.slices", {
                  count: candidate.slices.length,
                })}</span
              >
            </span>
          </button>
        {/each}
      </div>

      <div class="border-t border-theme-border pt-4">
        <SliceList
          slices={menu.slices}
          selectedId={selectedSliceId}
          onSelect={(sliceId) => {
            selectedSliceId = sliceId;
            activeTab = "slices";
          }}
          onReorder={handleSliceReorder}
          onAdd={handleAddSlice}
          onDelete={handleDeleteSlice}
        />
      </div>
    </aside>

    <section
      class="glass-panel flex min-h-[32rem] min-w-0 flex-col rounded-[10px] p-3"
    >
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div class="min-w-0">
          <h2
            class="truncate text-[15px] font-bold leading-5 text-theme-text-primary"
          >
            {selectedSlice ? selectedSlice.label : menu.name}
          </h2>
          <p class="truncate text-xs text-theme-text-muted">
            {selectedSlice
              ? getActionLabel(selectedSlice.actions[0]?.type)
              : $t("dashboard.slices", { count: menu.slices.length })}
          </p>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            on:click={handleAddSlice}
            class="icon-button"
            title={$t("editor.addSlice")}
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            on:click={() =>
              selectedSlice && handleDeleteSlice(selectedSlice.id)}
            disabled={!selectedSlice}
            class="icon-button hover:text-[#FF8A96]"
            title={$t("common.delete")}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div class="flex min-h-0 flex-1">
        <MenuPreview
          slices={menu.slices}
          selectedIndex={selectedIndex >= 0 ? selectedIndex : null}
          {appearance}
          {previewMode}
          onSelect={(sliceId) => {
            if (previewMode) return;
            selectedSliceId = sliceId;
            activeTab = "slices";
          }}
        />
      </div>
    </section>

    <aside
      class="glass-panel thin-scrollbar min-h-0 overflow-auto rounded-[10px] p-3"
    >
      <div class="mb-3 min-w-0">
        <div class="section-label mb-1">{$t("editor.sliceProperties")}</div>
        <h2
          class="truncate text-[15px] font-bold leading-5 text-theme-text-primary"
        >
          {selectedSlice ? selectedSlice.label : menu.name}
        </h2>
        {#if selectedSlice}
          <p class="mt-1 truncate text-xs text-theme-text-muted">
            {getActionLabel(selectedSlice.actions[0]?.type)}
          </p>
        {/if}
      </div>

      <div class="mb-4 flex gap-1 rounded-lg bg-theme-bg-tertiary p-1">
        <button
          type="button"
          on:click={() => {
            activeTab = "slices";
          }}
          class="flex-1 rounded-md py-1.5 text-sm leading-none transition-colors {activeTab ===
          'slices'
            ? 'bg-cyan-300/15 text-cyan-200'
            : 'text-theme-text-secondary hover:text-theme-text-primary'}"
        >
          {$t("editor.slices")}
        </button>
        <button
          type="button"
          on:click={() => {
            activeTab = "appearance";
          }}
          class="flex-1 rounded-md py-1.5 text-sm leading-none transition-colors {activeTab ===
          'appearance'
            ? 'bg-cyan-300/15 text-cyan-200'
            : 'text-theme-text-secondary hover:text-theme-text-primary'}"
        >
          {$t("editor.appearance")}
        </button>
      </div>

      {#if activeTab === "slices"}
        {#if selectedSlice}
          <SliceEditor
            slice={selectedSlice}
            onChange={handleSliceChange}
            {menuOptions}
          />
        {:else}
          <div
            class="rounded-lg border border-dashed border-theme-border p-4 text-sm text-theme-text-muted"
          >
            {$t("editor.slices")}
          </div>
        {/if}
      {/if}

      {#if activeTab === "appearance"}
        <AppearancePanel
          {appearance}
          hasOverrides={hasAppearanceOverrides}
          onChange={handleAppearanceChange}
          onReset={handleAppearanceReset}
        />
      {/if}

      <button
        type="button"
        on:click={handleDeleteMenu}
        class="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-[#FF6B7A]/25 bg-[#FF6B7A]/10 px-3 py-2 text-xs font-semibold text-[#FFC2C8] transition-colors hover:bg-[#FF6B7A]/15"
      >
        <Trash2 size={14} />
        {$t("editor.deleteMenu")}
      </button>
    </aside>

    <section
      class="glass-panel thin-scrollbar min-h-0 overflow-x-auto rounded-[10px] p-3 xl:col-span-3 xl:row-start-3"
    >
      <div class="flex min-w-max gap-3">
        {#each settings.profiles as profile (profile.id)}
          {@const bindings = getProfileBindingCount(profile.id)}
          <div
            class={`w-56 shrink-0 rounded-[10px] border p-3 ${
              bindings > 0
                ? "border-cyan-300/45 bg-cyan-300/10"
                : "border-theme-border bg-theme-bg-tertiary/45"
            }`}
          >
            <div class="flex min-w-0 items-center justify-between gap-2">
              <h3 class="truncate text-sm font-bold text-theme-text-primary">
                {profile.name}
              </h3>
              {#if profile.isDefault}
                <span
                  class="shrink-0 rounded-full bg-cyan-300/15 px-2 py-0.5 text-[0.65rem] font-bold text-cyan-200"
                >
                  {$t("profiles.default")}
                </span>
              {/if}
            </div>
            <p class="mt-1 truncate text-xs text-theme-text-muted">
              {profile.isDefault
                ? $t("profiles.matchesAll")
                : $t("profiles.matchRules")}
            </p>
            <div class="mt-3 flex items-center justify-between gap-3">
              <span class="font-mono text-xs text-cyan-200">
                {$t("profiles.hotkeyBindings", { count: bindings })}
              </span>
              <span
                class={`h-2 w-2 rounded-full ${
                  bindings > 0 ? "bg-cyan-300" : "bg-theme-text-muted"
                }`}
              ></span>
            </div>
          </div>
        {/each}
      </div>
    </section>
  </div>
{/if}
