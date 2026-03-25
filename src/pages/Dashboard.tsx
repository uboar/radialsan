import React, { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { convertAutoHotPieSettings } from '../utils/autohotpieImport';
import { exportMenu, exportBundle, parseRadialsanPackage, pickJsonFile } from '../utils/sharing';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PieMenu } from '../types/settings';

export const Dashboard: React.FC = () => {
  const { settings, loading, loadSettings, addMenu, addProfile, saveSettings } = useSettingsStore();
  const { t } = useTranslation();

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

  const handleExport = (menu: PieMenu, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    exportMenu(menu);
  };

  const handleImport = async () => {
    try {
      const text = await pickJsonFile();
      const data = JSON.parse(text);

      if (data.format === 'radialsan') {
        // Radialsan package format
        const pkg = parseRadialsanPackage(text);
        for (const menu of pkg.menus) {
          addMenu(menu);
        }
        if (pkg.profiles) {
          for (const profile of pkg.profiles) {
            addProfile(profile);
          }
        }
      } else if (data.name && Array.isArray(data.slices)) {
        // Legacy single menu format
        data.id = `menu_${Date.now()}`;
        data.slices = data.slices.map((s: any, i: number) => ({ ...s, id: `s_${Date.now()}_${i}` }));
        addMenu(data);
      } else {
        alert('Unrecognized file format');
        return;
      }

      saveSettings();
    } catch (err) {
      alert('Import failed: ' + String(err));
    }
  };

  const handleExportAll = () => {
    if (!settings) return;
    exportBundle(settings.menus, settings.profiles);
  };

  const handleAutoHotPieImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const ahpSettings = JSON.parse(text);

        // Detect AutoHotPie format (has appProfiles)
        if (!ahpSettings.appProfiles) {
          alert('This does not appear to be an AutoHotPie settings file');
          return;
        }

        const converted = convertAutoHotPieSettings(ahpSettings);
        const store = useSettingsStore.getState();

        // Merge imported data
        if (converted.menus) {
          for (const menu of converted.menus) {
            store.addMenu(menu);
          }
        }
        if (converted.profiles) {
          for (const profile of converted.profiles) {
            if (!profile.isDefault) {
              store.addProfile(profile);
            }
          }
        }

        store.saveSettings();
        alert(`Imported ${converted.menus?.length || 0} menus and ${converted.profiles?.length || 0} profiles`);
      } catch (err) {
        alert('Failed to import AutoHotPie settings: ' + String(err));
      }
    };
    input.click();
  };

  if (loading || !settings) return <div className="text-zinc-400">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t('dashboard.title')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoHotPieImport}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
          >
            {t('dashboard.importAutoHotPie')}
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
          >
            {t('dashboard.importMenu')}
          </button>
          <button
            onClick={handleExportAll}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
          >
            {t('dashboard.exportAll')}
          </button>
          <button
            onClick={handleNewMenu}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            {t('dashboard.newMenu')}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settings.menus.map((menu) => (
          <Link
            key={menu.id}
            to={`/menu/${menu.id}`}
            className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold">{menu.name}</h3>
              <button
                onClick={(e) => handleExport(menu, e)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors ml-2 shrink-0"
                title="Export menu as JSON"
              >
                {t('common.export')}
              </button>
            </div>
            <p className="text-sm text-zinc-400">{t('dashboard.slices', { count: menu.slices.length })}</p>
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
