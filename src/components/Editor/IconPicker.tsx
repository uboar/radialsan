import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';

// Get a curated subset of common icon names for the picker
const ICON_NAMES: string[] = [
  'Copy', 'Clipboard', 'ClipboardPaste', 'Scissors', 'Undo2', 'Redo2',
  'Save', 'FolderOpen', 'File', 'FileText', 'Download', 'Upload',
  'Search', 'ZoomIn', 'ZoomOut', 'Settings', 'Wrench', 'Terminal',
  'Globe', 'Link', 'ExternalLink', 'Mail', 'Send',
  'Play', 'Pause', 'SkipForward', 'SkipBack', 'Volume2', 'VolumeX',
  'Monitor', 'Smartphone', 'Tablet', 'Keyboard', 'Mouse',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ChevronUp', 'ChevronDown', 'ChevronLeft', 'ChevronRight',
  'Plus', 'Minus', 'X', 'Check', 'RefreshCw',
  'Eye', 'EyeOff', 'Lock', 'Unlock', 'Key',
  'Home', 'Star', 'Heart', 'Bookmark', 'Flag',
  'Trash2', 'Edit3', 'Type', 'Bold', 'Italic', 'Underline',
  'AlignLeft', 'AlignCenter', 'AlignRight',
  'Image', 'Camera', 'Film', 'Music',
  'Sun', 'Moon', 'Cloud', 'Zap',
  'Layers', 'Grid', 'Layout', 'Maximize2', 'Minimize2',
  'Move', 'RotateCcw', 'RotateCw', 'Crop', 'Pipette',
  'Palette', 'PenTool', 'Brush', 'Eraser',
  'Code', 'Database', 'Server',
  'Wifi', 'Bluetooth', 'Battery', 'Power',
];

// Common emoji categories for quick selection
const EMOJI_PRESETS = [
  '📋', '📌', '✂️', '↩️', '↪️', '💾', '📁', '📄', '🔍', '⚡',
  '🔗', '🌐', '✉️', '▶️', '⏸️', '⏭️', '🔊', '🔇',
  '⬆️', '⬇️', '⬅️', '➡️', '✅', '❌', '⭐', '❤️',
  '🗑️', '✏️', '🎨', '🖌️', '💡', '🔒', '🔓', '🏠',
  '⚙️', '🔧', '📷', '🎵', '☀️', '🌙', '🔥', '💻',
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'lucide' | 'emoji'>('emoji');

  const filteredIcons = useMemo(() => {
    const q = search.toLowerCase();
    return ICON_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [search]);

  const filteredEmojis = useMemo(() => {
    if (!search) return EMOJI_PRESETS;
    return EMOJI_PRESETS; // Emoji search is limited, show all
  }, [search]);

  const renderLucideIcon = (name: string) => {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name];
    if (!Icon) return null;
    return <Icon size={20} />;
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-theme-bg-tertiary border border-theme-border rounded-lg text-sm hover:bg-theme-bg-tertiary/80 transition-colors"
        >
          <span className="text-lg">{value || '⚡'}</span>
          <span className="text-theme-text-secondary">Change Icon</span>
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type emoji or icon name"
          className="flex-1 bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-80 bg-theme-bg-secondary border border-theme-border rounded-xl shadow-xl p-3">
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search icons..."
            className="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:border-blue-500"
            autoFocus
          />

          {/* Mode tabs */}
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => setMode('emoji')}
              className={`flex-1 text-xs py-1 rounded ${mode === 'emoji' ? 'bg-theme-bg-tertiary text-theme-text-primary' : 'text-theme-text-secondary'}`}
            >
              Emoji
            </button>
            <button
              onClick={() => setMode('lucide')}
              className={`flex-1 text-xs py-1 rounded ${mode === 'lucide' ? 'bg-theme-bg-tertiary text-theme-text-primary' : 'text-theme-text-secondary'}`}
            >
              Lucide Icons
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-auto">
            {mode === 'emoji' &&
              filteredEmojis.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => { onChange(emoji); setIsOpen(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-theme-bg-tertiary/80 text-lg"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            {mode === 'lucide' &&
              filteredIcons.map((name) => (
                <button
                  key={name}
                  onClick={() => { onChange(`lucide:${name}`); setIsOpen(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-theme-bg-tertiary/80 text-theme-text-primary"
                  title={name}
                >
                  {renderLucideIcon(name)}
                </button>
              ))}
          </div>

          {/* Close */}
          <button
            onClick={() => setIsOpen(false)}
            className="mt-2 w-full text-xs text-theme-text-muted hover:text-theme-text-primary py-1"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
