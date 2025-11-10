# Automated NPM Package Publishing

This document describes the automated publishing workflows for `aai-embed` and `aai-embed-react` packages.

## Architecture Overview

Two separate workflows in two different repositories:

1. **aai-embed** (submodule: `the-answerai/chat-embed`)
   - Publishes `@answerai/aai-embed` when changes merge to `a-main` branch
   - Manages its own versioning, building, and npm publishing

2. **aai-embed-react** (parent: `the-answerai/theanswer`)
   - Publishes `@answerai/aai-embed-react` when:
     - Code changes in `packages/embed-react/` (publishes immediately, no verification)
     - Submodule hash updates (only publishes if aai-embed version exists on npm)

---

## Publishing Flow

```
1. Developer merges PR to chat-embed a-main branch
   └─> Submodule workflow:
       ├─> Bumps version (e.g., 3.0.4 → 3.0.5)
       ├─> Publishes @answerai/aai-embed@3.0.5 to npm
       ├─> Commits version bump back to a-main [skip ci]
       └─> Creates tag v3.0.5

2. Developer updates submodule hash in parent repo
   $ cd packages/embed && git pull origin a-main && cd ../..
   $ git add packages/embed
   $ git commit -m "chore: update aai-embed to v3.0.5"
   $ git push origin staging

3. Parent repo workflow:
   ├─> Detects submodule hash changed
   ├─> Verifies @answerai/aai-embed@3.0.5 exists on npm ✅
   ├─> Bumps aai-embed-react (3.0.10 → 3.0.11)
   ├─> Updates peerDependencies to "aai-embed": "^3.0.5"
   └─> Publishes @answerai/aai-embed-react@3.0.11
```

---

## Workflow 1: aai-embed (Submodule Repo)

**Location:** `the-answerai/chat-embed/.github/workflows/publish-npm.yml`

### Triggers
- **Automatic**: Push to `a-main` branch
- **Manual**: Workflow dispatch with optional version override

### Version Bumping
Based on commit messages:
- `BREAKING`/`MAJOR` → major version
- `feat`/`feature`/`minor` → minor version
- Default → patch version

### Required Setup
- **Secret**: `NPM_TOKEN` with publish access to `@answerai` scope
- **Status**: ✅ Tested and working

---

## Workflow 2: aai-embed-react (Parent Repo)

**Location:** `.github/workflows/publish-packages.yml`

### Triggers
- **Automatic**: Push to `staging` branch
- **Manual**: Workflow dispatch with optional version override

### Three Jobs

**1. detect-changes**
- Checks if `packages/embed-react/` files changed
- Checks if submodule hash changed

**2. verify-embed-published** (conditional)
- Only runs if submodule hash changed
- Verifies aai-embed version exists on npm
- Fails with clear error if not found

**3. publish-aai-embed-react**
- Runs if:
  - Direct code changes in embed-react (no verification needed), OR
  - Submodule hash changed AND verification passed

### Version Bumping
- **Submodule-only updates**: Patch bump
- **Code changes**: Based on commit messages (BREAKING/feat/fix)

---

## Safety Features

### Version Verification
Only applies when submodule hash changes (not for direct code changes).

**Scenario: Premature Hash Update**
```bash
cd packages/embed && git checkout <unpublished-commit> && cd ../..
git push

# Workflow: Detects hash change → npm check fails → Nothing published ✅
```

**Scenario: Correct Hash Update**
```bash
# After aai-embed@3.0.5 published
git push

# Workflow: Detects hash change → npm check passes → Publishes aai-embed-react ✅
```

**Scenario: Direct Code Changes**
```bash
# Changes in packages/embed-react/
git push

# Workflow: Publishes immediately, no npm verification ✅
```

---

## Manual Publishing

### aai-embed-react
1. Go to Actions → Publish aai-embed-react to NPM
2. Click "Run workflow"
3. Optionally provide version override
4. Click "Run workflow"

### aai-embed
1. In chat-embed repository
2. Go to Actions → Publish aai-embed to NPM
3. Click "Run workflow" → Run on `a-main` branch
4. After publishing, update hash in parent repo

---

## Common Scenarios

### Update aai-embed Code
```bash
# 1. In chat-embed repo - merge changes to a-main
# 2. Workflow auto-publishes and tags

# 3. In parent repo (theanswer)
cd packages/embed && git pull origin a-main && cd ../..
git add packages/embed
git commit -m "chore: update aai-embed to v3.0.5"
git push origin staging

# 4. Parent workflow auto-publishes aai-embed-react
```

### Update aai-embed-react Code Only
```bash
cd packages/embed-react
# Make changes
git commit -m "feat: add TypeScript types"
git push origin staging

# Workflow auto-publishes immediately (no verification)
```

---

## Troubleshooting

### aai-embed-react Won't Publish

**Check npm:**
```bash
cd packages/embed
npm view @answerai/aai-embed@$(node -p "require('./package.json').version")
```

If not found, aai-embed workflow needs to run first.

### Build Failures

Test locally:
```bash
cd packages/embed && pnpm build
cd packages/embed-react && pnpm build
```

### Version Conflicts

Check published versions:
```bash
npm view @answerai/aai-embed versions
npm view @answerai/aai-embed-react versions
```

Manually trigger with higher version override if needed.

---

## Best Practices

### Commit Messages
```bash
git commit -m "fix: correct styling"      # patch bump
git commit -m "feat: add new option"      # minor bump
git commit -m "BREAKING: remove old API"  # major bump
```

### Updating Submodule Hash
Always include version in commit:
```bash
git commit -m "chore: update aai-embed to v3.0.5"
```

---

## Setup Status

### chat-embed Repository
- [x] Workflow created and tested
- [x] NPM_TOKEN configured
- [x] Successfully publishes to npm

### theanswer Repository
- [x] Workflow file updated
- [x] Documentation updated
- [ ] Test with submodule hash update
- [ ] Verify verification logic

---

## Monitoring

**Workflow URLs:**
- Parent: https://github.com/the-answerai/theanswer/actions/workflows/publish-packages.yml
- Submodule: https://github.com/the-answerai/chat-embed/actions/workflows/publish-npm.yml

**Check versions:**
```bash
npm view @answerai/aai-embed versions
npm view @answerai/aai-embed-react versions
```
