---
description: "Sprint planning — structured analysis from product and technical perspectives, interactive dialog with CEO to define priorities. Run weekly or at the start of a new sprint."
---

# Nexus Plan

You are facilitating a sprint planning session with CEO.
This is a structured dialog — analyze from multiple angles, discuss with CEO,
help them make informed decisions.

**Do NOT roleplay as agents.** Read agent files (`.claude/agents/nexus-*.md`)
as knowledge sources for project-specific context, domain expertise, and
decision-making principles. Use this knowledge to inform your analysis,
but speak as yourself — a knowledgeable facilitator.

## Steps

### 1. Load context

Read:
- `.nexus/evergreen/PROJECT-IDENTITY.md` — mission, north star, boundaries
- `.nexus/evergreen/EXECUTION-PLAN.md` — current roadmap, backlog, completed work
- `.nexus/evergreen/DECISION-LOG.md` — recent decisions (last 5-10)
- `.nexus/evergreen/WORKFLOW-STATUS.md` — current state
- `.nexus/evergreen/RETROSPECTIVE-LOG.md` — recent lessons (last 3-5)
- `.claude/agents/nexus-product-lead.md` — product thinking and domain expertise
- `.claude/agents/nexus-frontend-architect.md` — technical perspective (if exists)
- `.claude/agents/nexus-backend-engineer.md` — backend perspective (if exists)

### 2. Present current state

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

**Wait for CEO's reaction before proceeding.**

### 3. Product analysis

Using knowledge from product-lead agent file and PROJECT-IDENTITY, analyze:

- What are the highest-impact items and why?
- Are there user needs not reflected in the backlog?
- Do any parking lot items deserve promotion?
- Any items no longer relevant?

Present recommendations with reasoning. **Wait for CEO to discuss.**
Engage in genuine dialog — if CEO disagrees, explore why.

### 4. Technical assessment

Using knowledge from architect/backend agent files and ARCHITECTURE, assess:

- Realistic complexity and level (0-4) for each proposed item
- Hidden dependencies between items
- Technical risks or prerequisites
- Items that should be split or reordered based on technical reality

Present assessment. **Wait for CEO to discuss.**
CEO may challenge estimates or propose alternatives — especially
on frontend tasks where they have deep expertise.

### 5. Synthesis and decision

Help CEO bring it together:

- "Here's what I'd suggest for the sprint based on both perspectives: [synthesis]"
- "What's your capacity this sprint?"
- "Any external deadlines or constraints?"

If CEO proposes something that conflicts with PROJECT-IDENTITY boundaries,
flag it honestly with reasoning (per nexus-helpers.md#Agent-Core-Principles).

### 6. Define sprint

Based on discussion, define:
- Sprint goals (2-3 max)
- Sprint backlog with levels assigned to each task
- WIP limit (default: 2 active features)

Use `nexus-helpers.md#Level-Assessment` to assign levels.

### 7. Update files

Update `.nexus/evergreen/EXECUTION-PLAN.md` with new sprint.
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

⏭️ Start with: [first task] → use /nexus-task or /nexus-explore depending on level
```

## Rules

- **This is a dialog.** Wait for CEO input after each analysis step.
- CEO has final say on priorities. Your job is to inform, not decide.
- Be realistic about capacity. Better to plan 3 items and finish all than 7 and finish 2.
- If backlog is empty, facilitate a brainstorm using product knowledge.
- Reference retrospective lessons — don't repeat past mistakes.
- Every task needs a level (0-4). This determines which pipeline it follows.
- Apply nexus-helpers.md#Agent-Core-Principles: critical thinking, honesty, don't just agree.
- **For deeper product strategy discussion** — suggest CEO runs `claude --agent nexus-product-lead` for a dedicated session.
