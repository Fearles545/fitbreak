# Nexus Index — FitBreak

> Make physical activity an integral part of your daily routine.

## Quick Links

| Doc | Purpose |
|-----|---------|
| [PROJECT-IDENTITY](evergreen/PROJECT-IDENTITY.md) | North star, boundaries, CEO profile |
| [ARCHITECTURE](evergreen/ARCHITECTURE.md) | Tech stack, patterns, conventions |
| [DECISION-LOG](evergreen/DECISION-LOG.md) | Key decisions and their rationale |
| [EXECUTION-PLAN](evergreen/EXECUTION-PLAN.md) | Current sprint and parking lot |
| [WORKFLOW-STATUS](evergreen/WORKFLOW-STATUS.md) | Active work, blockers, next steps |
| [RETROSPECTIVE-LOG](evergreen/RETROSPECTIVE-LOG.md) | What we learned |

## Directories

- `active/` — specs and plans for in-progress features
- `handoffs/` — session continuation documents
- `archive/` — completed feature specs

## Agents

All agents live in `.claude/agents/nexus-*.md`:

| Agent | Role | Model |
|-------|------|-------|
| nexus-product-lead | Feature prioritization, UX principles, scope | opus |
| nexus-frontend-architect | Angular architecture, signals, Material M3 | opus |
| nexus-backend-engineer | Supabase schema, RLS, SQL, migrations | opus |
| nexus-ux-designer | Interaction flows, accessibility, UI copy | opus |
| nexus-qa-engineer | Bug hunting, edge cases, data integrity | opus |
