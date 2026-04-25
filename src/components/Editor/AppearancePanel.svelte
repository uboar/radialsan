<script lang="ts">
  import { t } from "../../i18n";
  import type { Appearance } from "../../types/settings";

  export let appearance: Appearance;
  export let onChange: (updates: Partial<Appearance>) => void;
</script>

<div class="space-y-4">
  <h3
    class="text-sm font-semibold text-theme-text-secondary uppercase tracking-wide"
  >
    {$t("editor.appearance")}
  </h3>

  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <div class="min-w-0">
      <label
        class="mb-1 flex items-center justify-between gap-3 text-xs text-theme-text-secondary"
        for="inner-radius"
      >
        <span class="truncate">{$t("settings.innerRadius")}</span>
        <span class="shrink-0 font-mono text-theme-text-muted"
          >{appearance.innerRadius}px</span
        >
      </label>
      <input
        id="inner-radius"
        type="range"
        min="10"
        max="100"
        value={appearance.innerRadius}
        on:input={(event) =>
          onChange({ innerRadius: Number(event.currentTarget.value) })}
        class="w-full accent-blue-600"
      />
    </div>
    <div class="min-w-0">
      <label
        class="mb-1 flex items-center justify-between gap-3 text-xs text-theme-text-secondary"
        for="outer-radius"
      >
        <span class="truncate">{$t("settings.outerRadius")}</span>
        <span class="shrink-0 font-mono text-theme-text-muted"
          >{appearance.outerRadius}px</span
        >
      </label>
      <input
        id="outer-radius"
        type="range"
        min="60"
        max="300"
        value={appearance.outerRadius}
        on:input={(event) =>
          onChange({ outerRadius: Number(event.currentTarget.value) })}
        class="w-full accent-blue-600"
      />
    </div>
  </div>

  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <div class="min-w-0">
      <label
        class="mb-1 block truncate text-xs text-theme-text-secondary"
        for="background-color">{$t("appearance.background")}</label
      >
      <input
        id="background-color"
        type="color"
        value={appearance.backgroundColor.substring(0, 7)}
        on:input={(event) =>
          onChange({ backgroundColor: `${event.currentTarget.value}80` })}
        class="w-full h-8 bg-theme-bg-tertiary border border-theme-border rounded cursor-pointer"
      />
    </div>
    <div class="min-w-0">
      <label
        class="mb-1 block truncate text-xs text-theme-text-secondary"
        for="slice-fill-color">{$t("appearance.sliceFill")}</label
      >
      <input
        id="slice-fill-color"
        type="color"
        value={appearance.sliceFillColor.substring(0, 7)}
        on:input={(event) =>
          onChange({ sliceFillColor: `${event.currentTarget.value}CC` })}
        class="w-full h-8 bg-theme-bg-tertiary border border-theme-border rounded cursor-pointer"
      />
    </div>
    <div class="min-w-0">
      <label
        class="mb-1 block truncate text-xs text-theme-text-secondary"
        for="hover-color">{$t("appearance.hoverColor")}</label
      >
      <input
        id="hover-color"
        type="color"
        value={appearance.sliceHoverColor.substring(0, 7)}
        on:input={(event) =>
          onChange({ sliceHoverColor: `${event.currentTarget.value}99` })}
        class="w-full h-8 bg-theme-bg-tertiary border border-theme-border rounded cursor-pointer"
      />
    </div>
    <div class="min-w-0">
      <label
        class="mb-1 block truncate text-xs text-theme-text-secondary"
        for="border-color">{$t("appearance.border")}</label
      >
      <input
        id="border-color"
        type="color"
        value={appearance.sliceBorderColor.substring(0, 7)}
        on:input={(event) =>
          onChange({ sliceBorderColor: event.currentTarget.value })}
        class="w-full h-8 bg-theme-bg-tertiary border border-theme-border rounded cursor-pointer"
      />
    </div>
  </div>

  <div class="min-w-0">
    <label
      class="mb-1 flex items-center justify-between gap-3 text-xs text-theme-text-secondary"
      for="opacity"
    >
      <span class="truncate">{$t("settings.opacity")}</span>
      <span class="shrink-0 font-mono text-theme-text-muted"
        >{appearance.opacity}</span
      >
    </label>
    <input
      id="opacity"
      type="range"
      min="0.1"
      max="1"
      step="0.05"
      value={appearance.opacity}
      on:input={(event) =>
        onChange({ opacity: Number(event.currentTarget.value) })}
      class="w-full accent-blue-600"
    />
  </div>

  <div class="min-w-0">
    <label
      class="mb-1 flex items-center justify-between gap-3 text-xs text-theme-text-secondary"
      for="label-size"
    >
      <span class="truncate">{$t("appearance.labelSize")}</span>
      <span class="shrink-0 font-mono text-theme-text-muted"
        >{appearance.labelSize}px</span
      >
    </label>
    <input
      id="label-size"
      type="range"
      min="8"
      max="24"
      value={appearance.labelSize}
      on:input={(event) =>
        onChange({ labelSize: Number(event.currentTarget.value) })}
      class="w-full accent-blue-600"
    />
  </div>
</div>
