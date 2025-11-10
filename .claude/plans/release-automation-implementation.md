# Release Automation Implementation Plan - 12/10 Flow

**Goal:** Fully automated, Linear-synced, semver-compliant release process

**Timeline:** 3 weeks (can be compressed to 1-2 weeks if prioritized)

---

## Overview

Transform the current manual release process into a fully automated system that:
- ✅ Enforces conventional commits for accurate semver
- ✅ Integrates natively with Linear for ticket tracking
- ✅ Auto-generates changelogs grouped by Linear tickets
- ✅ Creates GitHub releases with proper versioning
- ✅ Updates Linear tickets with release versions
- ✅ Maintains current staging → production workflow

---

## Current State Assessment

### ✅ What You Already Have
- [x] Semantic-release installed and configured
- [x] GitHub Actions workflow (`.github/workflows/release.yml`)
- [x] Custom Linear webhook (`github-linear-slack-automation`)
- [x] Staging → production release pattern
- [x] Single-version monorepo (3.0.0)
- [x] Most PRs reference Linear tickets (ANS-X)

### ❌ What's Missing
- [ ] Conventional commit enforcement
- [ ] Linear native GitHub integration
- [ ] Enhanced semantic-release config for Linear tickets
- [ ] Post-release Linear ticket updates
- [ ] Changelog grouped by Linear tickets
- [ ] Team documentation and training

---

## Phase 1: Foundation (Week 1, Days 1-2)

### Goal: Setup tooling without disruption

#### 1.1 Install Commitlint

**Install dependencies:**
```bash
pnpm add -D @commitlint/cli @commitlint/config-conventional
```

**Create `.commitlintrc.json`:**
```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert"
      ]
    ],
    "scope-empty": [1, "never"],
    "scope-case": [2, "always", "upper-case"],
    "subject-case": [2, "always", "sentence-case"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "body-leading-blank": [2, "always"],
    "footer-leading-blank": [2, "always"]
  },
  "parserPreset": {
    "parserOpts": {
      "issuePrefixes": ["ANS-"]
    }
  }
}
```

**Update `.husky/commit-msg`:**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Commitlint check
npx --no -- commitlint --edit $1
```

**Test locally:**
```bash
# Should pass
git commit -m "feat(ANS-65): add chat UI artifacts"

# Should fail
git commit -m "Added new feature"
```

#### 1.2 Create Commit Message Helper Script

**`.github/scripts/format-commit.sh`:**
```bash
#!/bin/bash

# Helper to format commit messages
# Usage: ./format-commit.sh "ANS-65" "add chat UI artifacts" "feat"

TICKET=$1
MESSAGE=$2
TYPE=${3:-feat}

if [ -z "$TICKET" ] || [ -z "$MESSAGE" ]; then
  echo "Usage: $0 <ticket> <message> [type]"
  echo "Example: $0 ANS-65 'add chat UI artifacts' feat"
  exit 1
fi

FORMATTED="$TYPE($TICKET): $MESSAGE"
echo "$FORMATTED"
git commit -m "$FORMATTED"
```

**Make executable:**
```bash
chmod +x .github/scripts/format-commit.sh
```

#### 1.3 Update PR Template

**`.github/pull_request_template.md`:**
```markdown
## Summary
<!-- Describe your changes -->

## Linear Ticket
Closes ANS-

## Type of Change
<!-- Check one -->
- [ ] feat: New feature (minor version bump)
- [ ] fix: Bug fix (patch version bump)
- [ ] perf: Performance improvement (patch version bump)
- [ ] refactor: Code refactor (patch version bump)
- [ ] docs: Documentation only
- [ ] chore: Maintenance (no version bump)

## Breaking Changes
<!-- If yes, describe and add BREAKING CHANGE to commit body -->
- [ ] Yes (major version bump)
- [x] No

## Commit Message Format
**Required format:** `type(ANS-X): description`

Examples:
- `feat(ANS-65): add chat UI artifacts display`
- `fix(ANS-41): resolve follow-up prompts crash`
- `perf(ANS-59): optimize query performance`

## Testing
- [ ] Tested locally
- [ ] Deployed to staging
- [ ] No breaking changes
```

**Commit these changes:**
```bash
git checkout -b chore/release-automation-setup
git add .commitlintrc.json .husky/commit-msg .github/scripts/format-commit.sh .github/pull_request_template.md
git commit -m "chore: setup commitlint and PR templates for release automation"
git push -u origin chore/release-automation-setup
gh pr create --base staging --title "chore: Setup release automation foundation" --body "Part 1: Commitlint and PR templates"
```

**✅ Success Criteria:**
- [ ] Commitlint blocks invalid commit messages locally
- [ ] PR template reminds developers of format
- [ ] No disruption to current workflow

---

## Phase 2: Enforcement (Week 1, Days 3-5)

### Goal: Gradually enforce conventional commits

#### 2.1 GitHub Action: PR Title Lint

**Create `.github/workflows/pr-title-lint.yml`:**
```yaml
name: PR Title Lint

on:
  pull_request:
    types: [opened, edited, synchronize, reopened]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check PR title format
        uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            docs
            style
            refactor
            perf
            test
            build
            ci
            chore
            revert
          requireScope: true
          scopes: |
            ^ANS-\d+$
          subjectPattern: ^[A-Z].+$
          subjectPatternError: |
            Subject must start with uppercase letter.
            Example: "feat(ANS-65): Add chat UI artifacts"
```

**✅ Success Criteria:**
- [ ] PRs with invalid titles show red X
- [ ] Error message guides developers to correct format
- [ ] Existing PRs not affected (only new/edited)

#### 2.2 GitHub Action: Auto-Suggest PR Title

**Create `.github/workflows/pr-title-suggest.yml`:**
```yaml
name: PR Title Suggester

on:
  pull_request:
    types: [opened]

jobs:
  suggest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Extract Linear ticket and suggest title
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const prBody = context.payload.pull_request.body || '';
            const prTitle = context.payload.pull_request.title;

            // Extract ANS-X from body
            const ticketMatch = prBody.match(/ANS-\d+/);

            if (!ticketMatch) {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.payload.pull_request.number,
                body: `⚠️ **No Linear ticket found**\n\nPlease add a Linear ticket reference (ANS-X) to your PR description.\n\nExample PR title format:\n\`\`\`\nfeat(ANS-65): Add chat UI artifacts display\n\`\`\``
              });
              return;
            }

            const ticket = ticketMatch[0];

            // Check if title follows convention
            const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)\(ANS-\d+\):/;

            if (!conventionalPattern.test(prTitle)) {
              const suggestion = `feat(${ticket}): ${prTitle}`;
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.payload.pull_request.number,
                body: `💡 **Suggested PR Title**\n\nYour PR title doesn't follow conventional commits format.\n\n**Current:** \`${prTitle}\`\n**Suggested:** \`${suggestion}\`\n\nChange the title to match this format for automatic versioning.\n\n**Type options:**\n- \`feat\`: New feature (minor bump)\n- \`fix\`: Bug fix (patch bump)\n- \`perf\`: Performance (patch bump)\n- \`refactor\`: Code refactor (patch bump)\n- \`chore\`: Maintenance (no bump)`
              });
            }
```

**✅ Success Criteria:**
- [ ] New PRs get helpful comment with suggested title
- [ ] Developers understand the format
- [ ] Reduces back-and-forth on PR reviews

#### 2.3 Team Communication

**Create internal doc:** `RELEASE_PROCESS.md`

```markdown
# Release Process - Developer Guide

## TL;DR

**Format your commits:** `type(ANS-X): description`

Examples:
- `feat(ANS-65): add chat UI artifacts` → Minor version bump (1.7.0 → 1.8.0)
- `fix(ANS-41): resolve crash on load` → Patch bump (1.7.0 → 1.7.1)
- `chore: update dependencies` → No version bump

## Why?

Automated releases depend on commit messages to:
1. Determine version bumps (major/minor/patch)
2. Generate changelogs
3. Group features by Linear ticket
4. Update Linear tickets with release info

## Commit Types

| Type | When to Use | Version Bump | Example |
|------|-------------|--------------|---------|
| `feat` | New feature | Minor (1.7.0 → 1.8.0) | `feat(ANS-65): add execution tree` |
| `fix` | Bug fix | Patch (1.7.0 → 1.7.1) | `fix(ANS-59): restore template display` |
| `perf` | Performance | Patch | `perf(ANS-44): optimize query` |
| `refactor` | Code cleanup | Patch | `refactor(ANS-52): simplify auth flow` |
| `docs` | Documentation | None | `docs: update README` |
| `chore` | Maintenance | None | `chore: bump dependencies` |
| `test` | Tests only | None | `test: add unit tests` |

## Breaking Changes

If you break backwards compatibility:

```bash
git commit -m "feat(ANS-100): redesign API

BREAKING CHANGE: API endpoints now require authentication"
```

This triggers a major version bump (1.7.0 → 2.0.0).

## PR Workflow

1. Create branch: `git checkout -b feature/ans-65`
2. Make changes
3. Commit with format: `git commit -m "feat(ANS-65): add feature"`
4. Create PR with title matching first commit
5. PR title will be validated automatically

## What Happens on Release

When we merge staging → production:
1. Semantic-release analyzes all commits since last release
2. Calculates version based on commit types
3. Generates changelog grouped by Linear ticket
4. Creates GitHub release
5. Updates Linear tickets with version label
6. Deploys to production

## Tools

- **Commitlint:** Validates commit format locally
- **PR Title Lint:** Validates PR title on GitHub
- **Semantic Release:** Automates versioning and releases

## Need Help?

Run: `.github/scripts/format-commit.sh ANS-X "your message" feat`
```

**Send team announcement:**
```
📢 New Release Process

Starting next week, we're enforcing conventional commits for automated releases.

**What you need to do:**
- Format commits: `type(ANS-X): description`
- Use PR template (auto-filled)
- GitHub will guide you if format is wrong

**Why:** Automatic versioning, better changelogs, Linear sync

**Docs:** See RELEASE_PROCESS.md

**Questions:** Ask in #engineering
```

**✅ Success Criteria:**
- [ ] Team understands the change
- [ ] Documentation is accessible
- [ ] Support available for questions

---

## Phase 3: Linear Native Integration (Week 2, Days 1-2)

### Goal: Replace custom webhook with Linear native

#### 3.1 Install Linear GitHub App

**Steps:**
1. Go to Linear workspace settings: https://linear.app/settings/integrations
2. Click "GitHub" integration
3. Click "Install GitHub App"
4. Select organization: `the-answerai`
5. Select repository: `theanswer`
6. Authorize

**Configure team automation:**
1. In Linear, go to Team Settings → GitHub
2. Set workflow automation:
   ```
   Branch: staging
   When PR merged: Set issue status to "In Staging"

   Branch: production
   When PR merged: Set issue status to "Released"
   ```
3. Enable:
   - ✅ Auto-assign on branch creation
   - ✅ Auto-link PRs with ANS-* in title/description
   - ✅ Sync PR review state
   - ✅ Create branch from Linear issue

#### 3.2 Test Linear Integration

**Test flow:**
```bash
# 1. Create Linear ticket: ANS-TEST
# 2. Create branch from Linear
# 3. Make a change
git commit -m "feat(ANS-TEST): test linear integration"
git push

# 4. Create PR
gh pr create --base staging --title "feat(ANS-TEST): test linear integration"

# 5. Check Linear:
#    - Issue should link to PR
#    - Status should update to "In Progress"

# 6. Merge PR
gh pr merge --squash

# 7. Check Linear:
#    - Status should be "In Staging"
```

#### 3.3 Remove Old Webhook (After Testing)

**Only after confirming Linear native works:**
```bash
# Remove custom webhook
gh api -X DELETE /repos/the-answerai/theanswer/hooks/576923957

# Verify
gh api /repos/the-answerai/theanswer/hooks --jq '.[].config.url'
```

**✅ Success Criteria:**
- [ ] Linear issues auto-link to PRs
- [ ] Status updates on PR merge
- [ ] Old webhook removed (after validation)

---

## Phase 4: Enhanced Semantic Release (Week 2, Days 3-5)

### Goal: Better changelogs and Linear ticket grouping

#### 4.1 Install Additional Plugins

```bash
pnpm add -D @semantic-release/exec @semantic-release/git
```

#### 4.2 Update `.releaserc.json`

**Replace current config:**
```json
{
  "branches": [{ "name": "production" }],
  "tagFormat": "v${version}",
  "plugins": [
    [
      "@semantic-release/commit-analyzer",
      {
        "preset": "conventionalcommits",
        "releaseRules": [
          { "type": "feat", "release": "minor" },
          { "type": "fix", "release": "patch" },
          { "type": "perf", "release": "patch" },
          { "type": "refactor", "release": "patch" },
          { "type": "docs", "release": false },
          { "type": "test", "release": false },
          { "type": "chore", "release": false },
          { "breaking": true, "release": "major" }
        ],
        "parserOpts": {
          "noteKeywords": ["BREAKING CHANGE", "BREAKING CHANGES"],
          "issuePrefixes": ["ANS-"]
        }
      }
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        "preset": "conventionalcommits",
        "writerOpts": {
          "groupBy": "scope",
          "commitGroupsSort": "title",
          "commitsSort": ["scope", "subject"],
          "noteGroupsSort": "title"
        },
        "presetConfig": {
          "types": [
            { "type": "feat", "section": "✨ Features" },
            { "type": "fix", "section": "🐛 Bug Fixes" },
            { "type": "perf", "section": "⚡️ Performance" },
            { "type": "refactor", "section": "♻️ Refactors" }
          ]
        }
      }
    ],
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md",
        "changelogTitle": "# Changelog\n\nAll notable changes to TheAnswer platform."
      }
    ],
    [
      "@semantic-release/github",
      {
        "successComment": false,
        "failComment": false,
        "releasedLabels": ["released-v${nextRelease.version}"],
        "assets": []
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["CHANGELOG.md", "package.json"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    [
      "@semantic-release/exec",
      {
        "publishCmd": "node .github/scripts/post-release.js ${nextRelease.version} '${nextRelease.notes}'"
      }
    ]
  ]
}
```

**✅ Success Criteria:**
- [ ] Config validates (`npx semantic-release --dry-run`)
- [ ] Changelog format improves
- [ ] Post-release hook configured

#### 4.3 Create Post-Release Script

**Create `.github/scripts/post-release.js`:**
```javascript
#!/usr/bin/env node

/**
 * Post-Release Script
 *
 * After semantic-release creates a GitHub release, this script:
 * 1. Extracts Linear tickets from release notes
 * 2. Updates each ticket with release version label
 * 3. Adds comment linking to GitHub release
 * 4. Optionally sends Slack notification
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const version = process.argv[2];
const notes = process.argv[3];

if (!version || !notes) {
  console.error('Usage: post-release.js <version> <notes>');
  process.exit(1);
}

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY || 'the-answerai/theanswer';

async function main() {
  console.log(`🚀 Post-release processing for v${version}`);

  // Extract Linear tickets from release notes
  const ticketMatches = notes.match(/ANS-\d+/g) || [];
  const uniqueTickets = [...new Set(ticketMatches)];

  if (uniqueTickets.length === 0) {
    console.log('⚠️  No Linear tickets found in release notes');
    return;
  }

  console.log(`📋 Found ${uniqueTickets.length} Linear tickets: ${uniqueTickets.join(', ')}`);

  // Process each ticket
  for (const ticket of uniqueTickets) {
    try {
      await updateLinearTicket(ticket, version);
      console.log(`✅ Updated ${ticket}`);
    } catch (error) {
      console.error(`❌ Failed to update ${ticket}:`, error.message);
    }
  }

  console.log('✨ Post-release processing complete');
}

async function updateLinearTicket(ticketId, version) {
  if (!LINEAR_API_KEY) {
    console.log(`⚠️  LINEAR_API_KEY not set, skipping ${ticketId}`);
    return;
  }

  const releaseUrl = `https://github.com/${GITHUB_REPO}/releases/tag/v${version}`;

  // GraphQL query to get issue by identifier
  const getIssueQuery = `
    query GetIssue($id: String!) {
      issue(id: $id) {
        id
        identifier
        title
      }
    }
  `;

  // GraphQL mutation to add label
  const addLabelQuery = `
    mutation AddLabel($issueId: String!, $labelName: String!) {
      issueLabelCreate(input: {
        issueId: $issueId
        name: $labelName
      }) {
        success
      }
    }
  `;

  // GraphQL mutation to add comment
  const addCommentQuery = `
    mutation AddComment($issueId: String!, $body: String!) {
      commentCreate(input: {
        issueId: $issueId
        body: $body
      }) {
        success
      }
    }
  `;

  const comment = `Released in [v${version}](${releaseUrl}) 🚀`;

  // In production, implement actual Linear API calls here
  // For now, log what would happen
  console.log(`  📝 Would add label: released-v${version}`);
  console.log(`  💬 Would add comment: ${comment}`);

  // Optional: Send to Slack
  if (process.env.SLACK_WEBHOOK_URL) {
    await notifySlack(ticketId, version, releaseUrl);
  }
}

async function notifySlack(ticketId, version, releaseUrl) {
  // Implement Slack webhook notification
  console.log(`  📢 Would notify Slack about ${ticketId} in v${version}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

**Make executable:**
```bash
chmod +x .github/scripts/post-release.js
```

**Add to package.json:**
```json
{
  "scripts": {
    "release:post": "node .github/scripts/post-release.js"
  }
}
```

**✅ Success Criteria:**
- [ ] Script extracts Linear tickets from notes
- [ ] Script is executable
- [ ] Ready for Linear API integration

---

## Phase 5: Linear API Integration (Week 3, Days 1-3)

### Goal: Automatically update Linear tickets with release info

#### 5.1 Get Linear API Key

**Steps:**
1. Go to Linear Settings → API → Personal API Keys
2. Create new key: "GitHub Release Automation"
3. Copy key
4. Add to GitHub secrets:
   ```bash
   gh secret set LINEAR_API_KEY --body "lin_api_xxxxxxxxxxxxxxxx"
   ```

#### 5.2 Install Linear SDK

```bash
pnpm add -D @linear/sdk
```

#### 5.3 Implement Linear Updates in post-release.js

**Replace the placeholder functions with real implementation:**

```javascript
const { LinearClient } = require('@linear/sdk');

async function updateLinearTicket(ticketId, version) {
  if (!LINEAR_API_KEY) {
    console.log(`⚠️  LINEAR_API_KEY not set, skipping ${ticketId}`);
    return;
  }

  const linear = new LinearClient({ apiKey: LINEAR_API_KEY });
  const releaseUrl = `https://github.com/${GITHUB_REPO}/releases/tag/v${version}`;

  try {
    // Find the issue
    const issue = await linear.issue(ticketId);

    if (!issue) {
      console.log(`⚠️  Issue ${ticketId} not found`);
      return;
    }

    // Add label
    const labelName = `released-v${version}`;
    const existingLabels = await issue.labels();
    const labelExists = existingLabels.nodes.some(l => l.name === labelName);

    if (!labelExists) {
      // Get or create label
      const team = await issue.team;
      let label = await team.labels().then(labels =>
        labels.nodes.find(l => l.name === labelName)
      );

      if (!label) {
        label = await team.createLabel({
          name: labelName,
          color: '#10B981' // Green
        });
      }

      await issue.addLabel(label.id);
      console.log(`  ✅ Added label: ${labelName}`);
    }

    // Add comment
    const comment = `Released in [v${version}](${releaseUrl}) 🚀`;
    await issue.createComment({ body: comment });
    console.log(`  💬 Added comment with release link`);

    // Optional: Update status to "Released" if not already
    const currentState = await issue.state;
    if (currentState && currentState.name !== 'Released') {
      const team = await issue.team;
      const states = await team.states();
      const releasedState = states.nodes.find(s => s.name === 'Released');

      if (releasedState) {
        await issue.update({ stateId: releasedState.id });
        console.log(`  📊 Updated status to: Released`);
      }
    }

  } catch (error) {
    console.error(`❌ Linear API error for ${ticketId}:`, error.message);
    throw error;
  }
}
```

#### 5.4 Update GitHub Action with Linear Secret

**Update `.github/workflows/release.yml`:**

```yaml
name: release

on:
    push:
        branches:
            - production
    workflow_dispatch:

permissions:
    contents: write
    issues: read
    pull-requests: read

jobs:
    release:
        if: github.event_name == 'push'
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
              with:
                  fetch-depth: 0

            - name: Setup Node
              uses: actions/setup-node@v4
              with:
                  node-version: '22'

            - name: Install pnpm
              uses: pnpm/action-setup@v2
              with:
                  version: 8

            - name: Install dependencies
              run: pnpm install --frozen-lockfile

            - name: Semantic Release
              uses: cycjimmy/semantic-release-action@v4
              with:
                  extra_plugins: |
                      @semantic-release/commit-analyzer
                      @semantic-release/release-notes-generator
                      @semantic-release/changelog
                      @semantic-release/git
                      @semantic-release/github
                      @semantic-release/exec
              env:
                  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
                  LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
                  GITHUB_REPOSITORY: ${{ github.repository }}

    dry-run:
        if: github.event_name == 'workflow_dispatch'
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
              with:
                  fetch-depth: 0

            - name: Setup Node
              uses: actions/setup-node@v4
              with:
                  node-version: '22'

            - name: Install pnpm
              uses: pnpm/action-setup@v2
              with:
                  version: 8

            - name: Install dependencies
              run: pnpm install --frozen-lockfile

            - name: Semantic Release (dry run)
              uses: cycjimmy/semantic-release-action@v4
              with:
                  dry_run: true
                  extra_plugins: |
                      @semantic-release/commit-analyzer
                      @semantic-release/release-notes-generator
                      @semantic-release/changelog
                      @semantic-release/git
                      @semantic-release/github
                      @semantic-release/exec
              env:
                  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
                  LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
                  GITHUB_REPOSITORY: ${{ github.repository }}
```

**✅ Success Criteria:**
- [ ] LINEAR_API_KEY stored in GitHub secrets
- [ ] Script can authenticate with Linear
- [ ] Test script locally with dummy ticket

---

## Phase 6: Testing & Validation (Week 3, Days 4-5)

### Goal: Validate end-to-end flow

#### 6.1 Dry Run Test

**Trigger dry run:**
```bash
# Manually trigger workflow
gh workflow run release.yml

# Check output
gh run list --workflow=release.yml --limit 1
gh run view <run-id> --log
```

**What to verify:**
- [ ] Semantic-release analyzes commits correctly
- [ ] Version calculation is accurate
- [ ] Changelog generates with Linear tickets
- [ ] No errors in post-release script

#### 6.2 Create Test Release

**Create test PRs:**
```bash
# Create 3 test PRs to staging
git checkout staging
git pull

# PR 1: Feature
git checkout -b feat/test-1
echo "test" >> test1.txt
git add test1.txt
git commit -m "feat(ANS-TEST-1): test feature for release automation"
git push -u origin feat/test-1
gh pr create --base staging --title "feat(ANS-TEST-1): test feature" --body "Closes ANS-TEST-1"
gh pr merge --squash

# PR 2: Fix
git checkout staging
git pull
git checkout -b fix/test-2
echo "test" >> test2.txt
git add test2.txt
git commit -m "fix(ANS-TEST-2): test fix for release automation"
git push -u origin fix/test-2
gh pr create --base staging --title "fix(ANS-TEST-2): test fix" --body "Closes ANS-TEST-2"
gh pr merge --squash

# PR 3: Chore (should not trigger release)
git checkout staging
git pull
git checkout -b chore/test-3
echo "test" >> test3.txt
git add test3.txt
git commit -m "chore: test chore (no release)"
git push -u origin chore/test-3
gh pr create --base staging --title "chore: test chore" --body "Testing release automation"
gh pr merge --squash
```

**Create release PR:**
```bash
git checkout staging
git pull
git checkout production
git pull
git checkout -b release/test-automation

# Merge staging into release branch
git merge staging --no-ff -m "Release: Test Automation Flow"

git push -u origin release/test-automation

# Create PR to production
gh pr create --base production \
  --title "Release: Test Automation Flow" \
  --body "## Summary
Testing automated release flow with semantic-release and Linear integration.

## Changes
- feat(ANS-TEST-1): test feature
- fix(ANS-TEST-2): test fix
- chore: test chore (no release)

## Expected Outcome
- Version bump: patch (3.0.0 → 3.0.1)
- Linear tickets ANS-TEST-1, ANS-TEST-2 updated with label
- GitHub release created
"

# Merge PR
gh pr merge --squash
```

**Verify:**
1. Check GitHub releases: `gh release list`
2. Should see new release: `v3.0.1`
3. Check changelog: `cat CHANGELOG.md`
4. Check Linear tickets:
   - ANS-TEST-1: Should have label `released-v3.0.1`
   - ANS-TEST-2: Should have label `released-v3.0.1`
   - Should have comment with release link

**✅ Success Criteria:**
- [ ] Release created automatically
- [ ] Version calculated correctly (3.0.1)
- [ ] Changelog generated with sections
- [ ] Linear tickets updated with labels and comments
- [ ] No manual intervention needed

#### 6.3 Cleanup Test Data

```bash
# Delete test PRs and branches if needed
gh pr list --state merged --search "test" --json number --jq '.[].number' | xargs -I {} gh pr delete {}

# Keep the release as validation
```

---

## Phase 7: Documentation & Rollout (Week 3, Day 5)

### Goal: Complete team enablement

#### 7.1 Update Project README

**Add section to main README.md:**

```markdown
## Release Process

This project uses automated semantic versioning based on conventional commits.

### For Developers

**Commit Format:** `type(ANS-X): description`

- `feat(ANS-65):` → Minor version bump (new feature)
- `fix(ANS-41):` → Patch version bump (bug fix)
- `chore:` → No version bump

See [RELEASE_PROCESS.md](./RELEASE_PROCESS.md) for full guide.

### Release Flow

1. PRs merge to `staging` → Auto-deploy to staging environment
2. Staging → Production PR created → Review and merge
3. Semantic-release runs automatically:
   - Analyzes commits
   - Calculates version
   - Generates changelog
   - Creates GitHub release
   - Updates Linear tickets
   - Deploys to production

### Commands

```bash
# Check what version would be released
gh workflow run release.yml  # (dry run mode)

# View recent releases
gh release list

# View changelog
cat CHANGELOG.md
```
```

#### 7.2 Create Troubleshooting Guide

**Create `.github/docs/RELEASE_TROUBLESHOOTING.md`:**

```markdown
# Release Process Troubleshooting

## Common Issues

### "PR title doesn't follow conventional format"

**Error:** PR checks fail with format error

**Solution:**
1. Edit PR title to match: `type(ANS-X): description`
2. Valid types: feat, fix, perf, refactor, docs, chore, test, build, ci, revert
3. Scope must be Linear ticket: `(ANS-65)`

**Example:** `feat(ANS-65): add chat UI artifacts`

### "No release created after merging to production"

**Possible causes:**
1. No releasable commits (only chore/docs/test)
2. Semantic-release failed (check Actions log)
3. Last commit was [skip ci]

**Check:**
```bash
gh run list --workflow=release.yml --limit 5
gh run view <run-id> --log
```

### "Linear ticket not updated with release"

**Possible causes:**
1. LINEAR_API_KEY not set or expired
2. Ticket identifier doesn't match ANS-X format
3. Ticket doesn't exist or not accessible

**Check:**
```bash
# View post-release script logs
gh run view <run-id> --log | grep "post-release"
```

### "Wrong version calculated"

**Cause:** Commit types don't match expectations

**Check commits since last release:**
```bash
git log v3.0.0..HEAD --oneline --grep="feat\|fix\|BREAKING"
```

**Version bump rules:**
- `BREAKING CHANGE` in commit body → Major (3.0.0 → 4.0.0)
- `feat` commits → Minor (3.0.0 → 3.1.0)
- `fix/perf/refactor` → Patch (3.0.0 → 3.0.1)
- `chore/docs/test` → No bump

### "Husky commit hook blocks commit"

**Error:** Commitlint rejects commit message

**Solutions:**

1. Fix message format:
   ```bash
   git commit --amend -m "feat(ANS-65): proper format"
   ```

2. Use helper script:
   ```bash
   .github/scripts/format-commit.sh ANS-65 "add feature" feat
   ```

3. Emergency bypass (not recommended):
   ```bash
   git commit --no-verify -m "message"
   ```

## Getting Help

1. Check workflow logs: `gh run list --workflow=release.yml`
2. Test dry run: `gh workflow run release.yml`
3. Review commit history: `git log --oneline -20`
4. Ask in #engineering Slack channel

## Emergency: Manual Release

If automation fails and you need to release manually:

```bash
# 1. Determine version
export VERSION="3.1.0"  # Choose appropriate version

# 2. Update package.json
npm version $VERSION --no-git-tag-version

# 3. Update CHANGELOG.md manually

# 4. Commit
git add package.json CHANGELOG.md
git commit -m "chore(release): $VERSION [skip ci]"

# 5. Create tag
git tag -a "v$VERSION" -m "Release v$VERSION"

# 6. Push
git push origin production
git push origin "v$VERSION"

# 7. Create GitHub release
gh release create "v$VERSION" --title "v$VERSION" --notes "Manual release"

# 8. Manually update Linear tickets
# Go to each ticket and add label: released-v$VERSION
```
```

#### 7.3 Team Training Session

**Prepare slides/demo:**

1. **Why we're doing this** (5 min)
   - Manual releases are error-prone
   - Changelogs were inconsistent
   - Linear tickets out of sync
   - Goal: Fully automated, reliable releases

2. **What changed** (10 min)
   - Commit message format now matters
   - PR titles must follow convention
   - GitHub/Linear integration is native
   - Releases happen automatically

3. **Developer workflow** (15 min)
   - Demo: Creating a proper commit
   - Demo: Creating a PR with correct title
   - Demo: What happens when you merge
   - Demo: How to check release info

4. **What to avoid** (5 min)
   - Don't skip conventional format
   - Don't use [skip ci] unless necessary
   - Don't merge directly to production
   - Don't manually edit version in package.json

5. **Q&A** (15 min)
   - Common questions
   - Troubleshooting tips
   - Where to get help

**Schedule:**
- Record demo video for async viewing
- Live session for Q&A
- Office hours for first week

**✅ Success Criteria:**
- [ ] Team trained on new process
- [ ] Documentation complete and accessible
- [ ] Support channels established

---

## Phase 8: Monitoring & Iteration (Ongoing)

### Goal: Ensure process works smoothly

#### 8.1 Metrics to Track

**Week 1-2 after rollout:**
- [ ] % of PRs with correct title format
- [ ] Number of failed PR title checks
- [ ] Number of commits that bypass commitlint
- [ ] Release frequency (should remain ~2-3/week)
- [ ] Linear sync success rate
- [ ] Time from merge to production deploy

**Dashboard:**
```bash
# Create script to generate metrics
.github/scripts/release-metrics.sh
```

#### 8.2 Feedback Loop

**Create feedback form:**
- What's working well?
- What's confusing?
- What takes too long?
- What could be automated further?

**Regular check-ins:**
- Week 1: Daily check
- Week 2: Every other day
- Week 3+: Weekly review

#### 8.3 Iteration Plan

Based on feedback, consider:

**Enhancements:**
- [ ] Auto-fix PR titles (not just suggest)
- [ ] Slack notifications on releases
- [ ] Release notes posted to Linear updates
- [ ] Deployment status in Linear tickets
- [ ] Rollback automation
- [ ] Hotfix workflow (bypass staging)

**Future improvements:**
- [ ] Move to trunk-based (single main branch)
- [ ] Deployment frequency metrics
- [ ] Lead time tracking
- [ ] DORA metrics integration

---

## Success Metrics - 12/10 Flow

### Quantitative
- ✅ **100% conventional commit compliance** (enforced)
- ✅ **Zero manual release steps** (fully automated)
- ✅ **Linear sync: 100% accuracy** (all tickets tagged)
- ✅ **Changelog generation: 100% automated**
- ✅ **Release time: <5 minutes** (from merge to production)
- ✅ **Developer overhead: <1 minute/PR** (just correct title)

### Qualitative
- ✅ **Developers understand the process**
- ✅ **Product team can track releases in Linear**
- ✅ **Customers see clear release notes**
- ✅ **Rollbacks are simple** (revert commit + deploy)
- ✅ **No confusion about "what's in production"**
- ✅ **CI/CD is trusted and reliable**

---

## Quick Reference

### Commands

```bash
# Check commit format locally
npx commitlint --from HEAD~1 --to HEAD

# Format a commit
.github/scripts/format-commit.sh ANS-65 "description" feat

# Dry run release
gh workflow run release.yml

# Check release status
gh run list --workflow=release.yml --limit 1

# View recent releases
gh release list

# View changelog
cat CHANGELOG.md
```

### Commit Types Quick Reference

| Type | Bump | Use For |
|------|------|---------|
| `feat(ANS-X):` | Minor | New features |
| `fix(ANS-X):` | Patch | Bug fixes |
| `perf(ANS-X):` | Patch | Performance |
| `refactor(ANS-X):` | Patch | Code cleanup |
| `chore:` | None | Dependencies |
| `docs:` | None | Documentation |
| `test:` | None | Tests |

---

## Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| 1. Foundation | 2 days | Commitlint + PR template |
| 2. Enforcement | 3 days | GitHub Actions + validation |
| 3. Linear Native | 2 days | Native integration setup |
| 4. Enhanced Release | 3 days | Better semantic-release config |
| 5. Linear API | 3 days | Automated ticket updates |
| 6. Testing | 2 days | End-to-end validation |
| 7. Rollout | 1 day | Documentation + training |
| 8. Monitor | Ongoing | Metrics + iteration |

**Total:** 16 days (~3 weeks)

---

## Next Steps

1. **Review this plan** with team leads
2. **Adjust timeline** based on priorities
3. **Assign ownership** for each phase
4. **Start with Phase 1** (low risk, high value)
5. **Iterate based on feedback**

**Ready to start?** Let's begin with Phase 1: Foundation setup.
