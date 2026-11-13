---
name: port-cc-to-ag
description: Use when porting features, widgets, bugfixes, refactors, or upstream releases from sirmalloc/ccstatusline (Claude Code statusline) to agstatusline (Google Antigravity CLI statusline), or when triaging upstream parity issues, checking upstream drift, or catching up with ccstatusline.
---

# Porting from ccstatusline to agstatusline

This skill guides agents through systematically porting upstream releases and commits from `sirmalloc/ccstatusline` (Claude Code statusline) to `agstatusline` (Google Antigravity CLI `agy` statusline).

## The Core Rule

**Never triage from a commit message. Triage from our tree.**

Commit titles can be misleading or describe changes that `agstatusline` has already absorbed, widgets that cannot exist here due to telemetry differences, or refactors already completed independently.

For every commit, ask:
1. **Does this change touch something `agstatusline` actually has?**
2. **Does Google Antigravity CLI supply the data it needs?** (Inspect `src/types/StatusJSON.ts`)

---

## Upstream Parity Workflow

```
┌─────────────────────────────────┐
│ 1. Check Upstream Baseline      │ bun run scripts/port-upstream.ts check
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│ 2. Triage Commits               │ Triage Matrix (Category A / B / C / D)
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│ 3. Check What Bites             │ Schema migrations, presentation vs exec, guards
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│ 4. Test-Driven Porting (TDD)    │ Failing test -> Implementation -> Verification
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│ 5. Update Baseline & NOTICE     │ Update scripts/upstream-ccstatusline.json & NOTICE
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│ 6. Full Verification            │ bun test && bun run lint && bun run build
└─────────────────────────────────┘
```

---

## Detailed Step-by-Step Guide

### Step 1: Upstream Baseline & Discovery

The current upstream baseline commit is recorded in `scripts/upstream-ccstatusline.json`:
```json
{
  "repo": "sirmalloc/ccstatusline",
  "baseCommit": "19c6665ecf14309a5ffcfcda5e31972833dd821a"
}
```

To inspect new upstream commits:
```bash
# Check commits via GitHub API using the helper tool
bun run scripts/port-upstream.ts check

# Or check against a local sibling clone of ccstatusline
bun run scripts/port-upstream.ts check --cc-checkout ../ccstatusline

# Output as JSON for automated pipelines
bun run scripts/port-upstream.ts check --json
```

### Step 2: Triage Commits

Review every commit between `baseCommit` and the target tag/commit. For each commit:
1. Fetch and examine the diff or stat summary:
   ```bash
   bun run scripts/port-upstream.ts diff <commit> --stat
   ```
2. Classify into one of four buckets defined in [references/triage-matrix.md](references/triage-matrix.md):
   - **Category A (Direct Port)**: Presentation, formatting, git/jj widgets, layout, powerline, ANSI helpers.
   - **Category B (Adapt to Antigravity)**: Quota, rate limits, session duration, model metadata, subagents, tasks.
   - **Category C (Skip / Drop)**: Claude-specific auth, macOS keychain, Claude-only services.
   - **Category D (Tooling & Dependencies)**: Dev dependencies, CI workflows, evaluate independently.
3. Record the triage verdict and concrete evidence from our codebase (e.g. file paths or symbol names in `src/`).

### Step 3: Check What Bites

Before implementing any port:
1. **Settings Schema Bump?**
   If upstream bumps the settings schema version, confirm `src/types/Settings.ts` and `src/utils/migrations.ts` handle migrations. A schema bump without migration causes settings to silently reset to defaults.
2. **Execution vs Presentation?**
   In widgets like `CustomCommand`, command execution is decoupled from rendering. Do not inline execution logic into UI widgets.
3. **Guard Conditions?**
   Upstream bugfixes often carry subtle guard conditions (e.g., condition checks for terminal width, nullability, or empty strings). Never drop guard conditions during porting.
4. **Keybind Collisions?**
   The items editor reserves `h` for toggling the hide checklist. When upstream introduces actions binding to `h`, remap them (see [references/translation-guide.md](references/translation-guide.md)).

### Step 4: Test-Driven Porting (TDD)

For Category A and Category B commits:
1. **Fetch Commit Diff**:
   ```bash
   bun run scripts/port-upstream.ts diff <commit>
   ```
2. **Translate Code**:
   Apply translation rules from [references/translation-guide.md](references/translation-guide.md):
   - `ccstatusline` $\rightarrow$ `agstatusline`
   - Map environment variables: `AGSTATUSLINE_*` (with fallbacks `CXSTATUSLINE_*`, `CCSTATUSLINE_*`)
   - Map telemetry to `StatusJSON` schema (`RenderContext.data`)
3. **Write Tests First**:
   - Write failing unit tests in `test/widgets/` or `src/widgets/__tests__/`.
   - Run tests to confirm red state:
     ```bash
     bun test test/widgets/<target>.test.ts
     ```
4. **Implement Code**:
   - Apply ported changes in `src/`.
   - Run tests to confirm green state:
     ```bash
     bun test test/widgets/<target>.test.ts
     ```

### Step 5: Update Baseline & Attribution

Once all selected changes are ported, verified, and tested:
1. **Update Baseline**:
   ```bash
   bun run scripts/port-upstream.ts update-baseline <new-commit-sha>
   ```
2. **Update Attribution**:
   Update `NOTICE` with the new baseline commit hash and release tag. Ensure copyright attribution for Matthew Breedlove and upstream contributors is preserved.

### Step 6: Full Verification

Always run the full verification suite before committing:
```bash
# Run all unit tests
bun test

# Run strict lint and type checks (zero errors and zero warnings required)
bun run lint

# Build standalone distribution bundle
bun run build

# Smoke test distribution bundle
echo '{"model":{"id":"gemini-2.5-pro","display_name":"Gemini 2.5 Pro"},"context_window":{"total_input_tokens":1000,"context_window_size":1000000}}' | node dist/agstatusline.js
```

---

## Reference Documents

- [Code Translation Guide](references/translation-guide.md) — Identifier mappings, environment variables, telemetry translation, and keybind collision resolutions.
- [Commit Triage Matrix](references/triage-matrix.md) — Category definitions (A, B, C, D) and decision rules.
