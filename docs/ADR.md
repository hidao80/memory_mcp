# Architecture Decision Records (ADR)

`memory_mcp` の Git 履歴（2025-07-31〜2026-01-17、全10コミット）から抽出したアーキテクチャ上の決定を記録する。

---

## ADR-001: MCP デスクトップ拡張機能として Python (FastMCP) を採用

- **Status**: Accepted（その後 ADR-002 で言語自体は再決定）
- **Date**: 2025-07-31
- **Context**: Claude Desktop 向けにローカル実行するメモリ管理サーバーが必要。DXT (Desktop Extension) 形式でパッケージングする前提があった。
- **Decision**: 初回コミットでは Node.js (`index.js`) と Python (`main.py`) の両方を同梱し、`manifest.json` の `server.type` は `node` / `entry_point: index.js` を指定。実データ操作ロジックは `main.py`（`fastmcp` ライブラリ）に実装。
- **Consequences**: 実行系が二重に存在し、どちらが実際に呼ばれるかが曖昧な状態でスタートした。この重複は ADR-002 で解消される。

---

## ADR-002: サーバーエントリポイントを Node.js (`index.js`) から Python (`main.py`) に一本化

- **Status**: Accepted
- **Date**: 2025-08-01（コミット `dc2b53b`「Fix conflict with other local MCP server built-in DXT」）
- **Context**: 他のローカル MCP サーバーの組み込み DXT とエントリポイントが衝突する不具合が発生。`index.js` (66行) を残したまま `python main.py` を呼ぶ構成は実行環境によって衝突した。
- **Decision**:
  - `manifest.json` の `server.type` を `node` → `python`、`entry_point` を `index.js` → `main.py` に変更。
  - `index.js` を削除。
  - パッケージ名を `memory-mcp-server` → `memory` に統一（`package.json` / `manifest.json` 双方）。
  - ポート番号を `user_config.port`（デフォルト `58902`）として追加し、`main.py` の起動引数を `[memory_file, port]` の2引数に拡張。
  - `.dxtignore` を新設し、パッケージング対象から除外するファイルを明示。
- **Consequences**: 実行系が Python 単一に統一され、以後のバグ修正・機能追加はすべて `main.py` に集約される。ただし本コミットで `time.sleep(5); os.exit()` というデバッグ用と思われるコードが `load_memory_from_file()` に混入し（ADR-006 参照）、後続バグの原因となった。

---

## ADR-003: メモリストアはプロセス内 dict + JSON ファイル永続化（DB非使用）

- **Status**: Accepted（現在も継続）
- **Context**: ローカルデスクトップ拡張として、外部DBやミドルウェアなしで動作する軽量な永続化が求められる。
- **Decision**: `memory_store: dict` をグローバル変数として保持し、起動時に `MEMORY_FILE`（JSON）から `json.load`、更新の都度 `json.dump` で全量書き込みする素朴な方式を採用。キーは `memory_YYYYMMDDHHMMSS` 形式のタイムスタンプ生成（衝突時は `_01`, `_02`... を連番付加）。
- **Consequences**:
  - 実装は単純だが、同時書き込みや大規模データに対するスケーラビリティはない（デスクトップ拡張のスコープでは許容範囲と判断されている）。
  - `MEMORY_FILE` の場所は起動引数（`sys.argv[1]`）または `manifest.json` の `user_config.memory_file` で外部から指定可能にし、環境ごとの保存先の違いに対応。

---

## ADR-004: 操作ログを `print` から構造化 JSONL (`log_operation`) に置き換え

- **Status**: Accepted
- **Date**: 2025-08-10（コミット `021cea2`「Fix: Resolve memory JSON file loading failure」で全面適用、関数自体は同コミットで追加）
- **Context**: 当初は `print()` によるログのみで、成功/失敗や変更前後の状態を追跡できなかった。
- **Decision**: `log_operation()` を導入し、`memory_operations.log` に1行1JSON（timestamp, operation_id (uuid4), operation, key, before, after, success, error, metadata）で追記する形式に統一。`create/update/delete` の各ツールで変更前後の値を記録するようにした。
- **Consequences**: 操作の監査・デバッグが容易になった一方、ログファイルは無制限に追記され続けるためログローテーション等は未実装（現状スコープ外）。

---

## ADR-005: ロード時のデバッグ用ブロッキングコード（`time.sleep(5)` + `os.exit()`）の除去

- **Status**: Accepted
- **Date**: 2025-08-09〜2025-08-10（`8047d7e` → `2195f1e` → `021cea2` の3コミットにわたる修正）
- **Context**: ADR-002 (`dc2b53b`) で `load_memory_from_file()` 内に `time.sleep(5)` と `os.exit()` が混入しており、メモリファイル読み込み後にプロセスが強制終了する状態になっていた（Issue #1「メモリデータがクライアント再起動時に消える」の根本原因）。
  - `8047d7e` で `import time` を除去したが、`time.sleep(5)` の呼び出し自体は消し忘れており `NameError` を誘発。
  - `2195f1e` で `import time` を復元し、暫定的にエラーを回避。
  - `021cea2` で `load_memory_from_file()` を書き直し、`time.sleep(5)` / `os.exit()` を完全に削除し、`log_operation("load", ...)` によるロギングへ置換。
- **Decision**: ロード処理はファイル読み込み→ログ記録のみとし、プロセスを終了させる副作用を持たせない。
- **Consequences**: メモリの永続化・再起動時のロードが正常に機能するようになった。この一連の修正は「小さな暫定対応を重ねるより、根本原因（デバッグコードの残留）を特定して除去する」方針への転換点になっている。

---

## ADR-006: Docker マルチステージビルドによるコンテナ実行のサポート追加

- **Status**: Accepted
- **Date**: 2026-01-17（コミット `a4d1d14`）
- **Context**: DXT（Claude Desktop 拡張）以外の実行手段として、Docker 経由でのローカル/サーバー実行をサポートする要求。
- **Decision**:
  - `Dockerfile` を builder/runner の2ステージ構成にし、`requirements.txt` のみを builder でインストールして `runner` ステージへ `--user` パッケージをコピー（イメージ軽量化）。
  - 非rootユーザー（`appuser`/`appgroup`, uid/gid 1001）で実行し、`EXPOSE 58902` を明示。
  - `docker-compose.yml` で開発時は `main.py` と `memory_data.json` をボリュームマウントし、`target: runner` を指定してビルド。
  - `.dockerignore` を追加し、ビルドコンテキストを最小化。
- **Consequences**: DXT 以外の環境（サーバー常駐運用等）でも同一コードベースを再利用できるようになった。ただし `docker-compose.yml` はホストの `58902` ポートに固定でバインドしており、`manifest.json` 側のポート設定とは独立した定義になっている（二重管理）。

---

## ADR-007: CI に Lint (Ruff) と依存関係セキュリティ監査 (pip-audit) を分離して導入

- **Status**: Accepted
- **Date**: 2026-01-17（コミット `424aeca`）
- **Context**: コードスタイルの一貫性と依存パッケージの既知脆弱性を継続的に検知したい。
- **Decision**: `.github/workflows/lint.yml`（`ruff check .`）と `.github/workflows/audit.yml`（`pip-audit -r requirements.txt`）を別ジョブ・別ワークフローとして分離。両方とも `push`/`pull_request` の `master` ブランチ対象で発火。README にステータスバッジを追加。
- **Consequences**: 関心事ごとにワークフローが分かれ、どちらが失敗したか一目で分かる。ジョブが2つに分かれる分、CI実行時間・Actions消費はわずかに増える。

---

## ADR-008: CI ランナーを `ubuntu-latest` から `ubuntu-slim` に変更

- **Status**: Accepted（要検証）
- **Date**: 2026-01-17（コミット `e7fdf41`）
- **Context**: CI 実行環境の変更を意図したもの（詳細な動機はコミットメッセージからは不明。より軽量なランナーへの切り替えと推測される）。
- **Decision**: `lint.yml` / `audit.yml` の `runs-on` を `ubuntu-latest` → `ubuntu-slim` に変更。合わせて YAML 内の文字列クォートをシングル→ダブルに統一。
- **Consequences**: **注意**: `ubuntu-slim` は GitHub Actions がホストする標準ランナーラベル（`ubuntu-latest`, `ubuntu-24.04`, `ubuntu-22.04` 等）には含まれておらず、self-hosted runner のラベルとして登録されていない限り、このジョブは実行環境を確保できずキューイングされたまま失敗する可能性がある。本ドキュメントは現状の記録のみを目的としており、修正はユーザーの承認後に別途対応する。

---

## 補足: バージョニングの経緯

`manifest.json` の `version` は本文中の各バグ修正コミットに追随して単調増加している（`1.0.0` → `1.0.1`（dc2b53b）→ `1.0.2`（8047d7e）→ `1.0.3`（2195f1e）→ `1.0.4`（021cea2、現行））。Docker/CI 関連の追加コミットではバージョン番号の更新は行われていない。
