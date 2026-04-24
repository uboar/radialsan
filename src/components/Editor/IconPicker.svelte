<script lang="ts">
  import ArrowDown from 'lucide-svelte/icons/arrow-down';
  import ArrowLeft from 'lucide-svelte/icons/arrow-left';
  import ArrowRight from 'lucide-svelte/icons/arrow-right';
  import ArrowUp from 'lucide-svelte/icons/arrow-up';
  import Battery from 'lucide-svelte/icons/battery';
  import Bluetooth from 'lucide-svelte/icons/bluetooth';
  import Bold from 'lucide-svelte/icons/bold';
  import Bookmark from 'lucide-svelte/icons/bookmark';
  import Brush from 'lucide-svelte/icons/brush';
  import Camera from 'lucide-svelte/icons/camera';
  import Check from 'lucide-svelte/icons/check';
  import ChevronDown from 'lucide-svelte/icons/chevron-down';
  import ChevronLeft from 'lucide-svelte/icons/chevron-left';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';
  import ChevronUp from 'lucide-svelte/icons/chevron-up';
  import Clipboard from 'lucide-svelte/icons/clipboard';
  import ClipboardPaste from 'lucide-svelte/icons/clipboard-paste';
  import Cloud from 'lucide-svelte/icons/cloud';
  import Code from 'lucide-svelte/icons/code';
  import Copy from 'lucide-svelte/icons/copy';
  import Crop from 'lucide-svelte/icons/crop';
  import Database from 'lucide-svelte/icons/database';
  import Download from 'lucide-svelte/icons/download';
  import Eraser from 'lucide-svelte/icons/eraser';
  import ExternalLink from 'lucide-svelte/icons/external-link';
  import Eye from 'lucide-svelte/icons/eye';
  import EyeOff from 'lucide-svelte/icons/eye-off';
  import File from 'lucide-svelte/icons/file';
  import FileText from 'lucide-svelte/icons/file-text';
  import Film from 'lucide-svelte/icons/film';
  import Flag from 'lucide-svelte/icons/flag';
  import FolderOpen from 'lucide-svelte/icons/folder-open';
  import Globe from 'lucide-svelte/icons/globe';
  import Heart from 'lucide-svelte/icons/heart';
  import Image from 'lucide-svelte/icons/image';
  import Italic from 'lucide-svelte/icons/italic';
  import Key from 'lucide-svelte/icons/key';
  import Keyboard from 'lucide-svelte/icons/keyboard';
  import Layers from 'lucide-svelte/icons/layers';
  import Link from 'lucide-svelte/icons/link';
  import Lock from 'lucide-svelte/icons/lock';
  import Mail from 'lucide-svelte/icons/mail';
  import Maximize2 from 'lucide-svelte/icons/maximize-2';
  import Minimize2 from 'lucide-svelte/icons/minimize-2';
  import Minus from 'lucide-svelte/icons/minus';
  import Monitor from 'lucide-svelte/icons/monitor';
  import Moon from 'lucide-svelte/icons/moon';
  import Mouse from 'lucide-svelte/icons/mouse';
  import Move from 'lucide-svelte/icons/move';
  import Music from 'lucide-svelte/icons/music';
  import Palette from 'lucide-svelte/icons/palette';
  import Pause from 'lucide-svelte/icons/pause';
  import PenTool from 'lucide-svelte/icons/pen-tool';
  import Pipette from 'lucide-svelte/icons/pipette';
  import Play from 'lucide-svelte/icons/play';
  import Plus from 'lucide-svelte/icons/plus';
  import Power from 'lucide-svelte/icons/power';
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';
  import Redo2 from 'lucide-svelte/icons/redo-2';
  import RotateCcw from 'lucide-svelte/icons/rotate-ccw';
  import RotateCw from 'lucide-svelte/icons/rotate-cw';
  import Save from 'lucide-svelte/icons/save';
  import Scissors from 'lucide-svelte/icons/scissors';
  import Search from 'lucide-svelte/icons/search';
  import Send from 'lucide-svelte/icons/send';
  import Server from 'lucide-svelte/icons/server';
  import Settings from 'lucide-svelte/icons/settings';
  import SkipBack from 'lucide-svelte/icons/skip-back';
  import SkipForward from 'lucide-svelte/icons/skip-forward';
  import Smartphone from 'lucide-svelte/icons/smartphone';
  import Star from 'lucide-svelte/icons/star';
  import Sun from 'lucide-svelte/icons/sun';
  import Tablet from 'lucide-svelte/icons/tablet';
  import Terminal from 'lucide-svelte/icons/terminal';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import Type from 'lucide-svelte/icons/type';
  import Underline from 'lucide-svelte/icons/underline';
  import Undo2 from 'lucide-svelte/icons/undo-2';
  import Upload from 'lucide-svelte/icons/upload';
  import Volume2 from 'lucide-svelte/icons/volume-2';
  import VolumeX from 'lucide-svelte/icons/volume-x';
  import Wifi from 'lucide-svelte/icons/wifi';
  import Wrench from 'lucide-svelte/icons/wrench';
  import X from 'lucide-svelte/icons/x';
  import Zap from 'lucide-svelte/icons/zap';
  import ZoomIn from 'lucide-svelte/icons/zoom-in';
  import ZoomOut from 'lucide-svelte/icons/zoom-out';
  import type { ComponentType } from 'svelte';

  export let value: string;
  export let onChange: (icon: string) => void;

  const ICON_NAMES = [
    'Copy', 'Clipboard', 'ClipboardPaste', 'Scissors', 'Undo2', 'Redo2',
    'Save', 'FolderOpen', 'File', 'FileText', 'Download', 'Upload',
    'Search', 'ZoomIn', 'ZoomOut', 'Settings', 'Wrench', 'Terminal',
    'Globe', 'Link', 'ExternalLink', 'Mail', 'Send',
    'Play', 'Pause', 'SkipForward', 'SkipBack', 'Volume2', 'VolumeX',
    'Monitor', 'Smartphone', 'Tablet', 'Keyboard', 'Mouse',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'ChevronUp', 'ChevronDown', 'ChevronLeft', 'ChevronRight',
    'Plus', 'Minus', 'X', 'Check', 'RefreshCw',
    'Eye', 'EyeOff', 'Lock', 'Key',
    'Star', 'Heart', 'Bookmark', 'Flag',
    'Trash2', 'Type', 'Bold', 'Italic', 'Underline',
    'Image', 'Camera', 'Film', 'Music',
    'Sun', 'Moon', 'Cloud', 'Zap',
    'Layers', 'Maximize2', 'Minimize2',
    'Move', 'RotateCcw', 'RotateCw', 'Crop', 'Pipette',
    'Palette', 'PenTool', 'Brush', 'Eraser',
    'Code', 'Database', 'Server',
    'Wifi', 'Bluetooth', 'Battery', 'Power',
  ];

  const EMOJI_PRESETS = [
    '📋', '📌', '✂️', '↩️', '↪️', '💾', '📁', '📄', '🔍', '⚡',
    '🔗', '🌐', '✉️', '▶️', '⏸️', '⏭️', '🔊', '🔇',
    '⬆️', '⬇️', '⬅️', '➡️', '✅', '❌', '⭐', '❤️',
    '🗑️', '✏️', '🎨', '🖌️', '💡', '🔒', '🔓', '🏠',
    '⚙️', '🔧', '📷', '🎵', '☀️', '🌙', '🔥', '💻',
  ];

  let isOpen = false;
  let search = '';
  let mode: 'lucide' | 'emoji' = 'emoji';

  $: filteredIcons = ICON_NAMES.filter((name) => name.toLowerCase().includes(search.toLowerCase()));
  $: filteredEmojis = EMOJI_PRESETS;

  const ICON_COMPONENTS: Record<string, ComponentType> = {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    Battery,
    Bluetooth,
    Bold,
    Bookmark,
    Brush,
    Camera,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Clipboard,
    ClipboardPaste,
    Cloud,
    Code,
    Copy,
    Crop,
    Database,
    Download,
    Eraser,
    ExternalLink,
    Eye,
    EyeOff,
    File,
    FileText,
    Film,
    Flag,
    FolderOpen,
    Globe,
    Heart,
    Image,
    Italic,
    Key,
    Keyboard,
    Layers,
    Link,
    Lock,
    Mail,
    Maximize2,
    Minimize2,
    Minus,
    Monitor,
    Moon,
    Mouse,
    Move,
    Music,
    Palette,
    Pause,
    PenTool,
    Pipette,
    Play,
    Plus,
    Power,
    RefreshCw,
    Redo2,
    RotateCcw,
    RotateCw,
    Save,
    Scissors,
    Search,
    Send,
    Server,
    Settings,
    SkipBack,
    SkipForward,
    Smartphone,
    Star,
    Sun,
    Tablet,
    Terminal,
    Trash2,
    Type,
    Underline,
    Undo2,
    Upload,
    Volume2,
    VolumeX,
    Wifi,
    Wrench,
    X,
    Zap,
    ZoomIn,
    ZoomOut,
  };

  function getLucideIcon(name: string): ComponentType | null {
    return ICON_COMPONENTS[name] ?? null;
  }

  function selectIcon(icon: string) {
    onChange(icon);
    isOpen = false;
  }
</script>

<div class="relative">
  <div class="flex gap-2">
    <button
      type="button"
      on:click={() => {
        isOpen = !isOpen;
      }}
      class="flex items-center gap-2 px-3 py-2 bg-theme-bg-tertiary border border-theme-border rounded-lg text-sm hover:bg-theme-bg-tertiary/80 transition-colors"
    >
      <span class="text-lg">{value || '⚡'}</span>
      <span class="text-theme-text-secondary">Change Icon</span>
    </button>
    <input
      type="text"
      value={value}
      on:input={(event) => onChange(event.currentTarget.value)}
      placeholder="Type emoji or icon name"
      class="flex-1 bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
    />
  </div>

  {#if isOpen}
    <div class="absolute z-50 top-full left-0 mt-1 w-80 bg-theme-bg-secondary border border-theme-border rounded-xl shadow-xl p-3">
      <input
        type="text"
        bind:value={search}
        placeholder="Search icons..."
        class="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:border-blue-500"
      />

      <div class="flex gap-1 mb-2">
        <button
          type="button"
          on:click={() => {
            mode = 'emoji';
          }}
          class="flex-1 text-xs py-1 rounded {mode === 'emoji' ? 'bg-theme-bg-tertiary text-theme-text-primary' : 'text-theme-text-secondary'}"
        >
          Emoji
        </button>
        <button
          type="button"
          on:click={() => {
            mode = 'lucide';
          }}
          class="flex-1 text-xs py-1 rounded {mode === 'lucide' ? 'bg-theme-bg-tertiary text-theme-text-primary' : 'text-theme-text-secondary'}"
        >
          Lucide Icons
        </button>
      </div>

      <div class="grid grid-cols-8 gap-1 max-h-48 overflow-auto">
        {#if mode === 'emoji'}
          {#each filteredEmojis as emoji, index (index)}
            <button
              type="button"
              on:click={() => selectIcon(emoji)}
              class="w-8 h-8 flex items-center justify-center rounded hover:bg-theme-bg-tertiary/80 text-lg"
              title={emoji}
            >
              {emoji}
            </button>
          {/each}
        {:else}
          {#each filteredIcons as name (name)}
            {@const Icon = getLucideIcon(name)}
            <button
              type="button"
              on:click={() => selectIcon(`lucide:${name}`)}
              class="w-8 h-8 flex items-center justify-center rounded hover:bg-theme-bg-tertiary/80 text-theme-text-primary"
              title={name}
            >
              {#if Icon}
                <svelte:component this={Icon} size={20} />
              {/if}
            </button>
          {/each}
        {/if}
      </div>

      <button
        type="button"
        on:click={() => {
          isOpen = false;
        }}
        class="mt-2 w-full text-xs text-theme-text-muted hover:text-theme-text-primary py-1"
      >
        Close
      </button>
    </div>
  {/if}
</div>
