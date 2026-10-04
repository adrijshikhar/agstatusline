# AGENTS.md

This file provides guidance to AI coding assistants (including Claude Code, Antigravity, and Gemini) when working with code in this repository.

## Project Overview

`agstatusline` is a customizable, multi-row status line formatter and interactive terminal UI configuration tool for **Google Antigravity CLI (`agy`)**. It connects directly to Antigravity's native statusline runner via standard input/output. It functions as both:
1. A piped command processor for Antigravity CLI status lines (`!isTTY`)
2. An interactive React/Ink TUI configuration tool when run directly or with `--tui` (`isTTY`)

## Development Commands

```bash
# Install dependencies
bun install

# Run in interactive TUI mode (development)
bun run start
# or
bun run src/agstatusline.ts

# Test with piped Antigravity telemetry payload
echo '{"model":{"id":"gemini-2.5-pro","display_name":"Gemini 2.5 Pro","effort":"high"},"context_window":{"total_input_tokens":45000,"total_output_tokens":3500,"context_window_size":1000000,"used_percentage":4.85},"vcs":{"branch":"main","dirty":true}}' | bun run src/agstatusline.ts

# Build for distribution (Node.js 18+ and Bun compatible standalone bundle)
bun run build

# Smoke test built distribution bundle
echo '{"model":{"id":"gemini-2.5-pro","display_name":"Gemini 2.5 Pro","effort":"high"},"context_window":{"total_input_tokens":45000,"total_output_tokens":3500,"context_window_size":1000000,"used_percentage":4.85},"vcs":{"branch":"main","dirty":true}}' | node dist/agstatusline.js

# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Type check and lint (must have 0 errors and 0 warnings)
bun run lint

# Apply ESLint auto-fixes intentionally
bun run lint:fix

# Check upstream ccstatusline parity diff (dry run)
bun run scripts/upstream-ccstatusline.ts --dry-run
```

## Architecture

The project has dual runtime compatibility—it develops and tests natively with Bun, and bundles into a standalone ESM script that runs under both Bun and Node.js 18+:

### Dual-Mode Contract
- **Piped Mode (`!process.stdin.isTTY`)**:
  - Reads Antigravity's `StatusLineData` JSON payload from stdin with a 1-second timeout.
  - Parses payload with `parsePayload()` (handles malformed JSON, missing fields, and fallbacks safely).
  - Loads user settings from `~/.config/agstatusline/settings.json` (or `--config <path>`).
  - Formats widgets, colors, padding, and Powerline glyphs via `renderMultipleLines()`.
  - Writes formatted ANSI strings to stdout.
- **Interactive Mode (`process.stdin.isTTY` or `--tui`)**:
  - Dynamically imports and initializes the React 19 / Ink 6 terminal configuration UI.
  - Allows adding, deleting, moving, and editing widgets across multiple lines.
  - Supports color editing (ANSI, 256, TrueColor, gradients), Powerline setup, and terminal sizing.
  - Provides a live preview with representative Antigravity payloads.
  - Manages installation into `~/.gemini/antigravity-cli/settings.json`.

### Directory Structure
- **`src/agstatusline.ts`**: Main entrypoint handling CLI flags (`--install`, `--uninstall`, `--status`, `--tui`, `--config`, `-v`, `-h`) and dispatching between piped rendering and TUI mode.
- **`src/types/`**:
  - `Payload.ts`: TypeScript interfaces for Antigravity CLI telemetry (`StatusLineData`, `StatusLineModel`, `StatusLineContextWindow`, `StatusLineVCS`, `StatusLineQuotaBucket`, `StatusLineSubagent`, `StatusLineCost`, `StatusLineSandbox`, `StatusLineVim`).
  - `Settings.ts`: Zod schema and defaults for statusline configuration (`Settings`, `WidgetItem`).
  - `Widget.ts`: `Widget` interface contract and display metadata.
  - `canonical-widget-types.ts`: Union of all registered widget identifier types.
  - `ColorLevel.ts`: Terminal color depth enum (0 = none, 1 = 16 colors, 2 = 256 colors, 3 = truecolor).
  - `RenderContext.ts`: Rendering execution context containing payload and width limits.
- **`src/utils/`**:
  - `antigravity-settings.ts`: Manages installation into `~/.gemini/antigravity-cli/settings.json` (respecting `ANTIGRAVITY_CONFIG_DIR` and `AIM_PROFILE_DIR`).
  - `config.ts`: Loads and saves `agstatusline` settings at `~/.config/agstatusline/settings.json` using atomic file writes.
  - `renderer.ts`: Core line rendering engine, handling terminal width calculation, truncation, flex separators, and ANSI colors.
  - `powerline.ts`: Powerline glyph rendering, arrow separators, caps, and palette mapping.
  - `colors.ts`: ANSI code generation, TrueColor hex conversion, and gradient interpolation.
  - `widgets.ts`: Registry mapping canonical widget types to instances.
  - `widget-manifest.ts`: Manifest catalog of all widgets, descriptions, and categories.
  - `payload.ts`: Resilient JSON parser and normalizer for Antigravity telemetry.
  - `vcs.ts`: VCS utilities and git status resolution.
- **`src/widgets/`**:
  - Modular implementations for Model, ContextWindow, ContextBar, ContextPercentage, QuotaUsage, QuotaReset, AgentState, Subagents, Tasks, Sandbox, VimMode, SessionCost, GitBranch, GitChanges, CurrentWorkingDir, SessionClock, TerminalWidth, CustomText, CustomSymbol, CustomCommand, and Version.
- **`src/tui/`**:
  - `index.tsx`: Terminal UI lifecycle and initialization.
  - `App.tsx`: Navigation router, keyboard dispatch, and configuration state container.
  - `components/`: Modular UI views (MainMenu, LineSelector, ItemsEditor, ColorMenu, PowerlineSetup, TerminalOptionsMenu, StatusLinePreview, GlobalOverridesMenu).
- **`scripts/`**:
  - `replace-version.ts`: Postbuild script injecting package version into bundled artifacts.
  - `upstream-ccstatusline.ts`: Automated GitHub compare utility detecting upstream updates in `sirmalloc/ccstatusline`.
  - `upstream-ccstatusline.json`: Upstream tracking baseline commit.
- **`.github/workflows/`**:
  - `ci.yml`: Automated CI running linter, type checks, and tests on push and pull requests.
  - `upstream-ccstatusline.yml`: Daily cron tracking upstream `ccstatusline` changes.

## Coding and Maintenance Guidelines

1. **Lint Rules**:
   - Zero tolerance for lint errors or warnings (`--max-warnings=0`).
   - Never disable any ESLint or TypeScript rule with an inline comment (`// eslint-disable...` is strictly forbidden).
   - Run verification via `bun run lint`.
2. **Bun Toolchain**:
   - Always prefer `bun` over `node` or `npm` (`bun run`, `bun test`, `bun install`, `bun build`).
   - Bun automatically loads `.env` files; do not add `dotenv`.
3. **Dual Runtime Compatibility**:
   - Bundle output must run cleanly on Node.js 18+ and Bun.
   - Use Node.js built-ins with the `node:` protocol (e.g., `node:fs/promises`, `node:path`).
4. **Ink Compatibility**:
   - macOS backspace key handling is patched via `patches/ink@6.2.0.patch`.
   - Never remove or bypass this patch during dependency updates.
5. **Testing**:
   - All features and bugfixes must include corresponding unit tests in `test/`.
   - Ensure `bun test` passes 100% before committing.
