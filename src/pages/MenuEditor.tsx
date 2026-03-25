import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { MenuPreview } from '../components/Editor/MenuPreview';
import { SliceList } from '../components/Editor/SliceList';
import { SliceEditor } from '../components/Editor/SliceEditor';
import { AppearancePanel } from '../components/Editor/AppearancePanel';
import type { Slice } from '../types/settings';

export const MenuEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings, updateMenu, saveSettings, deleteMenu, loadSettings } = useSettingsStore();
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

  if (!settings || !menu) return <div className="text-zinc-400">Menu not found</div>;

  const selectedSlice = menu.slices.find((s) => s.id === selectedSliceId);
  const selectedIndex = menu.slices.findIndex((s) => s.id === selectedSliceId);
  const appearance = settings.global.appearance;
  const menuIds = settings.menus.filter((m) => m.id !== id).map((m) => m.id);

  const handleMenuNameChange = (name: string) => {
    updateMenu(id!, { name });
    debouncedSave();
  };

  const handleSliceReorder = (slices: Slice[]) => {
    updateMenu(id!, { slices });
    debouncedSave();
  };

  const handleAddSlice = () => {
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
    const newSlices = menu.slices.filter((s) => s.id !== sliceId);
    updateMenu(id!, { slices: newSlices });
    if (selectedSliceId === sliceId) setSelectedSliceId(null);
    debouncedSave();
  };

  const handleSliceChange = (updates: Partial<Slice>) => {
    if (!selectedSliceId) return;
    const newSlices = menu.slices.map((s) =>
      s.id === selectedSliceId ? { ...s, ...updates } : s
    );
    updateMenu(id!, { slices: newSlices });
    debouncedSave();
  };

  const handleAppearanceChange = (updates: Partial<typeof appearance>) => {
    const { updateGlobalSettings } = useSettingsStore.getState();
    updateGlobalSettings({ appearance: { ...appearance, ...updates } });
    debouncedSave();
  };

  const handleDeleteMenu = () => {
    if (confirm('Delete this menu?')) {
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
          className="text-zinc-400 hover:text-white text-sm"
        >
          &larr; Back
        </button>
        <input
          type="text"
          value={menu.name}
          onChange={(e) => handleMenuNameChange(e.target.value)}
          className="text-2xl font-bold bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
        />
        <button
          onClick={handleDeleteMenu}
          className="ml-auto text-sm text-zinc-500 hover:text-red-400 transition-colors"
        >
          Delete Menu
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
          <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('slices')}
              className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${
                activeTab === 'slices' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Slices
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${
                activeTab === 'appearance' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Appearance
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
                <div className="border-t border-zinc-800 pt-4">
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
