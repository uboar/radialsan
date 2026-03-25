import React from 'react';
import { ActionEditor } from './ActionEditor';
import { IconPicker } from './IconPicker';
import type { Slice, Action } from '../../types/settings';

interface SliceEditorProps {
  slice: Slice;
  onChange: (updates: Partial<Slice>) => void;
  menuIds: string[];
}

export const SliceEditor: React.FC<SliceEditorProps> = ({ slice, onChange, menuIds }) => {
  const handleActionChange = (index: number, action: Action) => {
    const newActions = [...slice.actions];
    newActions[index] = action;
    onChange({ actions: newActions });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-theme-text-secondary uppercase tracking-wide">Slice Properties</h3>

      <div>
        <label className="block text-xs text-theme-text-secondary mb-1">Label</label>
        <input
          type="text"
          value={slice.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs text-theme-text-secondary mb-1">Icon (emoji or text)</label>
        <IconPicker value={slice.icon} onChange={(icon) => onChange({ icon })} />
      </div>

      <div className="border-t border-theme-border pt-4">
        <h4 className="text-xs text-theme-text-secondary mb-2 uppercase tracking-wide">Action</h4>
        {slice.actions.map((action, i) => (
          <ActionEditor
            key={i}
            action={action}
            onChange={(a) => handleActionChange(i, a)}
            menuIds={menuIds}
          />
        ))}
      </div>
    </div>
  );
};
