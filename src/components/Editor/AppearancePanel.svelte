<script lang="ts">
  import { t } from '../../i18n';
  import type { Appearance } from '../../types/settings';

  export let appearance: Appearance;
  export let onChange: (updates: Partial<Appearance>) => void;
</script>

<div class="space-y-4">
  <h3 class="text-sm font-semibold text-theme-text-secondary uppercase tracking-wide">{$t('editor.appearance')}</h3>

  <div class="grid grid-cols-2 gap-3">
    <div>
      <label class="block text-xs text-theme-text-secondary mb-1" for="inner-radius">{$t('settings.innerRadius')}</label>
      <input
        id="inner-radius"
        type="range"
        min="10"
        max="100"
        value={appearance.innerRadius}
        on:input={(event) => onChange({ innerRadius: Number(event.currentTarget.value) })}
        class="w-full accent-blue-600"
      />
      <span class="text-xs text-theme-text-muted">{appearance.innerRadius}px</span>
    </div>
    <div>
      <label class="block text-xs text-theme-text-secondary mb-1" for="outer-radius">{$t('settings.outerRadius')}</label>
      <input
        id="outer-radius"
        type="range"
        min="60"
        max="300"
        value={appearance.outerRadius}
        on:input={(event) => onChange({ outerRadius: Number(event.currentTarget.value) })}
        class="w-full accent-blue-600"
      />
      <span class="text-xs text-theme-text-muted">{appearance.outerRadius}px</span>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-3">
    <div>
      <label class="block text-xs text-theme-text-secondary mb-1" for="background-color">{$t('appearance.background')}</label>
      <input
        id="background-color"
        type="color"
        value={appearance.backgroundColor.substring(0, 7)}
        on:input={(event) => onChange({ backgroundColor: `${event.currentTarget.value}80` })}
        class="w-full h-8 bg-theme-bg-tertiary border border-theme-border rounded cursor-pointer"
      />
    </div>
    <div>
      <label class="block text-xs text-theme-text-secondary mb-1" for="slice-fill-color">{$t('appearance.sliceFill')}</label>
      <input
        id="slice-fill-color"
        type="color"
        value={appearance.sliceFillColor.substring(0, 7)}
        on:input={(event) => onChange({ sliceFillColor: `${event.currentTarget.value}CC` })}
        class="w-full h-8 bg-theme-bg-tertiary border border-theme-border rounded cursor-pointer"
      />
    </div>
    <div>
      <label class="block text-xs text-theme-text-secondary mb-1" for="hover-color">{$t('appearance.hoverColor')}</label>
      <input
        id="hover-color"
        type="color"
        value={appearance.sliceHoverColor.substring(0, 7)}
        on:input={(event) => onChange({ sliceHoverColor: `${event.currentTarget.value}99` })}
        class="w-full h-8 bg-theme-bg-tertiary border border-theme-border rounded cursor-pointer"
      />
    </div>
    <div>
      <label class="block text-xs text-theme-text-secondary mb-1" for="border-color">{$t('appearance.border')}</label>
      <input
        id="border-color"
        type="color"
        value={appearance.sliceBorderColor.substring(0, 7)}
        on:input={(event) => onChange({ sliceBorderColor: event.currentTarget.value })}
        class="w-full h-8 bg-theme-bg-tertiary border border-theme-border rounded cursor-pointer"
      />
    </div>
  </div>

  <div>
    <label class="block text-xs text-theme-text-secondary mb-1" for="opacity">{$t('settings.opacity')}</label>
    <input
      id="opacity"
      type="range"
      min="0.1"
      max="1"
      step="0.05"
      value={appearance.opacity}
      on:input={(event) => onChange({ opacity: Number(event.currentTarget.value) })}
      class="w-full accent-blue-600"
    />
    <span class="text-xs text-theme-text-muted">{appearance.opacity}</span>
  </div>

  <div>
    <label class="block text-xs text-theme-text-secondary mb-1" for="label-size">{$t('appearance.labelSize')}</label>
    <input
      id="label-size"
      type="range"
      min="8"
      max="24"
      value={appearance.labelSize}
      on:input={(event) => onChange({ labelSize: Number(event.currentTarget.value) })}
      class="w-full accent-blue-600"
    />
    <span class="text-xs text-theme-text-muted">{appearance.labelSize}px</span>
  </div>
</div>
