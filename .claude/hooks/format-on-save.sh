#!/usr/bin/env bash
# Auto-format files after Claude edits/writes them.
# Runs prettier synchronously (~0.4s) for instant formatting.
# Called by PostToolUse hook on Edit|Write events.

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

# Exit silently if no file path
[[ -z "$FILE_PATH" ]] && exit 0

# Only format JS/TS files
case "$FILE_PATH" in
    *.ts|*.tsx|*.js|*.jsx) ;;
    *) exit 0 ;;
esac

# Skip files that don't exist (deleted files)
[[ ! -f "$FILE_PATH" ]] && exit 0

# Skip node_modules, dist, build, .next, public (minified bundles), embed submodule
case "$FILE_PATH" in
    */node_modules/*|*/dist/*|*/build/*|*/.next/*|*/public/*|*/packages/embed/*) exit 0 ;;
esac

# Run prettier --write (fast, ~0.4s)
cd "$CLAUDE_PROJECT_DIR"
npx prettier --write "$FILE_PATH" >/dev/null 2>&1 || true

exit 0
