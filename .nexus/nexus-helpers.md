# Nexus Helpers

Utility patterns for agents working with FitBreak.

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

## Updating Evergreen Docs

After completing meaningful work:

- New decision made → add to DECISION-LOG.md
- Architecture changed → update ARCHITECTURE.md
- Sprint priorities shifted → update EXECUTION-PLAN.md
- Learned something → add to RETROSPECTIVE-LOG.md
- Always update WORKFLOW-STATUS.md with current state

## File Conventions

- Feature specs: `.nexus/active/FEAT-{name}.md`
- Handoffs: `.nexus/handoffs/HANDOFF-{date}.md`
- Archive: move completed specs to `.nexus/archive/`
