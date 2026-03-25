import React, { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { settings, loading, loadSettings, addMenu, saveSettings } = useSettingsStore();

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleNewMenu = () => {
    const id = `menu_${Date.now()}`;
    addMenu({
      id,
      name: 'New Menu',
      appearanceOverrides: null,
      slices: [
        { id: `s_${Date.now()}_1`, label: 'Action 1', icon: '⚡', actions: [{ type: 'noop', params: {} }] },
      ],
    });
    saveSettings();
  };

  if (loading || !settings) return <div className="text-zinc-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Menus</h2>
        <button
          onClick={handleNewMenu}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          + New Menu
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settings.menus.map((menu) => (
          <Link
            key={menu.id}
            to={`/menu/${menu.id}`}
            className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
          >
            <h3 className="font-semibold mb-1">{menu.name}</h3>
            <p className="text-sm text-zinc-400">{menu.slices.length} slices</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {menu.slices.slice(0, 6).map((s) => (
                <span key={s.id} className="text-xs bg-zinc-800 px-2 py-0.5 rounded">
                  {s.icon} {s.label}
                </span>
              ))}
              {menu.slices.length > 6 && (
                <span className="text-xs text-zinc-500">+{menu.slices.length - 6} more</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
