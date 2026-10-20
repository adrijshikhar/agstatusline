# Upstream ccstatusline v2.2.32 Parity & Antigravity Rebranding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the interactive TUI for Google Antigravity CLI (`agy`), fix the model preview to Gemini 2.5 Pro, and port all 69 upstream commits from `ccstatusline v2.2.32` covering security hardening, ANSI performance, Git bugfixes, and TUI enhancements.

**Architecture:** 
1. Fix TUI branding and settings wiring so `agstatusline` correctly interacts with `~/.gemini/antigravity-cli/settings.json`, displays Gemini models, and brands headers/menus appropriately.
2. Port upstream engine enhancements (ASCII fast-path, maxWidth truncation, Powerline ANSI reset background preservation, safe 0600 file modes, Git execution hardening against repo configs, and NO_PROXY handling).
3. Port upstream VCS enhancements (detached HEAD, tag-shadowed branches, submodule worktrees, fish-style path abbreviation, and GitIsFork widget).
4. Port upstream TUI enhancements (label editor `e` shortcut, hotkey modifier filtering, color menu fixes, and line editor edge cases).
5. Advance baseline commit in `scripts/upstream-ccstatusline.json` to `v2.2.32`.

**Tech Stack:** TypeScript, Bun, React 19 / Ink 6, Vitest, Zod, Git, Node.js built-ins (`node:*`).

---

### Task 0: Antigravity TUI Rebranding & Model Preview Fix

**Files:**
- Modify: `src/widgets/Model.ts:1-37`
- Modify: `src/tui/App.tsx:100-1400`
- Modify: `src/tui/components/MainMenu.tsx:50-200`
- Modify: `src/tui/components/ExportConfigDialog.tsx:15-20`
- Modify: `src/tui/components/TerminalWidthMenu.tsx:130-135`
- Test: `src/widgets/__tests__/Model.test.ts`
- Test: `src/tui/__tests__/App.test.ts`

- [ ] **Step 1: Update ModelWidget preview and description**
Update `src/widgets/Model.ts` to return `'Gemini 2.5 Pro'` / `'Model: Gemini 2.5 Pro'` in preview mode and describe Gemini models.
Update `src/widgets/__tests__/Model.test.ts` to assert `Model: Gemini 2.5 Pro` in preview mode.

- [ ] **Step 2: Update App.tsx header and repository URLs**
Change `<Gradient name='retro'>CCStatusline Configuration</Gradient>` to `<Gradient name='retro'>agstatusline Configuration</Gradient>`.
Change `GITHUB_REPO_URL` to `'https://github.com/adrijshikhar/agstatusline'`.

- [ ] **Step 3: Rewire TUI installation to Antigravity CLI settings**
In `src/tui/App.tsx` and `src/tui/components/MainMenu.tsx`, replace Claude Code settings calls with `isStatusLineInstalled`, `installStatusLine`, `uninstallStatusLine`, and `getAntigravitySettingsPath` from `src/utils/antigravity-settings.ts`.
Change menu items to `📦 Install to Antigravity CLI` and `🔌 Uninstall from Antigravity CLI`.

- [ ] **Step 4: Update ExportConfigDialog and TerminalWidthMenu copy**
Set default export path to `agstatusline-config.json`.
Update terminal width explanation to refer to Antigravity CLI.

- [ ] **Step 5: Run tests, lint, and build package**
Run: `bun run lint && bun test`
Run: `bun run build`

---

### Task 1: Milestone 1 - Core Engine, Performance & Security Hardening

**Files:**
- Modify: `src/utils/ansi.ts`
- Modify: `src/utils/renderer.ts`
- Modify: `src/utils/powerline.ts`
- Modify: `src/utils/git.ts`
- Create: `src/utils/git-hardening.ts`
- Modify: `src/utils/config.ts`
- Create: `src/utils/no-proxy.ts`
- Test: `src/utils/__tests__/ansi.test.ts`
- Test: `src/utils/__tests__/git-hardening.test.ts`
- Test: `src/utils/__tests__/no-proxy.test.ts`

- [ ] **Step 1: Implement ASCII fast-path and memoized cluster widths in ansi.ts**
Port `fast-path ASCII` and memoized cluster widths from ccstatusline commit `c74f402`.
Add tests in `src/utils/__tests__/ansi.test.ts`.

- [ ] **Step 2: Truncation and maxWidth clamping fixes in renderer.ts**
Ensure zero-width truncation returns empty string without crashing, clamp lines to maxWidth, and keep Powerline background active across ANSI resets (commit `1a6e588`, `055ae22`, `01e1f16`).
Verify with renderer unit tests.

- [ ] **Step 3: Git subprocess execution hardening**
Port `git-hardening.ts` preventing repo-controlled git configs from executing arbitrary binaries or scripts via environment flags (`GIT_CONFIG_NOSYSTEM=1`, `GIT_CONFIG_GLOBAL`, `-c core.fsmonitor=`, etc.) (commit `810d424`).
Add tests in `src/utils/__tests__/git-hardening.test.ts`.

- [ ] **Step 4: Restrictive 0600 file permissions on config saves**
Update atomic write in `src/utils/config.ts` to enforce `0o600` mode for configuration and backup files (commit `4c62e31`).

- [ ] **Step 5: NO_PROXY host matching and bounded timeouts**
Create `src/utils/no-proxy.ts` to evaluate `NO_PROXY` / `no_proxy` rules directly without routing through external proxies (commit `e8ef3cb`).
Add tests in `src/utils/__tests__/no-proxy.test.ts`.

- [ ] **Step 6: Run verification**
Run: `bun run lint && bun test`

---

### Task 2: Milestone 2 - VCS & CWD Enhancements

**Files:**
- Modify: `src/utils/git.ts`
- Modify: `src/widgets/CurrentWorkingDir.ts`
- Create: `src/widgets/GitIsFork.ts`
- Modify: `src/utils/widgets.ts`
- Modify: `src/utils/widget-manifest.ts`
- Test: `src/utils/__tests__/git.test.ts`
- Test: `src/widgets/__tests__/GitIsFork.test.ts`
- Test: `src/widgets/__tests__/CurrentWorkingDir.test.ts`

- [ ] **Step 1: Git detached HEAD, tag-shadowed branches & submodule worktrees**
Port git ref resolution improvements from commit `fa9bb7e` and linear time `.git` file parsing (commit `ae9721e`).
Avoid spawning git subprocesses repeatedly when directory is verified non-git (commit `07589a2`).

- [ ] **Step 2: Fish-style CWD home abbreviation on boundary**
Fix `~` replacement in `src/widgets/CurrentWorkingDir.ts` so paths like `~/foo` are abbreviated, but paths like `/home/foo~bar` are not corrupted (commit `236805c`, `92baba9`).
Add test in `src/widgets/__tests__/CurrentWorkingDir.test.ts`.

- [ ] **Step 3: Port GitIsFork widget**
Implement `GitIsForkWidget` rendering a configurable glyph when git repository origin is a fork (commit `12a6233`).
Register in widget manifest and registry.
Add unit tests in `src/widgets/__tests__/GitIsFork.test.ts`.

- [ ] **Step 4: Run verification**
Run: `bun run lint && bun test`

---

### Task 3: Milestone 3 - Interactive TUI Enhancements

**Files:**
- Create: `src/tui/components/LabelEditor.tsx`
- Modify: `src/tui/components/ItemsEditor.tsx`
- Modify: `src/tui/components/items-editor/input-handlers.ts`
- Modify: `src/tui/components/ColorMenu.tsx`
- Modify: `src/tui/components/PowerlineSeparatorEditor.tsx`
- Test: `src/tui/components/__tests__/ItemsEditor.test.ts`
- Test: `src/tui/components/__tests__/ColorMenu.test.tsx`

- [ ] **Step 1: Implement LabelEditor component and shortcut 'e'**
Create `LabelEditor.tsx` allowing users to edit widget labels directly (commit `994dd68`, `7bed5f2`).
Wire `e` key in `input-handlers.ts`.
Add tests for label editing.

- [ ] **Step 2: Hotkey modifier filtering in TUI**
Filter out shortcuts when `key.ctrl` or `key.meta` is pressed so terminal shortcuts don't trigger editor actions (commit `04ede95`).
Add tests in `input-handlers.test.ts`.

- [ ] **Step 3: Color menu & Powerline fixes**
Fix number key navigation and hidden separator rendering in `ColorMenu.tsx` (commit `5f95f44`).
Preserve custom number formats when resetting colors (commit `dfa54ba`).
Keep Powerline separator inversion list dense (commit `bf6f33e`).

- [ ] **Step 4: Line editor edge cases**
Handle widget merging when on the last widget, wrap navigation, and save-guard return routing (commit `5c92391`).

- [ ] **Step 5: Run verification**
Run: `bun run lint && bun test`

---

### Task 4: Milestone 4 - Baseline Bump, Docs & Final Parity Verification

**Files:**
- Modify: `scripts/upstream-ccstatusline.json`
- Modify: `NOTICE`
- Modify: `AGENTS.md`

- [ ] **Step 1: Update upstream baseline commit**
Set `baseCommit: "19c6665ecf14309a5ffcfcda5e31972833dd821a"` in `scripts/upstream-ccstatusline.json`.
Verify with `bun run scripts/upstream-ccstatusline.ts --dry-run` that total new commits is 0 (up to date).

- [ ] **Step 2: Update NOTICE and documentation**
Document ccstatusline v2.2.32 parity in `NOTICE`.

- [ ] **Step 3: Full test suite, lint, and distribution build**
Run: `bun run lint` (must be 0 errors, 0 warnings).
Run: `bun test` (100% pass).
Run: `bun run build`.

- [ ] **Step 4: Test standalone bundle and close parity issue #7**
Test `agstatusline` standalone bundle with piped payload.
Close GitHub issue #7 as completed with parity summary.
