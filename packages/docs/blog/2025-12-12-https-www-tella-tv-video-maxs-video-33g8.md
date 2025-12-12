---
slug: stop-doing-code-reviews-like-a-caveman
title: Stop Doing Code Reviews Like a Caveman - 4 Levels of Claude Code Automation
authors: [maxtechera]
tags: [builder-tips, claude-code, automation, code-review, developer-productivity]
date: 2025-12-12
---

> If your code reviews are infinite scrolls in GitHub, you're wasting your time.

Your team doesn't scale because of your code reviews, not because of your stack. In this guide, I'll show you how to go from manual code reviews to a fully automated system using Claude Code—from basic prompting to a repeatable system with your patterns, your standards, and your senior engineer judgment.

<!-- truncate -->

---

## 🔥 The Problem: Your Review Flow is Broken

Most developers do code reviews like this:

1. Someone opens a PR
2. You go into "Files Changed"
3. You skim the most visible changes
4. You look at a couple frontend files, a couple backend files
5. You drop a generic comment: *"LGTM"* (Didn't read. Looks good to me.)

That repeated 50 times a week? **That's a factory for bugs.**

The problem isn't that you don't have time for code reviews. The problem is that your flow is broken.

---

## 📊 Level 0: The Basic Approach

This is what most people do when they start with Claude Code:

1. Go to the pull request in GitHub
2. Copy all the content of the PR
3. Open Claude Code in the terminal
4. Paste the code and ask: *"Do a code review of these changes"*

**What happens?** It works. Claude Code will give you feedback and point things out.

**The catch?** Context is mixed—old stuff, new stuff, files that don't matter. You're feeding Claude noise along with signal.

> 💡 If you're already doing this, try the next level and see the difference.

---

## 🎯 Level 1: The Patch Mode

Here's where we stop feeding the model like an animal and start giving it only what matters—**the PR patch**.

**The trick is simple:**

1. Go to the pull request URL in GitHub
2. Add `.diff` to the end of the URL
3. This shows only the patch—new lines and deleted ones, none of that other noise
4. Copy the patch
5. Go to Claude Code and paste it with: *"Do a code review of this patch, focusing on performance, stability, and edge cases"*

**What do you gain?**
- Way less useless context
- Claude Code only focuses on the actual changes, not the entire repo
- You can iterate faster: *"Now review only these functions"*

> 💡 If you've never used patch mode, try it on your next PR and come back to tell me—did you notice the difference?

---

## 🤖 Level 2: The Agent Takes Over

Here, Claude Code stops being a chat and becomes a **sub-agent that integrates with your flows**.

**The setup:**

First, set up GitHub CLI on your machine. You can follow the docs or literally tell Claude Code: *"Set up GitHub CLI on this machine."*

**The flow:**

1. Go to GitHub and copy the pull request URL
2. Send it to Claude Code: `review PR [URL]`
3. Claude Code uses GitHub CLI to:
   - Get all the PR details
   - Fetch the diff
   - Ask you questions about your patterns
   - **Put comments directly into the PR**

**Why this is huge:**
- The PR author sees comments directly where they belong
- You don't have to copy-paste anything back from Claude Code
- Your work goes from *"I left a message in the chat"* to *"I left you some comments in that PR"*

> 💡 If you work on a team, show this to your tech lead. You can literally save them hours of review per week.

---

## 🏆 Level 3: Turn It Into a System

So far so good. But there's a huge problem: **all these commands don't know anything about you.**

They don't know:
- How you like to structure tests
- What things are non-negotiables for your team
- Which patterns you want enforced no matter what

You could shove all of that into a giant prompt every time, but that's exactly what doesn't scale.

**The solution: Create a Claude Code command with all your patterns baked in.**

```
Create a command to do a PR review as if you were a senior software engineer on team X, following these patterns:
- Review security first
- Flag any function with no new tests
- Comment on readability and naming
- Check we're not hurting performance
```

Claude Code will generate that command. Then you can simply run:

```
/pr-review [PR-URL]
```

**The final flow:**
1. Someone opens a PR
2. You copy the number or URL
3. You run `/pr-review [URL]`
4. The sub-agent handles everything—fetches info, applies your patterns, adds comments directly to the code

At this point, you don't have an LLM doing magic. **You have a code review system thinking like a senior engineer that anyone on the team can trigger.**

---

## 📋 Quick Recap

| Level | What You Do | What You Get |
|-------|-------------|--------------|
| **0** | Paste entire PR into Claude | Basic feedback, mixed context |
| **1** | Use `.diff` patch mode | Less noise, focused reviews |
| **2** | Integrate GitHub CLI | Comments directly in PR |
| **3** | Create custom command | Repeatable system with your patterns |

---

## 🚀 Why This Changes Everything

- **Stop depending on your mood** when reviewing
- **Get a repeatable standard** across your team
- **Spend your energy on things that matter**, not endless scrolling

This isn't just about saving time. It's about building a system where anyone on your team can contribute quality reviews without being a senior engineer.

---

## ⏭️ What's Next?

If this kind of content helps you, I'll keep breaking down how to use Claude Code to:
- Automate reviews
- Generate tests
- Migrate full features using sub-agents

**Want a video where we build a review command from scratch?** Drop "Level 3" in the comments and we'll build it step by step.

---

**Speaker:** Max Techera
**Track:** builder-tips
**Date:** December 12, 2025
**Source:** [Watch the Video](https://www.tella.tv/video/maxs-video-33g8)
