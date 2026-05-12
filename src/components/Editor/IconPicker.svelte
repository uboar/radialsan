<script lang="ts">
  import { t } from "../../i18n";
  import LucideIcon from "./LucideIcon.svelte";
  import {
    getLucideIconName,
    LUCIDE_ICON_NAMES,
  } from "../../utils/lucideIconRegistry";

  export let value: string;
  export let onChange: (icon: string) => void;

  const EMOJI_PRESETS = [
    "📋",
    "📌",
    "✂️",
    "↩️",
    "↪️",
    "💾",
    "📁",
    "📄",
    "🔍",
    "⚡",
    "🔗",
    "🌐",
    "✉️",
    "▶️",
    "⏸️",
    "⏭️",
    "🔊",
    "🔇",
    "⬆️",
    "⬇️",
    "⬅️",
    "➡️",
    "✅",
    "❌",
    "⭐",
    "❤️",
    "🗑️",
    "✏️",
    "🎨",
    "🖌️",
    "💡",
    "🔒",
    "🔓",
    "🏠",
    "⚙️",
    "🔧",
    "📷",
    "🎵",
    "☀️",
    "🌙",
    "🔥",
    "💻",
  ];

  let isOpen = false;
  let search = "";
  let mode: "lucide" | "emoji" = "emoji";

  $: filteredIcons = LUCIDE_ICON_NAMES.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase()),
  );
  $: filteredEmojis = EMOJI_PRESETS;
  $: selectedLucideName = getLucideIconName(value);

  function selectIcon(icon: string) {
    onChange(icon);
    isOpen = false;
  }
</script>

<div class="relative min-w-0">
  <div class="grid grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
    <button
      type="button"
      on:click={() => {
        isOpen = !isOpen;
      }}
      class="flex items-center justify-center gap-2 rounded-lg border border-theme-border bg-theme-bg-tertiary px-3 py-2 text-sm transition-colors hover:bg-theme-bg-tertiary/80 sm:justify-start"
    >
      <span class="flex h-5 w-5 items-center justify-center text-lg">
        {#if selectedLucideName}
          <LucideIcon icon={value} size={20} />
        {:else}
          {value || "⚡"}
        {/if}
      </span>
      <span class="text-theme-text-secondary">{$t("editor.iconChange")}</span>
    </button>
    <input
      type="text"
      {value}
      on:input={(event) => onChange(event.currentTarget.value)}
      placeholder={$t("editor.iconPlaceholder")}
      class="workbench-field flex-1 rounded-lg px-3 py-2 text-sm"
    />
  </div>

  {#if isOpen}
    <div
      class="glass-panel-strong absolute left-0 top-full z-50 mt-1 w-[min(20rem,calc(100vw-3rem))] rounded-lg p-3 shadow-xl"
    >
      <input
        type="text"
        bind:value={search}
        placeholder={$t("iconPicker.searchIcons")}
        class="workbench-field mb-2 w-full rounded-lg px-3 py-1.5 text-sm"
      />

      <div class="flex gap-1 mb-2">
        <button
          type="button"
          on:click={() => {
            mode = "emoji";
          }}
          class="flex-1 text-xs py-1 rounded {mode === 'emoji'
            ? 'bg-theme-bg-tertiary text-theme-text-primary'
            : 'text-theme-text-secondary'}"
        >
          {$t("iconPicker.emoji")}
        </button>
        <button
          type="button"
          on:click={() => {
            mode = "lucide";
          }}
          class="flex-1 text-xs py-1 rounded {mode === 'lucide'
            ? 'bg-theme-bg-tertiary text-theme-text-primary'
            : 'text-theme-text-secondary'}"
        >
          {$t("iconPicker.lucideIcons")}
        </button>
      </div>

      <div class="grid grid-cols-8 gap-1 max-h-48 overflow-auto">
        {#if mode === "emoji"}
          {#each filteredEmojis as emoji, index (index)}
            <button
              type="button"
              on:click={() => selectIcon(emoji)}
              class="w-8 h-8 flex items-center justify-center rounded hover:bg-theme-bg-tertiary/80 text-lg"
              title={emoji}
            >
              {emoji}
            </button>
          {/each}
        {:else}
          {#each filteredIcons as name (name)}
            <button
              type="button"
              on:click={() => selectIcon(`lucide:${name}`)}
              class="w-8 h-8 flex items-center justify-center rounded hover:bg-theme-bg-tertiary/80 text-theme-text-primary"
              title={name}
            >
              <LucideIcon icon={`lucide:${name}`} size={20} />
            </button>
          {/each}
        {/if}
      </div>

      <button
        type="button"
        on:click={() => {
          isOpen = false;
        }}
        class="mt-2 w-full text-xs text-theme-text-muted hover:text-theme-text-primary py-1"
      >
        {$t("iconPicker.close")}
      </button>
    </div>
  {/if}
</div>
