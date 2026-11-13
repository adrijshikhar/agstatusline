# Code Translation Guide

This reference guide provides standardized rules and translation patterns for converting upstream code from `sirmalloc/ccstatusline` (Claude Code) to `agstatusline` (Google Antigravity CLI `agy`).

---

## 1. Identifiers, Namespaces & Paths

| Upstream (`ccstatusline`) | Ported (`agstatusline`) | Notes |
|---|---|---|
| `ccstatusline` | `agstatusline` | Package name, command name, executable |
| `CCSTATUSLINE_WIDTH` | `AGSTATUSLINE_WIDTH` | Fallback pattern: `process.env.AGSTATUSLINE_WIDTH ?? process.env.CXSTATUSLINE_WIDTH ?? process.env.CCSTATUSLINE_WIDTH` |
| `~/.config/ccstatusline/` | `~/.config/agstatusline/` | User configuration directory |
| `~/.config/ccstatusline/settings.json` | `~/.config/agstatusline/settings.json` | Main settings file |
| `~/.claude/settings.json` | `~/.gemini/antigravity-cli/settings.json` | Antigravity settings path (also respects `ANTIGRAVITY_CONFIG_DIR`) |
| `github.com/sirmalloc/ccstatusline` | `github.com/adrijshikhar/agstatusline` | Repository URL |
| `Claude Code` | `Google Antigravity CLI` (`agy`) | User-facing documentation and CLI descriptions |

---

## 2. Environment Variables

When porting terminal width detection or configuration overrides, always support `AGSTATUSLINE_*` as the primary variable and maintain `CXSTATUSLINE_*` and `CCSTATUSLINE_*` as backward-compatible fallbacks:

```typescript
// Terminal width resolution example
const envWidth = process.env.AGSTATUSLINE_WIDTH
    ?? process.env.CXSTATUSLINE_WIDTH
    ?? process.env.CCSTATUSLINE_WIDTH;

if (envWidth) {
    const parsed = parseInt(envWidth, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
    }
}
```

---

## 3. Telemetry & Session Data Mapping

Claude Code and Google Antigravity CLI have different telemetry mechanics:

- **Upstream (Claude Code)**:
  - Claude stores session transcripts and telemetry in JSON files on disk under `~/.claude/sessions/`.
  - Upstream reads session JSON files or Anthropic OAuth cache tokens directly.

- **agstatusline (Google Antigravity CLI `agy`)**:
  - Telemetry is piped into stdin as a single JSON object parsed via `StatusJSONSchema.safeParse()`.
  - In widgets, telemetry is accessed via `RenderContext.data` (of type `StatusJSON`).

### Mapping Table

| Upstream Concept | agstatusline Equivalent | Description |
|---|---|---|
| Claude session JSON on disk | `context.data` | Session telemetry payload in `RenderContext` |
| Claude 5-hour rate limit | `context.data?.quota` / `rate_limits?.five_hour` | Antigravity quota / rate limits |
| Claude weekly limit | `context.data?.quota` / `rate_limits?.seven_day` | Weekly quota / rate limits |
| Claude reset timestamp | `quota.reset_time` / `reset_in_seconds` | Quota reset timestamp or remaining seconds |
| Session duration | `cost?.total_duration_ms` | Elapsed session duration in milliseconds |
| Active API duration | `cost?.total_api_duration_ms` | Duration spent executing API calls |
| Subagents list | `context.data?.subagents` | Active Antigravity subagents (`name`, `role`, `status`) |
| Tasks list / count | `context.data?.tasks` / `task_count` | Background tasks telemetry |
| Model info | `context.data?.model` | Active model (`id`, `display_name`, `effort`) |
| Context window | `context.data?.context_window` | Tokens used, context window size, percentage |
| Vim mode | `context.data?.vim` | Vim mode status in Antigravity |
| Sandbox | `context.data?.sandbox` | Sandbox environment status |

---

## 4. UI Keybind Conventions & Collision Avoidance

The `agstatusline` items editor reserves specific global keybinds across all widget editors:
- `h`: Reserved for toggling the **Hideable States Checklist** (`USAGE_HIDEABLE_STATES`).
- `d`: Reserved for delete / remove item.
- `m`: Reserved for move item / merge.
- `s`: Reserved for style / formatting.
- `g`: Standardized for **Glyph / Symbol Slot Editor** (`symbol-override.tsx`).

### Collision Resolution Rules

When upstream introduces an editor action that binds to `h` or other reserved keys, remap the keybind:

| Upstream Widget Action | Upstream Key | agstatusline Remapped Key | Label / Modifier Text |
|---|---|---|---|
| Weekly Reset: Hours only | `h` | `o` | `'(o)nly hours'` (`key: 'o'`) |
| Time format: 12/24 hour | `h` | `f` | `'12/24 (f)ormat'` (`key: 'f'`) |
| Symbol slots editor | `g` | `g` | `'(g)lyphs'` (`key: 'g'`) |

---

## 5. Testing Framework & Strict Lint Standards

In `agstatusline`, testing runs via `bun test` or `vitest run`. Code must satisfy strict linting rules:

1. **Strict Linting Rules**:
   - 4-space indentation.
   - Single quotes `'` for strings.
   - Semicolons required.
   - Trailing commas omitted on object literals and parameter lists.
   - Import order: `['builtin', 'external']`, `'internal'`, `'parent'`, `'sibling'`, `'index'`, `'unknown'`.
   - Node built-ins must use `node:` prefix (`node:fs`, `node:path`, `node:child_process`).
   - Zero tolerance for warnings (`--max-warnings=0`).
   - Never use `// eslint-disable...` comments.

2. **Test Patterns**:
   - Write unit tests in `src/widgets/__tests__/` or `test/`.
   - Use standard `describe`, `it`, `expect`, `vi` / `mock` assertions.
   - Verify both positive and negative cases (null telemetry, missing fields, malformed inputs).
