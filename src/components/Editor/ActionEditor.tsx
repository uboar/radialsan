import React from 'react';
import type { Action } from '../../types/settings';

interface ActionEditorProps {
  action: Action;
  onChange: (action: Action) => void;
  menuIds?: string[]; // for submenu selection
}

const ACTION_TYPES = [
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
  { value: 'submenu', label: 'Submenu' },
  { value: 'noop', label: 'No Action' },
];

export const ActionEditor: React.FC<ActionEditorProps> = ({ action, onChange, menuIds }) => {
  const updateType = (type: string) => {
    onChange({ type: type as Action['type'], params: getDefaultParams(type) });
  };

  const updateParam = (key: string, value: unknown) => {
    const params = typeof action.params === 'object' && action.params !== null ? action.params : {};
    onChange({ ...action, params: { ...(params as Record<string, unknown>), [key]: value } });
  };

  const params = (typeof action.params === 'object' && action.params !== null ? action.params : {}) as Record<string, unknown>;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Action Type</label>
        <select
          value={action.type}
          onChange={(e) => updateType(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          {ACTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {action.type === 'sendKey' && (
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Keys (e.g. ctrl+c)</label>
          <input
            type="text"
            value={(params.keys as string) || ''}
            onChange={(e) => updateParam('keys', e.target.value)}
            placeholder="ctrl+c"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {action.type === 'sendText' && (
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Text</label>
          <input
            type="text"
            value={(params.text as string) || ''}
            onChange={(e) => updateParam('text', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {action.type === 'mouseClick' && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Button</label>
            <select
              value={(params.button as string) || 'left'}
              onChange={(e) => updateParam('button', e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="middle">Middle</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Clicks</label>
            <input
              type="number"
              min={1}
              max={5}
              value={(params.clicks as number) || 1}
              onChange={(e) => updateParam('clicks', parseInt(e.target.value) || 1)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {action.type === 'openUrl' && (
        <div>
          <label className="block text-xs text-zinc-400 mb-1">URL</label>
          <input
            type="url"
            value={(params.url as string) || ''}
            onChange={(e) => updateParam('url', e.target.value)}
            placeholder="https://..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {(action.type === 'openFile' || action.type === 'openFolder') && (
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Path</label>
          <input
            type="text"
            value={(params.path as string) || ''}
            onChange={(e) => updateParam('path', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {action.type === 'runCommand' && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Command</label>
            <input
              type="text"
              value={(params.command as string) || ''}
              onChange={(e) => updateParam('command', e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={(params.shell as boolean) || false}
              onChange={(e) => updateParam('shell', e.target.checked)}
              className="accent-blue-600"
            />
            Run in shell
          </label>
        </div>
      )}

      {action.type === 'runScript' && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Interpreter</label>
            <input
              type="text"
              value={(params.interpreter as string) || ''}
              onChange={(e) => updateParam('interpreter', e.target.value)}
              placeholder="python, node, bash..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Script Path</label>
            <input
              type="text"
              value={(params.scriptPath as string) || ''}
              onChange={(e) => updateParam('scriptPath', e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {action.type === 'clipboard' && (
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Operation</label>
          <select
            value={(params.action as string) || 'copy'}
            onChange={(e) => updateParam('action', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="copy">Copy</option>
            <option value="cut">Cut</option>
            <option value="paste">Paste</option>
          </select>
        </div>
      )}

      {action.type === 'mediaControl' && (
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Action</label>
          <select
            value={(params.action as string) || 'playPause'}
            onChange={(e) => updateParam('action', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="playPause">Play/Pause</option>
            <option value="next">Next Track</option>
            <option value="prev">Previous Track</option>
            <option value="volumeUp">Volume Up</option>
            <option value="volumeDown">Volume Down</option>
            <option value="mute">Mute</option>
          </select>
        </div>
      )}

      {action.type === 'submenu' && menuIds && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Target Menu</label>
            <select
              value={(params.menuId as string) || ''}
              onChange={(e) => updateParam('menuId', e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select a menu...</option>
              {menuIds.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
          {menuIds.length === 0 && (
            <p className="text-xs text-amber-400">
              No other menus available. Create another menu to use as a submenu target. The current menu is excluded to prevent circular references.
            </p>
          )}
          {(params.menuId as string) && !menuIds.includes(params.menuId as string) && (
            <p className="text-xs text-red-400">
              Warning: The selected menu ID is not in the available menus list. This may cause a circular reference or point to a deleted menu.
            </p>
          )}
        </div>
      )}
      {action.type === 'submenu' && !menuIds && (
        <p className="text-xs text-zinc-500">
          Submenu selection is not available in this context.
        </p>
      )}
    </div>
  );
};

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
    case 'clipboard': return { action: 'copy' };
    case 'mediaControl': return { action: 'playPause' };
    case 'submenu': return { menuId: '' };
    default: return {};
  }
}
