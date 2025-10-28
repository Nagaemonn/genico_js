# Genico - PNG to ICO Desktop App (Electron版)

このリポジトリは、PNG画像をWindows用ICOファイルに変換するデスクトップアプリケーションです。ElectronとTypeScriptで構築されています。

---

## セットアップ手順

### 1. リポジトリのクローン

```bash
# 任意のディレクトリで
git clone <repository-url>
cd genico_js
```

### 2. Node.jsのインストール

```bash
# Node.js 18以上をインストール
# macOS (Homebrew)
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. 依存パッケージのインストール

```bash
npm install
```

### 4. TypeScriptのビルド

```bash
npm run build
```

### 5. Electronアプリの起動

```bash
# Electronアプリを起動
npm run electron

# 開発モード（ファイル監視付き）
npm run electron-dev

# Webサーバーとして起動（従来の機能）
npm run dev
npm start
```

---

## パッケージングと配布

### デスクトップアプリのビルド

```bash
# 全プラットフォーム用にビルド
npm run electron-build

# 配布用パッケージのみ作成
npm run electron-dist
```

### ビルド成果物

- **macOS**: DMGファイル
- **Windows**: NSISインストーラー
- **Linux**: AppImageファイル

ビルドされたファイルは `release/` ディレクトリに出力されます。

---

## 開発

### TypeScriptの型チェック

```bash
npm run build
```

### ファイル監視モード

```bash
npm run watch
```

### Electron開発モード

```bash
npm run electron-dev
```

---

## Dockerでの実行（Webサーバー版）

```bash
# Dockerfileを作成してコンテナ化
docker build -t genico-js .
docker run -p 3000:3000 genico-js
```

---

## Webサーバーとしての使用

従来のWebサーバー機能も利用可能です：

```bash
# 開発モード（TypeScript直接実行）
npm run dev

# 本番モード（ビルド済みJavaScript実行）
npm start

# ポート指定
npm start 8080
```

### systemdサービスとして登録する

例: `/etc/systemd/system/genico-js.service`

```ini
[Unit]
Description=PNG to ICO Web Service (TypeScript)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/path/to/genico_js
ExecStart=/usr/bin/node dist/server.js 3000
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### サービスへのアクセス

- ブラウザで `http://localhost:3000` にアクセス
- デフォルトポートは3000番
- ファイアウォール等でポート開放も必要に応じて行ってください

---

## 技術仕様

### 使用技術
- **Electron**: デスクトップアプリフレームワーク
- **TypeScript**: 型安全なJavaScript開発
- **Node.js**: サーバーサイド実行環境
- **Sharp**: 高性能画像処理ライブラリ
- **Electron Builder**: アプリパッケージング

### 主な機能
- PNG画像のICO形式への変換
- ネイティブファイル選択ダイアログ
- ネイティブ保存ダイアログ
- 画像バリデーション（PNG形式、正方形、最小サイズチェック）
- エラーハンドリングとユーザーフレンドリーなメッセージ
- クロスプラットフォーム対応（Windows、macOS、Linux）

### アーキテクチャ
- **メインプロセス**: Electronのメインプロセスでファイル操作と変換処理
- **レンダラープロセス**: ユーザーインターフェース
- **IPC通信**: 安全なプロセス間通信
- **Preloadスクリプト**: セキュアなAPI公開

### 型安全性
- 完全なTypeScript型定義
- インターフェースベースの設計
- コンパイル時エラーチェック

---

## 注意事項
- Node.js 18以上が必要
- PNG形式・正方形・256px以上の画像を推奨
- Sharpライブラリはネイティブバイナリを含むため、初回インストールに時間がかかる場合があります
- Electronアプリは従来のWebサーバー機能も併用可能

---

## ライセンス

MIT License

---

ご質問・不具合はIssueまたはPRでお知らせください。
