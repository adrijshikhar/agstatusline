# Antigravity Telemetry Payload Contract

`agstatusline` reads exactly one JSON object on standard input (`stdin`) and prints formatted ANSI statusline string(s) to standard output (`stdout`).

This document defines the complete JSON telemetry contract between the **Google Antigravity CLI (`agy`)** and `agstatusline`.

---

## 📡 Protocol & Resilience Guarantees

1. **Non-Blocking Stdio Interface**: Telemetry is piped into `agstatusline` on every prompt redraw and cycle update.
2. **Resilience & Safe Fallbacks**: All payload fields are optional. Absent or `null` values degrade gracefully to sensible defaults without throwing unhandled exceptions.
3. **Additive Schema**: New keys may be added by Antigravity CLI over time without breaking existing `agstatusline` installations. Unrecognized keys are ignored.
4. **Enriched Fallback Resolution**: When certain metadata (such as conversation titles or token metrics) is omitted from the piped stdin JSON, `agstatusline` automatically performs non-blocking local resolution:
   - **Session Titles**: Cached SQLite reverse lookup from `~/.gemini/antigravity-cli/conversation_summaries.db`.
   - **Transcript Parsing**: Reads active session transcript JSONL from `~/.gemini/antigravity-cli/brain/<session_id>/.system_generated/logs/transcript.jsonl` if direct token metrics are absent.

---

## 📋 Payload Field Reference

The root object conforms to `StatusJSON` (defined in `src/types/StatusJSON.ts`):

| Key | Type | Description |
| :--- | :--- | :--- |
| `session_id` | string | Unique Antigravity session identifier (UUID). |
| `conversation_id` | string | Conversation identifier (often identical to `session_id`). |
| `conversation_title` | string | User-assigned or AI-generated thread title (e.g. via `/rename`). |
| `session_name` | string | Alias for conversation title. |
| `conversation_name` | string | Alias for conversation title. |
| `transcript_path` | string | Absolute path to the active session transcript JSONL file. |
| `cwd` | string | Current working directory of the active terminal session. |
| `terminal_width` | number | Detected terminal column width. |
| `version` | string | Running Antigravity CLI version string (e.g. `1.107.0`). |
| `model` | string \| object | Active model metadata. String or `{ id: string, display_name?: string }`. |
| `effort` | object | Thinking / reasoning effort level: `{ level: "low" \| "medium" \| "high" \| "max" }`. |
| `workspace` | object | Workspace root directories: `{ current_dir?: string, project_dir?: string }`. |
| `context_window` | object | Context token metrics and capacity (see Context Window Schema below). |
| `cost` | object | Cost and duration telemetry (see Cost Schema below). |
| `quota` | record | Map of quota bucket identifiers to bucket state (see Quota Bucket Schema below). |
| `rate_limits` | object | Rate limit utilization windows (see Rate Limits Schema below). |
| `worktree` | object | Git worktree state (see Worktree Schema below). |
| `vim` | object | Active editor mode: `{ mode?: "NORMAL" \| "INSERT" \| "VISUAL" }`. |
| `output_style` | object | Active output style: `{ name?: string }`. |
| `hook_event_name` | string | Event triggering the statusline redraw (e.g. `Prompt`, `CycleEnd`). |

---

### Context Window Schema (`context_window`)

```json
{
  "context_window_size": 1000000,
  "total_input_tokens": 45200,
  "total_output_tokens": 3150,
  "used_percentage": 4.84,
  "remaining_percentage": 95.16,
  "current_usage": {
    "input_tokens": 12000,
    "output_tokens": 1500,
    "cache_creation_input_tokens": 4000,
    "cache_read_input_tokens": 28000
  }
}
```

| Key | Type | Description |
| :--- | :--- | :--- |
| `context_window_size` | number | Total capacity of the active model in tokens (e.g. `1000000` for 1M models, `2000000` for 2M models). |
| `total_input_tokens` | number | Cumulative input tokens in the current context. |
| `total_output_tokens` | number | Cumulative output tokens generated in the session. |
| `used_percentage` | number | Context percentage consumed (`0` to `100`). |
| `remaining_percentage`| number | Context percentage remaining (`0` to `100`). |
| `current_usage` | object \| number | Granular token breakdown or single total token count. |
| `current_usage.input_tokens` | number | Base input tokens. |
| `current_usage.output_tokens` | number | Output tokens. |
| `current_usage.cache_read_input_tokens` | number | Tokens retrieved from cache. |
| `current_usage.cache_creation_input_tokens` | number | Tokens written to create new cache entries. |

---

### Quota Bucket Schema (`quota.<bucket_name>`)

```json
{
  "quota": {
    "gemini_flash": {
      "remaining_fraction": 0.85,
      "remaining_amount": 8500,
      "reset_time": "2026-10-04T22:00:00Z",
      "reset_in_seconds": 12600,
      "disabled": false
    }
  }
}
```

| Key | Type | Description |
| :--- | :--- | :--- |
| `remaining_fraction` | number | Ratio of remaining quota (`0.0` to `1.0`). |
| `remaining_amount` | number | Absolute remaining quota units. |
| `reset_time` | string | ISO 8601 UTC timestamp of next quota reset. |
| `reset_in_seconds` | number | Seconds remaining until quota reset countdown completes. |
| `disabled` | boolean | True if this quota bucket is disabled or unavailable. |

---

### Rate Limits Schema (`rate_limits`)

```json
{
  "rate_limits": {
    "five_hour": {
      "used_percentage": 24.5,
      "resets_at": 1791129600
    },
    "seven_day": {
      "used_percentage": 42.0,
      "resets_at": 1791648000
    }
  }
}
```

| Key | Type | Description |
| :--- | :--- | :--- |
| `used_percentage` | number | Rate limit consumed as percentage (`0` to `100`). |
| `resets_at` | number | Reset time as Unix epoch seconds. |

---

### Cost Schema (`cost`)

```json
{
  "cost": {
    "total_cost_usd": 0.1425,
    "total_usd": 0.1425,
    "total_duration_ms": 45200,
    "total_api_duration_ms": 12800,
    "total_lines_added": 142,
    "total_lines_removed": 28
  }
}
```

---

### Worktree Schema (`worktree`)

```json
{
  "worktree": {
    "name": "feat-user-auth",
    "path": "/Users/nemesis/Projects/my-projects/agstatusline-feat",
    "branch": "feat/user-auth",
    "original_cwd": "/Users/nemesis/Projects/my-projects/agstatusline",
    "original_branch": "main"
  }
}
```

---

## 🧪 Golden Fixture Example

Use this comprehensive mock payload to test statusline formatting locally:

```json
{
  "session_id": "bf406314-88cd-4502-a61b-ced89beba624",
  "conversation_id": "bf406314-88cd-4502-a61b-ced89beba624",
  "conversation_title": "Antigravity Statusline Refactor",
  "version": "1.107.0",
  "cwd": "/Users/nemesis/Projects/my-projects/agstatusline",
  "terminal_width": 120,
  "model": {
    "id": "gemini-2.5-pro",
    "display_name": "Gemini 2.5 Pro"
  },
  "effort": {
    "level": "high"
  },
  "context_window": {
    "context_window_size": 1000000,
    "total_input_tokens": 45200,
    "total_output_tokens": 3150,
    "used_percentage": 4.84,
    "remaining_percentage": 95.16,
    "current_usage": {
      "input_tokens": 12000,
      "output_tokens": 1500,
      "cache_creation_input_tokens": 4000,
      "cache_read_input_tokens": 28000
    }
  },
  "quota": {
    "pro": {
      "remaining_fraction": 0.82,
      "reset_time": "2026-10-04T22:00:00Z",
      "reset_in_seconds": 12600,
      "disabled": false
    }
  },
  "rate_limits": {
    "five_hour": {
      "used_percentage": 18.0,
      "resets_at": 1791129600
    },
    "seven_day": {
      "used_percentage": 35.0,
      "resets_at": 1791648000
    }
  },
  "cost": {
    "total_usd": 0.14,
    "total_duration_ms": 32000,
    "total_lines_added": 142,
    "total_lines_removed": 28
  },
  "vim": {
    "mode": "NORMAL"
  }
}
```

### Local CLI Testing

```bash
# Test rendering using piped JSON
cat << 'EOF' | bun run src/agstatusline.ts
{"model":{"id":"gemini-2.5-pro","display_name":"Gemini 2.5 Pro"},"effort":{"level":"high"},"context_window":{"total_input_tokens":45000,"total_output_tokens":3500,"context_window_size":1000000,"used_percentage":4.85}}
EOF
```
