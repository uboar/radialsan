<script lang="ts">
  import { t } from '../../i18n';
  import ActionEditor from './ActionEditor.svelte';
  import IconPicker from './IconPicker.svelte';
  import type { Action, Slice } from '../../types/settings';

  export let slice: Slice;
  export let onChange: (updates: Partial<Slice>) => void;
  export let menuIds: string[];

  function handleActionChange(index: number, action: Action) {
    const actions = [...slice.actions];
    actions[index] = action;
    onChange({ actions });
  }
</script>

<div class="space-y-4">
  <h3 class="text-sm font-semibold text-theme-text-secondary uppercase tracking-wide">{$t('editor.sliceProperties')}</h3>

  <div>
    <label class="block text-xs text-theme-text-secondary mb-1" for="slice-label">{$t('editor.label')}</label>
    <input
      id="slice-label"
      type="text"
      value={slice.label}
      on:input={(event) => onChange({ label: event.currentTarget.value })}
      class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
    />
  </div>

  <div>
    <div class="block text-xs text-theme-text-secondary mb-1">{$t('editor.iconEmojiOrText')}</div>
    <IconPicker value={slice.icon} onChange={(icon) => onChange({ icon })} />
  </div>

  <div class="border-t border-theme-border pt-4">
    <h4 class="text-xs text-theme-text-secondary mb-2 uppercase tracking-wide">{$t('editor.action')}</h4>
    {#each slice.actions as action, index (index)}
      <ActionEditor action={action} onChange={(nextAction) => handleActionChange(index, nextAction)} {menuIds} />
    {/each}
  </div>
</div>
