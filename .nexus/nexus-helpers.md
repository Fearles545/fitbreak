# Nexus Helpers

> Shared operations, templates, and behavioral principles for Nexus agents and commands.
> Agents reference sections via anchor: "Reference: .nexus/nexus-helpers.md#Section-Name"
> Purpose: reduce token usage by avoiding duplication across agent files.

---

## Agent-Core-Principles

Universal behavioral principles for ALL Nexus agents. Every agent MUST follow these.

**Critical Thinking:** Don't just agree with everything CEO proposes. Evaluate objectively. When you have a well-reasoned alternative position — share it honestly. CEO values constructive honesty over comfortable agreement.

**Honesty Over Comfort:** When you see a genuine problem, weak spot, or risk — raise it directly with reasoning. Don't soften real issues. CEO won't be offended — they'll be grateful for a well-argued alternative perspective.

**Collaborative by Default:** Be helpful, explain, suggest, share knowledge. Pushback is for real issues, not every interaction. If CEO's approach is solid — say so and move forward.

**Project Context First:** Always consult relevant `.nexus/evergreen/` files before responding. Your value comes from project-specific knowledge, not generic advice.

**Stay in Your Lane:** Each agent owns a specific domain. Don't make decisions outside your responsibility. Flag cross-domain concerns to CEO and suggest which agent should be consulted.

**Memory Matters:** Update your persistent memory with valuable discoveries. Future sessions benefit from what you learn today.

---

## Reading Project Context

Before any significant work, agents should:

1. Read `.nexus/evergreen/PROJECT-IDENTITY.md` — understand the north star
2. Read `.nexus/evergreen/ARCHITECTURE.md` — understand current patterns
3. Read `.nexus/evergreen/WORKFLOW-STATUS.md` — understand current state
4. Check `.nexus/active/` — for any in-progress feature specs

## Consulting Other Agents

When your work touches another agent's domain, recommend consultation:

- **Changing DB schema?** → nexus-backend-engineer
- **New user-facing flow?** → nexus-ux-designer + nexus-product-lead
- **Architecture decision?** → nexus-frontend-architect
- **Before marking done?** → nexus-qa-engineer

---

## Decision-Log-Format

Use this format when adding a new entry to `evergreen/DECISION-LOG.md`:

```markdown
### [YYYY-MM-DD] Decision Title

**Status:** Accepted | Rejected | Superseded by [###]

**Context:**
What was happening, what problem or choice we faced.

**Options Considered:**
1. Option A — brief description
2. Option B — brief description

**Decision:**
What we decided and why.

**Consequences:**
- Positive: what improves
- Negative: what trade-offs we accept
- Risks: what to watch out for
```

---

## Feature-Spec-Format

Use this format when creating a Technical Design Document in `active/`:

```markdown
# Feature: [Name]

**Level:** [0-4]
**Date:** [YYYY-MM-DD]
**Status:** Draft | In Review | Approved | Completed

## Context
Why we're doing this, what problem it solves.

## User Stories
- As a [user], I want [action] so that [outcome]
  - AC: [specific testable criteria]

## UX Flow
How user interacts, wireframe description, accessibility notes.

## Technical Design
- Components to create/modify
- Data model changes
- State management changes
- API contracts

## Edge Cases & Risks
What could go wrong, severity, mitigation.

## Acceptance Criteria
How to know it's done.

## Open Questions
What's not decided yet.
```

---

## Handoff-Format

Use this format when creating a handoff note in `handoffs/`:

```markdown
# Handoff: [YYYY-MM-DD] Session [N]

## What was done
Brief summary of accomplishments.

## Decisions made
Key decisions (details in DECISION-LOG).

## Current state
What's in progress, what's the state of active work.

## Next steps
What to do in the next session, in priority order.

## Blockers or concerns
Anything that needs attention.
```

---

## Absorption-Flow

When `/nexus-save` runs, perform absorption on completed active artifacts:

1. **Read** the active artifact (feature spec or review findings)
2. **Extract** valuable content by category:
   - Architecture decisions → append to `evergreen/DECISION-LOG.md` using #Decision-Log-Format
   - New patterns or anti-patterns → update `evergreen/ARCHITECTURE.md`
   - Product insights, boundary changes → update `evergreen/PROJECT-IDENTITY.md`
   - Process lessons → append to `evergreen/RETROSPECTIVE-LOG.md`
3. **Move** the original artifact to `archive/` (do not delete — keep for future analysis)
4. **Update** `evergreen/WORKFLOW-STATUS.md` with current state
5. **Create** handoff note in `handoffs/` using #Handoff-Format
6. **Cleanup** old handoffs: keep last 3-5, delete older

---

## Status-Update

When updating `evergreen/WORKFLOW-STATUS.md`:

1. Set `Last updated` to current timestamp
2. Set `Last session` to brief summary of what was done
3. Update `Active Task` with current work (or "None" if between tasks)
4. Update `In Progress`, `Blocked`, `Next Up` sections
5. Add last 1-2 decisions to `Recent Decisions` (keep only 3-5 total)
6. Update `Session Notes` with anything relevant for next session

---

## Updating Evergreen Docs

After completing meaningful work:

- New decision made → add to DECISION-LOG.md
- Architecture changed → update ARCHITECTURE.md
- Sprint priorities shifted → update EXECUTION-PLAN.md
- Learned something → add to RETROSPECTIVE-LOG.md
- Always update WORKFLOW-STATUS.md with current state

---

## Agent-Memory-Reminder

At end of session, remind agents to update their persistent memory:

"Before closing, review what you learned this session. Update your agent memory with:
- New codebase patterns discovered
- Architectural decisions and rationale
- Recurring issues or anti-patterns found
- Key file locations or component relationships
- Any corrections to previously stored knowledge"

---

## Level-Assessment

To determine task level:

| Signal | Suggests Level |
|---|---|
| Single file change, obvious fix | 0 |
| 1-3 files, clear scope, no architecture impact | 1 |
| Multiple components, new state, UI + data | 2 |
| New system/module, cross-cutting concerns | 3 |
| Architecture change, migration, new integrations | 4 |

When in doubt, start one level lower. Escalate if complexity exceeds expectations.

---

## File Conventions

- Feature specs: `.nexus/active/feature-{name}.md`
- Handoffs: `.nexus/handoffs/{date}-session{N}.md`
- Archive: move completed specs to `.nexus/archive/`
