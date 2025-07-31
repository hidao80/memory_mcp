# Memory MCP サーバー

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Memory MCP サーバーは、デスクトップ拡張機能向けのローカルで動作するメモリ管理サーバーです。ユーザーの好み、興味、個人情報、現在の状態などを記憶・管理するためのシンプルなインターフェースを提供します。

## 機能

- ユーザー情報の作成、読み取り、更新、削除（CRUD操作）
- メモリの自動保存と読み込み（JSONファイル）
- 操作ログの記録
- デスクトップ拡張機能との統合
- マルチプラットフォーム対応（Windows/macOS/Linux）

## インストール方法

1. GitHubのリリースページから最新版をダウンロードしてください。
2. ダウンロードしたファイルを解凍してください。
3. Claude Desktopの設定ページで、拡張機能ページを開き、解凍した`.dxt`ファイルをドラッグアンドドロップしてください。
4. 有効にすると保存用ファイルの場所を設定します。（必須）

## 使い方

1. Claude Desktopからプロンプトを実行してください。必要に応じて自動的にメモリを更新します。

## 開発者向け情報

### メモリの形式

メモリは以下の形式で保存されます：

```json
{
  "key": "memory_YYYYMMDDHHMMSS",
  "content": "User is [specific info]",
  "timestamp": "YYYY-MM-DDTHH:MM:SS.ssssss"
}
```

### 開発環境の準備

1. リポジトリをクローンします：
   ```bash
   git clone https://github.com/yourusername/memory_mcp.git
   cd memory_mcp
   ```

2. Python 3.8以上がインストールされていることを確認してください。

3. Pythonの依存関係をインストールします：
   ```bash
   pip install -r requirements.txt
   ```

4. DXTファイルを生成します：
   ```bash
   npm run package
   ```

### ディレクトリ構造

```
memory_mcp/
├── .gitignore
├── icon.png         # 拡張機能アイコン
├── index.js         # Node.js エントリーポイント
├── main.py          # Python MCP サーバー
├── manifest.json    # 拡張機能マニフェスト
├── package.json     # プロジェクト設定
├── requirements.txt # Python依存関係
├── README_ja.md     # README（日本語）
├── README.md        # README（英語）
└── dist/            # ビルド出力ディレクトリ
```

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 貢献について

バグレポートやプルリクエストは歓迎します。

## 作者

hidao80

## 謝辞

このMCPサーバーの`main.py`は、[sherryさん](https://zenn.dev/zhizhiarv)の[記事](https://zenn.dev/zhizhiarv/articles/local-memory-mcp-for-claude-desktop#%E5%AE%9F%E8%A3%85)を参考に作成しました。  
ありがとうございます。
