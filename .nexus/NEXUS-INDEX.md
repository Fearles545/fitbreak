# Nexus Index — FitBreak

> Make physical activity an integral part of your daily routine.

## CEO

Ihor — Solo developer with Angular/frontend background, 5-10h/week. Values critical thinking and honest collaboration over blind execution.

## Scale-Adaptive Levels

| Level | Pipeline | When |
|---|---|---|
| 0 | Quick Flow (task → review → save) | Bug fixes, tiny changes |
| 1 | Light (task → build → review → save) | Small features, 1-3 stories |
| 2 | Full (plan → explore → build → review → save) | Medium features, 3-10 stories |
| 3+ | Full + Council | Large features, architecture changes |

## Quick Links

| Doc | Purpose | Read when |
|-----|---------|-----------|
| [PROJECT-IDENTITY](evergreen/PROJECT-IDENTITY.md) | North star, boundaries, CEO profile | Starting new feature, questioning scope |
| [ARCHITECTURE](evergreen/ARCHITECTURE.md) | Tech stack, patterns, conventions | Making technical decisions |
| [DECISION-LOG](evergreen/DECISION-LOG.md) | Key decisions and their rationale | Before proposing change to existing approach |
| [EXECUTION-PLAN](evergreen/EXECUTION-PLAN.md) | Current sprint and parking lot | During `/nexus-plan` |
| [WORKFLOW-STATUS](evergreen/WORKFLOW-STATUS.md) | Active work, blockers, next steps | Start of every session (`/nexus-status`) |
| [RETROSPECTIVE-LOG](evergreen/RETROSPECTIVE-LOG.md) | What we learned | When hitting similar problem, during retros |

## Directories

| Directory | Contains | Lifecycle |
|-----------|----------|-----------|
| `active/` | Feature specs, review findings for current work | Absorbed into evergreen after completion, then → archive |
| `handoffs/` | Session continuation documents | Keep last 3-5, delete older |
| `archive/` | Completed feature specs (for reference) | Can be cleaned periodically |

## Shared

| File | Purpose |
|------|---------|
| `nexus-helpers.md` | Shared operations, templates, behavioral principles. Agents reference via anchor links. |

## Agents

All agents live in `.claude/agents/nexus-*.md`:

| Agent | Role | When auto-delegated |
|-------|------|---------------------|
| nexus-product-lead | Feature prioritization, UX principles, scope | Prioritizing features, writing user stories, evaluating scope |
| nexus-frontend-architect | Angular architecture, signals, Material M3 | Component design, signal patterns, theming, code structure |
| nexus-backend-engineer | Supabase schema, RLS, SQL, migrations | Schema changes, RLS policies, SQL functions, data integrity |
| nexus-ux-designer | Interaction flows, accessibility, UI copy | User flows, WCAG compliance, Ukrainian copy, responsive design |
| nexus-qa-engineer | Bug hunting, edge cases, data integrity | Code review, edge cases, data flow validation, risk analysis |

## Commands Quick Reference

| Command | When | Level |
|---------|------|-------|
| `/nexus-status` | Start of session | All |
| `/nexus-plan` | Sprint planning | All |
| `/nexus-task <task>` | Small task, fast path | 0-1 |
| `/nexus-explore <feature>` | Feature preparation | 2+ |
| `/nexus-review` | Code review | All |
| `/nexus-save` | End of session | All |

## Deep Sessions (outside standard workflow)

For extended dialog with a specific specialist — architecture discussions,
deep product strategy, learning sessions — launch a dedicated agent session:

```bash
claude --agent nexus-frontend-architect   # Angular architecture discussion
claude --agent nexus-product-lead         # Product strategy deep dive
claude --agent nexus-backend-engineer     # Database/API design session
claude --agent nexus-ux-designer          # UX review and design thinking
claude --agent nexus-qa-engineer          # Quality deep dive
```

This is NOT part of the standard workflow. Use when you want a long, focused
conversation with one specialist. The agent has access to `.nexus/evergreen/`
files and its own persistent memory.

## How commands use agents

| Command | Mode | What happens |
|---------|------|--------------|
| `/nexus-plan` | Structured analysis | Reads agent files as knowledge, analyzes from product + technical perspectives |
| `/nexus-explore` | Structured analysis | Reads agent files, cycles through product → UX → technical → QA analysis |
| `/nexus-review` | Subagents (automatic) | Isolated agents analyze code and return findings |
| `/nexus-task` | Inline | Quick analysis without agent delegation |
| `/nexus-status` | Inline | Reads files, shows status |
| `/nexus-save` | Inline | Absorption, writes files, creates handoff |
