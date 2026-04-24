<script lang="ts">
  import type { Action, ActionType } from '../../types/settings';

  export let action: Action;
  export let onChange: (action: Action) => void;
  export let menuIds: string[] | undefined = undefined;

  const ACTION_TYPES: Array<{ value: ActionType; label: string }> = [
    { value: 'sendKey', label: 'Send Key' },
    { value: 'sendText', label: 'Send Text' },
    { value: 'mouseClick', label: 'Mouse Click' },
    { value: 'openUrl', label: 'Open URL' },
    { value: 'openFile', label: 'Open File' },
    { value: 'openFolder', label: 'Open Folder' },
    { value: 'runCommand', label: 'Run Command' },
    { value: 'runScript', label: 'Run Script' },
    { value: 'clipboard', label: 'Clipboard' },
    { value: 'mediaControl', label: 'Media Control' },
    { value: 'runLua', label: 'Lua Script' },
    { value: 'submenu', label: 'Submenu' },
    { value: 'noop', label: 'No Action' },
  ];

  let params: Record<string, unknown> = {};

  $: params = typeof action.params === 'object' && action.params !== null
    ? (action.params as Record<string, unknown>)
    : {};

  function updateType(type: string) {
    onChange({ type: type as Action['type'], params: getDefaultParams(type) });
  }

  function updateParam(key: string, value: unknown) {
    onChange({ ...action, params: { ...params, [key]: value } });
  }
</script>

<div class="space-y-3">
  <div>
    <label class="block text-xs text-theme-text-secondary mb-1" for="action-type">Action Type</label>
    <select
      id="action-type"
      value={action.type}
      on:change={(event) => updateType(event.currentTarget.value)}
      class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
    >
      {#each ACTION_TYPES as type}
        <option value={type.value}>{type.label}</option>
      {/each}
    </select>
  </div>

  {#if action.type === 'sendKey'}
    <div>
      <label class="block text-xs text-theme-text-secondary mb-1" for="send-key-keys">Keys (e.g. ctrl+c)</label>
      <input
        id="send-key-keys"
        type="text"
        value={(params.keys as string) || ''}
        on:input={(event) => updateParam('keys', event.currentTarget.value)}
        placeholder="ctrl+c"
        class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  {/if}

  {#if action.type === 'sendText'}
    <div>
      <label class="block text-xs text-theme-text-secondary mb-1" for="send-text-value">Text</label>
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
        <label class="block text-xs text-theme-text-secondary mb-1" for="mouse-button">Button</label>
        <select
          id="mouse-button"
          value={(params.button as string) || 'left'}
          on:change={(event) => updateParam('button', event.currentTarget.value)}
          class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="middle">Middle</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-theme-text-secondary mb-1" for="mouse-clicks">Clicks</label>
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
      <label class="block text-xs text-theme-text-secondary mb-1" for="open-url">URL</label>
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
      <label class="block text-xs text-theme-text-secondary mb-1" for="open-path">Path</label>
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
        <label class="block text-xs text-theme-text-secondary mb-1" for="run-command">Command</label>
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
        Run in shell
      </label>
    </div>
  {/if}

  {#if action.type === 'runScript'}
    <div class="space-y-2">
      <div>
        <label class="block text-xs text-theme-text-secondary mb-1" for="script-interpreter">Interpreter</label>
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
        <label class="block text-xs text-theme-text-secondary mb-1" for="script-path">Script Path</label>
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
      <label class="block text-xs text-theme-text-secondary mb-1" for="clipboard-operation">Operation</label>
      <select
        id="clipboard-operation"
        value={(params.operation as string) || (params.action as string) || 'copy'}
        on:change={(event) => updateParam('operation', event.currentTarget.value)}
        class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm"
      >
        <option value="copy">Copy</option>
        <option value="cut">Cut</option>
        <option value="paste">Paste</option>
      </select>
    </div>
  {/if}

  {#if action.type === 'mediaControl'}
    <div>
      <label class="block text-xs text-theme-text-secondary mb-1" for="media-action">Action</label>
      <select
        id="media-action"
        value={(params.action as string) || 'playPause'}
        on:change={(event) => updateParam('action', event.currentTarget.value)}
        class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm"
      >
        <option value="playPause">Play/Pause</option>
        <option value="next">Next Track</option>
        <option value="prev">Previous Track</option>
        <option value="volumeUp">Volume Up</option>
        <option value="volumeDown">Volume Down</option>
        <option value="mute">Mute</option>
      </select>
    </div>
  {/if}

  {#if action.type === 'runLua'}
    <div class="space-y-2">
      <div>
        <label class="block text-xs text-theme-text-secondary mb-1" for="lua-script">Lua Script</label>
        <textarea
          id="lua-script"
          value={(params.script as string) || ''}
          on:input={(event) => updateParam('script', event.currentTarget.value)}
          placeholder={'-- Example:\nradialsan.send_key("ctrl+c")\nradialsan.delay(100)\nradialsan.send_key("ctrl+v")'}
          rows="6"
          class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 resize-y"
        ></textarea>
      </div>
      <p class="text-xs text-theme-text-muted">
        Available API: radialsan.send_key(), send_text(), delay(), open_url(), open_file(), run_command(), mouse_click(), clipboard(), log()
      </p>
    </div>
  {/if}

  {#if action.type === 'submenu' && menuIds}
    <div class="space-y-2">
      <div>
        <label class="block text-xs text-theme-text-secondary mb-1" for="submenu-target">Target Menu</label>
        <select
          id="submenu-target"
          value={(params.menuId as string) || ''}
          on:change={(event) => updateParam('menuId', event.currentTarget.value)}
          class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Select a menu...</option>
          {#each menuIds as menuId}
            <option value={menuId}>{menuId}</option>
          {/each}
        </select>
      </div>
      {#if menuIds.length === 0}
        <p class="text-xs text-amber-400">
          No other menus available. Create another menu to use as a submenu target. The current menu is excluded to prevent circular references.
        </p>
      {/if}
      {#if (params.menuId as string) && !menuIds.includes(params.menuId as string)}
        <p class="text-xs text-red-400">
          Warning: The selected menu ID is not in the available menus list. This may cause a circular reference or point to a deleted menu.
        </p>
      {/if}
    </div>
  {/if}

  {#if action.type === 'submenu' && !menuIds}
    <p class="text-xs text-theme-text-muted">
      Submenu selection is not available in this context.
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
