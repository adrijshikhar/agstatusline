<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/banner-dark.png">
  <img alt="agstatusline - Customizable statusline & status bar for Google Antigravity CLI" src="docs/banner-light.png" width="720">
</picture>

# agstatusline

**⚡ Your Antigravity session, at a glance.**

*Model, thinking effort, context window, Git, quota, subagents, and cost. Your terminal, your layout.*

[![CI](https://github.com/adrijshikhar/agstatusline/actions/workflows/ci.yml/badge.svg)](https://github.com/adrijshikhar/agstatusline/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/agstatusline.svg)](https://www.npmjs.com/package/agstatusline)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Node.js 18+](https://img.shields.io/badge/node-%E2%89%A518-green)](https://nodejs.org/)
[![Bun 1.0+](https://img.shields.io/badge/bun-%E2%89%A51.0-orange)](https://bun.sh)
[![Upstream Parity](https://github.com/adrijshikhar/agstatusline/actions/workflows/upstream-ccstatusline.yml/badge.svg)](https://github.com/adrijshikhar/agstatusline/actions/workflows/upstream-ccstatusline.yml)

</div>

---

## 📚 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Documentation & Guides](#-documentation--guides)
- [Quick Start](#-quick-start)
  - [Installation Options](#installation-options)
  - [Antigravity CLI Configuration](#antigravity-cli-configuration)
- [Default Layout](#-default-layout)
- [Interactive TUI Configuration](#-interactive-tui-configuration)
- [Widget Catalog](#-widget-catalog)
- [CLI Reference](#-cli-reference)
- [Configuration Reference](#-configuration-reference)
- [Advanced Customization](#-advanced-customization)
  - [Powerline Mode](#powerline-mode)
  - [Flex Separators & Right-Alignment](#flex-separators--right-alignment)
  - [Custom Commands](#custom-commands)
  - [Widget Merging](#widget-merging)
  - [Colors & Gradients](#colors--gradients)
- [Upstream Parity Tracking](#-upstream-parity-tracking)
- [Contributing](#-contributing)
- [Development](#-development)
- [License](#-license)

---

## 🔭 Overview

`agstatusline` is a customizable, multi-row statusline and interactive configuration tool designed specifically for the **Google Antigravity CLI (`agy`)**. It connects directly to Antigravity's native statusline runner via standard input/output—requiring **zero binary patching**, **no daemon wrappers**, and no background helper processes.

It operates seamlessly in two modes:
1. **Piped Stream Processor (`!stdin.isTTY`)**: Consumes real-time session telemetry (`StatusLineData` JSON) piped by Antigravity CLI, applies your layout rules, colors, and Powerline glyphs, and renders formatted ANSI strings to stdout.
2. **Interactive Terminal UI (`stdin.isTTY`)**: Launches a full-screen React/Ink terminal interface when run directly, letting you visually arrange widgets across unlimited lines, tune colors, toggle Powerline glyphs, and preview changes with live mock data.

---

## 📖 Documentation & Guides

- **[Usage Guide (`docs/usage.md`)](docs/usage.md)**: Exhaustive reference for all 88 widgets, custom commands, background caching, session name resolution, TUI keybindings, and Powerline setup.
- **[Telemetry Payload Contract (`docs/payload.md`)](docs/payload.md)**: Full JSON telemetry specification between Antigravity CLI and `agstatusline`, field types, fallback resolution, and golden test fixtures.
- **[Contributing Guide (`CONTRIBUTING.md`)](CONTRIBUTING.md)**: Development setup, zero-lint standards, testing against real Antigravity sessions, and automated upstream sync.


---

## ✨ Features

- **📊 Comprehensive Telemetry**: Model names with thinking effort (`low`, `medium`, `high`, `max`), token counts, context percentage & progress bars, API quota reset countdowns, active subagents, background tasks, sandbox status, Vim mode, and USD session costs.
- **⚡ Native Antigravity Integration**: Uses Antigravity's built-in `statusLine` command hook in `~/.gemini/antigravity-cli/settings.json` (with full support for `AIM_PROFILE_DIR` and `ANTIGRAVITY_CONFIG_DIR`).
- **🎯 Clean Default Layout**: Ships out of the box with a focused, production-proven layout: `model` | `context-window` | `git-branch` | `git-changes`.
- **🖥️ Visual React/Ink TUI**: Reorder widgets, add rows, customize padding, select glyphs, test color palettes, and manage installation state interactively.
- **📐 Multi-Line & Flex Layouts**: Build single-row or multi-row statuslines. Use `flex-separator` to split left and right statusline segments that dynamically adjust to your terminal width.
- **⚡ Powerline & Nerd Fonts**: Full support for Powerline arrow glyphs, custom Unicode start/end caps, and automatic multi-line theme continuity.
- **🌈 Rich Color Palettes & Gradients**: Choose between 16-color ANSI, 256-color, TrueColor (24-bit hex), or configure multi-stop foreground gradients per widget or across the entire statusline.
- **🔄 Automated Upstream Parity**: Daily automated CI tracks upstream changes in `sirmalloc/ccstatusline` to ensure `agstatusline` inherits upstream rendering optimizations, bugfixes, and TUI enhancements.

---

## 🚀 Quick Start

### Installation Options

Install `agstatusline` globally using your preferred package manager:

```bash
# Using bun (recommended)
bun add -g agstatusline

# Using npm
npm install -g agstatusline

# Using pnpm
pnpm add -g agstatusline

# Using yarn
yarn global add agstatusline
```

Alternatively, run it directly without global installation:

```bash
# Launch interactive configuration
bunx agstatusline
# or
npx agstatusline
```

### Antigravity CLI Configuration

#### Automatic Configuration (Recommended)
Run the built-in install command:

```bash
agstatusline --install
```

This automatically configures Antigravity CLI's `settings.json` to pipe session telemetry through `agstatusline`. You can check installation status or uninstall at any time:

```bash
# Check status
agstatusline --status

# Uninstall
agstatusline --uninstall
```

#### Manual Configuration
Add or update the `statusLine` block in your Antigravity settings file (`~/.gemini/antigravity-cli/settings.json`, or `$AIM_PROFILE_DIR/.gemini/antigravity-cli/settings.json` if using AIM profiles):

```json
{
  "statusLine": {
    "type": "command",
    "command": "agstatusline",
    "enabled": true
  }
}
```

---

## 🎨 Default Layout

`agstatusline` ships configured with an information-dense, multi-row layout designed for professional Antigravity CLI workflows:

```text
 Line 1:  Gemini 2.5 Pro │ high │ [■■■■······] │ ~/P/m/agstatusline │ main │ +142 -28 
 Line 2:  $0.14 │ 2m 45s │ 82% (4h 12m) │ 14:28:05 │ 120 t/s │ 45 t/s │ 12.5k │ 48.5k/1.0M (5%)
 Line 3:  14.2 GB free │ adrijshikhar26@gmail.com │ User Auth Refactor │ ag-88f12a
```

- **Line 1 (Model, Workspace & VCS)**:
  - `model` (`#61AFEF`): Active model display name (e.g. `Gemini 2.5 Pro`)
  - `thinking-effort` (`#E06C75`): Current reasoning effort level (`low`, `medium`, `high`, `max`)
  - `context-bar` (`#98C379`): Visual progress bar of context window consumption
  - `current-working-dir` (`#ABB2BF`): Fish-style compact workspace path
  - `git-branch` (`#C678DD`): Current Git branch name
  - `git-changes` (`#E5C07B`): Uncommitted insertions, deletions, or dirty state
- **Line 2 (Metrics, Velocity & Usage)**:
  - `session-cost` (`#98C379`): Total USD session cost tracking
  - `block-timer` (`#D19A66`): Elapsed execution time in active turn
  - `weekly-usage` (`#61AFEF`): Quota usage percentage and reset countdown
  - `session-clock` (`#56B6C2`): Session timestamp / duration clock
  - `input-speed` (`#56B6C2`) & `output-speed` (`#61AFEF`): Token generation velocities in tokens/sec
  - `tokens-cached` (`#5C6370`): Total tokens read from prompt cache
  - `session-usage` (`#C678DD`): Total token usage against context limit with progress formatting
- **Line 3 (System, Identity & Session)**:
  - `free-memory` (`#E06C75`): System available memory
  - `account-email` (`#E879F9`): Authenticated user account email
  - `session-name`: Active session title with sub-5ms cached SQLite lookup
  - `session-id`: Active Antigravity session identifier

---

## 🖥️ Interactive TUI Configuration

Run `agstatusline` without piped input (or pass `--tui`) to launch the interactive terminal configuration utility:

```bash
agstatusline
# or
agstatusline --tui
```

### Key Navigation

| Key | Action |
| :--- | :--- |
| `↑` / `↓` | Navigate menu items or widget list |
| `Enter` | Select item / Enter sub-menu |
| `Esc` | Go back / Return to previous menu |
| `q` | Exit TUI and save configuration |
| `a` | Add widget to line |
| `d` | Delete selected widget |
| `m` | Move / Reorder selected widget |
| `c` | Change widget type or color |
| `k` | Duplicate / clone selected widget |
| `r` | Toggle raw value mode |
| `h` | Toggle hideable conditions (e.g. hide when zero / clean) |

### TUI Modules
- **Configure Status Line**: Add, remove, and reorder widgets across multiple independent lines.
- **Color Customization**: Configure individual widget colors, text styles (bold, dim), and multi-stop gradients.
- **Powerline Setup**: Toggle Powerline rendering, configure arrow separators, start/end caps, and column alignment.
- **Terminal Options**: Adjust flex width behavior, padding sides, and compact threshold limits.
- **Install / Uninstall**: One-key integration toggle into Antigravity settings.
- **Live Preview**: Real-time statusline preview with representative Antigravity session payloads.

---

## 🧩 Widget Catalog

`agstatusline` provides **94 modular widgets** plus 2 layout separators across Core, Git, Jujutsu (`jj`), Context, Tokens, Speeds, Quota, Session, Environment, and Custom categories.

👉 **For the complete 94-widget breakdown, options, and keybindings, see the [Usage Guide (`docs/usage.md`)](docs/usage.md).**

### Featured Core & Telemetry Widgets

| Widget Name | ID / Type | Category | Default Color | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Model** | `model` | Core | `cyan` | Active model identifier and reasoning effort level (`low`, `medium`, `high`, `max`) |
| **Session Name** | `session-name` | Core | `white` | Conversation title with sub-5ms cached SQLite lookup from `conversation_summaries.db` |
| **Context Window** | `context-window` | Context | `brightBlack` | Shows context window token usage and capacity (e.g., `45k/1.0M (5%)`) |
| **Context Bar** | `context-bar` | Context | `cyan` | Visual progress bar of context window consumption (e.g. `[■■■■······]`) |
| **Context %** | `context-percentage` | Context | `brightBlack` | Displays context window consumption percentage (e.g., `4.8%`) |
| **Quota Usage** | `quota-usage` | Quota | `yellow` | Remaining or consumed API quota fraction/percentage |
| **Quota Reset** | `quota-reset` | Quota | `brightBlack` | Countdown timer until API quota reset (e.g., `4h 12m`) |
| **Git Branch** | `git-branch` | Git | `magenta` | Current Git repository branch |
| **Git Changes** | `git-changes` | Git | `yellow` | Uncommitted insertions, deletions, or dirty status (e.g., `+12 -4`) |
| **Current Directory** | `current-working-dir` | Environment | `blue` | Current workspace directory with configurable segment depth |
| **Session Cost** | `session-cost` | Cost | `yellow` | Total session cost in USD (e.g., `$0.14`) |
| **Session Clock** | `session-clock` | Time | `brightBlack` | Current session clock time |
| **Sandbox** | `sandbox-status` | Environment | `green` | Antigravity sandbox isolation and network access state |
| **Vim Mode** | `vim-mode` | Status | `magenta` | Current editor mode (`NORMAL`, `INSERT`, `VISUAL`) |
| **Custom Command** | `custom-command` | Custom | `white` | Output from an arbitrary shell command with background caching |
| **Custom Text** | `custom-text` | Custom | `white` | User-defined static text, label, or emoji string |
| **Separator** | `separator` | Layout | `white` | Visual divider between adjacent widgets (`│`, `/`, or custom) |
| **Flex Separator** | `flex-separator` | Layout | `white` | Expanding spacer that pushes subsequent widgets to the right edge |


---

## 🛠️ CLI Reference

```text
agstatusline - customizable status line formatter for Google Antigravity CLI

Usage:
  echo '<json>' | agstatusline     Render statusline from piped JSON payload
  agstatusline [options]           Manage configuration or installation

Options:
  -h, --help                       Show this help message
  -v, --version                    Show version number
  --tui                            Launch interactive configuration TUI
  --install                        Install agstatusline in Antigravity CLI settings
  --uninstall                      Remove agstatusline from Antigravity CLI settings
  --status                         Check if agstatusline is installed in Antigravity CLI
  --config <path>                  Use custom configuration file
```

---

## ⚙️ Configuration Reference

Settings are stored in JSON format at `~/.config/agstatusline/settings.json`.

```json
{
  "version": 4,
  "lines": [
    [
      { "id": "w-model", "type": "model", "color": "hex:61AFEF" },
      { "id": "w-sep1", "type": "separator" },
      { "id": "w-thinking", "type": "thinking-effort", "color": "hex:E06C75" },
      { "id": "w-sep2", "type": "separator" },
      { "id": "w-context-bar", "type": "context-bar", "color": "hex:98C379" },
      { "id": "w-sep3b", "type": "separator" },
      { "id": "w-cwd-l1", "type": "current-working-dir", "color": "hex:ABB2BF", "metadata": { "fishStyle": "true" } },
      { "id": "w-sep4b", "type": "separator" },
      { "id": "w-git-branch", "type": "git-branch", "color": "hex:C678DD" },
      { "id": "w-sep5", "type": "separator" },
      { "id": "w-git-changes", "type": "git-changes", "color": "hex:E5C07B" }
    ],
    [
      { "id": "w-session-cost", "type": "session-cost", "color": "hex:98C379" },
      { "id": "w-sep6", "type": "separator" },
      { "id": "w-block-timer", "type": "block-timer", "color": "hex:D19A66" },
      { "id": "w-sep7", "type": "separator" },
      { "id": "w-weekly-usage", "type": "weekly-usage", "color": "hex:61AFEF" },
      { "id": "w-sep8", "type": "separator" },
      { "id": "w-session-clock", "type": "session-clock", "color": "hex:56B6C2" },
      { "id": "w-sep9", "type": "separator" },
      { "id": "w-input-speed", "type": "input-speed", "color": "hex:56B6C2" },
      { "id": "w-sep9b", "type": "separator" },
      { "id": "w-output-speed", "type": "output-speed", "color": "hex:61AFEF" },
      { "id": "w-sep9c", "type": "separator" },
      { "id": "w-tokens-cached", "type": "tokens-cached", "color": "hex:5C6370" },
      { "id": "w-sep10", "type": "separator" },
      { "id": "w-session-usage-pct", "type": "session-usage", "color": "hex:C678DD", "metadata": { "display": "progress" } }
    ],
    [
      { "id": "w-memory", "type": "free-memory", "color": "hex:E06C75", "rawValue": false },
      { "id": "w-sep-memory", "type": "separator" },
      { "id": "w-account-email", "type": "account-email", "color": "hex:E879F9", "rawValue": false },
      { "id": "w-sep-session-name", "type": "separator" },
      { "id": "w-session-name", "type": "session-name" },
      { "id": "w-sep-session-id", "type": "separator" },
      { "id": "w-session-id", "type": "session-id" }
    ]
  ],
  "flexMode": "full-minus-40",
  "compactThreshold": 60,
  "colorLevel": 2,
  "defaultPaddingSide": "both",
  "inheritSeparatorColors": false,
  "globalBold": false,
  "terminalWidthCacheTtlSeconds": 5,
  "gitCacheTtlSeconds": 5,
  "powerline": {
    "enabled": false,
    "separators": ["|"],
    "separatorInvertBackground": [false],
    "startCaps": [],
    "endCaps": [],
    "autoAlign": true,
    "continueThemeAcrossLines": false
  }
}
```

### Settings Properties

- **`lines`**: Array of rows, each containing an array of `WidgetItem` configurations.
- **`flexMode`**: How the statusline expands to terminal width:
  - `"full"`: Always expand to the full terminal width.
  - `"full-minus-40"`: Leave 40 columns of buffer space.
  - `"full-until-compact"`: Expand until terminal width drops below `compactThreshold`.
- **`compactThreshold`**: Width threshold (in columns) for compact layout collapse (default: `60`).
- **`colorLevel`**: Color support depth: `0` (None/Monochrome), `1` (16 ANSI colors), `2` (256 colors), `3` (TrueColor / 24-bit).
- **`defaultPaddingSide`**: Widget spacing padding: `"both"`, `"left"`, `"right"`, or `"none"`.
- **`powerline`**: Powerline theme, custom glyphs, and alignment options.

---

## 💡 Advanced Customization

### Powerline Mode
Enable Powerline mode to transform your statusline into styled colored segments separated by arrow glyphs:
1. Ensure your terminal uses a [Nerd Font](https://www.nerdfonts.com/) or Powerline font.
2. In the TUI, open **Powerline Setup** and toggle **Enable Powerline**.
3. Customize separator symbols, inverted background transitions, and terminal caps.

### Flex Separators & Right-Alignment
Place a `flex-separator` between widgets to push following widgets to the right margin of your terminal:

```json
[
  { "id": "1", "type": "model", "color": "cyan" },
  { "id": "2", "type": "flex-separator" },
  { "id": "3", "type": "session-clock", "color": "brightBlack" }
]
```

### Custom Commands
Run any shell script or CLI command and embed its output directly in your statusline:
- Add a `Custom Command` widget in the TUI (`a` -> Custom -> Custom Command).
- Configure command line string and optional output caching TTL to minimize subprocess latency.

### Widget Merging
Merge adjacent items together without separators or inner padding to create composite pills (for example, placing an emoji symbol directly beside a metric).

### Colors & Gradients
- Customize foreground and background colors per widget using ANSI names, color numbers `0-255`, or `#RRGGBB` hex strings.
- Apply multi-stop color gradients across individual widgets or entire statusline rows.

---

## 🔄 Upstream Parity Tracking

`agstatusline` is maintained as a faithful Antigravity-native port of `ccstatusline`:
- **Automated Sync**: A scheduled GitHub Actions workflow (`.github/workflows/upstream-ccstatusline.yml`) runs daily against upstream `sirmalloc/ccstatusline`.
- **Automated Triage**: When upstream commits or new releases are detected, an automated issue with detailed changelogs and diff links is created for triage.
- **Upstream Diff Check**: You can manually check upstream diff status at any time:
  ```bash
  bun run scripts/upstream-ccstatusline.ts --dry-run
  ```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our development workflow, coding standards, and pull request process.

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)

---

### Prerequisites
- [Bun](https://bun.sh) (v1.0+) or [Node.js](https://nodejs.org) (v18+)

### Commands

```bash
# Install dependencies
bun install

# Start interactive TUI in development
bun run start

# Run test suite
bun test

# Run tests in watch mode
bun test --watch

# Typecheck and lint (zero-error enforcement)
bun run lint

# Apply ESLint auto-fixes
bun run lint:fix

# Build standalone distribution
bun run build

# Test piped execution with mock payload
echo '{"model":{"id":"gemini-2.5-pro","display_name":"Gemini 2.5 Pro","effort":"high"},"context_window":{"total_input_tokens":45000,"total_output_tokens":3500,"context_window_size":1000000,"used_percentage":4.85},"vcs":{"branch":"main","dirty":true}}' | bun run src/agstatusline.ts
```

---

## 📄 License

[MIT](LICENSE) © 2026 Adrij Shikhar  
Portions © 2025 Matthew Breedlove (`ccstatusline`)
