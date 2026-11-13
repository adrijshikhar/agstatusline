#!/usr/bin/env bash
set -euo pipefail

# update-baseline.sh - Updates upstream-ccstatusline.json and reminds/validates NOTICE.
#
# Usage:
#   update-baseline.sh <commit-sha> [repo]
#   update-baseline.sh --help

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../../../" && pwd)"
CONFIG_FILE="${ROOT_DIR}/scripts/upstream-ccstatusline.json"
NOTICE_FILE="${ROOT_DIR}/NOTICE"

if [[ $# -eq 0 || "$1" == "--help" || "$1" == "-h" ]]; then
  echo "Usage: $0 <commit-sha> [repo]"
  echo ""
  echo "Arguments:"
  echo "  <commit-sha>  Git commit SHA (e.g. 19c6665ecf14309a5ffcfcda5e31972833dd821a)"
  echo "  [repo]        Upstream repo (default: sirmalloc/ccstatusline)"
  exit 0
fi

NEW_COMMIT="$1"
REPO="${2:-sirmalloc/ccstatusline}"

if [[ ${#NEW_COMMIT} -lt 7 ]]; then
  echo "Error: commit SHA must be at least 7 characters, got '${NEW_COMMIT}'" >&2
  exit 1
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Error: Config file not found at ${CONFIG_FILE}" >&2
  exit 1
fi

if command -v bun >/dev/null 2>&1; then
  JS_CMD="bun"
elif command -v node >/dev/null 2>&1; then
  JS_CMD="node"
else
  echo "Error: Neither 'bun' nor 'node' command was found in PATH." >&2
  exit 1
fi

"$JS_CMD" -e "
import('node:fs').then(fs => {
  const file = process.argv[1];
  const repo = process.argv[2];
  const commit = process.argv[3];
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.repo = repo;
  data.baseCommit = commit;
  fs.writeFileSync(file, JSON.stringify(data, null, 4) + '\n', 'utf8');
  console.log('✅ Updated ' + file + ' baseCommit to ' + commit);
});
" "$CONFIG_FILE" "$REPO" "$NEW_COMMIT"

echo ""
echo "📝 Reminder: Please update ${NOTICE_FILE} with the new baseline commit and release tag if applicable."
