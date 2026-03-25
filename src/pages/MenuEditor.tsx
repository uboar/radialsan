import React from 'react';
import { useParams } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';

export const MenuEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { settings } = useSettingsStore();
  const menu = settings?.menus.find((m) => m.id === id);

  if (!menu) return <div className="text-zinc-400">Menu not found</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{menu.name}</h2>
      <p className="text-zinc-400">Editor will be implemented in Step 9</p>
      <div className="mt-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
        <h3 className="font-semibold mb-2">Slices</h3>
        {menu.slices.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 py-1 text-sm">
            <span className="text-zinc-500">{i + 1}.</span>
            <span>{s.icon}</span>
            <span>{s.label}</span>
            <span className="text-zinc-500 ml-auto">{s.actions[0]?.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
