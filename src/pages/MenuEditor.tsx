import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useHistoryStore } from '../stores/historyStore';
import { MenuPreview } from '../components/Editor/MenuPreview';
import { SliceList } from '../components/Editor/SliceList';
import { SliceEditor } from '../components/Editor/SliceEditor';
import { AppearancePanel } from '../components/Editor/AppearancePanel';
import { useTranslation } from 'react-i18next';
import type { Slice } from '../types/settings';

export const MenuEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings, updateMenu, saveSettings, deleteMenu, loadSettings, setSettings } = useSettingsStore();
  const { pushSnapshot, undo, redo, canUndo, canRedo } = useHistoryStore();
  const { t } = useTranslation();
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'slices' | 'appearance'>('slices');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!settings) loadSettings();
  }, [settings, loadSettings]);

  const menu = settings?.menus.find((m) => m.id === id);

  // Auto-save with debounce
  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveSettings();
    }, 500);
  }, [saveSettings]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const restored = undo();
        if (restored) {
          setSettings(restored);
          saveSettings();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        const restored = redo();
        if (restored) {
          setSettings(restored);
          saveSettings();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setSettings, saveSettings]);

  if (!settings || !menu) return <div className="text-theme-text-secondary">Menu not found</div>;

  const selectedSlice = menu.slices.find((s) => s.id === selectedSliceId);
  const selectedIndex = menu.slices.findIndex((s) => s.id === selectedSliceId);
  const appearance = settings.global.appearance;
  const menuIds = settings.menus.filter((m) => m.id !== id).map((m) => m.id);

  const handleMenuNameChange = (name: string) => {
    pushSnapshot(settings);
    updateMenu(id!, { name });
    debouncedSave();
  };

  const handleSliceReorder = (slices: Slice[]) => {
    pushSnapshot(settings);
    updateMenu(id!, { slices });
    debouncedSave();
  };

  const handleAddSlice = () => {
    pushSnapshot(settings);
    const newSlice: Slice = {
      id: `s_${Date.now()}`,
      label: `Action ${menu.slices.length + 1}`,
      icon: '⚡',
      actions: [{ type: 'noop', params: {} }],
    };
    updateMenu(id!, { slices: [...menu.slices, newSlice] });
    setSelectedSliceId(newSlice.id);
    debouncedSave();
  };

  const handleDeleteSlice = (sliceId: string) => {
    pushSnapshot(settings);
    const newSlices = menu.slices.filter((s) => s.id !== sliceId);
    updateMenu(id!, { slices: newSlices });
    if (selectedSliceId === sliceId) setSelectedSliceId(null);
    debouncedSave();
  };

  const handleSliceChange = (updates: Partial<Slice>) => {
    if (!selectedSliceId) return;
    pushSnapshot(settings);
    const newSlices = menu.slices.map((s) =>
      s.id === selectedSliceId ? { ...s, ...updates } : s
    );
    updateMenu(id!, { slices: newSlices });
    debouncedSave();
  };

  const handleAppearanceChange = (updates: Partial<typeof appearance>) => {
    const { updateGlobalSettings } = useSettingsStore.getState();
    pushSnapshot(settings);
    updateGlobalSettings({ appearance: { ...appearance, ...updates } });
    debouncedSave();
  };

  const handleDeleteMenu = () => {
    if (confirm(t('editor.deleteConfirm'))) {
      deleteMenu(id!);
      saveSettings();
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-theme-text-secondary hover:text-theme-text-primary text-sm"
        >
          {t('editor.back')}
        </button>
        <input
          type="text"
          value={menu.name}
          onChange={(e) => handleMenuNameChange(e.target.value)}
          className="text-2xl font-bold bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
        />
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => { const s = undo(); if (s) { setSettings(s); saveSettings(); } }}
            disabled={!canUndo()}
            className="px-2 py-1 text-sm rounded bg-theme-bg-tertiary disabled:opacity-30 hover:bg-theme-bg-tertiary/80 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            onClick={() => { const s = redo(); if (s) { setSettings(s); saveSettings(); } }}
            disabled={!canRedo()}
            className="px-2 py-1 text-sm rounded bg-theme-bg-tertiary disabled:opacity-30 hover:bg-theme-bg-tertiary/80 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷
          </button>
        </div>
        <button
          onClick={handleDeleteMenu}
          className="ml-auto text-sm text-theme-text-muted hover:text-red-400 transition-colors"
        >
          {t('editor.deleteMenu')}
        </button>
      </div>

      {/* Main editor area */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Preview */}
        <div className="w-1/2 flex flex-col gap-4">
          <MenuPreview
            slices={menu.slices}
            selectedIndex={selectedIndex >= 0 ? selectedIndex : null}
            appearance={appearance}
          />
        </div>

        {/* Right: Editor panels */}
        <div className="w-1/2 flex flex-col gap-4 overflow-auto">
          {/* Tab bar */}
          <div className="flex gap-1 bg-theme-bg-secondary rounded-lg p-1">
            <button
              onClick={() => setActiveTab('slices')}
              className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${
                activeTab === 'slices' ? 'bg-theme-bg-tertiary text-theme-text-primary' : 'text-theme-text-secondary hover:text-theme-text-primary'
              }`}
            >
              {t('editor.slices')}
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${
                activeTab === 'appearance' ? 'bg-theme-bg-tertiary text-theme-text-primary' : 'text-theme-text-secondary hover:text-theme-text-primary'
              }`}
            >
              {t('editor.appearance')}
            </button>
          </div>

          {activeTab === 'slices' && (
            <div className="space-y-4">
              <SliceList
                slices={menu.slices}
                selectedId={selectedSliceId}
                onSelect={setSelectedSliceId}
                onReorder={handleSliceReorder}
                onAdd={handleAddSlice}
                onDelete={handleDeleteSlice}
              />
              {selectedSlice && (
                <div className="border-t border-theme-border pt-4">
                  <SliceEditor
                    slice={selectedSlice}
                    onChange={handleSliceChange}
                    menuIds={menuIds}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'appearance' && (
            <AppearancePanel
              appearance={appearance}
              onChange={handleAppearanceChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};
