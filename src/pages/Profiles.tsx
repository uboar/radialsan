import React, { useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { exportProfile, parseRadialsanPackage, pickJsonFile } from '../utils/sharing';
import { useTranslation } from 'react-i18next';
import type { Profile, MatchRule } from '../types/settings';

export const Profiles: React.FC = () => {
  const { settings, addMenu, addProfile, updateProfile, deleteProfile, saveSettings } = useSettingsStore();
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRules, setEditRules] = useState<MatchRule[]>([]);

  if (!settings) return <div className="text-zinc-400">{t('common.loading')}</div>;

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

  const handleExportProfile = (profile: Profile) => {
    exportProfile(profile, settings.menus);
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
  };

  const handleSaveEdit = (profileId: string) => {
    updateProfile(profileId, { name: editName, matchRules: editRules });
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t('profiles.title')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImportProfile}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
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
          <div key={profile.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            {editingId === profile.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Profile Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-zinc-400">Match Rules</label>
                    <button
                      onClick={handleAddRule}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      + Add Rule
                    </button>
                  </div>
                  {editRules.length === 0 && (
                    <p className="text-xs text-zinc-500">No rules — matches all applications</p>
                  )}
                  {editRules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <select
                        value={rule.field}
                        onChange={(e) => handleUpdateRule(i, { field: e.target.value as MatchRule['field'] })}
                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="processName">Process Name</option>
                        <option value="windowTitle">Window Title</option>
                      </select>
                      <select
                        value={rule.matchMode}
                        onChange={(e) => handleUpdateRule(i, { matchMode: e.target.value as MatchRule['matchMode'] })}
                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
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
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => handleRemoveRule(i)}
                        className="text-zinc-500 hover:text-red-400 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
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
                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-xs font-medium transition-colors"
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
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Export profile"
                    >
                      Export
                    </button>
                    <button
                      onClick={() => handleStartEdit(profile)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Edit
                    </button>
                    {!profile.isDefault && (
                      <button
                        onClick={() => handleDeleteProfile(profile.id)}
                        className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-zinc-400 mt-1">
                  {profile.matchRules.length === 0
                    ? t('profiles.matchesAll')
                    : profile.matchRules.map((r) => `${r.field} ${r.matchMode} "${r.value}"`).join(', ')}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  {t('profiles.hotkeyBindings', { count: profile.pieKeys.length })}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
