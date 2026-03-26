---
description: 'End of session — absorb valuable knowledge into evergreen docs, create handoff, update status, cleanup. Run before ending every work session.'
---

# Nexus Save

You are performing the end-of-session ritual for Nexus. This is the most critical command —
it ensures no knowledge is lost between sessions.

**Reference:** `.nexus/nexus-helpers.md#Absorption-Flow` for detailed absorption procedure.
**Reference:** `.nexus/nexus-helpers.md#Handoff-Format` for handoff note format.
**Reference:** `.nexus/nexus-helpers.md#Status-Update` for status update procedure.

## Steps

### 1. Gather session context

Ask CEO briefly:

- "What were the key decisions or outcomes this session?"
- "Anything that should be remembered for next time?"

If CEO gives short answers, that's fine — supplement with your own observations from the session.

### 2. Absorption (active → evergreen)

Check `.nexus/active/` for completed or updated artifacts. For each:

**Decisions made** → Append to `.nexus/evergreen/DECISION-LOG.md`

- Use ADR format from `nexus-helpers.md#Decision-Log-Format`
- Include: context, options considered, decision, consequences
- Include rejected ideas with "Status: Rejected"

**Architecture changes** → Update `.nexus/evergreen/ARCHITECTURE.md`

- New patterns adopted, anti-patterns discovered, convention changes

**Product insights** → Update `.nexus/evergreen/PROJECT-IDENTITY.md`

- New boundaries, refined north star, updated feature list

**Lessons learned** → Append to `.nexus/evergreen/RETROSPECTIVE-LOG.md`

- What worked, what didn't, action items
- Especially important after difficult sessions

**Completed features** → Update `.nexus/evergreen/EXECUTION-PLAN.md`

- Move completed items, update sprint backlog

### 3. Move absorbed artifacts to archive

Move completed artifacts from `.nexus/active/` to `.nexus/archive/`.
Do NOT delete — keep for future analysis.

### 4. Create handoff note

Create `.nexus/handoffs/[YYYY-MM-DD]-session[N].md` using format from
`nexus-helpers.md#Handoff-Format`.

Include: what was done, decisions made, current state, next steps, blockers.

### 5. Update workflow status

Update `.nexus/evergreen/WORKFLOW-STATUS.md` using procedure from
`nexus-helpers.md#Status-Update`.

### 6. Cleanup old handoffs

Keep only the last 5 handoff notes in `.nexus/handoffs/`. Delete older ones.

### 7. Agent memory reminder

Print:

```
🧠 Agent memory reminder: If specialized agents were used this session,
consider asking them to update their persistent memory with new discoveries.
```

### 8. Mark save completed

- Create file `.nexus/.save-completed` (empty marker)
- Remove `.nexus/.save-reminder` if it exists
- This prevents the SessionEnd hook from creating a false reminder

## Output

After completing all steps, present a summary:

```
💾 Nexus Save Complete
━━━━━━━━━━━━━━━━━━━━━━

📥 Absorbed:
   - [N] decisions → DECISION-LOG
   - [N] architecture updates → ARCHITECTURE
   - [N] lessons → RETROSPECTIVE-LOG
   - [other updates]

📋 Handoff: .nexus/handoffs/[filename]

📊 Status: Updated WORKFLOW-STATUS

🗄️ Archived: [list of moved files, or "None"]
🗑️ Cleaned: [N old handoffs removed, or "None"]

⏭️ Next session starts with: /nexus-status
```

## Rules

- If there's nothing to absorb, that's fine — still create handoff and update status.
- If CEO says "nothing happened" — still update WORKFLOW-STATUS with timestamp and "No changes" note.
- Don't over-absorb. Small bug fixes don't need ADR entries. Use judgment.
- When in doubt about whether something is worth absorbing, ask CEO.
- **After successful save:** create `.nexus/.save-completed` marker and remove `.nexus/.save-reminder` if it exists. This signals the SessionEnd hook that save was performed.
