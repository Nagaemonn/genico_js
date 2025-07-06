# PNG to ICO Webサービス

このリポジトリは、PNG画像をWindows用ICOファイルに変換するWebサービスです。

---

## Ubuntu Serverでのセットアップ手順

### 1. リポジトリのクローン

```bash
# 任意のディレクトリで
git clone git@github.com:Nagaemonn/genico.git
cd genico
```

### 2. Python仮想環境(venv)の作成

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. 依存パッケージのインストール

```bash
pip install -r requirements.txt
```

### 4. サーバーの起動（手動）

```bash
python server.py
# またはポート指定
python server.py 8080
```

---

## systemdサービスとして登録する

### 1. systemdサービスファイルの作成

例: `/etc/systemd/system/genico.service`

```ini
[Unit]
Description=PNG to ICO Web Service
After=network.target

[Service]
Type=simple
User=ubuntu  # ←適宜ユーザー名に変更！！！！
WorkingDirectory=/home/ubuntu/genico  # ←パスを修正
ExecStart=/home/ubuntu/genico/venv/bin/python server.py 23479 # ←ここもパスを修正
Restart=always

[Install]
WantedBy=multi-user.target
```

### 2. systemdサービスの有効化・起動

```bash
sudo systemctl daemon-reload
sudo systemctl enable genico
sudo systemctl start genico
```

### 3. ステータス確認・ログ確認

```bash
sudo systemctl status genico
journalctl -u genico -f
```

---

## サービスへのアクセス

- ブラウザで `http://サーバーIP:23479` にアクセス
- ファイアウォール等でポート開放も必要に応じて行ってください

---

## 注意事項
- Pillow（PIL）以外は標準ライブラリのみで動作します
- PNG形式・正方形・256px以上の画像を推奨
- 生成されたicoファイルはサーバーに保存されません

---

ご質問・不具合はIssueまたはPRでお知らせください。
