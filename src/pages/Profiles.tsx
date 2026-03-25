import React, { useState, useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { exportProfile, parseRadialsanPackage, pickJsonFile } from '../utils/sharing';
import { useTranslation } from 'react-i18next';
import type { Profile, MatchRule, PieKey } from '../types/settings';

const AVAILABLE_KEYS = [
  'A','B','C','D','E','F','G','H','I','J','K','L','M',
  'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
  '0','1','2','3','4','5','6','7','8','9',
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
  'Space','Tab','CapsLock','Escape','Return','Backspace','Delete',
  'Up','Down','Left','Right',
  'Mouse4','Mouse5',
];

const MODIFIER_NAMES = ['Ctrl', 'Shift', 'Alt', 'Meta'] as const;

/** Parse a hotkey string like "Ctrl+Shift+A" into { modifiers, key } */
function parseHotkeyString(hotkey: string): { modifiers: string[]; key: string } {
  const parts = hotkey.split('+');
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);
  return { modifiers, key };
}

/** Build a hotkey string from modifiers and key */
function buildHotkeyString(modifiers: string[], key: string): string {
  return [...modifiers, key].join('+');
}

interface HotkeyEditorRowProps {
  pieKey: PieKey;
  menus: { id: string; name: string }[];
  onUpdate: (id: string, updates: Partial<PieKey>) => void;
  onRemove: (id: string) => void;
  t: (key: string) => string;
}

const HotkeyEditorRow: React.FC<HotkeyEditorRowProps> = ({ pieKey, menus, onUpdate, onRemove, t }) => {
  const { modifiers, key } = parseHotkeyString(pieKey.hotkey);
  const [isRecording, setIsRecording] = useState(false);

  const handleModifierToggle = (mod: string) => {
    const newMods = modifiers.includes(mod)
      ? modifiers.filter(m => m !== mod)
      : [...modifiers, mod];
    // Keep modifier order consistent: Ctrl, Shift, Alt, Meta
    const sorted = MODIFIER_NAMES.filter(m => newMods.includes(m)) as unknown as string[];
    onUpdate(pieKey.id, { hotkey: buildHotkeyString(sorted, key) });
  };

  const handleKeyChange = (newKey: string) => {
    onUpdate(pieKey.id, { hotkey: buildHotkeyString(modifiers, newKey) });
  };

  const handleMenuChange = (menuId: string) => {
    onUpdate(pieKey.id, { menuId });
  };

  const handleRecordKey = useCallback(async () => {
    setIsRecording(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { listen } = await import('@tauri-apps/api/event');

      // Listen for the detected key event
      const unlisten = await listen<{ hotkey: string | null; timeout?: boolean }>('radialsan://key-detected', (event) => {
        setIsRecording(false);
        if (event.payload.hotkey) {
          onUpdate(pieKey.id, { hotkey: event.payload.hotkey });
        }
        unlisten();
      });

      // Start detection on the Rust side
      await invoke('start_key_detection');
    } catch (err) {
      console.error('Failed to start key detection:', err);
      setIsRecording(false);
    }
  }, [pieKey.id, onUpdate]);

  return (
    <div className="flex flex-col gap-2 p-3 bg-theme-bg-tertiary rounded-lg border border-theme-border">
      <div className="flex items-center gap-2">
        {/* Modifier checkboxes */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-theme-text-secondary mr-1">{t('profiles.hotkeyModifiers')}:</span>
          {MODIFIER_NAMES.map(mod => (
            <label key={mod} className="flex items-center gap-1 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={modifiers.includes(mod)}
                onChange={() => handleModifierToggle(mod)}
                className="rounded border-theme-border bg-theme-bg-tertiary text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span className="text-theme-text-primary">{mod}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Key dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-theme-text-secondary">{t('profiles.hotkeyKey')}:</span>
          <select
            value={key}
            onChange={(e) => handleKeyChange(e.target.value)}
            className="bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-theme-text-primary"
          >
            <option value="" disabled>{t('profiles.selectKey')}</option>
            {AVAILABLE_KEYS.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        {/* Record key button */}
        <button
          onClick={handleRecordKey}
          disabled={isRecording}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            isRecording
              ? 'bg-red-600/20 text-red-400 border border-red-600/50 animate-pulse'
              : 'bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 text-theme-text-primary border border-theme-border'
          }`}
        >
          {isRecording ? t('profiles.recording') : t('profiles.recordKey')}
        </button>

        {/* Resulting hotkey display */}
        <span className="px-2 py-1 bg-theme-bg-secondary border border-theme-border rounded text-xs text-theme-text-primary font-mono">
          {pieKey.hotkey}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Menu selector */}
        <div className="flex items-center gap-1.5 flex-1">
          <span className="text-xs text-theme-text-secondary">{t('profiles.hotkeyMenu')}:</span>
          <select
            value={pieKey.menuId}
            onChange={(e) => handleMenuChange(e.target.value)}
            className="flex-1 bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-theme-text-primary"
          >
            <option value="" disabled>{t('profiles.selectMenu')}</option>
            {menus.map(menu => (
              <option key={menu.id} value={menu.id}>{menu.name}</option>
            ))}
          </select>
        </div>

        {/* Remove button */}
        <button
          onClick={() => onRemove(pieKey.id)}
          className="text-xs text-theme-text-muted hover:text-red-400 transition-colors"
        >
          {t('profiles.removeHotkey')}
        </button>
      </div>
    </div>
  );
};

export const Profiles: React.FC = () => {
  const { settings, addMenu, addProfile, updateProfile, deleteProfile, saveSettings } = useSettingsStore();
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRules, setEditRules] = useState<MatchRule[]>([]);
  const [editPieKeys, setEditPieKeys] = useState<PieKey[]>([]);

  if (!settings) return <div className="text-theme-text-secondary">{t('common.loading')}</div>;

  const handleNewProfile = () => {
    const id = `profile_${Date.now()}`;
    addProfile({
      id,
      name: 'New Profile',
      isDefault: false,
      matchRules: [],
      pieKeys: [],
    });
    saveSettings();
  };

  const handleExportProfile = async (profile: Profile) => {
    try {
      await exportProfile(profile, settings.menus);
    } catch (err) {
      alert('Export failed: ' + String(err));
    }
  };

  const handleImportProfile = async () => {
    try {
      const text = await pickJsonFile();
      const pkg = parseRadialsanPackage(text);

      for (const menu of pkg.menus) {
        addMenu(menu);
      }
      if (pkg.profiles) {
        for (const profile of pkg.profiles) {
          addProfile(profile);
        }
      }

      saveSettings();
      alert(`Imported ${pkg.profiles?.length || 0} profile(s) and ${pkg.menus.length} menu(s)`);
    } catch (err) {
      alert('Import failed: ' + String(err));
    }
  };

  const handleStartEdit = (profile: Profile) => {
    setEditingId(profile.id);
    setEditName(profile.name);
    setEditRules(profile.matchRules);
    setEditPieKeys([...profile.pieKeys]);
  };

  const handleSaveEdit = (profileId: string) => {
    updateProfile(profileId, { name: editName, matchRules: editRules, pieKeys: editPieKeys });
    saveSettings();
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (!confirm('Delete this profile?')) return;
    deleteProfile(profileId);
    saveSettings();
  };

  const handleAddRule = () => {
    setEditRules(prev => [...prev, { field: 'processName', matchMode: 'contains', value: '' }]);
  };

  const handleUpdateRule = (index: number, updates: Partial<MatchRule>) => {
    setEditRules(prev => prev.map((r, i) => i === index ? { ...r, ...updates } : r));
  };

  const handleRemoveRule = (index: number) => {
    setEditRules(prev => prev.filter((_, i) => i !== index));
  };

  // PieKey handlers
  const handleAddPieKey = () => {
    const firstMenuId = settings.menus.length > 0 ? settings.menus[0].id : '';
    setEditPieKeys(prev => [...prev, {
      id: `pk_${Date.now()}`,
      hotkey: 'CapsLock',
      menuId: firstMenuId,
    }]);
  };

  const handleUpdatePieKey = useCallback((pieKeyId: string, updates: Partial<PieKey>) => {
    setEditPieKeys(prev => prev.map(pk =>
      pk.id === pieKeyId ? { ...pk, ...updates } : pk
    ));
  }, []);

  const handleRemovePieKey = (pieKeyId: string) => {
    setEditPieKeys(prev => prev.filter(pk => pk.id !== pieKeyId));
  };

  const menuOptions = settings.menus.map(m => ({ id: m.id, name: m.name }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t('profiles.title')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImportProfile}
            className="px-4 py-2 bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 rounded-lg text-sm font-medium transition-colors"
          >
            {t('profiles.importProfile')}
          </button>
          <button
            onClick={handleNewProfile}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            {t('profiles.newProfile')}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {settings.profiles.map((profile) => (
          <div key={profile.id} className="p-4 bg-theme-bg-secondary border border-theme-border rounded-xl">
            {editingId === profile.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-theme-text-secondary mb-1">Profile Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-theme-bg-tertiary border border-theme-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-theme-text-secondary">Match Rules</label>
                    <button
                      onClick={handleAddRule}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      + Add Rule
                    </button>
                  </div>
                  {editRules.length === 0 && (
                    <p className="text-xs text-theme-text-muted">No rules — matches all applications</p>
                  )}
                  {editRules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <select
                        value={rule.field}
                        onChange={(e) => handleUpdateRule(i, { field: e.target.value as MatchRule['field'] })}
                        className="bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="processName">Process Name</option>
                        <option value="windowTitle">Window Title</option>
                      </select>
                      <select
                        value={rule.matchMode}
                        onChange={(e) => handleUpdateRule(i, { matchMode: e.target.value as MatchRule['matchMode'] })}
                        className="bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="contains">contains</option>
                        <option value="exact">exact</option>
                        <option value="regex">regex</option>
                      </select>
                      <input
                        type="text"
                        value={rule.value}
                        onChange={(e) => handleUpdateRule(i, { value: e.target.value })}
                        placeholder="value"
                        className="flex-1 bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => handleRemoveRule(i)}
                        className="text-theme-text-muted hover:text-red-400 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Hotkey Bindings Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-theme-text-secondary">{t('profiles.hotkeys')}</label>
                    <button
                      onClick={handleAddPieKey}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      {t('profiles.addHotkey')}
                    </button>
                  </div>
                  {editPieKeys.length === 0 && (
                    <p className="text-xs text-theme-text-muted">{t('profiles.hotkeyBindings', { count: 0 })}</p>
                  )}
                  <div className="space-y-2">
                    {editPieKeys.map(pk => (
                      <HotkeyEditorRow
                        key={pk.id}
                        pieKey={pk}
                        menus={menuOptions}
                        onUpdate={handleUpdatePieKey}
                        onRemove={handleRemovePieKey}
                        t={t}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(profile.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 rounded text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{profile.name}</h3>
                    {profile.isDefault && (
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">{t('profiles.default')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportProfile(profile)}
                      className="text-xs text-theme-text-muted hover:text-theme-text-primary transition-colors"
                      title="Export profile"
                    >
                      Export
                    </button>
                    <button
                      onClick={() => handleStartEdit(profile)}
                      className="text-xs text-theme-text-muted hover:text-theme-text-primary transition-colors"
                    >
                      Edit
                    </button>
                    {!profile.isDefault && (
                      <button
                        onClick={() => handleDeleteProfile(profile.id)}
                        className="text-xs text-theme-text-muted hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-theme-text-secondary mt-1">
                  {profile.matchRules.length === 0
                    ? t('profiles.matchesAll')
                    : profile.matchRules.map((r) => `${r.field} ${r.matchMode} "${r.value}"`).join(', ')}
                </p>
                {/* Show hotkey bindings summary */}
                <div className="mt-2">
                  {profile.pieKeys.length === 0 ? (
                    <p className="text-sm text-theme-text-muted">
                      {t('profiles.hotkeyBindings', { count: 0 })}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.pieKeys.map(pk => {
                        const menuName = settings.menus.find(m => m.id === pk.menuId)?.name ?? pk.menuId;
                        return (
                          <span
                            key={pk.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-theme-bg-tertiary border border-theme-border rounded text-xs"
                          >
                            <span className="font-mono text-blue-400">{pk.hotkey}</span>
                            <span className="text-theme-text-muted">→</span>
                            <span className="text-theme-text-primary">{menuName}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
