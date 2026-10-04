# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within `agstatusline`, please do **not** open a public issue. Instead, report it privately to the repository maintainer via GitHub Private Vulnerability Reporting or via email.

Please include:
- A description of the vulnerability and its potential impact.
- Steps to reproduce or proof-of-concept payload.
- Any suggested remediations if available.

We will acknowledge receipt within 48 hours and work with you to patch and release a fix promptly.

## Security Architecture

- **Local Execution Only:** `agstatusline` executes locally on your machine by parsing stdin payloads from Antigravity CLI and reading local configuration in `~/.config/agstatusline/settings.json`.
- **Custom Commands:** The `custom-command` widget executes user-configured shell commands at the user's privilege level. Custom commands are only run if configured explicitly by the user in `settings.json`.
- **Subprocess Isolation:** Shell executions (such as `sqlite3` for conversation titles and `git` queries) strictly validate input identifiers (e.g. UUID/alphanumeric checks) and execute with bounded timeouts to prevent hangs or command injection.
- **Privacy:** Status line telemetry is formatted and written directly to stdout for terminal display; no data is ever transmitted over the network or collected.
