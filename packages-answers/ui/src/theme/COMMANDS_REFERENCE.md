# Theme Validation Commands Reference

Quick reference for all theme validation and linting commands.

## ESLint Commands

### Check for violations
```bash
# All theme files
pnpm lint packages-answers/ui/src/theme/

# Specific file
pnpm lint packages-answers/ui/src/Message/Message.tsx

# All files
pnpm lint
```

### Auto-fix violations
```bash
# Theme files
pnpm lint --fix packages-answers/ui/src/theme/

# All files
pnpm lint-fix
```

### Detailed output
```bash
# Show all violations with context
pnpm lint --format=compact packages-answers/ui/src/

# JSON format (for tools)
pnpm lint --format=json packages-answers/ui/src/theme/

# Show config for file
pnpm lint --print-config packages-answers/ui/src/Message/Message.tsx
```

---

## Theme Validation Commands

### Run compliance check
```bash
# Build and validate
pnpm run theme:validate

# Or run validator directly (if script available)
pnpm --filter ui run validate:theme
```

### Run tests
```bash
# All theme tests
pnpm test:theme

# Specific test file
pnpm --filter ui test -- __tests__/themeCompliance.test.ts

# Watch mode
pnpm --filter ui test -- --watch __tests__/themeCompliance.test.ts

# Coverage
pnpm --filter ui test -- --coverage __tests__/themeCompliance.test.ts
```

---

## Type Checking

### Validate TypeScript
```bash
# Theme types only
pnpm --filter ui tsc --noEmit packages-answers/ui/src/theme/

# All types
pnpm --filter ui tsc --noEmit
```

---

## Pre-commit Hooks

### Run manual validation (simulates pre-commit)
```bash
# Run theme validation hook
./.husky/theme-validate

# Run full pre-commit sequence
./.husky/pre-commit
```

### Skip hooks (not recommended)
```bash
# Skip all hooks
git commit --no-verify

# Skip specific hook
git commit --no-verify  # Then skip

# Re-run hooks manually
pnpm lint-staged
```

---

## Development Commands

### Watch mode (automatic linting)
```bash
# Watch theme files
pnpm --filter ui dev

# This runs your dev server with hot reload
```

### Format code
```bash
# Prettier format (handles more file types)
pnpm format packages-answers/ui/src/theme/

# Or just ESLint
pnpm lint --fix
```

---

## Comprehensive Validation

### Run all checks (before submitting PR)
```bash
# 1. Format code
pnpm lint-fix

# 2. Type check
pnpm --filter ui tsc --noEmit

# 3. Run tests
pnpm test:theme

# 4. Validate theme
pnpm run theme:validate

# Or combine:
pnpm lint-fix && pnpm --filter ui tsc --noEmit && pnpm test:theme
```

### Run in CI mode
```bash
# All checks must pass (no auto-fix)
pnpm lint
pnpm --filter ui tsc --noEmit
pnpm test:theme
```

---

## Import & Usage

### In TypeScript files

```typescript
// Import validators
import {
    runComplianceAudit,
    printComplianceReport,
    runThemeComplianceCheck
} from '@theme/validators/themeCompliance'

// Import pattern detector
import {
    themePatternDetector,
    reportThemePatternViolations,
    createThemeProxy,
    useThemePatternDetection,
    validateStyleObject
} from '@theme/validators/patternDetector'

// Run in app initialization
if (process.env.NODE_ENV !== 'production') {
    runThemeComplianceCheck(true) // verbose
}
```

### Check imports work
```bash
# In node/TypeScript REPL
node -e "
const path = require('path');
const mod = require(path.join(process.cwd(), 'packages-answers/ui/src/theme/validators/themeCompliance.ts'));
console.log(Object.keys(mod));
"
```

---

## Troubleshooting Commands

### Debug ESLint
```bash
# Show ESLint version
pnpm lint --version

# Show ESLint configuration
pnpm lint --print-config packages-answers/ui/src/theme/index.tsx

# Check if rule is loaded
pnpm lint --print-config packages-answers/ui/src/ | grep "no-restricted"

# Enable debug logging
DEBUG=eslint* pnpm lint packages-answers/ui/src/Message/Message.tsx
```

### Verify files
```bash
# Check if validator files exist
ls -la packages-answers/ui/src/theme/validators/

# Check if hook exists
ls -la .husky/theme-validate

# Check if ESLint config exists
ls -la .eslintrc.cjs

# Check tokens
ls -la packages-answers/ui/src/theme/tokens/
```

### Clean and rebuild
```bash
# Clear ESLint cache
rm -rf node_modules/.cache/eslint*

# Clear build artifacts
pnpm clean

# Reinstall dependencies
pnpm install

# Rebuild everything
pnpm build
```

---

## Git Integration

### Check before commit
```bash
# See what files would be linted
git diff --cached --name-only | grep -E '\.(tsx?|jsx?)$'

# See lint errors in staged files
pnpm lint-staged --dry-run
```

### Create test branch
```bash
# Create feature branch
git checkout -b feature/fix-theme-violations

# Make changes
# ... fix violations ...

# Commit (will run hooks)
git add .
git commit -m "fix: remove direct theme.palette access"

# If hooks fail
pnpm lint --fix
git add .
git commit -m "fix: remove direct theme.palette access"
```

---

## Reporting Issues

### Collect debug info
```bash
# ESLint version
pnpm lint --version

# Node version
node --version

# Theme validator check
ls -la packages-answers/ui/src/theme/validators/

# Pre-commit hook
cat .husky/pre-commit
cat .husky/theme-validate

# ESLint config
cat .eslintrc.cjs
```

### Run validation in verbose mode
```bash
# Lint with debug info
DEBUG=eslint* pnpm lint packages-answers/ui/src/ 2>&1 | tee lint-debug.log

# Run compliance check
node -e "
const { runComplianceAudit, printComplianceReport } = require('./packages-answers/ui/src/theme/validators/themeCompliance.ts');
const report = runComplianceAudit();
printComplianceReport(report);
" 2>&1 | tee theme-debug.log
```

---

## One-Liner Commands

### Quick check if violations exist
```bash
pnpm lint 2>&1 | grep -c "theme.palette"
```

### Count violations
```bash
pnpm lint 2>&1 | grep "theme.palette" | wc -l
```

### List all violation files
```bash
pnpm lint 2>&1 | grep "error\|warning" | awk '{print $1}' | sort -u
```

### Auto-fix and test
```bash
pnpm lint --fix && pnpm test:theme && echo "✅ All checks passed"
```

### Full validation pipeline
```bash
pnpm lint --fix && \
pnpm --filter ui tsc --noEmit && \
pnpm test:theme && \
echo "✅ Theme validation complete"
```

---

## IDE/Editor Commands

### VS Code

**Integrated Terminal:**
```bash
# Open integrated terminal
Ctrl+` (backtick)

# Run linter
pnpm lint packages-answers/ui/src/

# Run with fix
pnpm lint --fix packages-answers/ui/src/
```

**Command Palette:**
```
Ctrl+Shift+P (Cmd+Shift+P on Mac)
> ESLint: Fix all auto-fixable problems
```

**Extensions:**
```
Install: ESLint extension
Config: Editor → Settings → search "eslint"
Enable: "Editor: Code Actions on Save"
```

### WebStorm/IntelliJ

**Run Linter:**
```
Tools → Run ESLint
```

**Auto-fix:**
```
Tools → Run ESLint → Fix ESLint Problems
```

**Configuration:**
```
Preferences → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
✓ Enable ESLint
✓ Show ESLint issues in editor
```

---

## Continuous Integration

### GitHub Actions
```yaml
- name: ESLint
  run: pnpm lint

- name: Theme Validation
  run: pnpm run theme:validate

- name: Tests
  run: pnpm test:theme
```

### Local CI simulation
```bash
# Run checks like CI would
pnpm lint && \
pnpm --filter ui tsc --noEmit && \
pnpm test:theme && \
pnpm run theme:validate && \
echo "✅ CI checks passed locally"
```

---

## Performance Tips

### Speed up linting
```bash
# Cache results
pnpm lint --cache

# Clear cache if having issues
pnpm lint --cache --reset-cache

# Lint only changed files
pnpm lint --max-warnings=0
```

### Speed up builds
```bash
# Use Turbo cache
pnpm build

# Force clean build if cache corrupted
pnpm build-force
```

---

## Summary

**Before Commit:**
```bash
pnpm lint-fix && pnpm test:theme
```

**Before Push:**
```bash
pnpm lint && pnpm --filter ui tsc --noEmit && pnpm test:theme
```

**Troubleshooting:**
```bash
# Clean and validate
pnpm nuke && pnpm install && pnpm lint
```

**Full Validation:**
```bash
pnpm lint-fix && \
pnpm --filter ui tsc --noEmit && \
pnpm test:theme && \
pnpm run theme:validate
```
