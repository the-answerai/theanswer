# Fleet + Agent Teams Walkthrough

Quick test to verify `/fleet` correctly uses Agent Teams mode.

## Prerequisites

1. Agent Teams enabled in `.claude/settings.json`:
   ```json
   { "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
   ```
2. Restart Claude Code after changing settings (features load at session start)

---

## Test 1: Mode Detection

**Goal:** Verify fleet detects Agent Teams mode.

```
/fleet "add a comment to the top of packages/server/src/index.ts"
```

**What to look for:**
- Plan should show `### Mode: Agent Teams`
- After approval, should create an agent team (not spawn a Task subagent)
- You should see teammate(s) listed in the terminal
- Use `Shift+Up/Down` to cycle through teammates (in-process mode)

**Approve the plan, then cancel** (`Ctrl+C`) after verifying the mode. Clean up:
```
/fleet cleanup
```

---

## Test 2: Two Parallel Workers (Minimal)

**Goal:** Verify two teammates work in parallel in isolated worktrees.

Create two tiny goals that can't conflict:

```
/fleet "add a hello-world.txt to packages/server" "add a hello-world.txt to packages/ui"
```

Or use two independent goals:

```
/fleet "create a file FLEET-TEST-1.md in packages/server with the text 'worker 1 was here'" "create a file FLEET-TEST-2.md in packages/ui with the text 'worker 2 was here'"
```

**What to look for:**
- [ ] Plan shows 2 work units
- [ ] 2 worktrees created in `/home/max/dev/theanswer-worktrees/`
- [ ] Agent team is created (not subagent Tasks)
- [ ] 2 teammates spawned (worker names in terminal)
- [ ] Lead stays in delegate mode (doesn't implement anything itself)
- [ ] Teammates message the lead when done
- [ ] `TaskList` shows tasks completing

**Check status mid-flight:**
```
/fleet
```

**After completion, verify worktrees:**
```bash
# Check worktree 1
ls /home/max/dev/theanswer-worktrees/*/FLEET-TEST-*.md 2>/dev/null
cat /home/max/dev/theanswer-worktrees/*/FLEET-TEST-*.md 2>/dev/null
```

**Clean up (don't push test files):**
```
/fleet cleanup
```

---

## Test 3: Teammate Communication

**Goal:** Verify teammates can message the lead and each other.

```
/fleet "create a shared constants file at packages/server/src/constants/fleet-test.ts that exports FLEET_VERSION='1.0'" "create a file at packages/server/src/utils/fleet-test-util.ts that imports FLEET_VERSION from the constants file and logs it"
```

**What to look for:**
- [ ] Worker 2 should need to coordinate with Worker 1 (shared dependency)
- [ ] You may see teammate-to-teammate messaging
- [ ] Lead receives status messages from both workers
- [ ] Shift+Up/Down lets you see each teammate's session

**Clean up:**
```
/fleet cleanup
```

---

## Test 4: Subagent Fallback

**Goal:** Verify fallback works when Agent Teams is disabled.

1. Temporarily disable Agent Teams:
   - Remove `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` from `.claude/settings.json`
   - Restart Claude Code

2. Run:
   ```
   /fleet "create a file FALLBACK-TEST.md in packages/server"
   ```

3. **What to look for:**
   - Plan should show `### Mode: Subagent`
   - Uses `Task` tool with `fleet-worker` subagent (not Agent Teams)
   - Worker runs in background

4. Clean up and re-enable:
   ```
   /fleet cleanup
   ```
   Re-add the env setting to `.claude/settings.json`.

---

## Quick Checklist

| Feature | How to Verify |
|---|---|
| Mode detection | Plan shows "Agent Teams" mode |
| Team creation | Terminal lists teammates after spawning |
| Worktree isolation | Each worker has its own dir under `theanswer-worktrees/` |
| Delegate mode | Lead never edits files, only coordinates |
| Task self-claiming | `TaskList` shows tasks claimed by worker names |
| Teammate → lead messaging | Lead receives completion messages |
| Cleanup | Teammates shut down, team cleaned up, worktrees removed |
| Subagent fallback | Disable flag → falls back to Task tool |

---

## Troubleshooting

**Teammates not appearing:**
- Verify `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings
- Restart Claude Code after changing settings
- Check: did fleet detect Agent Teams mode in the plan?

**Lead implementing instead of delegating:**
- Tell it: "Enter delegate mode. Don't implement, only coordinate."
- Or press `Shift+Tab` to cycle into delegate mode

**File conflicts between workers:**
- This shouldn't happen — each worker has its own worktree
- If it does, check that worktrees were created correctly: `git worktree list`

**Orphaned worktrees after testing:**
```bash
# Manual cleanup
git worktree list
git worktree remove /home/max/dev/theanswer-worktrees/{name} --force
```
