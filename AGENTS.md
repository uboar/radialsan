# radialsan 作業メモ

radialsan は Tauri v2 + React/TypeScript のラジアルメニューアプリ。AutoHotPie 風に、ホットキーを押している間だけ overlay に Canvas メニューを表示し、離した時に選択アクションを実行する。

## 構成

- `src-tauri/src/`: Rust バックエンド。入力監視、アクション実行、設定保存、OS 連携。
- `src/`: React フロントエンド。設定 UI、エディタ、overlay Canvas 描画。
- `main`: `index.html` / `src/main.tsx`。設定・エディタ画面。
- `overlay`: `overlay.html` / `src/overlay.tsx`。透明フルスクリーンのメニュー描画。

主な流れ:

```text
rdev でホットキー検出 -> Tauri event -> React Canvas 表示 -> release -> enigo 等でアクション実行
```

## 重要ファイル

- `src-tauri/src/settings.rs`: 設定型、JSON 永続化、プロファイル判定。
- `src-tauri/src/input_listener.rs`: `rdev` の press/release 監視。
- `src-tauri/src/actions.rs`: アクション実行ディスパッチ。
- `src-tauri/src/commands.rs`: Tauri IPC。
- `src/components/PieMenu/`: Canvas メニューの geometry / renderer / animation。
- `src/components/Editor/`: メニュー編集 UI。
- `src/stores/`: Zustand ストア。
- `src/types/settings.ts`: フロントエンド設定型。Rust 側と同期する。
- `src/i18n/locales/`: 静的 UI 文言。

## コマンド

```bash
cargo tauri dev
cd src-tauri && cargo test
pnpm exec vitest run
pnpm exec tsc --noEmit
pnpm run build
cargo tauri build
```

## 変更時のルール

- Rust の設定構造体は `#[serde(rename_all = "camelCase")]` を使う。
- TypeScript の設定型は `src/types/settings.ts` に集約し、Rust と整合させる。
- 静的 UI テキストは `t()` と `src/i18n/locales/*.json` を使う。
- グローバル状態は Zustand、局所状態は React state を使う。
- 新機能には該当レイヤーのテストを追加する。
- OS 権限が必要な `rdev` / `enigo` の実操作は直接テストせず、パースや純粋ロジックをテストする。

## よくある追加作業

新しいアクション:

1. `src-tauri/src/settings.rs` の `ActionType` を更新。
2. `src-tauri/src/actions.rs` に dispatch と実装、テストを追加。
3. `src/types/settings.ts` を更新。
4. `src/components/Editor/ActionEditor.tsx` に UI を追加。
5. `src/i18n/locales/en.json` と `ja.json` にラベルを追加。

新しい設定項目:

1. `src-tauri/src/settings.rs` にフィールド追加。
2. `src/types/settings.ts` を更新。
3. 必要なら `src/stores/settingsStore.ts` と設定 UI を更新。

新しいページ:

1. `src/pages/` にページを追加。
2. `src/App.tsx` に route を追加。
3. `src/components/Layout/Sidebar.tsx` にナビを追加。
4. i18n を更新。

新しい Rust モジュール:

1. `src-tauri/src/<module>.rs` を追加。
2. `src-tauri/src/lib.rs` に `pub mod <module>;` を追加。
3. IPC が必要なら `commands.rs` と `invoke_handler` を更新。

## プラットフォーム注意点

- OS 固有処理は `#[cfg(target_os = "macos")]` / `#[cfg(unix)]` / `#[cfg(windows)]` で分岐する。
- クリップボード系ショートカットは macOS が `Meta+C/V/X`、他 OS が `Ctrl+C/V/X`。
- `auto_launch::AutoLaunch::new` は macOS のみ 4 引数、Linux/Windows は 3 引数。
- `Key::MediaStop` は macOS の enigo には存在しない。
