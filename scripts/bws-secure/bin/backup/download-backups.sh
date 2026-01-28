#!/bin/sh
#
# Downloads ALL bws CLI binaries for local backup
# Dynamically discovers available files from checksum file
# Run this script when GitHub CDN is available
#

VERSION="${1:-1.0.0}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="$SCRIPT_DIR/v$VERSION"

mkdir -p "$TARGET_DIR"

BASE_URL="https://github.com/bitwarden/sdk-sm/releases/download/bws-v${VERSION}"
CHECKSUM_FILE="bws-sha256-checksums-${VERSION}.txt"

echo "═══════════════════════════════════════════════════════════"
echo "  Downloading bws v${VERSION} binaries"
echo "  Target: $TARGET_DIR"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Step 1: Download checksum file first (it tells us what files exist)
echo "Step 1: Fetching checksum file..."
if curl -L --fail --retry 3 --retry-delay 5 -o "$TARGET_DIR/$CHECKSUM_FILE" "$BASE_URL/$CHECKSUM_FILE" 2>/dev/null; then
  echo "  ✓ Downloaded $CHECKSUM_FILE"
else
  echo "  ✗ Failed to download checksum file. Cannot proceed."
  echo "  Check if version v${VERSION} exists at:"
  echo "  https://github.com/bitwarden/sdk-sm/releases/tag/bws-v${VERSION}"
  exit 1
fi

echo ""

# Step 2: Parse checksum file to get list of all .zip files
echo "Step 2: Downloading all available binaries..."
BINARIES=$(grep '\.zip$' "$TARGET_DIR/$CHECKSUM_FILE" | awk '{print $2}')

if [ -z "$BINARIES" ]; then
  echo "  ✗ No binaries found in checksum file"
  exit 1
fi

# Count total files
TOTAL=$(echo "$BINARIES" | wc -l | tr -d ' ')
CURRENT=0
SUCCESS=0
FAILED=0

for file in $BINARIES; do
  CURRENT=$((CURRENT + 1))
  if [ -f "$TARGET_DIR/$file" ]; then
    echo "  [$CURRENT/$TOTAL] ✓ $file (already exists)"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "  [$CURRENT/$TOTAL] ↓ Downloading $file..."
    if curl -L --fail --retry 3 --retry-delay 5 -o "$TARGET_DIR/$file" "$BASE_URL/$file" 2>/dev/null; then
      echo "           ✓ Downloaded"
      SUCCESS=$((SUCCESS + 1))
    else
      echo "           ✗ Failed"
      FAILED=$((FAILED + 1))
    fi
  fi
done

echo ""
echo "Step 3: Verifying checksums..."

VERIFIED=0
CHECKSUM_FAILED=0

for file in "$TARGET_DIR"/*.zip; do
  [ -f "$file" ] || continue
  filename=$(basename "$file")
  expected=$(grep "$filename" "$TARGET_DIR/$CHECKSUM_FILE" | awk '{print $1}')
  
  if [ -n "$expected" ]; then
    if command -v sha256sum >/dev/null; then
      actual=$(sha256sum "$file" | awk '{print $1}')
    else
      actual=$(shasum -a 256 "$file" | awk '{print $1}')
    fi
    
    if [ "$expected" = "$actual" ]; then
      echo "  ✓ $filename"
      VERIFIED=$((VERIFIED + 1))
    else
      echo "  ✗ $filename CHECKSUM FAILED"
      echo "    Expected: $expected"
      echo "    Actual:   $actual"
      CHECKSUM_FAILED=$((CHECKSUM_FAILED + 1))
    fi
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Summary"
echo "═══════════════════════════════════════════════════════════"
echo "  Downloaded: $SUCCESS / $TOTAL"
[ "$FAILED" -gt 0 ] && echo "  Failed:     $FAILED"
echo "  Verified:   $VERIFIED checksums OK"
[ "$CHECKSUM_FAILED" -gt 0 ] && echo "  Invalid:    $CHECKSUM_FAILED checksums FAILED"
echo ""
echo "  Files saved to: $TARGET_DIR"
echo "═══════════════════════════════════════════════════════════"

# Exit with error if any checksums failed
[ "$CHECKSUM_FAILED" -gt 0 ] && exit 1
exit 0
