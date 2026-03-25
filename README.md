# radialsan

Cross-platform radial pie-menu launcher. Inspired by [AutoHotPie](https://github.com/dumbeau/AutoHotPie).

## Features

- **Radial Menu** — Hold a hotkey to show a pie menu at your cursor, release to execute
- **13+ Actions** — Send keys, open URLs, run commands, Lua scripts, clipboard, media control, and more
- **Visual Editor** — WYSIWYG menu editor with live Canvas preview, drag-and-drop slice reordering
- **App Profiles** — Automatic menu switching based on the active window (title / process name)
- **Hierarchical Submenus** — Nest menus up to 3 levels deep
- **Icon System** — Lucide Icons + emoji picker
- **Lua Scripting** — Embedded Lua 5.4 for custom automation
- **Import/Export** — `.radialsan.json` packages, AutoHotPie settings import
- **i18n** — English and Japanese
- **Cross-platform** — Windows, macOS, Linux

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Tauri v2](https://v2.tauri.app/) (Rust) |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Menu Rendering | HTML5 Canvas |
| Input Capture | [rdev](https://crates.io/crates/rdev) (global key press/release) |
| Input Simulation | [enigo](https://crates.io/crates/enigo) |
| Window Detection | [x-win](https://crates.io/crates/x-win) |
| Scripting | [mlua](https://crates.io/crates/mlua) (Lua 5.4) |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) (stable)
- Platform dependencies:
  - **Linux**: `sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libx11-dev libxdo-dev libxcb-shape0-dev libxcb-xfixes0-dev`
  - **macOS**: Xcode Command Line Tools, Accessibility permission for input capture
  - **Windows**: WebView2 (included in Windows 10/11)

### Setup

```bash
git clone https://github.com/uboar/radialsan.git
cd radialsan
npm install
```

### Run (development)

```bash
cargo tauri dev
```

### Test

```bash
# Rust tests
cd src-tauri && cargo test

# Frontend tests
npx vitest run

# TypeScript check
npx tsc --noEmit
```

### Build

```bash
cargo tauri build
```

## Permissions

| OS | Permission | Required For |
|---|---|---|
| macOS | Accessibility | Global hotkey capture (rdev) |
| macOS | Screen Recording | Window title detection (optional) |
| Linux (Wayland) | `input` group | Global input via `/dev/input` |

## Project Structure

```
src/                    # React frontend
  components/
    PieMenu/            # Canvas rendering, geometry, animation
    Editor/             # Visual editor components
    Layout/             # Sidebar, layout
  pages/                # Dashboard, MenuEditor, Profiles, Settings
  stores/               # Zustand state management
  i18n/                 # Translations (en, ja)
  utils/                # Sharing, AutoHotPie import

src-tauri/              # Rust backend
  src/
    actions.rs          # Action execution (sendKey, openUrl, Lua, etc.)
    commands.rs         # Tauri IPC commands
    input_listener.rs   # Global hotkey capture (rdev)
    lua_engine.rs       # Embedded Lua scripting
    profiles.rs         # Active window monitoring
    settings.rs         # Settings persistence (JSON)
    tray.rs             # System tray
```

## License

[MIT](LICENSE)
