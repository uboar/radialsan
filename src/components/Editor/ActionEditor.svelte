<script lang="ts">
  import { t } from '../../i18n';
  import type { Action, ActionType } from '../../types/settings';
  import { buildKeyCombo, MODIFIER_NAMES, parseKeyCombo, SEND_KEY_OPTIONS, toggleModifier } from '../../utils/keyOptions';
  import type { ModifierName } from '../../utils/keyOptions';

  export let action: Action;
  export let onChange: (action: Action) => void;
  export let menuOptions: Array<{ id: string; name: string }> | undefined = undefined;

  const ACTION_TYPES: Array<{ value: ActionType; labelKey: string }> = [
    { value: 'sendKey', labelKey: 'actions.sendKey' },
    { value: 'sendText', labelKey: 'actions.sendText' },
    { value: 'mouseClick', labelKey: 'actions.mouseClick' },
    { value: 'openUrl', labelKey: 'actions.openUrl' },
    { value: 'openFile', labelKey: 'actions.openFile' },
    { value: 'openFolder', labelKey: 'actions.openFolder' },
    { value: 'runCommand', labelKey: 'actions.runCommand' },
    { value: 'runScript', labelKey: 'actions.runScript' },
    { value: 'clipboard', labelKey: 'actions.clipboard' },
    { value: 'mediaControl', labelKey: 'actions.mediaControl' },
    { value: 'runLua', labelKey: 'actions.runLua' },
    { value: 'submenu', labelKey: 'actions.submenu' },
    { value: 'noop', labelKey: 'actions.noop' },
  ];

  let params: Record<string, unknown> = {};
  let recordingSendKey = false;

  $: params = typeof action.params === 'object' && action.params !== null
    ? (action.params as Record<string, unknown>)
    : {};

  function updateType(type: string) {
    onChange({ type: type as Action['type'], params: getDefaultParams(type) });
  }

  function updateParam(key: string, value: unknown) {
    onChange({ ...action, params: { ...params, [key]: value } });
  }

  function handleSendKeyModifierToggle(modifier: ModifierName) {
    const combo = parseKeyCombo((params.keys as string) || '');
    updateParam('keys', buildKeyCombo(toggleModifier(combo.modifiers, modifier), combo.key));
  }

  function handleSendKeyChange(key: string) {
    const combo = parseKeyCombo((params.keys as string) || '');
    updateParam('keys', buildKeyCombo(combo.modifiers, key));
  }

  async function handleRecordSendKey() {
    recordingSendKey = true;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { listen } = await import('@tauri-apps/api/event');

      let stopListening: (() => void) | undefined;
      stopListening = await listen<{ hotkey: string | null; timeout?: boolean }>('radialsan://key-detected', (event) => {
        recordingSendKey = false;
        if (event.payload.hotkey) {
          updateParam('keys', event.payload.hotkey);
        }
        stopListening?.();
      });

      await invoke('start_key_detection');
    } catch (err) {
      console.error('Failed to start key detection:', err);
      recordingSendKey = false;
    }
  }
</script>

<div class="space-y-3">
  <div>
    <label class="block text-xs text-theme-text-secondary mb-1" for="action-type">{$t('editor.actionType')}</label>
    <select
      id="action-type"
      value={action.type}
      on:change={(event) => updateType(event.currentTarget.value)}
      class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
    >
      {#each ACTION_TYPES as type}
        <option value={type.value}>{$t(type.labelKey)}</option>
      {/each}
    </select>
  </div>

  {#if action.type === 'sendKey'}
    {@const sendKeyCombo = parseKeyCombo((params.keys as string) || '')}
    <div class="space-y-2">
      <div>
        <label class="block text-xs text-theme-text-secondary mb-1" for="send-key-key">{$t('actions.keys')}</label>
        <div class="flex flex-wrap items-center gap-2">
          <select
            id="send-key-key"
            value={sendKeyCombo.key}
            on:change={(event) => handleSendKeyChange(event.currentTarget.value)}
            class="min-w-36 bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-theme-text-primary"
          >
            <option value="" disabled>{$t('actions.selectKey')}</option>
            {#each SEND_KEY_OPTIONS as key}
              <option value={key}>{key}</option>
            {/each}
          </select>

          <button
            type="button"
            on:click={handleRecordSendKey}
            disabled={recordingSendKey}
            class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              recordingSendKey
                ? 'bg-red-600/20 text-red-400 border border-red-600/50 animate-pulse'
                : 'bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 text-theme-text-primary border border-theme-border'
            }`}
          >
            {recordingSendKey ? $t('actions.recording') : $t('actions.recordKey')}
          </button>

          <span class="px-3 py-2 bg-theme-bg-tertiary border border-theme-border rounded-lg text-sm text-theme-text-primary font-mono">
            {(params.keys as string) || '-'}
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs text-theme-text-secondary mr-1">{$t('actions.keyModifiers')}:</span>
        {#each MODIFIER_NAMES as modifier}
          <label class="flex items-center gap-1 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={sendKeyCombo.modifiers.includes(modifier)}
              on:change={() => handleSendKeyModifierToggle(modifier)}
              class="rounded border-theme-border bg-theme-bg-tertiary text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span class="text-theme-text-primary">{modifier}</span>
          </label>
        {/each}
      </div>
    </div>
  {/if}

  {#if action.type === 'sendText'}
    <div>
      <label class="block text-xs text-theme-text-secondary mb-1" for="send-text-value">{$t('actions.text')}</label>
      <input
        id="send-text-value"
        type="text"
        value={(params.text as string) || ''}
        on:input={(event) => updateParam('text', event.currentTarget.value)}
        class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  {/if}

  {#if action.type === 'mouseClick'}
    <div class="space-y-2">
      <div>
        <label class="block text-xs text-theme-text-secondary mb-1" for="mouse-button">{$t('actions.button')}</label>
        <select
          id="mouse-button"
          value={(params.button as string) || 'left'}
          on:change={(event) => updateParam('button', event.currentTarget.value)}
          class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="left">{$t('actions.buttonLeft')}</option>
          <option value="right">{$t('actions.buttonRight')}</option>
          <option value="middle">{$t('actions.buttonMiddle')}</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-theme-text-secondary mb-1" for="mouse-clicks">{$t('actions.clicks')}</label>
        <input
          id="mouse-clicks"
          type="number"
          min="1"
          max="5"
          value={(params.clicks as number) || 1}
          on:input={(event) => updateParam('clicks', Number.parseInt(event.currentTarget.value, 10) || 1)}
          class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm"
        />
      </div>
    </div>
  {/if}

  {#if action.type === 'openUrl'}
    <div>
      <label class="block text-xs text-theme-text-secondary mb-1" for="open-url">{$t('actions.url')}</label>
      <input
        id="open-url"
        type="url"
        value={(params.url as string) || ''}
        on:input={(event) => updateParam('url', event.currentTarget.value)}
        placeholder="https://..."
        class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  {/if}

  {#if action.type === 'openFile' || action.type === 'openFolder'}
    <div>
      <label class="block text-xs text-theme-text-secondary mb-1" for="open-path">{$t('actions.path')}</label>
      <input
        id="open-path"
        type="text"
        value={(params.path as string) || ''}
        on:input={(event) => updateParam('path', event.currentTarget.value)}
        class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  {/if}

  {#if action.type === 'runCommand'}
    <div class="space-y-2">
      <div>
        <label class="block text-xs text-theme-text-secondary mb-1" for="run-command">{$t('actions.command')}</label>
        <input
          id="run-command"
          type="text"
          value={(params.command as string) || ''}
          on:input={(event) => updateParam('command', event.currentTarget.value)}
          class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <label class="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={(params.shell as boolean) || false}
          on:change={(event) => updateParam('shell', event.currentTarget.checked)}
          class="accent-blue-600"
        />
        {$t('actions.runInShell')}
      </label>
    </div>
  {/if}

  {#if action.type === 'runScript'}
    <div class="space-y-2">
      <div>
        <label class="block text-xs text-theme-text-secondary mb-1" for="script-interpreter">{$t('actions.interpreter')}</label>
        <input
          id="script-interpreter"
          type="text"
          value={(params.interpreter as string) || ''}
          on:input={(event) => updateParam('interpreter', event.currentTarget.value)}
          placeholder="python, node, bash..."
          class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label class="block text-xs text-theme-text-secondary mb-1" for="script-path">{$t('actions.scriptPath')}</label>
        <input
          id="script-path"
          type="text"
          value={(params.scriptPath as string) || ''}
          on:input={(event) => updateParam('scriptPath', event.currentTarget.value)}
          class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm"
        />
      </div>
    </div>
  {/if}

  {#if action.type === 'clipboard'}
    <div>
      <label class="block text-xs text-theme-text-secondary mb-1" for="clipboard-operation">{$t('actions.clipboardOperation')}</label>
      <select
        id="clipboard-operation"
        value={(params.operation as string) || (params.action as string) || 'copy'}
        on:change={(event) => updateParam('operation', event.currentTarget.value)}
        class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm"
      >
        <option value="copy">{$t('actions.copy')}</option>
        <option value="cut">{$t('actions.cut')}</option>
        <option value="paste">{$t('actions.paste')}</option>
      </select>
    </div>
  {/if}

  {#if action.type === 'mediaControl'}
    <div>
      <label class="block text-xs text-theme-text-secondary mb-1" for="media-action">{$t('actions.mediaAction')}</label>
      <select
        id="media-action"
        value={(params.action as string) || 'playPause'}
        on:change={(event) => updateParam('action', event.currentTarget.value)}
        class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm"
      >
        <option value="playPause">{$t('actions.playPause')}</option>
        <option value="next">{$t('actions.nextTrack')}</option>
        <option value="prev">{$t('actions.previousTrack')}</option>
        <option value="volumeUp">{$t('actions.volumeUp')}</option>
        <option value="volumeDown">{$t('actions.volumeDown')}</option>
        <option value="mute">{$t('actions.mute')}</option>
      </select>
    </div>
  {/if}

  {#if action.type === 'runLua'}
    <div class="space-y-2">
      <div>
        <label class="block text-xs text-theme-text-secondary mb-1" for="lua-script">{$t('actions.luaScript')}</label>
        <textarea
          id="lua-script"
          value={(params.script as string) || ''}
          on:input={(event) => updateParam('script', event.currentTarget.value)}
          placeholder={$t('actions.luaPlaceholder')}
          rows="6"
          class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 resize-y"
        ></textarea>
      </div>
      <p class="text-xs text-theme-text-muted">
        {$t('actions.luaApi')}
      </p>
    </div>
  {/if}

  {#if action.type === 'submenu' && menuOptions}
    <div class="space-y-2">
      <div>
        <label class="block text-xs text-theme-text-secondary mb-1" for="submenu-target">{$t('actions.targetMenu')}</label>
        <select
          id="submenu-target"
          value={(params.menuId as string) || ''}
          on:change={(event) => updateParam('menuId', event.currentTarget.value)}
          class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{$t('actions.selectMenu')}</option>
          {#each menuOptions as menu}
            <option value={menu.id}>{menu.name}</option>
          {/each}
        </select>
      </div>
      {#if menuOptions.length === 0}
        <p class="text-xs text-amber-400">
          {$t('actions.submenuNoMenus')}
        </p>
      {/if}
      {#if (params.menuId as string) && !menuOptions.some((menu) => menu.id === params.menuId)}
        <p class="text-xs text-red-400">
          {$t('actions.submenuInvalid')}
        </p>
      {/if}
    </div>
  {/if}

  {#if action.type === 'submenu' && !menuOptions}
    <p class="text-xs text-theme-text-muted">
      {$t('actions.submenuUnavailable')}
    </p>
  {/if}
</div>

<script lang="ts" context="module">
  function getDefaultParams(type: string): Record<string, unknown> {
    switch (type) {
      case 'sendKey': return { keys: '' };
      case 'sendText': return { text: '' };
      case 'mouseClick': return { button: 'left', clicks: 1 };
      case 'openUrl': return { url: '' };
      case 'openFile': return { path: '' };
      case 'openFolder': return { path: '' };
      case 'runCommand': return { command: '', shell: false };
      case 'runScript': return { interpreter: '', scriptPath: '' };
      case 'clipboard': return { operation: 'copy' };
      case 'mediaControl': return { action: 'playPause' };
      case 'runLua': return { script: '' };
      case 'submenu': return { menuId: '' };
      default: return {};
    }
  }
</script>
