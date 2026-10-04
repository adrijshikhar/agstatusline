# Usage Guide

Reference for configuring `agstatusline`: every widget you can place on your statusline, metadata options, keyboard shortcuts, formatting flags, and layout modes.

Configure everything interactively by running `agstatusline` with no arguments (or pass `--tui`). Settings are saved to `~/.config/agstatusline/settings.json` (or `$XDG_CONFIG_HOME/agstatusline/settings.json`).

---

## 📚 Table of Contents

- [Widget Catalog](#-widget-catalog)
  - [Core & Antigravity Telemetry](#core--antigravity-telemetry)
  - [Git & Jujutsu VCS](#git--jujutsu-vcs)
  - [Context & Compaction](#context--compaction)
  - [Tokens & Speeds](#tokens--speeds)
  - [Quota & Rate Limits](#quota--rate-limits)
  - [Session & Environment](#session--environment)
  - [Custom Content](#custom-content)
  - [Layout](#layout)
- [Custom Widgets & Shell Commands](#-custom-widgets--shell-commands)
  - [Synchronous Execution (Default)](#synchronous-execution-default)
  - [Background Caching (`refreshMs`)](#background-caching-refreshms)
  - [Color Preservation & Width Limits](#color-preservation--width-limits)
- [Session Name Resolution](#-session-name-resolution)
- [Interactive TUI & Keyboard Shortcuts](#-interactive-tui--keyboard-shortcuts)
- [Powerline & Font Setup](#-powerline--font-setup)
- [Terminal Width & Flex Modes](#-terminal-width--flex-modes)
- [Colors & Gradients](#-colors--gradients)

---

## 🧩 Widget Catalog

`agstatusline` features 88 modular widgets organized into logical categories. All widgets implement the unified `Widget` interface and consume real-time Antigravity telemetry (`StatusLineData`) piped via stdin.

### Core & Antigravity Telemetry

| Type | Display Name | Default Color | Description |
| :--- | :--- | :--- | :--- |
| `model` | Model | `cyan` | Displays the active Antigravity model name (e.g. `Gemini 2.5 Pro`, `Gemini 2.5 Flash`) and thinking effort level (e.g. `[effort: high]`). Supports raw value mode. |
| `thinking-effort` | Thinking Effort | `cyan` | Displays the current thinking / reasoning effort level (`low`, `medium`, `high`, `max`). |
| `session-name` | Session Name | `white` | Displays the active Antigravity session / conversation title (e.g. `User Auth Refactor`). Supports sub-5ms cached SQLite lookup. |
| `session-id` | Session ID | `brightBlack` | Shows the active Antigravity session ID (UUID or shortened hash). |
| `version` | Version | `brightBlack` | Displays the Antigravity CLI version or `agstatusline` package version. |
| `output-style` | Output Style | `brightBlack` | Displays the configured output style (e.g. `standard`, `concise`, `code`). |
| `claude-status` | Antigravity Status | `green` | Displays service status and connectivity health indicator. |
| `account-email` | Account Email | `brightBlack` | Displays the authenticated user account email address. |
| `skills` | Skills | `magenta` | Displays loaded Antigravity skills or count of active skill plugins. |

### Git & Jujutsu VCS

`agstatusline` provides comprehensive, high-performance VCS inspection with zero process blocking:

#### Git Widgets

| Type | Display Name | Default Color | Description |
| :--- | :--- | :--- | :--- |
| `git-branch` | Git Branch | `magenta` | Current Git branch name (or detached commit SHA). |
| `git-changes` | Git Changes | `yellow` | Combined uncommitted diff stats (e.g. `+142 -28` or `*`). |
| `git-insertions` | Git Insertions | `green` | Uncommitted line insertions count (e.g. `+142`). |
| `git-deletions` | Git Deletions | `red` | Uncommitted line deletions count (e.g. `-28`). |
| `git-staged-files` | Git Staged Files | `green` | Number of files staged for commit. |
| `git-unstaged-files` | Git Unstaged Files | `yellow` | Number of modified files not yet staged. |
| `git-untracked-files` | Git Untracked Files | `brightBlack` | Number of untracked files in the repository. |
| `git-clean-status` | Git Clean Status | `green` | Indicator showing if the working tree is clean. |
| `git-root-dir` | Git Root Dir | `blue` | Name of the root directory of the current Git repository. |
| `git-review` | Git PR / MR | `cyan` | Pull / Merge Request number associated with the current branch. |
| `git-ci-status` | Git CI Status | `yellow` | CI build status for the current commit / branch. |
| `git-worktree` | Git Worktree | `magenta` | Shows if the session is running in a linked Git worktree. |
| `git-status` | Git Status | `yellow` | Compact composite status string representing staged, modified, and untracked files. |
| `git-staged` | Git Staged | `green` | Staged changes counter or glyph indicator. |
| `git-unstaged` | Git Unstaged | `yellow` | Unstaged changes counter or glyph indicator. |
| `git-untracked` | Git Untracked | `brightBlack` | Untracked files counter or glyph indicator. |
| `git-ahead-behind` | Git Ahead/Behind | `cyan` | Commits ahead / behind upstream tracking branch (e.g. `⇡2 ⇣1`). |
| `git-conflicts` | Git Conflicts | `red` | Number of unresolved merge / rebase conflicts. |
| `git-sha` | Git SHA | `brightBlack` | Short commit SHA of HEAD. |
| `git-origin-owner` | Origin Owner | `brightBlack` | Repository owner on `origin` remote (e.g. `adrijshikhar`). |
| `git-origin-repo` | Origin Repo | `brightBlack` | Repository name on `origin` remote (e.g. `agstatusline`). |
| `git-origin-owner-repo` | Origin Owner/Repo | `brightBlack` | Full `owner/repo` path on `origin`. |
| `git-upstream-owner` | Upstream Owner | `brightBlack` | Repository owner on `upstream` remote. |
| `git-upstream-repo` | Upstream Repo | `brightBlack` | Repository name on `upstream` remote. |
| `git-upstream-owner-repo` | Upstream Owner/Repo | `brightBlack` | Full `owner/repo` path on `upstream`. |
| `git-is-fork` | Git Fork Status | `cyan` | Indicator indicating if the repository is a fork. |
| `worktree-mode` | Worktree Mode | `magenta` | Mode indicator for Git worktree sessions. |
| `worktree-name` | Worktree Name | `magenta` | Name of the active worktree directory. |
| `worktree-branch` | Worktree Branch | `magenta` | Branch checked out in the active worktree. |
| `worktree-original-branch` | Original Branch | `brightBlack` | Base branch from which the worktree was branched. |

#### Jujutsu (`jj`) Widgets

| Type | Display Name | Default Color | Description |
| :--- | :--- | :--- | :--- |
| `jj-bookmarks` | JJ Bookmarks | `magenta` | Active Jujutsu bookmarks / branches. |
| `jj-workspace` | JJ Workspace | `blue` | Name of the active Jujutsu workspace. |
| `jj-root-dir` | JJ Root Dir | `blue` | Root directory of the Jujutsu repository. |
| `jj-changes` | JJ Changes | `yellow` | Working copy diff summary in Jujutsu format. |
| `jj-insertions` | JJ Insertions | `green` | Line insertions in the active Jujutsu change. |
| `jj-deletions` | JJ Deletions | `red` | Line deletions in the active Jujutsu change. |
| `jj-description` | JJ Description | `brightBlack` | Change description / commit summary of current working copy. |
| `jj-revision` | JJ Revision | `cyan` | Change ID / commit ID of active Jujutsu revision. |

---

### Context & Compaction

| Type | Display Name | Default Color | Description |
| :--- | :--- | :--- | :--- |
| `context-window` | Context Window | `brightBlack` | Formatted token usage and model capacity (e.g. `48.5k/1.0M (5%)` or `48k / 1.0M`). |
| `context-bar` | Context Bar | `cyan` | Visual progress bar displaying context window consumption (e.g. `[■■■■······]`). |
| `context-percentage` | Context % | `brightBlack` | Percentage of total context window used (or remaining). |
| `context-percentage-usable` | Context % (Usable) | `brightBlack` | Percentage consumed relative to safe usable context buffer (80% threshold). |
| `context-length` | Context Length | `brightBlack` | Raw count of active tokens currently in context. |
| `compaction-counter` | Compaction Counter | `brightBlack` | Number of context compaction / truncation events in the session. |

---

### Tokens & Speeds

| Type | Display Name | Default Color | Description |
| :--- | :--- | :--- | :--- |
| `tokens-input` | Tokens Input | `brightBlack` | Cumulative input tokens processed in the current session. |
| `tokens-output` | Tokens Output | `brightBlack` | Cumulative output tokens generated in the current session. |
| `tokens-cached` | Tokens Cached | `brightBlack` | Number of tokens read from prompt cache. |
| `tokens-total` | Tokens Total | `brightBlack` | Blended total of input, output, and cached tokens. |
| `cache-hit-rate` | Cache Hit Rate | `green` | Percentage of tokens served from cache vs cache writes. |
| `cache-read` | Cache Read Tokens | `brightBlack` | Cumulative tokens read from cache. |
| `cache-write` | Cache Write Tokens | `brightBlack` | Cumulative tokens written to prompt cache. |
| `cache-timer` | Cache Timer | `brightBlack` | Cache window expiration countdown timer. |
| `input-speed` | Input Speed | `brightBlack` | Average input token ingestion speed in tokens/second. |
| `output-speed` | Output Speed | `brightBlack` | Average generation speed in tokens/second. |
| `total-speed` | Total Speed | `brightBlack` | Combined session token throughput speed. |

---

### Quota & Rate Limits

| Type | Display Name | Default Color | Description |
| :--- | :--- | :--- | :--- |
| `session-usage` | Session Usage | `yellow` | Percentage of current session rate limit consumed. |
| `weekly-usage` | Weekly Usage | `yellow` | Weekly API usage percentage across models. |
| `weekly-sonnet-usage` | Weekly Sonnet Usage | `yellow` | Model-specific weekly utilization percentage. |
| `weekly-opus-usage` | Weekly Opus Usage | `yellow` | Model-specific weekly utilization percentage. |
| `fable-weekly-usage` | Fable Weekly Usage | `yellow` | Fable tier weekly quota utilization. |
| `extra-usage-utilization` | Extra Usage % | `yellow` | Percentage of extra usage bucket consumed. |
| `extra-usage-remaining` | Extra Usage Left | `yellow` | Remaining extra usage allowance. |
| `extra-usage-used` | Extra Usage Used | `yellow` | Amount of extra usage consumed. |
| `reset-timer` | Reset Timer | `brightBlack` | Time remaining until current rate limit resets (e.g. `3h 45m`). |
| `weekly-reset-timer` | Weekly Reset Timer | `brightBlack` | Time remaining until weekly usage quota resets. |
| `block-timer` | Block Timer | `brightBlack` | Countdown timer for current billing / rate block. |

---

### Session & Environment

| Type | Display Name | Default Color | Description |
| :--- | :--- | :--- | :--- |
| `session-clock` | Session Clock | `brightBlack` | Current time or elapsed session duration (configurable format). |
| `session-cost` | Session Cost | `yellow` | Total session cost in USD (e.g. `$0.14`). |
| `current-working-dir` | Current Working Dir | `blue` | Current workspace directory with `~` substitution and configurable segment depth. |
| `terminal-width` | Terminal Width | `brightBlack` | Current terminal width in columns (e.g. `120`). |
| `free-memory` | Memory Usage | `brightBlack` | System RAM usage formatted as `used/total` (e.g. `14.2G/32.0G`). |
| `sandbox-status` | Sandbox Status | `green` | Antigravity execution sandbox status (`sandbox: on`, `net-restricted`, or `off`). |
| `vim-mode` | Vim Mode | `magenta` | Current editor mode in Antigravity (`NORMAL`, `INSERT`, `VISUAL`). |
| `voice-status` | Voice Status | `cyan` | Antigravity voice mode audio input status. |
| `remote-control-status`| Remote Control | `cyan` | Remote control / daemon pairing status. |

---

### Custom Content

| Type | Display Name | Default Color | Description |
| :--- | :--- | :--- | :--- |
| `custom-text` | Custom Text | `white` | Fixed user-defined static text, label, or emoji string. |
| `custom-symbol` | Custom Symbol | `white` | Single user-defined glyph, icon, or emoji. |
| `custom-command` | Custom Command | `white` | Executes an arbitrary shell command and renders its stdout. Supports background caching. |
| `link` | Link | `cyan` | Clickable terminal hyperlink using OSC 8 escape sequences. |

---

### Layout

| Type | Display Name | Description |
| :--- | :--- | :--- |
| `separator` | Separator | Fixed visual divider between adjacent widgets (`│`, `/`, `•`, etc.). |
| `flex-separator` | Flex Separator | Dynamic spacer that expands to push following widgets to the right margin of the terminal. |

---

## 🛠️ Custom Widgets & Shell Commands

You can embed dynamic metrics, system health, or project context using the `custom-command` widget.

### Configuration Fields

```json
{
  "id": "my-cmd",
  "type": "custom-command",
  "commandPath": "git status -s | wc -l | tr -d ' '",
  "refreshMs": 5000,
  "timeout": 300,
  "preserveColors": false,
  "maxWidth": 20
}
```

- **`commandPath`**: Shell command to execute via `/bin/sh -c`.
- **`refreshMs`**: Background caching interval in milliseconds (see below).
- **`timeout`**: Synchronous execution timeout in milliseconds (max 600ms, default 300ms).
- **`preserveColors`** (key `p` in TUI): Retain ANSI foreground colors output by the command.
- **`maxWidth`** (key `w` in TUI): Maximum display width before truncating with an ellipsis (`...`).

### Synchronous Execution (Default)

When `refreshMs` is omitted:
- The command executes synchronously on **every statusline render**.
- Commands run within the current session's working directory (`cwd`) and inherit environment variables.
- Execution is strictly capped at **300ms by default (600ms absolute maximum)** to prevent blocking the terminal.
- Over-budget commands display `[Timeout]`, missing binaries display `[Cmd not found]`, and non-zero exit codes display `[Exit: N]`.
- Keep synchronous commands lightweight and local (e.g. `date +%H:%M`, `git rev-parse --short HEAD`).

### Background Caching (`refreshMs`)

For expensive commands (such as network queries, package manager checks, or repository statistics):
- Specify `refreshMs` (e.g. `5000` for 5 seconds). Any value below `1000` is raised to a 1-second floor.
- **Non-blocking**: Rendering reads the latest cached result from disk and never blocks the prompt.
- **Background Refresh**: When the cache expires, `agstatusline` spawns a detached worker to update the result in the background.
- **Cold Start**: Shows `[Loading]` until the first background execution completes.
- **Cache Storage**: Results are safely stored under `~/.cache/agstatusline/commands/` (or `$XDG_CACHE_HOME/agstatusline/commands/`).
- **Auto-Eviction**: Stale cache entries are automatically purged after 7 days.

---

## 🔍 Session Name Resolution

Antigravity sessions can be renamed on the fly via `/rename`. `agstatusline` resolves session names using a multi-tiered lookup engine:

1. **Direct Payload**: Inspects `conversation_title`, `session_name`, and `conversation_name` in the incoming stdin JSON telemetry.
2. **SQLite Reverse Lookup**: If omitted from the payload, queries Antigravity CLI's session database:
   - Database location: `~/.gemini/antigravity-cli/conversation_summaries.db` (respects `$AIM_PROFILE_DIR` and `$ANTIGRAVITY_CONFIG_DIR`).
   - Query: Matches session ID against `conversations` table.
   - Sub-5ms in-memory cache: Cached lookups eliminate disk I/O overhead on repeated renders.
3. **Graceful Fallback**: Displays the session ID or empty string if no title has been assigned yet.

---

## ⌨️ Interactive TUI & Keyboard Shortcuts

Launch the visual configurator at any time:

```bash
agstatusline
# or
agstatusline --tui
```

### Navigation & Actions

| Key | Context | Action |
| :--- | :--- | :--- |
| `↑` / `↓` | All Menus | Navigate items / widgets |
| `Enter` | All Menus | Select item / Enter submenu / Confirm selection |
| `Esc` | All Menus | Go back / Cancel |
| `q` | Main Menu | Save configuration and exit TUI |
| `a` | Items Editor | Add a new widget from the categorized catalog |
| `d` | Items Editor | Delete selected widget |
| `m` | Items Editor | Toggle reorder mode (use `↑`/`↓` to reposition) |
| `k` | Items Editor | Duplicate / clone selected widget |
| `r` | Items Editor | Toggle raw value mode (drops labels like `ctx:`) |
| `c` | Items Editor | Change color / open Color Menu |
| `h` | Items Editor | Configure hideable conditions (e.g. hide when clean / zero) |
| `b` | Color Menu | Toggle bold text style |
| `d` | Color Menu | Cycle dim text style (none, whole widget, parens only) |
| `p` | Custom Command | Toggle color preservation |
| `w` | Custom Command | Set maximum display width |
| `f` | Custom Command | Configure background refresh interval (`refreshMs`) |

---

## ⚡ Powerline & Font Setup

`agstatusline` supports Powerline-styled statuslines with seamless arrow transitions, background fills, and terminal caps.

### Requirements

To render Powerline glyphs correctly, configure your terminal emulator with a [Nerd Font](https://www.nerdfonts.com/) (such as *FiraCode Nerd Font*, *JetBrainsMono Nerd Font*, or *MesloLGS NF*).

### Setup in TUI

1. Launch `agstatusline`.
2. Select **Powerline Setup**.
3. Toggle **Enable Powerline** to `true`.
4. Configure options:
   - **Separators**: Choose from standard arrow (`\uE0B0`), angled, curved, or flame dividers.
   - **Invert Background**: Invert arrow foreground/background relationships for alternating segments.
   - **Start & End Caps**: Add rounded or bracketed caps to the edges of each statusline row.
   - **Theme Continuity**: Maintain background palette flow across multiple rows.

---

## 📐 Terminal Width & Flex Modes

Control how statusline rows expand and handle terminal resizing via `flexMode`:

- **`full` (Default)**: Expands the statusline to fill the entire width of your terminal window. `flex-separator` pushes widgets following it all the way to the right margin.
- **`full-minus-40`**: Reserves 40 columns of buffer space on the right, providing breathing room in wide windows.
- **`full-until-compact`**: Expands to full width until terminal width drops below `compactThreshold` (default: 60 columns), at which point flex separators collapse to single spaces.

---

## 🎨 Colors & Gradients

### Supported Color Depths

- **`colorLevel: 0`**: Monochrome (no ANSI escape codes).
- **`colorLevel: 1`**: Standard 16-color ANSI (`black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, and `bright*` variants).
- **`colorLevel: 2`**: 256-color palette (indexes `0` through `255`).
- **`colorLevel: 3`**: TrueColor 24-bit RGB (hex codes such as `#58a6ff`, `#3fb950`).

### Gradients

You can apply linear multi-stop color gradients across individual widgets or entire statusline rows:
- Configure start and end color hex codes.
- The renderer interpolates RGB values character-by-character while strictly preserving ANSI reset boundaries.
