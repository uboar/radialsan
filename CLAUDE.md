# radialsan - プロジェクトガイド

## 概要

radialsan は AutoHotPie の設計思想を引き継いだ、マルチプラットフォーム対応のラジアルメニューソフトウェア。
Tauri v2 (Rust) + React (TypeScript) で構築。

## アーキテクチャ

### 2層構成

- **Rust バックエンド** (`src-tauri/src/`): 入力キャプチャ、アクション実行、設定管理、システム連携
- **React フロントエンド** (`src/`): メニュー描画 (Canvas)、設定UI、ビジュアルエディタ

### ウィンドウ構成

| ウィンドウ | エントリポイント                   | 用途                                      |
| ---------- | ---------------------------------- | ----------------------------------------- |
| `main`     | `index.html` → `src/main.tsx`      | 設定・エディタUI (トレイから開く)         |
| `overlay`  | `overlay.html` → `src/overlay.tsx` | ラジアルメニュー描画 (フルスクリーン透明) |

### イベントフロー

```
ホットキー押下 → rdev検出 → Tauriイベント → Canvas描画 → ホットキー離す → アクション実行
```

Rust (`rdev` スレッド) → `radialsan://show-menu` イベント → React (Canvas) → `radialsan://hide-menu` → Rust (`enigo` でキー送信等)

## ディレクトリ構造

```
src-tauri/src/
  lib.rs              # アプリ初期化、イベントブリッジ
  settings.rs         # Settings構造体、JSON永続化、プロファイルマッチング
  input_listener.rs   # rdev グローバルキーリスナー (press/release)
  actions.rs          # アクション実行ディスパッチャ (14種)
  lua_engine.rs       # mlua Luaスクリプティング
  profiles.rs         # x-win アクティブウィンドウ監視
  commands.rs         # Tauri IPCコマンド
  tray.rs             # システムトレイ

src/
  components/
    PieMenu/          # Canvas描画 (geometry, renderer, animation)
    Editor/           # ビジュアルエディタ (SliceList, ActionEditor, etc.)
    Layout/           # サイドバー、レイアウト
  pages/              # Dashboard, MenuEditor, Profiles, GlobalSettings
  stores/             # Zustand (settingsStore, historyStore)
  types/              # TypeScript型定義 (settings.ts)
  i18n/               # 翻訳 (en.json, ja.json)
  utils/              # sharing, autohotpieImport
```

## 主要な設計判断

- **rdev を使う理由**: Tauri の `global-shortcut` プラグインは KeyRelease を検出できない。「押している間表示、離すと実行」モデルには rdev が必要
- **メニューはフラット配列 + ID参照**: プロファイル間でメニューを共有可能
- **Action は `{ type, params }` 形式**: serde の tagged union でディスパッチ
- **Canvas 描画**: overlay ウィンドウ上の HTML5 Canvas。WebGL ではなく 2D Context
- **設定の自動保存**: エディタは 500ms debounce で Tauri IPC 経由保存

## コマンド

```bash
# 開発
cargo tauri dev

# テスト
cd src-tauri && cargo test     # Rust 38テスト
pnpm exec vitest run            # Frontend 46テスト
pnpm exec tsc --noEmit          # 型チェック

# ビルド
pnpm run build                  # フロントエンド
cargo tauri build               # 全体

# リリース
git tag vX.Y.Z && git push origin vX.Y.Z
```

## テスト戦略

### テスト構成 (84テスト)

| レイヤー         | 件数 | 場所                                                 | 内容                                                                |
| ---------------- | ---- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| Rust ユニット    | 38   | `src-tauri/src/*.rs` (#[cfg(test)])                  | 設定パース、キーマッピング、プロファイルマッチング、アクション、Lua |
| Vitest geometry  | 26   | `src/components/PieMenu/__tests__/geometry.test.ts`  | 角度計算、ヒット判定、座標変換                                      |
| Vitest animation | 5    | `src/components/PieMenu/__tests__/animation.test.ts` | easeOutCubic、MenuAnimator                                          |
| Vitest history   | 7    | `src/stores/__tests__/historyStore.test.ts`          | Undo/Redo スタック                                                  |
| Vitest import    | 3    | `src/utils/__tests__/autohotpieImport.test.ts`       | AutoHotPie変換                                                      |
| Vitest sharing   | 5    | `src/utils/__tests__/sharing.test.ts`                | パッケージパース、ID再生成                                          |

### テスト方針

- **OS レベルの操作 (enigo, rdev) はテストしない**: 権限が必要なため、パース/バリデーションのみテスト
- **Canvas 描画はテストしない**: geometry の純粋関数のみテスト
- **Tauri IPC はテストしない**: ストアのロジックのみテスト
- **新機能追加時**: 対応するユニットテストを必ず追加

### テスト追加のパターン

**Rust アクション追加時**:

```rust
// actions.rs の dispatch に追加
"newAction" => execute_new_action(params),

// テスト追加
#[test]
fn test_execute_new_action_missing_params() { ... }
```

**フロントエンド ユーティリティ追加時**:

```
src/utils/newUtil.ts
src/utils/__tests__/newUtil.test.ts
```

## CI/CD

### CI (`ci.yml`) — main ブランチ push / PR

3OS マトリクス (ubuntu-22.04, macos-latest, windows-latest):

1. npm ci
2. npx tsc --noEmit
3. npx vitest run
4. cargo test
5. npm run build
6. cargo check

### Release (`release.yml`) — `v*` タグ push

`tauri-apps/tauri-action` で自動ビルド:

- Windows x64: `.msi` + `.exe`
- macOS ARM: `.dmg` + `.app.tar.gz`
- macOS Intel: `.dmg` (macos-latest + x86_64 target)
- Linux x64: `.deb` + `.AppImage` + `.rpm`

成果物は GitHub Release に自動アップロード。

### リリース手順

```bash
# 1. バージョンを更新
# src-tauri/tauri.conf.json の "version" を変更
# package.json の "version" を変更

# 2. コミット
git add -A && git commit -m "Bump version to X.Y.Z"

# 3. タグ作成 & プッシュ → 自動ビルド & リリース
git tag vX.Y.Z
git push origin main --tags
```

## 新機能追加ガイド

### 新しいアクション型を追加する

1. `src-tauri/src/settings.rs`: `ActionType` enum にバリアント追加
2. `src-tauri/src/actions.rs`: `execute_action` の match に追加 + 実装関数 + テスト
3. `src/types/settings.ts`: `ActionType` に追加
4. `src/components/Editor/ActionEditor.tsx`: `ACTION_TYPES` に追加 + UIフォーム
5. `src/i18n/locales/en.json` + `ja.json`: `actions` にラベル追加

### 新しい設定項目を追加する

1. `src-tauri/src/settings.rs`: 構造体にフィールド追加 (serde camelCase)
2. `src/types/settings.ts`: 対応する型を追加
3. `src/stores/settingsStore.ts`: 必要なら操作メソッド追加
4. `src/pages/GlobalSettings.tsx`: UIコントロール追加

### 新しいページを追加する

1. `src/pages/NewPage.tsx` 作成
2. `src/App.tsx`: `<Route>` 追加
3. `src/components/Layout/Sidebar.tsx`: ナビゲーション項目追加
4. `src/i18n/locales/*.json`: 翻訳追加

### 新しい Rust モジュールを追加する

1. `src-tauri/src/new_module.rs` 作成
2. `src-tauri/src/lib.rs`: `pub mod new_module;` 追加
3. 必要なら `commands.rs` に Tauri コマンド追加
4. `lib.rs` の `invoke_handler` にコマンド登録

## ルール

### コーディング規約

- **Rust**: serde の `#[serde(rename_all = "camelCase")]` を全構造体に適用
- **TypeScript**: 型定義は `src/types/settings.ts` に集約し、Rust と同期を保つ
- **i18n**: 静的UIテキストは必ず `t()` を使う。動的データ（メニュー名等）はそのまま
- **状態管理**: グローバル状態は Zustand ストア (`src/stores/`)。コンポーネントローカル状態は useState

### auto-launch の注意

`auto_launch::AutoLaunch::new` は macOS のみ4引数 (`use_launch_agent: bool`)、Linux/Windows は3引数。`#[cfg(target_os = "macos")]` で分岐すること。

### プラットフォーム固有コード

- `#[cfg(target_os = "macos")]` / `#[cfg(unix)]` / `#[cfg(windows)]` で分岐
- クリップボード操作: macOS は `Meta+C/V/X`、他は `Ctrl+C/V/X`
- メディアキー: `Key::MediaStop` は macOS の enigo に存在しない

### 依存クレートのバージョン

| クレート        | 用途                 | 注意                                          |
| --------------- | -------------------- | --------------------------------------------- |
| tauri 2         | フレームワーク       | features: tray-icon, devtools, image-png      |
| rdev 0.5        | 入力キャプチャ       | macOS: Accessibility 権限必要                 |
| enigo 0.2       | 入力シミュレーション | Keyboard / Mouse trait を use する            |
| x-win 4         | ウィンドウ検出       | macOS: Screen Recording 権限 (タイトル取得時) |
| mlua 0.10       | Lua                  | features: lua54, vendored                     |
| auto-launch 0.5 | 自動起動             | macOS API が他 OS と異なる                    |
