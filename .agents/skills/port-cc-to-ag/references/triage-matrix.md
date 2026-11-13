# Upstream Commit Triage Matrix

This document defines the deterministic rules for classifying upstream commits from `sirmalloc/ccstatusline` when porting changes to `agstatusline`.

Every upstream commit between `baseCommit` and the target commit must be categorized into exactly one of the four categories below.

---

## Triage Categories

### Category A: Direct Port (UI, Generic Widgets, Terminal, Formatting)

**Definition:**  
Changes that apply directly to generic statusline presentation, terminal capabilities, version control widgets, or rendering infrastructure without Claude-specific dependencies.

**In-Scope Components:**
- **Git & Jujutsu (JJ) Widgets**: Branch, status, changes, ahead/behind counters, commit hashes, symbol slots, clean/dirty state.
- **Generic Widgets**: Custom Command, Custom Symbol, Custom Text, Static Text, Session Clock, Free Memory.
- **Powerline Infrastructure**: Powerline themes, separators, colors, background styling, glyphs, and palette indexing.
- **Terminal Capabilities**: Terminal width detection, process tree ancestor walking, width caching (`AGSTATUSLINE_WIDTH`), `COLUMNS` override handling.
- **Layout & Sizing Engine**: Flex mode (`full`, `full-minus-40`), padding, alignment, margin, truncation, and ellipsis formatting.
- **ANSI & Text Helpers**: SGR stripping, visible length calculation, color sanitization, gradient interpolation.
- **Documentation & Metadata**: Project summaries (`llms.txt`), generic CLI flags, preview mode improvements.

**Porting Action:**
1. Fetch the upstream diff (`bun run scripts/port-upstream.ts diff <commit>`).
2. Apply code translation patterns from [translation-guide.md](translation-guide.md).
3. Port or author unit tests in `src/widgets/__tests__/` or `test/`.
4. Implement in `src/`.
5. Preserve Matthew Breedlove's copyright attribution in `NOTICE`.

---

### Category B: Adapt to Antigravity (Usage, Telemetry & Session)

**Definition:**  
Changes that involve usage statistics, rate limits, session duration, or telemetry that are architecturally shared between Claude Code and Google Antigravity CLI, but require data-model adaptation.

**In-Scope Components:**
- **Quota & Usage Percentage Widgets**: Quota usage (`QuotaUsage`), block usage (`SessionUsage`), rate limits.
- **Reset Timers**: Quota reset (`QuotaReset`), block reset (`BlockResetTimer`), weekly reset timer (`WeeklyResetTimer`).
- **Antigravity-Specific Widgets**: Subagents, Tasks, AgentState, VimMode, SandboxStatus, ThinkingEffort.
- **Session Duration & Accounting**: Session elapsed time, active API turn duration, token usage counters.
- **Hideable States**: Hiding widgets under specific conditions (e.g. `no-data` placeholder hiding when quota telemetry is unavailable).

**Adaptation Criteria & Rules:**
- **Data Model Translation**: Claude Code stores session JSON files on disk; Antigravity CLI provides telemetry structures via `StatusJSON` piped to stdin. Adapt all property accesses to match the Antigravity schema in `src/types/StatusJSON.ts`.
- **Keybind Collision Prevention**:
  The shared item editor reserves `h` for toggling the hide checklist. When upstream introduces mode toggles that use `h`, remap them:
  - Weekly Reset Timer `(h)ours only` $\rightarrow$ `(o)nly hours` (`key: 'o'`)
  - Time format `12/24 (h)our` $\rightarrow$ `12/24 (f)ormat` (`key: 'f'`)
- **Zero-Usage vs No-Data**:
  Ensure that 0% utilization with valid session telemetry is rendered as `0%` rather than triggering missing-data / `[Loading]` placeholders.

**Porting Action:**
1. Map Claude data structures to `StatusJSON` equivalents.
2. Write unit tests with mock Antigravity telemetry fixtures covering edge cases (0% usage, null fields, reset dates in past/future).
3. Implement in `src/widgets/` and verify no keybind collisions with existing items editor shortcuts.

---

### Category C: Skip / Drop (Claude-Specific Infrastructure & Auth)

**Definition:**  
Features, modules, or dependencies tightly coupled to Anthropic infrastructure, Claude Code credentials, or third-party Claude-only tooling that have no functional relevance to Google Antigravity CLI.

**Excluded Components:**
- **macOS Keychain & Auth**: Reading Claude tokens from macOS Keychain, OAuth refresh token exchange, credential persistence.
- **Anthropic APIs**: Direct Anthropic API calls, billing headers, Anthropic status endpoints.
- **Pricing & Tier Constants**: Anthropic model pricing tables, tier definitions (e.g. Claude Pro/Max tier checks).
- **Claude-Specific Third-Party Links**: Integrations with Claude-only tools (e.g. `claudenews`, Claude plugins).

**Handling Action:**
1. Mark commit as **Category C (Skip)** in the triage log.
2. Document the specific reason (e.g. "Claude macOS Keychain credential access — out of scope for Antigravity").
3. Do not port any code, dependencies, or tests.

---

### Category D: Tooling & Dependencies (Dev-Dependencies & Build)

**Definition:**  
Upstream changes to dev-dependencies, build configurations, linting rules, or repository automation.

**Evaluation Rules:**
- `agstatusline` uses **Bun** as its primary development runtime and test runner, targeting Node >=18 for distribution.
- Upstream dev-dependency updates must be evaluated independently for compatibility with:
  1. Bun's native module loader and test runner
  2. Patched dependencies (e.g. `patches/ink@6.2.0.patch`)
  3. Bundling with `bun build` to Node.js ESM
- Do not blindly upgrade dev-dependencies if they introduce breaking changes, runtime incompatibilities, or unnecessary churn.

**Handling Action:**
1. If the upstream dependency bump solves a verified bug or security vulnerability compatible with our stack, create a dedicated chore commit.
2. Otherwise, mark as **Category D (Skipped / Retained existing)** in the triage record and plan upgrades separately.

---

## Triage Table Structure

When executing an upstream port, record every commit in a triage table:

| Commit Hash | Upstream Title | Category | Target in `agstatusline` | Notes / Actions |
|---|---|---|---|---|
| `747b7f1` | `feat(widgets): give the remaining git and jj widgets symbol slots` | Category A | `src/widgets/GitChanges.ts` | Direct port with tests |
| `f370720` | `feat(usage): let the reset timers hide their no-data placeholders` | Category B | `src/widgets/BlockResetTimer.ts` | Remap `h` keybinds to `o`/`f` |
| `0551b06` | `feat(auth): read claude token from macos keychain` | Category C | N/A | Skip: Claude-specific auth |
| `2ae993d` | `chore(deps-dev): bump typescript from 5.4 to 5.5` | Category D | N/A | Evaluated; keep current compiler |
