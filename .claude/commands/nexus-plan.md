---
description: "Sprint planning — analyze current state, consult product and domain agents, define priorities with CEO. Run weekly or at the start of a new sprint."
---

# Nexus Plan

You are facilitating a sprint planning session. Your role is to coordinate
between product perspective and CEO's decisions.

## Steps

### 1. Load context

Read these files:
- `.nexus/evergreen/PROJECT-IDENTITY.md` — mission, north star, boundaries
- `.nexus/evergreen/EXECUTION-PLAN.md` — current roadmap, backlog, completed work
- `.nexus/evergreen/DECISION-LOG.md` — recent decisions (last 5-10)
- `.nexus/evergreen/WORKFLOW-STATUS.md` — current state
- `.nexus/evergreen/RETROSPECTIVE-LOG.md` — recent lessons (last 3-5)

### 2. Present current state to CEO

```
📋 Sprint Planning: [Project Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Previous sprint results:
   - Completed: [list]
   - Carried over: [list]
   - Key lessons: [from retro log]

📦 Current backlog: [top 5-7 items with levels]

🅿️ Parking lot: [ideas not yet prioritized]
```

### 3. Product perspective

Delegate to `nexus-product-lead` agent (or apply product thinking if agent unavailable):

- Based on PROJECT-IDENTITY and current state, what are the highest-impact items?
- Are there user needs not reflected in the backlog?
- Do any parking lot items deserve promotion?
- Are any backlog items no longer relevant (should be removed or deprioritized)?

Present product recommendations to CEO.

### 4. Discussion with CEO

Ask CEO:
- "Do you agree with these priorities?"
- "Anything you want to add, remove, or reorder?"
- "What's your capacity this sprint? (How many hours/days)"
- "Any external deadlines or constraints?"

If CEO mentions a feature that conflicts with boundaries in PROJECT-IDENTITY,
flag it (per Agent-Core-Principles).

### 5. Define sprint

Based on discussion, define:
- Sprint goals (2-3 max)
- Sprint backlog with levels assigned to each task
- WIP limit (default: 2 active features)

Use Level-Assessment from `nexus-helpers.md#Level-Assessment` to assign levels.

### 6. Update EXECUTION-PLAN

Update `.nexus/evergreen/EXECUTION-PLAN.md` with:
- New sprint section (number, dates, goals, backlog)
- Updated backlog priorities
- Moved items between backlog/parking lot as decided

### 7. Update WORKFLOW-STATUS

Update `.nexus/evergreen/WORKFLOW-STATUS.md` with new sprint context.

## Output

```
✅ Sprint [N] Planned
━━━━━━━━━━━━━━━━━━━━

🎯 Goals:
   1. [goal]
   2. [goal]

📋 Sprint Backlog:
   1. [task] — Level [N]
   2. [task] — Level [N]
   3. [task] — Level [N]

⚡ WIP Limit: [N]

⏭️ Start with: [first task] → use /nexus-quick or /nexus-explore depending on level
```

## Rules

- CEO has final say on priorities. Your job is to inform, not decide.
- Be realistic about capacity. Better to plan 3 items and finish all than 7 and finish 2.
- If backlog is empty, facilitate a brainstorm — consult product lead perspective.
- Reference retrospective lessons when planning — don't repeat past mistakes.
- Every task needs a level (0-4). This determines which pipeline it follows.
