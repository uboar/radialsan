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
  import { getLucideIconName } from '../../utils/lucideIconRegistry';

  export let icon: string;
  export let size = 20;
  export let className = '';

  const ICON_COMPONENTS: Record<string, ComponentType> = {
    ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Battery, Bluetooth, Bold, Bookmark, Brush, Camera, Check,
    ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clipboard, ClipboardPaste, Cloud, Code, Copy, Crop,
    Database, Download, Eraser, ExternalLink, Eye, EyeOff, File, FileText, Film, Flag, FolderOpen, Globe,
    Heart, Image, Italic, Key, Keyboard, Layers, Link, Lock, Mail, Maximize2, Minimize2, Minus, Monitor,
    Moon, Mouse, Move, Music, Palette, Pause, PenTool, Pipette, Play, Plus, Power, RefreshCw, Redo2,
    RotateCcw, RotateCw, Save, Scissors, Search, Send, Server, Settings, SkipBack, SkipForward, Smartphone,
    Star, Sun, Tablet, Terminal, Trash2, Type, Underline, Undo2, Upload, Volume2, VolumeX, Wifi, Wrench,
    X, Zap, ZoomIn, ZoomOut,
  };

  $: iconName = getLucideIconName(icon);
  $: Icon = iconName ? ICON_COMPONENTS[iconName] : null;
</script>

{#if Icon}
  <svelte:component this={Icon} {size} class={className} />
{:else}
  <span class={className}>{icon}</span>
{/if}
