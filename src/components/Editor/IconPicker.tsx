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
          className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
        >
          <span className="text-lg">{value || '⚡'}</span>
          <span className="text-zinc-400">Change Icon</span>
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type emoji or icon name"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl p-3">
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search icons..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:border-blue-500"
            autoFocus
          />

          {/* Mode tabs */}
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => setMode('emoji')}
              className={`flex-1 text-xs py-1 rounded ${mode === 'emoji' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
            >
              Emoji
            </button>
            <button
              onClick={() => setMode('lucide')}
              className={`flex-1 text-xs py-1 rounded ${mode === 'lucide' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
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
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-700 text-lg"
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
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-700 text-white"
                  title={name}
                >
                  {renderLucideIcon(name)}
                </button>
              ))}
          </div>

          {/* Close */}
          <button
            onClick={() => setIsOpen(false)}
            className="mt-2 w-full text-xs text-zinc-500 hover:text-zinc-300 py-1"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
