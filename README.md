# PNG to ICO Webサービス (TypeScript版)

このリポジトリは、PNG画像をWindows用ICOファイルに変換するWebサービスです。Python版からTypeScriptに変換されました。

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

### 5. サーバーの起動

```bash
# 開発モード（TypeScript直接実行）
npm run dev

# 本番モード（ビルド済みJavaScript実行）
npm start

# ポート指定
npm start 8080
```

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

---

## Dockerでの実行

```bash
# Dockerfileを作成してコンテナ化
docker build -t genico-js .
docker run -p 3000:3000 genico-js
```

---

## systemdサービスとして登録する

### 1. systemdサービスファイルの作成

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

### 2. systemdサービスの有効化・起動

```bash
sudo systemctl daemon-reload
sudo systemctl enable genico-js
sudo systemctl start genico-js
```

---

## サービスへのアクセス

- ブラウザで `http://localhost:3000` にアクセス
- デフォルトポートは3000番
- ファイアウォール等でポート開放も必要に応じて行ってください

---

## 技術仕様

### 使用技術
- **TypeScript**: 型安全なJavaScript開発
- **Node.js**: サーバーサイド実行環境
- **Sharp**: 高性能画像処理ライブラリ
- **Formidable**: マルチパートフォーム解析

### 主な機能
- PNG画像のICO形式への変換
- 複数サイズ（256px, 128px, 48px, 32px, 16px）での生成
- 画像バリデーション（PNG形式、正方形、最小サイズチェック）
- エラーハンドリングとユーザーフレンドリーなメッセージ

### 型安全性
- 完全なTypeScript型定義
- インターフェースベースの設計
- コンパイル時エラーチェック

---

## 注意事項
- Node.js 18以上が必要
- PNG形式・正方形・256px以上の画像を推奨
- 生成されたicoファイルはサーバーに保存されません
- Sharpライブラリはネイティブバイナリを含むため、初回インストールに時間がかかる場合があります

---

ご質問・不具合はIssueまたはPRでお知らせください。
