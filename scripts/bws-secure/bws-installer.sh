#!/bin/sh

##################################################
# Custom installer for bws CLI in a project repo #
##################################################

DEFAULT_BWS_VERSION="1.0.0"
BWS_VERSION="${BWS_VERSION:-$DEFAULT_BWS_VERSION}"

# Determine script directory for finding local backups
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/bin/backup"

# Cross-platform temp base and cleanup trap
TMP_BASE="${TMPDIR:-${TEMP:-${TMP:-/tmp}}}"
cleanup() {
  [ -n "$tmp_dir" ] && rm -rf "$tmp_dir" 2>/dev/null || true
}
trap cleanup EXIT
trap 'cleanup; exit 130' INT
trap 'cleanup; exit 143' TERM

main() {
  case "$1" in
  -u | --uninstall)
    uninstall_bws
    ;;
  -f | --force)
    FORCE_INSTALL=1
    run_install
    ;;
  *)
    FORCE_INSTALL=0
    run_install
    ;;
  esac
}

run_install() {
  check_required
  platform_detect
  arch_detect

  # Skip if already installed at correct version (unless forced)
  if [ "$FORCE_INSTALL" -eq 0 ] && check_already_installed; then
    echo "bws v${BWS_VERSION} already installed, skipping."
    echo "To force reinstall: sh ./scripts/bws-secure/bws-installer.sh -f"
    exit 0
  fi

  check_version_availability
  download_bws
  validate_checksum
  install_bws
}

error() {
  echo "$1" >&2
  echo "Exiting..." >&2
  exit 1
}

check_required() {
  if ! command -v curl >/dev/null && ! command -v wget >/dev/null; then
    error "curl or wget is required to download bws."
  fi

  if ! command -v unzip >/dev/null; then
    error "unzip is required to install bws."
  fi
}

check_already_installed() {
  bws_bin="$(pwd)/node_modules/.bin/bws"
  
  if [ ! -f "$bws_bin" ]; then
    return 1  # Not installed
  fi

  # Get installed version (bws --version outputs "bws x.y.z")
  installed_version="$("$bws_bin" --version 2>/dev/null | awk '{print $2}')"
  
  if [ -z "$installed_version" ]; then
    return 1  # Couldn't determine version
  fi

  if [ "$installed_version" = "$BWS_VERSION" ]; then
    return 0  # Already installed at correct version
  fi

  echo "Installed version ($installed_version) differs from requested ($BWS_VERSION), updating..."
  return 1
}

platform_detect() {
  if [ "$(uname -s)" = "Linux" ]; then
    PLATFORM="unknown-linux-gnu"
  elif [ "$(uname -s)" = "Darwin" ]; then
    PLATFORM="apple-darwin"
  elif [ "$(expr substr "$(uname -s)" 1 10)" = "MINGW32_NT" ] || [ "$(expr substr "$(uname -s)" 1 10)" = "MINGW64_NT" ]; then
    PLATFORM="pc-windows-msvc"
  else
    error "Unsupported platform: $(uname -s)"
  fi
}

arch_detect() {
  if [ "$(uname -m)" = "x86_64" ]; then
    ARCH="x86_64"
  elif [ "$(uname -m)" = "aarch64" ]; then
    ARCH="aarch64"
  elif [ "$(uname -m)" = "arm64" ]; then
    ARCH="aarch64"
  else
    error "Unsupported architecture: $(uname -m)"
  fi
}

checksum() {
  if command -v sha256sum >/dev/null; then
    sha256sum "$1"
  else
    shasum -a 256 "$1"
  fi
}

downloader() {
  if command -v curl >/dev/null; then
    curl -L -o "$2" "$1"
  else
    wget -O "$2" "$1"
  fi
}

downloader_with_check() {
  if command -v curl >/dev/null; then
    curl -L --fail --silent --show-error -o "$2" "$1" 2>/dev/null
  else
    wget -q -O "$2" "$1" 2>/dev/null
  fi
}

extract() {
  unzip -o "$1" -d "$2"
}

download_bws() {
  tmp_dir="$(mktemp -d "$TMP_BASE/bws-secure.XXXXXXXXXX")"
  local_backup="$BACKUP_DIR/v${BWS_VERSION}/bws-${ARCH}-${PLATFORM}-${BWS_VERSION}.zip"
  bws_url="https://github.com/bitwarden/sdk-sm/releases/download/bws-v${BWS_VERSION}/bws-${ARCH}-${PLATFORM}-${BWS_VERSION}.zip"
  
  # Try download first, fall back to local backup if download fails
  echo "Downloading bws from: $bws_url"
  if downloader_with_check "$bws_url" "$tmp_dir/bws.zip"; then
    USE_LOCAL_BACKUP=0
  else
    echo "Download failed, checking for local backup..."
    if [ -f "$local_backup" ]; then
      echo "Using local backup: $local_backup"
      cp "$local_backup" "$tmp_dir/bws.zip"
      USE_LOCAL_BACKUP=1
    else
      error "Download failed and no local backup found at: $local_backup"
    fi
  fi
}

validate_checksum() {
  local_checksum_file="$BACKUP_DIR/v${BWS_VERSION}/bws-sha256-checksums-${BWS_VERSION}.txt"
  checksum_file="$tmp_dir/bws-checksums.txt"
  checksum_url="https://github.com/bitwarden/sdk-sm/releases/download/bws-v${BWS_VERSION}/bws-sha256-checksums-${BWS_VERSION}.txt"
  
  # Try download first, fall back to local checksum file
  if downloader_with_check "$checksum_url" "$checksum_file"; then
    echo "Downloaded checksum file."
  elif [ -f "$local_checksum_file" ]; then
    echo "Using local checksum file: $local_checksum_file"
    cp "$local_checksum_file" "$checksum_file"
  else
    error "Could not download checksum file and no local backup found."
  fi

  expected_checksum="$(grep "bws-${ARCH}-${PLATFORM}-${BWS_VERSION}.zip" "$checksum_file" | awk '{print $1}')"
  actual_checksum="$(checksum "$tmp_dir/bws.zip" | awk '{print $1}')"

  if [ "$actual_checksum" != "$expected_checksum" ]; then
    error "Checksum validation failed. Expected: $expected_checksum, Actual: $actual_checksum"
  else
    echo "Checksum validation successful."
  fi
}

install_bws() {
  echo "Installing bws into node_modules/.bin directory..."
  extract "$tmp_dir/bws.zip" "$(pwd)/node_modules/.bin"

  # Skip chmod for Windows
  if [ "$PLATFORM" != "pc-windows-msvc" ]; then
    chmod +x "$(pwd)/node_modules/.bin/bws"
  fi

  # Add installation to NVM binary directory only if not Windows
  if [ "$PLATFORM" != "pc-windows-msvc" ]; then
    NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    if [ -d "$NVM_DIR" ]; then
      NODE_VERSION=$(node -v)
      NVM_BIN_DIR="$NVM_DIR/versions/node/$NODE_VERSION/bin"
      if [ -d "$NVM_BIN_DIR" ]; then
        echo "Installing bws into NVM binary directory..."
        cp "$(pwd)/node_modules/.bin/bws" "$NVM_BIN_DIR/bws"
        chmod +x "$NVM_BIN_DIR/bws"
        echo "bws installed globally to $NVM_BIN_DIR/bws"
      else
        echo "Warning: NVM binary directory not found at $NVM_BIN_DIR"
      fi
    else
      echo "Warning: NVM directory not found at $NVM_DIR"
    fi
  fi

  echo "bws installed to node_modules/.bin/bws"
  echo "To use bws, run either:"
  echo "  ./node_modules/.bin/bws <command>"
  echo "  bws <command> (if it is on your PATH)"
}

uninstall_bws() {
  NODE_BIN_DIR="$(pwd)/node_modules/.bin"

  if [ -f "$NODE_BIN_DIR/bws" ]; then
    echo "Removing bws binary at $NODE_BIN_DIR/bws"
    rm -f "$NODE_BIN_DIR/bws"
  fi

  # Remove from NVM binary directory
  NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ -d "$NVM_DIR" ]; then
    NODE_VERSION=$(node -v)
    NVM_BIN_DIR="$NVM_DIR/versions/node/$NODE_VERSION/bin"
    
    if [ -f "$NVM_BIN_DIR/bws" ]; then
      echo "Removing bws binary at $NVM_BIN_DIR/bws"
      rm -f "$NVM_BIN_DIR/bws"
    fi
  fi

  echo "bws uninstalled successfully."
  exit 0
}

check_version_availability() {
  local_backup="$BACKUP_DIR/v${BWS_VERSION}/bws-${ARCH}-${PLATFORM}-${BWS_VERSION}.zip"
  test_url="https://github.com/bitwarden/sdk-sm/releases/download/bws-v${BWS_VERSION}/bws-${ARCH}-${PLATFORM}-${BWS_VERSION}.zip"

  # Attempt a HEAD request to see if the requested version URL exists
  if command -v curl >/dev/null; then
    if ! curl --head --silent --fail "$test_url" >/dev/null 2>&1; then
      # Remote not available - check if we have local backup before falling back
      if [ -f "$local_backup" ]; then
        echo "Remote v${BWS_VERSION} unavailable, but local backup exists. Continuing..."
        return 0
      fi
      echo "Version bws-v${BWS_VERSION} not found remotely or locally. Falling back to default ${DEFAULT_BWS_VERSION}..."
      BWS_VERSION="$DEFAULT_BWS_VERSION"
    fi
  else
    # Fallback if wget is used
    if ! wget --spider -q "$test_url" 2>/dev/null; then
      if [ -f "$local_backup" ]; then
        echo "Remote v${BWS_VERSION} unavailable, but local backup exists. Continuing..."
        return 0
      fi
      echo "Version bws-v${BWS_VERSION} not found remotely or locally. Falling back to default ${DEFAULT_BWS_VERSION}..."
      BWS_VERSION="$DEFAULT_BWS_VERSION"
    fi
  fi
}

main "$@"
