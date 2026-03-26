---
description: 'Daily standup — show current project state, active tasks, blockers, and next steps. Run at the start of every session.'
---

# Nexus Status

You are running a quick status check for the CEO. This is the "daily standup" of Nexus.

## Steps

1. **Check** if `.nexus/.save-reminder` exists. If yes — show warning first:
   ```
   ⚠️ Previous session ended without /nexus-save!
   Context from last session may be lost. Run /nexus-save now to recover what you can.
   ```
2. **Read** `.nexus/evergreen/WORKFLOW-STATUS.md`
3. **Read** the most recent file in `.nexus/handoffs/` (if any exist)
4. **Present** a concise status report in this format:

```
📍 Status: [Project Name]
━━━━━━━━━━━━━━━━━━━━━━━━

🔄 Active: [current task or "Nothing in progress"]
   Level: [0-4] | Phase: [plan/explore/build/review]

🚫 Blocked: [blockers or "None"]

⏭️ Next up:
   1. [highest priority next task]
   2. [second priority]

📝 Last session: [brief summary from handoff]

💡 Suggested action: [what to do right now — e.g. "Continue with /nexus-build" or "Start /nexus-plan for new sprint"]
```

## Rules

- Be concise. This is a 30-second check, not a report.
- If WORKFLOW-STATUS.md doesn't exist or is empty, say so and suggest running `/nexus-init` or manually creating it.
- If there are no handoffs, just skip that part.
- The suggested action should be specific and actionable — not "consider your options".
- If last session was more than 7 days ago, note this: "⚠️ Last activity was [N] days ago. Consider running /nexus-plan to re-orient."
