# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# FitBreak

Personal health tool for building a habit of taking breaks, exercising, and staying active throughout the workday. Single-user app, not a SaaS.

## Nexus — Project Brain

This project uses Nexus for context management. **Start every session with `/nexus-status`.**

**Entry point:** `.nexus/NEXUS-INDEX.md` — links to all evergreen docs, agents, and commands.

**Evergreen docs (`.nexus/evergreen/`):**
- `PROJECT-IDENTITY.md` — north star, boundaries, UX principles, CEO profile
- `ARCHITECTURE.md` — tech stack, project structure, patterns, current state
- `DECISION-LOG.md` — key decisions with rationale
- `EXECUTION-PLAN.md` — sprint backlog and parking lot
- `WORKFLOW-STATUS.md` — what's done, what's next

**Agents (`.claude/agents/nexus-*.md`):** product lead, frontend architect, backend engineer, UX designer, QA engineer.

**Session protocol:**
- **Start:** `/nexus-status`
- **End:** `/nexus-save` — always, before closing. If CEO says "I'm done", "закінчую", "на сьогодні все" — remind them.
- **If `.nexus/.save-reminder` exists** — previous session ended without saving. Remind CEO immediately.

## Guardrails — Don't Break Things

These are the rules that matter even for quick changes without full Nexus context.

### Database

**`docs/fitbreak-supabase-schema.sql` is the source of truth.**

- Do NOT rename columns or tables without explicit approval — ADD new fields instead
- TypeScript interfaces in `shared/models/` must match the DB schema
- camelCase in TypeScript, snake_case in SQL
- JSONB internal keys are camelCase — must stay consistent between TS and DB
- All tables have RLS enabled: `(select auth.uid()) = user_id`

### Angular

- `ChangeDetectionStrategy.OnPush` on all components
- Pure Signals for state (no NgRx, no BehaviorSubjects)
- `inject()` for DI, never constructor injection
- Standalone components, no NgModules
- Do NOT install `@angular/animations` — Material v21 uses CSS animations
- WCAG AA compliance required

### Material M3

- Do NOT use `color="primary"` — M2 pattern, doesn't work in M3
- Style with CSS tokens: `var(--mat-sys-primary)`, `var(--mat-sys-on-primary)`, etc.
- Icons: Material Symbols Outlined (not legacy Material Icons)
- Theme: Deep Purple `#5E35B1`, palettes in `src/_theme-colors.scss`
- Dark mode: `color-scheme: light dark` — auto-follows OS

### Language

- Code, comments, commits — **English**
- UI text (labels, buttons, messages) — **Ukrainian** (hardcoded, no i18n)

### Tests

Vitest (not Karma/Jasmine). `describe`, `it`, `expect` available globally via `vitest/globals`.

### Dates

Always use `date-fns` and `toDateKey()` from `shared/utils/date.utils.ts`. Never `toISOString().split('T')[0]`.

## Documentation

- `docs/fitbreak-project-brief.md` — full project brief (flows, screens, features)
- `docs/fitbreak-data-model.ts` — TypeScript interfaces for all entities
- `docs/fitbreak-supabase-schema.sql` — complete DB schema (source of truth)

Read these before making architectural decisions. When in doubt — check the brief.
