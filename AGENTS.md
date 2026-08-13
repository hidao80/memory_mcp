# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Copilot, etc.) working in this repository.

## What this repo is

**Memory MCP Server** — a single-file Python MCP (Model Context Protocol) server that gives Claude Desktop (and other MCP clients) a local, file-backed memory store for user info: preferences, interests, personal details, current status, etc. It runs locally over stdio and is packaged as a Claude Desktop extension (`.dxt`).

## Key files

- `main.py` — the entire server. Built with `mcp.server.fastmcp.FastMCP`. Defines the in-memory `memory_store` dict, five MCP tools (`list_memory`, `create_memory`, `update_memory`, `read_memory`, `delete_memory`), one MCP resource (`memory://info`), and the JSON-file persistence layer. **This is the source of truth for behavior.**
- `manifest.json` — Claude Desktop extension manifest (`dxt_version`, entry point, `user_config` for `memory_file` path and `port`). Keep `version` here in sync with `package.json` and any release tag.
- `package.json` — npm metadata used only to run `npx @anthropic-ai/dxt pack` (the `package` / `package-ps` scripts) and produce `dist/memory.dxt`. No JS runtime code lives here.
- `requirements.txt` — Python dependencies (MCP SDK).
- `README.md` / `README_ja.md` — user-facing docs (English / Japanese). Keep both in sync when behavior or setup steps change.
- `docs/ADR.md` — Architecture Decision Records, generated/updated from git history.
- `Dockerfile` / `docker-compose.yml` — container packaging for running the server outside Claude Desktop.
- `.github/workflows/lint.yml`, `.github/workflows/audit.yml` — CI: linting and security auditing.

## Runtime model

- Entry point: `python main.py [memory_file] [port]`. If no args are given, the memory file defaults to `<script_dir>/memory_data.json` and transport is stdio.
- All state lives in the module-level `memory_store` dict, loaded from `MEMORY_FILE` at startup (`load_memory_from_file`) and written back to disk on every mutation (`save_memory_to_file`). There is no database — the JSON file *is* the database.
- Every operation (`create`, `read`, `update`, `delete`, `list`, `load`) is logged as a JSON line to `memory_operations.log` next to `main.py` via `log_operation`. This log is an audit trail, not application state — don't read it to determine current memory contents, read the memory file.
- Memory keys are auto-generated as `memory_YYYYMMDDHHMMSS`, with a numeric suffix (`_01`, `_02`, ...) appended on collision.
- Tool docstrings in `main.py` (especially `create_memory`) are prompt instructions consumed directly by the calling LLM (e.g. "always wrap entities in `[[...]]`" for Obsidian-style linking). Treat docstring edits as behavior changes, not just documentation — they change what the calling model does.

## Conventions

- Single-file server: keep `main.py` self-contained unless there's a concrete reason to split it. Don't introduce new files/modules speculatively.
- Every mutating tool wraps its logic in try/except, logs via `log_operation`, and returns a short human-readable string (not structured JSON) as the tool result — match this pattern for any new tool.
- Memory content follows the `"User is ..."` / `"User likes [[X]]"` phrasing convention baked into the `create_memory` docstring; don't silently change this format without updating the docstring and both READMEs.
- No test suite currently exists in this repo. If you add one, wire it into `.github/workflows/lint.yml` or a new workflow rather than leaving it disconnected from CI.

## When you change behavior

- If you change the memory JSON schema (`content` / `created_at` / `updated_at`), update `README.md`'s "Memory Format" section and `README_ja.md` to match.
- If you change `manifest.json` (`user_config`, `entry_point`, `mcp_config`), verify `main.py`'s `sys.argv` handling still matches — the two must agree on argument order (`memory_file`, then `port`).
- Bump `version` in `manifest.json` (and tag/release) for any user-visible change, since this ships as a packaged `.dxt` extension, not a library.
