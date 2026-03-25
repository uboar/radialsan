import React from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export const Profiles: React.FC = () => {
  const { settings } = useSettingsStore();
  if (!settings) return <div className="text-zinc-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Profiles</h2>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          + New Profile
        </button>
      </div>
      <div className="space-y-3">
        {settings.profiles.map((profile) => (
          <div key={profile.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{profile.name}</h3>
              {profile.isDefault && (
                <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">Default</span>
              )}
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              {profile.matchRules.length === 0
                ? 'Matches all applications'
                : profile.matchRules.map((r) => `${r.field} ${r.matchMode} "${r.value}"`).join(', ')}
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              {profile.pieKeys.length} hotkey binding{profile.pieKeys.length !== 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
