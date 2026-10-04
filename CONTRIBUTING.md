# Contributing to agstatusline

Thank you for your interest in contributing to `agstatusline`! This document provides detailed guidelines for developing, testing, and contributing code, widgets, and documentation.

---

## 🧭 Philosophy & Core Principles

1. **Antigravity CLI Native**: Built specifically for Google Antigravity CLI (`agy`). First-class support for Gemini 1M/2M context windows, thinking / reasoning effort levels (`low`, `medium`, `high`, `max`), quota bucket tracking, subagent states, and conversation titles with sub-5ms cached SQLite lookup.
2. **Dual Runtime Compatibility**: Fully compatible with both **Bun (1.0+)** and **Node.js (18+)**. Development and tests run primarily on Bun; production bundles target standalone Node.js.
3. **Zero Lint & Type Error Policy**: We enforce a strict zero-warning policy (`bun run lint` running `tsc --noEmit && eslint . --max-warnings=0`). Never disable a lint rule with an inline comment (`// eslint-disable`, `@ts-ignore`, or `@ts-nocheck`).
4. **Upstream Parity**: We maintain continuous parity with upstream `sirmalloc/ccstatusline` while preserving all Antigravity adapters, layout optimizations, and schema extensions.
5. **Ultra-Low Latency Stdio Pipeline**: Piped rendering runs frequently on cycle redraws. The stdio path must remain lean, avoiding heavy dependencies like React or Ink at top-level import.

---

## 🛠️ Development Setup

### Prerequisites

- [Bun](https://bun.sh) (v1.0 or newer)
- [Node.js](https://nodejs.org) (v18 or newer)
- Git

### Installation

```bash
git clone https://github.com/adrijshikhar/agstatusline.git
cd agstatusline
bun install
```

### Essential Commands

```bash
# Run complete test suite (2,370+ unit and integration tests)
bun test

# Run tests in watch mode during development
bun test --watch

# Type check and lint with zero-warning enforcement
bun run lint

# Apply ESLint auto-fixes where possible
bun run lint:fix

# Build standalone distribution bundle (dist/agstatusline.js)
bun run build

# Launch interactive React/Ink configuration TUI
bun run start

# Test piped statusline rendering with sample payload
echo '{"model":{"id":"gemini-2.5-pro","display_name":"Gemini 2.5 Pro"},"effort":{"level":"high"},"context_window":{"total_input_tokens":45000,"total_output_tokens":3500,"context_window_size":1000000,"used_percentage":4.85}}' | bun run src/agstatusline.ts
```

---

## 🏛️ Architecture Overview

The repository is structured into distinct, modular subsystems:

```text
src/
├── agstatusline.ts          # CLI entry point (detects piped stdin vs interactive TTY)
├── types/                   # TypeScript schemas & Zod definitions (StatusJSON, Settings, Widget)
├── utils/
│   ├── renderer.ts          # Core rendering pipeline (padding, powerline, flex width)
│   ├── payload.ts           # Antigravity stdin JSON parser & normalizer
│   ├── config.ts            # Atomic settings loader & saver (~/.config/agstatusline/)
│   ├── antigravity-settings.ts # Antigravity CLI settings installer (~/.gemini/antigravity-cli/)
│   ├── widget-manifest.ts   # Declarative catalog of all 88 widgets & layout elements
│   ├── widgets.ts           # Widget registry Map & fuzzy search helpers
│   ├── colors.ts            # ANSI 16/256/TrueColor color styling & gradients
│   └── powerline.ts         # Powerline arrow dividers, backgrounds, and caps
├── widgets/                 # Modular widget implementations (Model, Git, Context, Quota, etc.)
└── tui/                     # Interactive React/Ink terminal configuration UI
    ├── App.tsx              # Root TUI component & navigation state
    └── components/          # Menus, widget editors, color pickers, and live preview
```

### High-Performance Piped Execution vs Lazy TUI

- When `!process.stdin.isTTY`, `src/agstatusline.ts` reads the stdin stream with a 1-second safety timeout, parses telemetry with `parsePayload()`, loads settings with `loadSettings()`, and prints the rendered ANSI string.
- The interactive React/Ink TUI (`src/tui/`) is **dynamically imported** only when running in an interactive terminal. This guarantees piped prompt execution executes in single-digit milliseconds without loading the React runtime or Yoga layout engine.

---

## 🧪 Testing Guidelines

- **Vitest Suite**: All unit, widget, and integration tests live under `src/**/__tests__/` and `test/`.
- **TDD Workflow**: When adding or fixing widgets, write unit tests verifying:
  1. Default formatted display with representative Antigravity payloads.
  2. Raw value mode (`rawValue: true`).
  3. Graceful degradation when telemetry fields are `null`, `undefined`, or empty.
  4. Hideable states (e.g. hiding git status when clean).
- **Testing against Real Antigravity Sessions**:
  1. Build the distribution bundle: `bun run build`.
  2. Install into your local Antigravity settings: `bun run src/agstatusline.ts --install`.
  3. Start an Antigravity session (`agy`) in another terminal and verify the statusline updates during cycles.
  4. Check the installation status at any time: `bun run src/agstatusline.ts --status`.

---

## 🌿 Branching & Pull Requests

Direct pushes to `main` are restricted. All contributions must follow this workflow:

1. **Create a topic branch**:
   ```bash
   git checkout -b feat/my-new-widget
   # or
   git checkout -b fix/issue-description
   ```
2. **Implement changes and ensure tests pass**:
   ```bash
   bun test
   bun run lint
   bun run build
   ```
3. **Commit using Conventional Commits**:
   - `feat(...)`: New feature or widget
   - `fix(...)`: Bug fix or edge-case handling
   - `docs(...)`: Documentation improvements
   - `chore(...)`: Tooling, dependencies, or maintenance
   - `test(...)`: Adding or updating test suites
4. **Open a Pull Request**:
   - Fill out the PR template completely.
   - Attach test output or screenshots demonstrating the change.

---

## 🔄 Upstream Parity Management

`agstatusline` maintains continuous synchronization with upstream `sirmalloc/ccstatusline`:

- **Automated Daily Watcher**: `.github/workflows/upstream-ccstatusline.yml` runs daily at `04:30 UTC`.
- **Comparison Engine**: `scripts/upstream-ccstatusline.ts` compares the tracked `baseCommit` in `scripts/upstream-ccstatusline.json` with the latest upstream commit and releases.
- **Dry Run Audit**: You can inspect upstream changes locally:
  ```bash
  bun run scripts/upstream-ccstatusline.ts --dry-run
  ```
- **Syncing Upstream Changes**:
  1. Review commits reported by the watcher.
  2. Port bugfixes, rendering improvements, or TUI features into `agstatusline`.
  3. Update `baseCommit` in `scripts/upstream-ccstatusline.json` to the new upstream SHA.
  4. Run full test and lint verification before submitting a PR.

---

## 🔒 Clean Defaults & Privacy

- **No Personal Configurations**: Never commit personal filesystem paths (e.g. `/Users/<name>/...`), private bash scripts, custom machine-specific aliases, or personal API tokens.
- **Universal Default Settings**: The default layout in `src/types/Settings.ts` must only contain standard, universal widgets that function out of the box across any environment.
- **Reporting Security Issues**: Review [SECURITY.md](SECURITY.md) for instructions on confidentially reporting vulnerabilities.
