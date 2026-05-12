<script lang="ts">
  import { t } from "../../i18n";
  import ActionEditor from "./ActionEditor.svelte";
  import IconPicker from "./IconPicker.svelte";
  import type { Action, Slice } from "../../types/settings";

  export let slice: Slice;
  export let onChange: (updates: Partial<Slice>) => void;
  export let menuOptions: Array<{ id: string; name: string }>;

  function handleActionChange(index: number, action: Action) {
    const actions = [...slice.actions];
    actions[index] = action;
    onChange({ actions });
  }
</script>

<div class="space-y-4">
  <h3 class="section-label">
    {$t("editor.sliceProperties")}
  </h3>

  <div class="min-w-0">
    <label
      class="mb-1 block text-xs font-medium text-theme-text-secondary"
      for="slice-label">{$t("editor.label")}</label
    >
    <input
      id="slice-label"
      type="text"
      value={slice.label}
      on:input={(event) => onChange({ label: event.currentTarget.value })}
      class="workbench-field w-full rounded-lg px-3 py-2 text-sm"
    />
  </div>

  <div class="min-w-0">
    <div class="mb-1 block text-xs font-medium text-theme-text-secondary">
      {$t("editor.iconEmojiOrText")}
    </div>
    <IconPicker value={slice.icon} onChange={(icon) => onChange({ icon })} />
  </div>

  <div class="min-w-0 border-t border-theme-border pt-4">
    <h4 class="section-label mb-3">
      {$t("editor.action")}
    </h4>
    {#each slice.actions as action, index (index)}
      <ActionEditor
        {action}
        onChange={(nextAction) => handleActionChange(index, nextAction)}
        {menuOptions}
      />
    {/each}
  </div>
</div>
