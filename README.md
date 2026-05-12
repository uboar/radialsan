# radialsan

クロスプラットフォームのラジアル式パイメニューランチャーです。[AutoHotPie](https://github.com/dumbeau/AutoHotPie) に着想を得ています。

## 機能

- **ラジアルメニュー** - ホットキーを押している間だけカーソル位置にパイメニューを表示し、離すと選択した項目を実行
- **13 種類以上のアクション** - キー送信、URL を開く、コマンド実行、Lua スクリプト、クリップボード、メディア制御など
- **ビジュアルエディタ** - ライブ Canvas プレビュー付きの WYSIWYG メニューエディタ、ドラッグアンドドロップによるスライス並べ替え
- **アプリプロファイル** - アクティブウィンドウのタイトルやプロセス名に応じてメニューを自動切り替え
- **階層サブメニュー** - 最大 3 階層までメニューをネスト可能
- **アイコンシステム** - Lucide Icons と絵文字ピッカー
- **Lua スクリプト** - カスタム自動化向けに Lua 5.4 を組み込み
- **インポート / エクスポート** - `.radialsan.json` パッケージと AutoHotPie 設定インポート
- **i18n** - 英語と日本語
- **クロスプラットフォーム** - Windows、macOS、Linux

## 技術スタック

| レイヤー             | 技術                                                             |
| -------------------- | ---------------------------------------------------------------- |
| フレームワーク       | [Tauri v2](https://v2.tauri.app/) (Rust)                         |
| フロントエンド       | Svelte + TypeScript + Vite                                       |
| スタイリング         | Tailwind CSS                                                     |
| メニュー描画         | HTML5 Canvas                                                     |
| 入力キャプチャ       | [rdev](https://crates.io/crates/rdev) (global key press/release) |
| 入力シミュレーション | [enigo](https://crates.io/crates/enigo)                          |
| ウィンドウ検出       | [x-win](https://crates.io/crates/x-win)                          |
| スクリプト           | [mlua](https://crates.io/crates/mlua) (Lua 5.4)                  |

## 開発

### 前提条件

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+
- [Rust](https://rustup.rs/) (stable)
- プラットフォーム別の依存関係:
  - **Linux**: `sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libx11-dev libxdo-dev libxcb-shape0-dev libxcb-xfixes0-dev`
  - **macOS**: Xcode Command Line Tools、入力キャプチャ用のアクセシビリティ権限
  - **Windows**: WebView2 (Windows 10/11 には同梱)

### セットアップ

```bash
git clone https://github.com/uboar/radialsan.git
cd radialsan
pnpm install
```

### 実行 (開発)

```bash
pnpm tauri dev
```

### テスト

```bash
# Rust テスト
cd src-tauri && cargo test

# フロントエンドテスト
pnpm exec vitest run

# TypeScript チェック
pnpm exec tsc --noEmit

# Svelte チェック
pnpm exec svelte-check
```

### ビルド

```bash
# フロントエンドビルド
pnpm build

# Tauri アプリビルド
pnpm tauri build
```

## 権限

| OS              | 権限             | 必要な用途                                  |
| --------------- | ---------------- | ------------------------------------------- |
| macOS           | アクセシビリティ | グローバルホットキーのキャプチャ (rdev)     |
| macOS           | 画面収録         | ウィンドウタイトル検出 (任意)               |
| Linux (Wayland) | `input` グループ | `/dev/input` 経由のグローバル入力           |

## プロジェクト構成

```text
src/                    # Svelte フロントエンド
  components/
    PieMenu/            # Canvas 描画、geometry、animation
    Editor/             # ビジュアルエディタコンポーネント
    Layout/             # サイドバー、レイアウト
  pages/                # Dashboard、MenuEditor、Profiles、GlobalSettings
  stores/               # Svelte store ベースの状態管理
  i18n/                 # 翻訳 (en, ja)
  utils/                # 共有、AutoHotPie インポート

src-tauri/              # Rust バックエンド
  src/
    actions.rs          # アクション実行 (sendKey、openUrl、Lua など)
    commands.rs         # Tauri IPC コマンド
    input_listener.rs   # グローバルホットキーキャプチャ (rdev)
    lua_engine.rs       # 組み込み Lua スクリプト
    profiles.rs         # アクティブウィンドウ監視
    settings.rs         # 設定永続化 (JSON)
    tray.rs             # システムトレイ
```

## ライセンス

[MIT](LICENSE)
