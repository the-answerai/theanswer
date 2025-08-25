#!/usr/bin/env bash
set -euo pipefail

# Check for existence of Copilot environment files
# Usage: ./check-env-files.sh [application_name]

# Get application name from argument or try to detect from .workspace
if [[ -n "${1:-}" ]]; then
    APP_NAME="$1"
elif [[ -f "copilot/.workspace" ]]; then
    APP_NAME="$(cat copilot/.workspace | grep 'application:' | cut -d':' -f2 | xargs)"
else
    echo "❌ No application name provided and no copilot/.workspace file found"
    echo "Usage: $0 [application_name]"
    exit 1
fi

echo "🔍 Checking environment files for application: $APP_NAME"
echo ""

# Check for main flowise env file
FLOWISE_ENV_FILE="copilot.$APP_NAME.env"
if [[ -f "$FLOWISE_ENV_FILE" ]]; then
    echo "✅ $FLOWISE_ENV_FILE - EXISTS"
    # Show file size and last modified
    if command -v stat >/dev/null 2>&1; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS stat
            SIZE=$(stat -f%z "$FLOWISE_ENV_FILE")
            MODIFIED=$(stat -f%Sm "$FLOWISE_ENV_FILE")
        else
            # Linux stat
            SIZE=$(stat -c%s "$FLOWISE_ENV_FILE")
            MODIFIED=$(stat -c%y "$FLOWISE_ENV_FILE")
        fi
        echo "   Size: $SIZE bytes, Modified: $MODIFIED"
    fi
else
    echo "❌ $FLOWISE_ENV_FILE - NOT FOUND"
fi

# Check for web env file
WEB_ENV_FILE="copilot.$APP_NAME.web.env"
if [[ -f "$WEB_ENV_FILE" ]]; then
    echo "✅ $WEB_ENV_FILE - EXISTS"
    # Show file size and last modified
    if command -v stat >/dev/null 2>&1; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS stat
            SIZE=$(stat -f%z "$WEB_ENV_FILE")
            MODIFIED=$(stat -f%Sm "$WEB_ENV_FILE")
        else
            # Linux stat
            SIZE=$(stat -c%s "$WEB_ENV_FILE")
            MODIFIED=$(stat -c%y "$WEB_ENV_FILE")
        fi
        echo "   Size: $SIZE bytes, Modified: $MODIFIED"
    fi
else
    echo "❌ $WEB_ENV_FILE - NOT FOUND"
fi

echo ""

# Summary
MISSING_COUNT=0
[[ ! -f "$FLOWISE_ENV_FILE" ]] && ((MISSING_COUNT++))
[[ ! -f "$WEB_ENV_FILE" ]] && ((MISSING_COUNT++))

if [[ $MISSING_COUNT -eq 0 ]]; then
    echo "🎯 All environment files found!"
    exit 0
elif [[ $MISSING_COUNT -eq 1 ]]; then
    echo "⚠️  1 environment file missing"
    exit 1
else
    echo "❌ $MISSING_COUNT environment files missing"
    exit 1
fi
