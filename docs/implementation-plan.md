# radialsan 実装計画

## Phase 1: Core Menu (MVP) ✅ COMPLETED

### Step 1: プロジェクトスキャフォールド ✅

- [x] Tauri v2 + React + TypeScript プロジェクト生成
- [x] 2ウィンドウ構成 (main + overlay)
- [x] Vite マルチページ設定、Vitest セットアップ

### Step 2: 設定データモデル ✅
- [x] Rust: Settings/Profile/Menu/Slice/Action 構造体 (serde, camelCase)
- [x] Default実装 (4スライス: Copy/Paste/Undo/Redo, CapsLockホットキー)
- [x] JSON読み書き + プロファイルマッチング (contains/exact/regex)
- [x] TypeScript型定義 (types/settings.ts)
- [x] 6ユニットテスト

### Step 3: グローバル入力リスナー ✅
- [x] rdev::listen 専用スレッド (KeyPress/KeyRelease/MouseMove)
- [x] ホットキー文字列パーサ (A-Z, 0-9, F1-F12, CapsLock, Mouse4/5, 修飾キー組み合わせ)
- [x] クイックタップ判定、修飾キー状態追跡
- [x] InputEvent (ShowMenu/HideMenu/MouseMove) チャネル送信
- [x] 8ユニットテスト

### Step 4: Canvas ラジアルメニュー描画 ✅
- [x] geometry.ts: angleFromCenter, getSliceAtPoint, polarToCartesian 等
- [x] PieMenuRenderer.ts: Canvas描画クラス (スライス, ラベル, ホバーハイライト)
- [x] PieMenu.tsx: Tauriイベント連携 React コンポーネント
- [x] Overlay.tsx, useTauriEvents.ts 更新
- [x] 26 Vitestユニットテスト

### Step 5: アクション実行エンジン ✅
- [x] actions.rs: execute_action ディスパッチャ (sendKey, openUrl, runCommand, clipboard, delay等)
- [x] キー文字列パーサ + enigo連携
- [x] commands.rs: Tauri IPCコマンド (execute_slice_actions, get_default_settings)
- [x] 11ユニットテスト

### Step 6: システムトレイ & ウィンドウ管理 ✅
- [x] tray.rs: トレイアイコン + メニュー (Open Settings / Quit)
- [x] lib.rs: 全コンポーネント統合 (設定, 入力リスナー, イベントブリッジ, トレイ)
- [x] mainウィンドウ閉じる→非表示、overlayのカーソルイベント制御

### Step 7: Phase 1 統合 ✅
- [x] cargo test 25/25, vitest 26/26, tsc OK, cargo build OK
- [x] デフォルトメニュー (Copy/Paste/Undo/Redo) でエンドツーエンド統合

---

## Phase 2: エディタ & プロファイル ✅ COMPLETED

### Step 8: 設定UI基盤 ✅

**目的**: メインウィンドウに設定UIのフレームワークを構築する

**作業内容**:
- [ ] 依存追加: `react-router-dom`, `zustand`, `tailwindcss`, `@radix-ui/react-*` (shadcn/ui互換)
- [ ] Tailwind CSS セットアップ (postcss, tailwind.config)
- [ ] React Router でページ構成:
  - `/` — ダッシュボード（メニュー一覧）
  - `/menu/:id` — メニューエディタ
  - `/profiles` — プロファイル管理
  - `/settings` — グローバル設定
- [ ] サイドバーナビゲーション コンポーネント
- [ ] Zustand ストア: `useSettingsStore` (Tauri IPC連携)
  - `settings`, `loadSettings()`, `saveSettings()`, `updateMenu()`, `updateProfile()`
- [ ] 設定ファイル永続化: Rust側 `save_settings` コマンドで `app_data_dir()` に書き込み
- [ ] Tauri capabilities に `fs` パーミッション追加

**新規ファイル**:
```
src/
  stores/
    settingsStore.ts          # Zustand ストア
  components/
    Layout/
      Sidebar.tsx             # サイドバーナビゲーション
      Layout.tsx              # メインレイアウト
    ui/                       # 共通UIコンポーネント (Button, Input, Card等)
  pages/
    Dashboard.tsx             # メニュー一覧
    MenuEditor.tsx            # メニューエディタページ
    Profiles.tsx              # プロファイル管理ページ
    GlobalSettings.tsx        # グローバル設定ページ
```

---

### Step 9: ビジュアルエディタ ✅

**目的**: GUIでラジアルメニューを作成・編集できるビジュアルエディタを実装する

**作業内容**:
- [ ] メニュー一覧ページ (Dashboard.tsx)
  - カード形式でメニュー表示（名前、スライス数、プレビュー）
  - 「新規メニュー作成」ボタン → ID自動生成、デフォルト設定で作成
  - メニュー削除（確認ダイアログ付き）
- [ ] メニューエディタページ (MenuEditor.tsx)
  - 左パネル: Canvas メニュープレビュー（PieMenuRenderer再利用）
  - 右パネル: プロパティエディタ
- [ ] スライスリスト コンポーネント
  - スライス一覧（ラベル + アイコン表示）
  - スライス追加（+ボタン）/ 削除（×ボタン）
  - ドラッグ＆ドロップ並べ替え（@dnd-kit/sortable）
  - スライス選択 → 詳細編集パネル表示
- [ ] スライス詳細編集パネル
  - ラベル入力
  - アイコン入力（テキスト入力、Phase3でピッカー化）
  - アクション設定: アクション型セレクト → 型に応じた入力フォーム
    - sendKey: キー入力フィールド（"ctrl+c"形式）
    - openUrl: URL入力
    - openFile/openFolder: パス入力
    - runCommand: コマンド + 引数 + cwd + shell チェック
    - submenu: メニューIDセレクト
    - clipboard: copy/cut/paste ラジオ
    - noop: パラメータなし
- [ ] 外観カスタマイズパネル
  - innerRadius / outerRadius スライダー
  - カラーピッカー（背景色、スライス色、ホバー色、ボーダー色）
  - フォント設定、ラベルサイズ
  - リアルタイムプレビュー更新
- [ ] 設定変更の自動保存 (debounce 500ms)

**新規ファイル**:
```
src/
  pages/
    MenuEditor.tsx
  components/
    Editor/
      SliceList.tsx           # スライス一覧 + DnD
      SliceEditor.tsx         # スライス詳細編集
      ActionEditor.tsx        # アクション設定フォーム
      AppearancePanel.tsx     # 外観カスタマイズ
      MenuPreview.tsx         # Canvas プレビュー
```

---

### Step 10: プロファイルシステム (Rust + UI) ✅

**目的**: アクティブウィンドウに応じてメニューを自動切替するプロファイルシステム

**Rust 側**:
- [ ] `x-win` クレート追加 (Cargo.toml)
- [ ] `profiles.rs`: アクティブウィンドウ監視モジュール
  - 500ms間隔ポーリングでフォアグラウンドウィンドウのタイトル+プロセス名取得
  - プロファイルマッチング (settings.rs の `get_active_profile` 活用)
  - プロファイル変更時に `radialsan://profile-changed` イベント発行
  - ホットキーバインディングの動的更新 (`InputListener::update_bindings`)
- [ ] `lib.rs` に profiles ポーリングスレッドを追加

**React UI 側**:
- [ ] プロファイル管理ページ (Profiles.tsx)
  - プロファイル一覧（名前、マッチルール、バインドされたホットキー）
  - プロファイル作成/編集/削除
  - プロファイル優先順位変更（上下ドラッグ）
- [ ] プロファイル編集フォーム
  - 名前入力
  - マッチルール: field (processName/windowTitle) + mode (contains/exact/regex) + value
  - ホットキーバインディング: hotkey + menuId のペア一覧
  - ホットキー入力コンポーネント（キー押下でキャプチャ）
- [ ] デフォルトプロファイルは削除不可、マッチルール編集不可

**新規ファイル**:
```
src-tauri/src/profiles.rs
src/
  pages/Profiles.tsx
  components/
    Profiles/
      ProfileList.tsx
      ProfileEditor.tsx
      HotkeyInput.tsx         # キー押下でホットキーキャプチャ
      MatchRuleEditor.tsx
```

---

### Step 11: サブメニュー ✅

**目的**: スライス選択で別のラジアルメニューを展開する階層メニュー

**Canvas 側**:
- [ ] PieMenu.tsx: サブメニュー遷移ロジック
  - submenuアクション持ちスライスにホバー + 外径超え → 子メニュー展開
  - メニュースタック管理 (親メニュー情報を保持)
  - 「戻る」: Escape or 中心方向マウス移動 → 親メニューに復帰
  - 最大深度チェック (maxSubmenuDepth)
- [ ] PieMenuRenderer: サブメニューインジケータ描画（▶マーク）

**エディタ側**:
- [ ] ActionEditor: submenu型選択時にメニューIDドロップダウン
- [ ] 循環参照チェック（A→B→A を禁止）

---

### Step 12: 残りのアクション実装 ✅

**目的**: Phase 1で未実装のアクション型を追加する

- [ ] `sendText`: enigo.text() によるテキスト入力
- [ ] `mouseClick`: enigo でマウスボタンシミュレーション (left/right/middle, 修飾キー付き)
- [ ] `mediaControl`: enigo でメディアキー送信 (play/pause/next/prev/volumeUp/volumeDown/mute)
- [ ] `runScript`: interpreter + scriptPath + args でスクリプト実行
- [ ] アクションシーケンス: commands.rs で配列を順次実行（delay挟み込み対応）- 既に実装済み確認
- [ ] 各アクションのユニットテスト追加

---

## Phase 3: 品質向上 ✅ COMPLETED

### Step 13: アニメーション & UX ✅
- [x] MenuAnimator (requestAnimationFrame, easeOutCubic)
- [x] メニュー開閉スケールアニメーション + ホバー色ブレンド遷移
- [x] HiDPI Canvas (devicePixelRatio)
- [x] 5 animation テスト

### Step 14: アイコンシステム ✅
- [x] lucide-react (90+アイコン) 統合
- [x] IconPicker (emoji/Lucideモード, 検索, グリッド)
- [x] PieMenuRenderer: Lucideアイコンプレースホルダー描画

### Step 15: エディタ拡張 ✅
- [x] Undo/Redo (Zustand historyStore, 50スナップショット, Ctrl+Z/Ctrl+Shift+Z)
- [x] メニューJSON export (.radialsan.json) / import
- [x] AutoHotPie設定インポート (AHKキー変換, プロファイル/メニュー変換)
- [x] 10テスト (history 7 + autohotpie 3)

### Step 16: システム連携 ✅
- [x] auto-launch クレートでOS起動時自動起動
- [x] 設定保存時の自動バックアップ (max 10)
- [x] GlobalSettings: スライダー/トグル操作UI

---

## Phase 4: 拡張性 ✅ COMPLETED

### Step 17: Lua スクリプティング ✅
- [x] mlua (Lua 5.4 vendored) 組み込み
- [x] radialsan.* API (send_key, send_text, delay, open_url, open_file, run_command, mouse_click, clipboard, log)
- [x] runLuaアクション (インラインスクリプト or ファイルパス)
- [x] ActionEditorにスクリプトエディタUI
- [x] 7ユニットテスト

### Step 18: 共有 & コミュニティ ✅
- [x] .radialsan.json パッケージ形式 (menu/profile/bundle)
- [x] Export/Import (ID再生成, サブメニュー参照リマップ)
- [x] プロファイルCRUD UI (作成/編集/削除)
- [x] 5 sharing テスト

### Step 19: i18n ✅
- [x] react-i18next 導入
- [x] 英語/日本語翻訳ファイル
- [x] 全ページ・コンポーネントのi18n化
- [x] GlobalSettingsに言語切替UI (localStorage永続化)

---

## 技術選定まとめ

| カテゴリ | 選定 | 理由 |
|---|---|---|
| フレームワーク | Tauri v2 | 軽量、Rust バックエンド、マルチプラットフォーム |
| フロントエンド | React + TypeScript | エコシステム充実、型安全 |
| ビルド | Vite | 高速 HMR、Tauri 公式サポート |
| テスト (JS) | Vitest + React Testing Library | Vite ネイティブ、高速 |
| テスト (Rust) | `cargo test` | 標準ツールチェイン |
| E2E | Playwright + Tauri driver | クロスプラットフォーム E2E |
| UI コンポーネント | shadcn/ui (候補) | カスタマイズ性、Tailwind CSS ベース |
| 状態管理 | Zustand (候補) | 軽量、React 向け |
| 入力リスニング | rdev | press/release 対応、3OS 対応 |
| 入力シミュレーション | enigo v0.2+ | 3OS 対応、統一 API |
| ウィンドウ検出 | x-win | 3OS 対応、Wayland 部分対応 |
| CI/CD | GitHub Actions | 3OS マトリクスビルド |
