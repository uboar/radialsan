# radialsan 実装計画

## Phase 1: Core Menu (MVP)

### Step 1: プロジェクトスキャフォールド

**目的**: Tauri v2 + React (TypeScript) のプロジェクト基盤を構築する

**作業内容**:
- [ ] `cargo create-tauri-app` で Tauri v2 + React + TypeScript プロジェクト生成
- [ ] `tauri.conf.json` に2ウィンドウ構成を定義
  - `main`: 設定UI（デフォルト非表示、トレイから開く）
  - `overlay`: フルスクリーン・透明・枠なし・最前面
- [ ] React ルーティング設定（`/main` と `/overlay` の2エントリポイント）
- [ ] ESLint + Prettier 設定
- [ ] Vitest セットアップ
- [ ] GitHub Actions CI ワークフロー（Rust テスト + React テスト + ビルド、3OS マトリクス）

**成果物**:
```
radialsan/
├── src/                          # React フロントエンド
│   ├── main.tsx                  # メインウィンドウ エントリポイント
│   ├── overlay.tsx               # オーバーレイ エントリポイント
│   ├── App.tsx                   # 設定UI ルート
│   ├── components/
│   │   └── PieMenu/
│   │       ├── PieMenu.tsx       # Canvas ラジアルメニューコンポーネント
│   │       ├── PieMenuRenderer.ts # Canvas 描画ロジック
│   │       └── geometry.ts       # 角度計算・ヒット判定ユーティリティ
│   ├── types/
│   │   └── settings.ts           # 設定型定義
│   └── hooks/
│       └── useTauriEvents.ts     # Tauri イベントリスナーフック
├── src-tauri/
│   ├── src/
│   │   ├── main.rs               # Tauri エントリポイント
│   │   ├── lib.rs                # モジュール宣言
│   │   ├── input_listener.rs     # rdev グローバル入力リスナー
│   │   ├── actions.rs            # アクション実行エンジン
│   │   ├── settings.rs           # 設定読み書き
│   │   ├── tray.rs               # システムトレイ
│   │   └── commands.rs           # Tauri IPC コマンド
│   ├── Cargo.toml
│   └── tauri.conf.json
├── tests/
│   └── fixtures/                 # テストデータ
├── docs/
│   └── implementation-plan.md    # この文書
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

### Step 2: 設定データモデル

**目的**: 設定の型定義と読み書きロジックを実装する

**Rust 側**:
- [ ] `settings.rs`: `Settings`, `Profile`, `Menu`, `Slice`, `Action` 構造体を `serde` で定義
- [ ] デフォルト設定の生成 (`Default` trait 実装)
- [ ] JSON ファイルの読み込み / 保存（`app_data_dir()` 配下）
- [ ] 設定ファイル未存在時のデフォルト生成
- [ ] ユニットテスト: シリアライズ/デシリアライズ往復、不正入力ハンドリング

**TypeScript 側**:
- [ ] `types/settings.ts`: Rust 構造体と対応する TypeScript 型を定義
- [ ] `zod` スキーマによる実行時バリデーション（オプション）

**テスト**:
- `fixtures/settings_default.json` — デフォルト設定
- `fixtures/settings_minimal.json` — 最小構成
- `fixtures/settings_invalid_missing_field.json` — フィールド欠損

---

### Step 3: グローバル入力リスナー

**目的**: ホットキーの press/release を検出し、イベントを発行する

**作業内容**:
- [ ] `input_listener.rs`: `rdev::listen` を専用スレッドで起動
- [ ] `KeyPress` / `KeyRelease` イベントのフィルタリング（登録済みホットキーのみ）
- [ ] 修飾キーの状態追跡（Ctrl/Shift/Alt/Meta の押下状態）
- [ ] キー文字列 (`"CapsLock"`, `"Ctrl+Space"`) → `rdev::Key` への変換マップ
- [ ] クイックタップ判定（press → release が `quickTapThresholdMs` 以内なら無視）
- [ ] `AppHandle` 経由で Tauri イベント発行:
  - `radialsan://show-menu { menuId, cursorX, cursorY }`
  - `radialsan://hide-menu`
- [ ] マウスカーソル位置の取得（メニュー表示位置用）

**テスト**:
- キー文字列パースのユニットテスト
- 修飾キー正規化のテスト
- クイックタップ閾値判定のテスト（モック時刻使用）

**注意事項**:
- macOS ではアクセシビリティ権限が必要。権限未付与時のエラーメッセージを実装
- `rdev::listen` はブロッキングなので必ず `std::thread::spawn` で実行

---

### Step 4: Canvas ラジアルメニュー描画

**目的**: オーバーレイウィンドウ上に Canvas でラジアルメニューを描画する

**作業内容**:
- [ ] `geometry.ts`: 数学ユーティリティ
  - `calcSliceAngle(numSlices)` → 各スライスの角度幅
  - `getSliceAtPoint(x, y, cx, cy, numSlices, innerR, outerR, deadR)` → スライスインデックス or null
  - `polarToCartesian(cx, cy, r, angle)` → `{x, y}`
  - `angleBetween(x1, y1, x2, y2)` → ラジアン
- [ ] `PieMenuRenderer.ts`: Canvas 描画クラス
  - 円環の描画（`arc` パス）
  - スライスの分割描画（各スライスに fill + stroke）
  - ホバースライスのハイライト
  - アイコン描画（テキストアイコン、将来的に画像アイコン）
  - ラベルテキスト描画（スライス外周に配置）
- [ ] `PieMenu.tsx`: React コンポーネント
  - Canvas ref のセットアップ
  - `mousemove` イベントでホバースライス更新 → 再描画
  - `requestAnimationFrame` ベースの描画ループ
  - Tauri イベント `show-menu` 受信でメニュー表示
  - Tauri イベント `hide-menu` 受信で非表示 + 選択結果送信
- [ ] `overlay.tsx`: オーバーレイウィンドウのルート
  - 全画面透明背景
  - `PieMenu` コンポーネントのマウント

**テスト**:
- `geometry.ts` の全関数に対するユニットテスト（境界値含む）
- 2, 4, 8, 12 スライスでの角度計算検証
- デッドゾーン内 → null、リング内 → 正しいスライス番号

---

### Step 5: アクション実行エンジン

**目的**: 選択されたスライスのアクションを実行する

**作業内容**:
- [ ] `actions.rs`: アクション実行ディスパッチャ
  - `execute_action(action: Action)` → `Result<(), ActionError>`
  - `sendKey`: `enigo` で修飾キー + キーのシミュレーション
  - `openURL`: `open::that(url)` でデフォルトブラウザ起動
  - `openFile` / `openFolder`: `open::that(path)`
  - `runCommand`: `std::process::Command` で外部コマンド実行
- [ ] `commands.rs`: Tauri IPC コマンド
  - `#[tauri::command] fn execute_action(action: Action) -> Result<(), String>`
  - `#[tauri::command] fn get_settings() -> Result<Settings, String>`
- [ ] `sendKey` のキー文字列パーサ
  - `"ctrl+c"` → `[Key::Control (down), Key::C (press), Key::Control (up)]`
  - 複数キーの連続送信対応

**テスト**:
- キー文字列パースのユニットテスト（`"ctrl+shift+a"`, `"F5"`, `"alt+tab"` 等）
- 不正なキー文字列に対するエラーハンドリング
- アクションディスパッチの型マッチングテスト

---

### Step 6: システムトレイ & ウィンドウ管理

**目的**: トレイアイコンとウィンドウのライフサイクルを管理する

**作業内容**:
- [ ] `tray.rs`: システムトレイ
  - トレイアイコン表示
  - メニュー: 「設定を開く」「終了」
  - 「設定を開く」→ main ウィンドウを表示
- [ ] `main.rs`: アプリ初期化
  - 設定読み込み
  - 入力リスナースレッド起動
  - トレイ初期化
  - overlay ウィンドウの `setIgnoreCursorEvents` 制御
- [ ] main ウィンドウの閉じるボタン → 非表示（終了せずトレイに格納）

---

### Step 7: Phase 1 統合 & 受け入れテスト

**目的**: 全コンポーネントを結合し、エンドツーエンドで動作確認する

**作業内容**:
- [ ] ハードコードされたテスト用メニュー（4スライス: Copy/Paste/Undo/Redo）で統合テスト
- [ ] 受け入れテスト実施:
  1. `cargo tauri dev` で起動
  2. トレイアイコン表示確認
  3. ホットキー押下 → メニュー表示
  4. マウスホバー → ハイライト
  5. ホットキー離す → アクション実行
  6. デッドゾーンで離す → 未実行で閉じる
- [ ] 3OS での動作確認（手動 or CI）
- [ ] パフォーマンス計測（メニュー表示レイテンシ < 50ms 目標）

---

## Phase 2: エディタ & プロファイル

### Step 8: 設定UI基盤

- [ ] React Router でメインウィンドウのページ構成（概要/メニュー編集/プロファイル/設定）
- [ ] 設定の読み込み・保存の Tauri コマンド連携
- [ ] UI コンポーネントライブラリ選定・導入（shadcn/ui 等）

### Step 9: ビジュアルエディタ

- [ ] メニュー一覧表示 & 新規作成
- [ ] Canvas プレビュー付きスライスエディタ
- [ ] スライスのドラッグ＆ドロップ並べ替え
- [ ] アクション設定フォーム（アクション型ごとのUI）
- [ ] 外観カスタマイズパネル（色、半径、フォント）

### Step 10: プロファイルシステム

- [ ] `profiles.rs`: `x-win` によるアクティブウィンドウ監視（ポーリング 500ms）
- [ ] プロファイルマッチングエンジン（matchRules 評価）
- [ ] プロファイル切替時のホットキーマッピング更新
- [ ] プロファイル管理UI（作成/編集/削除/優先順位変更）

### Step 11: サブメニュー

- [ ] サブメニュー遷移ロジック（Canvas側）
- [ ] 「戻る」操作の実装
- [ ] エディタでのサブメニューリンク設定UI

### Step 12: 残りのアクション実装

- [ ] `sendText`, `mouseClick`, `clipboard`, `mediaControl`
- [ ] アクションシーケンス実行（配列内を順次処理、`delay` 対応）

---

## Phase 3: 品質向上

### Step 13: アニメーション & UX

- [ ] メニュー開閉アニメーション（スケール遷移）
- [ ] ホバー遷移アニメーション
- [ ] DPI スケーリング対応

### Step 14: アイコンシステム

- [ ] バンドルアイコンセット（Lucide Icons 等）統合
- [ ] アイコンピッカーUI（検索 + グリッド表示）
- [ ] カスタム画像アイコンのアップロード & 保存

### Step 15: エディタ拡張

- [ ] Undo/Redo（コマンドパターン）
- [ ] メニューの JSON インポート/エクスポート
- [ ] AutoHotPie 設定インポートツール（JSON 変換ロジック）

### Step 16: システム連携

- [ ] `auto-launch` によるOS起動時の自動起動
- [ ] 設定変更時の自動バックアップ（`backups/` ディレクトリ）

---

## Phase 4: 拡張性

### Step 17: Lua スクリプティング

- [ ] `mlua` 組み込みによるカスタムアクション実行環境
- [ ] Lua からアクセス可能な API（sendKey, getMousePos, getActiveWindow 等）
- [ ] スクリプトエディタUI

### Step 18: 共有 & コミュニティ

- [ ] メニュー/プロファイルのエクスポート/インポート（.radialsan 形式）
- [ ] プラグインシステム設計（Lua ベース or WASM ベース）

### Step 19: プラットフォーム改善

- [ ] Wayland ネイティブ対応（`libei` 入力、`wlr-layer-shell` オーバーレイ）
- [ ] i18n 基盤（react-intl 等）+ 日本語/英語翻訳

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
