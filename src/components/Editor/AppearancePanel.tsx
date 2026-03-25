import React from 'react';

interface AppearanceConfig {
  innerRadius: number;
  outerRadius: number;
  deadZoneRadius: number;
  backgroundColor: string;
  sliceFillColor: string;
  sliceHoverColor: string;
  sliceBorderColor: string;
  sliceBorderWidth: number;
  labelFont: string;
  labelSize: number;
  labelColor: string;
  iconSize: number;
  opacity: number;
}

interface AppearancePanelProps {
  appearance: AppearanceConfig;
  onChange: (updates: Partial<AppearanceConfig>) => void;
}

export const AppearancePanel: React.FC<AppearancePanelProps> = ({ appearance, onChange }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-theme-text-secondary uppercase tracking-wide">Appearance</h3>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-theme-text-secondary mb-1">Inner Radius</label>
        <input
          type="range"
          min={10}
          max={100}
          value={appearance.innerRadius}
          onChange={(e) => onChange({ innerRadius: Number(e.target.value) })}
          className="w-full accent-blue-600"
        />
        <span className="text-xs text-theme-text-muted">{appearance.innerRadius}px</span>
      </div>
      <div>
        <label className="block text-xs text-theme-text-secondary mb-1">Outer Radius</label>
        <input
          type="range"
          min={60}
          max={300}
          value={appearance.outerRadius}
          onChange={(e) => onChange({ outerRadius: Number(e.target.value) })}
          className="w-full accent-blue-600"
        />
        <span className="text-xs text-theme-text-muted">{appearance.outerRadius}px</span>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-theme-text-secondary mb-1">Background</label>
        <input
          type="color"
          value={appearance.backgroundColor.substring(0, 7)}
          onChange={(e) => onChange({ backgroundColor: e.target.value + '80' })}
          className="w-full h-8 bg-theme-bg-tertiary border border-theme-border rounded cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-xs text-theme-text-secondary mb-1">Slice Fill</label>
        <input
          type="color"
          value={appearance.sliceFillColor.substring(0, 7)}
          onChange={(e) => onChange({ sliceFillColor: e.target.value + 'CC' })}
          className="w-full h-8 bg-theme-bg-tertiary border border-theme-border rounded cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-xs text-theme-text-secondary mb-1">Hover Color</label>
        <input
          type="color"
          value={appearance.sliceHoverColor.substring(0, 7)}
          onChange={(e) => onChange({ sliceHoverColor: e.target.value + '99' })}
          className="w-full h-8 bg-theme-bg-tertiary border border-theme-border rounded cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-xs text-theme-text-secondary mb-1">Border</label>
        <input
          type="color"
          value={appearance.sliceBorderColor.substring(0, 7)}
          onChange={(e) => onChange({ sliceBorderColor: e.target.value })}
          className="w-full h-8 bg-theme-bg-tertiary border border-theme-border rounded cursor-pointer"
        />
      </div>
    </div>

    <div>
      <label className="block text-xs text-theme-text-secondary mb-1">Opacity</label>
      <input
        type="range"
        min={0.1}
        max={1}
        step={0.05}
        value={appearance.opacity}
        onChange={(e) => onChange({ opacity: Number(e.target.value) })}
        className="w-full accent-blue-600"
      />
      <span className="text-xs text-theme-text-muted">{appearance.opacity}</span>
    </div>

    <div>
      <label className="block text-xs text-theme-text-secondary mb-1">Label Size</label>
      <input
        type="range"
        min={8}
        max={24}
        value={appearance.labelSize}
        onChange={(e) => onChange({ labelSize: Number(e.target.value) })}
        className="w-full accent-blue-600"
      />
      <span className="text-xs text-theme-text-muted">{appearance.labelSize}px</span>
    </div>
  </div>
);
