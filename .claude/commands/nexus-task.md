---
description: "Lightweight task preparation for Level 0-1 work — quick analysis and minimal spec without full multi-agent consultation. Use for bug fixes, small features, and clear-scope changes."
---

# Nexus Task

Lightweight alternative to `/nexus-explore` for small tasks (Level 0-1).
No full multi-agent pipeline — just enough preparation to avoid obvious mistakes.

## Input

CEO provides: task description. Examples:
- "Fix the timer not resetting after completing an exercise"
- "Add dark mode toggle to settings"
- "Update the break reminder interval logic"

## Steps

### 1. Quick context check

Read:
- `.nexus/evergreen/ARCHITECTURE.md` — relevant patterns for this area
- `.nexus/evergreen/PROJECT-IDENTITY.md` — only if task touches product scope

Skim, don't deep-read. This is meant to be fast.

### 2. Assess scope

Confirm this is Level 0-1:
- Level 0: single file, obvious fix, no architecture impact
- Level 1: 1-3 files, clear scope, no new patterns needed

If the task looks bigger than expected — tell CEO:
"This looks like a Level [N] task. Consider running `/nexus-explore` instead."
Let CEO decide.

### 3. Quick spec

Generate a minimal spec (NOT a full Feature Spec):

```
⚡ Task: [title]
━━━━━━━━━━━━━━━

📍 Level: [0 or 1]

🎯 What: [one sentence — what needs to happen]

📁 Affected: [files/components that need changes]

⚠️ Watch out:
   - [1-2 things to be careful about]

✅ Done when:
   - [1-3 concrete criteria]
```

### 4. Proceed or hand off

Ask CEO:
- "Looks straightforward. Want to proceed with implementation?"
- If yes — continue with coding in the same session
- If CEO wants to do it themselves — the quick spec above is their guide

## Rules

- Speed over thoroughness. This should take 1-2 minutes, not 10.
- Don't run multi-agent consultations. Single perspective is fine for Level 0-1.
- If task is actually complex — escalate to `/nexus-explore`, don't try to force it through quick path.
- "Watch out" section is the most valuable part — even small changes can have surprising side effects.
- No separate file in `.nexus/active/` for Level 0 tasks. Level 1 gets a file only if there are meaningful decisions to absorb later.
