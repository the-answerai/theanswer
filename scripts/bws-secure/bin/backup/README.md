# BWS CLI Backup Binaries

This folder contains vendored bws CLI binaries used as a fallback when GitHub is unavailable (CDN outage, rate limiting, repo renamed, etc.).

## How It Works

The `bws-installer.sh` script:
1. **First** tries to download from GitHub
2. **Falls back** to these local binaries if download fails
3. **Validates checksums** regardless of source

## Folder Structure

```
bin/backup/
├── download-backups.sh           # Script to download binaries
├── README.md                     # This file
└── v1.0.0/                       # Version-specific folder
    ├── bws-*-1.0.0.zip           # Platform binaries
    └── bws-sha256-checksums-1.0.0.txt
```

## Downloading Binaries for a New Version

```bash
./download-backups.sh 1.1.0
```

The script automatically:
- Fetches the checksum file first
- Discovers all available binaries from the checksum file
- Downloads each binary
- Verifies SHA256 checksums

No hardcoded list of files - it adapts to whatever Bitwarden releases.

## Updating the Default Version

After downloading new binaries, update `bws-installer.sh`:

```bash
DEFAULT_BWS_VERSION="1.1.0"
```

## Removing Old Versions

```bash
rm -rf v1.0.0
```

## Supported Platforms

The binaries cover:
- **Linux**: x64, ARM64 (glibc)
- **macOS**: x64, ARM64, Universal
- **Windows**: x64, ARM64

## Why Vendor Binaries?

- **Resilience**: Upstream changes (repo renames, CDN issues) won't break builds
- **Speed**: Local copies are instant when available
- **Verification**: All binaries are SHA256 checksum verified

