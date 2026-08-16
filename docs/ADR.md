# Architecture Decision Records (ADR)

Architectural decisions extracted from the `memory_mcp` Git history (2025-07-31 through 2026-08-13, 17 commits).

---

## ADR-001: Adopt Python (FastMCP) for the MCP desktop extension

- **Status**: Accepted (the language choice itself was later revisited in ADR-002)
- **Date**: 2025-07-31
- **Context**: A locally running memory management server was needed for Claude Desktop, packaged as a DXT (Desktop Extension).
- **Decision**: The initial commit bundled both Node.js (`index.js`) and Python (`main.py`). `manifest.json`'s `server.type` pointed to `node` with `entry_point: index.js`, while the actual data logic was implemented in `main.py` using the `fastmcp` library.
- **Consequences**: The project started with two overlapping runtimes and no clear signal for which one was actually invoked. This duplication was resolved in ADR-002.

---

## ADR-002: Consolidate the server entry point on Python (`main.py`), dropping Node.js (`index.js`)

- **Status**: Accepted
- **Date**: 2025-08-01 (commit `dc2b53b`, "Fix conflict with other local MCP server built-in DXT")
- **Context**: The entry point collided with another locally installed MCP server's built-in DXT. Keeping `index.js` (66 lines) around while actually calling `python main.py` caused conflicts depending on the runtime environment.
- **Decision**:
  - Changed `manifest.json`'s `server.type` from `node` to `python`, and `entry_point` from `index.js` to `main.py`.
  - Deleted `index.js`.
  - Unified the package name from `memory-mcp-server` to `memory` (in both `package.json` and `manifest.json`).
  - Added a port number as `user_config.port` (default `58902`), extending `main.py`'s startup arguments to `[memory_file, port]`.
  - Added `.dxtignore` to explicitly exclude files from packaging.
- **Consequences**: The runtime was unified on Python alone, and all subsequent bug fixes and features were consolidated into `main.py`. However, this same commit introduced what looks like leftover debug code (`time.sleep(5); os.exit()`) into `load_memory_from_file()` (see ADR-005), which caused a follow-on bug.

---

## ADR-003: Store memory as an in-process dict, persisted to a JSON file (no database)

- **Status**: Accepted (still current)
- **Context**: As a local desktop extension, lightweight persistence without an external database or middleware was required.
- **Decision**: Keep `memory_store: dict` as a module-level global, loaded from `MEMORY_FILE` (JSON) via `json.load` at startup, and rewritten in full via `json.dump` on every update. Keys are generated as `memory_YYYYMMDDHHMMSS` timestamps, with a numeric suffix (`_01`, `_02`, ...) appended on collision.
- **Consequences**:
  - The implementation is simple but has no real scalability for concurrent writes or large datasets (considered acceptable for the scope of a desktop extension).
  - `MEMORY_FILE`'s location can be overridden externally via a startup argument (`sys.argv[1]`) or `manifest.json`'s `user_config.memory_file`, accommodating different save locations per environment.

---

## ADR-004: Replace `print`-based logging with structured JSONL logging (`log_operation`)

- **Status**: Accepted
- **Date**: 2025-08-10 (commit `021cea2`, "Fix: Resolve memory JSON file loading failure" — applied broadly here; the function itself was added in the same commit)
- **Context**: Logging was initially limited to `print()` calls, making it impossible to trace success/failure or before/after state.
- **Decision**: Introduced `log_operation()`, appending one JSON object per line to `memory_operations.log` (timestamp, operation_id (uuid4), operation, key, before, after, success, error, metadata). Each of `create`/`update`/`delete` now records before/after values.
- **Consequences**: Auditing and debugging operations became much easier, but the log file grows without bound — log rotation is not implemented (currently out of scope).

---

## ADR-005: Remove blocking debug code (`time.sleep(5)` + `os.exit()`) from the load path

- **Status**: Accepted
- **Date**: 2025-08-09 to 2025-08-10 (three commits: `8047d7e` → `2195f1e` → `021cea2`)
- **Context**: ADR-002 (`dc2b53b`) had introduced `time.sleep(5)` and `os.exit()` into `load_memory_from_file()`, causing the process to terminate right after loading the memory file (the root cause of Issue #1, "memory data lost on client restart").
  - `8047d7e` removed `import time` but left the `time.sleep(5)` call in place, triggering a `NameError`.
  - `2195f1e` restored `import time` as a stopgap to avoid the error.
  - `021cea2` rewrote `load_memory_from_file()` entirely, fully removing `time.sleep(5)` / `os.exit()` and replacing them with `log_operation("load", ...)` logging.
- **Decision**: The load path now only reads the file and logs the result — it no longer has the side effect of terminating the process.
- **Consequences**: Memory persistence and reload-on-restart now work correctly. This sequence of fixes marked a shift toward "find and remove the root cause" rather than stacking further stopgap patches.

---

## ADR-006: Add container support via a Docker multi-stage build

- **Status**: Accepted
- **Date**: 2026-01-17 (commit `a4d1d14`)
- **Context**: A need to support running locally/on a server via Docker, as an alternative to the DXT (Claude Desktop extension) path.
- **Decision**:
  - Split `Dockerfile` into `builder`/`runner` stages, installing only `requirements.txt` in the builder and copying `--user` packages into the `runner` stage (smaller image).
  - Run as a non-root user (`appuser`/`appgroup`, uid/gid 1001), with `EXPOSE 58902` declared explicitly.
  - `docker-compose.yml` mounts `main.py` and `memory_data.json` as volumes for development, building with `target: runner`.
  - Added `.dockerignore` to minimize the build context.
- **Consequences**: The same codebase can now be reused outside the DXT environment (e.g. as a standalone server). However, `docker-compose.yml` binds a fixed host port (`58902`), which is defined independently of `manifest.json`'s port setting (dual configuration).

---

## ADR-007: Split CI into separate Lint (Ruff) and dependency security audit (pip-audit) workflows

- **Status**: Accepted
- **Date**: 2026-01-17 (commit `424aeca`)
- **Context**: Wanted continuous detection of both code style inconsistencies and known vulnerabilities in dependencies.
- **Decision**: Split `.github/workflows/lint.yml` (`ruff check .`) and `.github/workflows/audit.yml` (`pip-audit -r requirements.txt`) into separate jobs and separate workflow files. Both trigger on `push`/`pull_request` against `master`. Added status badges to the README.
- **Consequences**: Failures are now attributable to a specific concern at a glance. Splitting into two workflows slightly increases total CI runtime and Actions usage.

---

## ADR-008: Change the CI runner from `ubuntu-latest` to `ubuntu-slim`

- **Status**: Accepted (needs verification)
- **Date**: 2026-01-17 (commit `e7fdf41`)
- **Context**: Intended to change the CI execution environment (the exact motivation isn't clear from the commit message alone — presumably a move to a lighter-weight runner).
- **Decision**: Changed `runs-on` in both `lint.yml` and `audit.yml` from `ubuntu-latest` to `ubuntu-slim`. Also normalized YAML string quoting from single to double quotes.
- **Consequences**: **Caution**: `ubuntu-slim` is not among GitHub Actions' standard hosted runner labels (`ubuntu-latest`, `ubuntu-24.04`, `ubuntu-22.04`, etc.). Unless it's registered as a self-hosted runner label, jobs using it may queue indefinitely without ever acquiring an execution environment. This entry only records the current state — any fix is left for separate, explicitly approved follow-up work.

---

## ADR-009: Tighten exception handling to concise messages and add a Ruff configuration file

- **Status**: Accepted
- **Date**: 2026-08-13 (commit `96fa273`)
- **Context**: Exception handling in `main.py` needed tightening for clarity, and linting configuration for Ruff had no dedicated home.
- **Decision**: Reworked exception messages in `main.py` to be more concise, and added `pyproject.toml` to hold Ruff's linting configuration.
- **Consequences**: Error output is easier to read and act on; lint configuration is now version-controlled and discoverable in the standard `pyproject.toml` location instead of being implicit in CI invocation flags.

---

## ADR-010: Bump `actions/checkout` and `actions/setup-python` to their latest major versions

- **Status**: Accepted
- **Date**: 2026-08-13 (commit `17297ef`)
- **Context**: `lint.yml` was pinned to `actions/checkout@v4` and `actions/setup-python@v5`, which had fallen behind current releases.
- **Decision**: Bumped both actions in `lint.yml` to `@v7`. `audit.yml` was not touched in this commit and still references the older action versions.
- **Consequences**: `lint.yml` now tracks current GitHub Actions releases; `audit.yml` remains on older versions, which is a drift worth revisiting. This commit does not address the `ubuntu-slim` runner concern raised in ADR-008 — that issue is still open for both workflows.

---

## Addendum: Versioning history

`manifest.json`'s `version` increased monotonically alongside the bug-fix commits described above (`1.0.0` → `1.0.1` (`dc2b53b`) → `1.0.2` (`8047d7e`) → `1.0.3` (`2195f1e`) → `1.0.4` (`021cea2`, current). No version bump accompanied the Docker, CI, or later tooling-related commits (ADR-006 through ADR-010).
