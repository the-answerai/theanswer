#!/usr/bin/env bash
# Async ESLint --fix for files in packages/ and packages-answers/.
# Catches unused imports and other auto-fixable lint rules.
# Reports results via systemMessage on next turn.

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

# Exit silently if no file path
[[ -z "$FILE_PATH" ]] && exit 0

# Only lint JS/TS files
case "$FILE_PATH" in
    *.ts|*.tsx|*.js|*.jsx) ;;
    *) exit 0 ;;
esac

# Skip files that don't exist
[[ ! -f "$FILE_PATH" ]] && exit 0

# Only run ESLint for packages/* and packages-answers/* (where it has valuable rules)
# Skip apps/web (no useful auto-fix rules beyond prettier)
# Skip packages/embed (in .eslintignore)
case "$FILE_PATH" in
    */packages/server/*|*/packages/components/*|*/packages/ui/*|*/packages-answers/*) ;;
    *) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR"
OUTPUT=$(npx eslint --fix "$FILE_PATH" 2>&1) || true

# Only report if there were unfixable issues
if [[ -n "$OUTPUT" ]] && echo "$OUTPUT" | grep -q "warning\|error"; then
    # Escape for JSON
    ESCAPED=$(echo "$OUTPUT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))" 2>/dev/null)
    echo "{\"systemMessage\": \"ESLint found issues in $(basename "$FILE_PATH"): ${ESCAPED}\"}"
fi

exit 0
