# Decision Log — FitBreak

Record of key architectural and product decisions.

## Format

```
### DECISION-NNN: Title
**Date:** YYYY-MM-DD
**Context:** What prompted this decision
**Decision:** What was decided
**Alternatives considered:** What else was on the table
**Rationale:** Why this choice
```

---

### DECISION-001: Pure Signals for State Management
**Date:** pre-2026-03 (foundational)
**Context:** Needed state management approach for Angular 21 app
**Decision:** Use Angular Signals exclusively. No NgRx, no BehaviorSubjects for state.
**Alternatives considered:** NgRx, BehaviorSubject-based services
**Rationale:** Single-user app with straightforward state. Signals are native to Angular 21, zero boilerplate, sufficient for the complexity level.

### DECISION-002: Supabase as Backend
**Date:** pre-2026-03 (foundational)
**Context:** Need auth + database without building a server
**Decision:** Supabase with direct client SDK calls from Angular services
**Alternatives considered:** Firebase, custom Node.js backend
**Rationale:** PostgreSQL gives real SQL power (RPC functions, JSONB), RLS handles auth-scoped queries, no server to maintain.

### DECISION-003: Ukrainian UI, English Code
**Date:** pre-2026-03 (foundational)
**Context:** App is for personal use, user is Ukrainian-speaking
**Decision:** Hardcode all UI text in Ukrainian. No i18n framework.
**Alternatives considered:** i18n with translation files
**Rationale:** Single-user app. i18n overhead not justified. Exercise names have both Ukrainian (`name`) and English (`nameEn`) for YouTube search.

### DECISION-004: Hybrid Settings — dedicated page + in-context persistence
**Date:** 2026-03-24
**Context:** Settings page needed for break interval, stepper defaults, rest timer. Question of where to put the controls.
**Decision:** Dedicated `/settings` page as the primary UI. Stepper auto-persists last-used values silently. No in-context settings on dashboard for V1.
**Alternatives considered:** (A) Dedicated page only, (B) In-context only (configure where you use it), (C) Hybrid
**Rationale:** CEO confirmed dedicated page is a good investment for future settings (theme, language, notifications). In-context for stepper is natural since setup screen already has pickers. Break interval is "set once, forget" — doesn't need to be on dashboard.

### DECISION-005: Lazy-load SettingsService with ensureLoaded() pattern
**Date:** 2026-03-24
**Context:** Settings are consumed by multiple lazy-loaded routes (dashboard, stepper, strength). Loading only in DashboardComponent leaves other routes unserved on direct navigation.
**Decision:** SettingsService uses a lazy `ensureLoaded()` pattern — first consumer triggers load, subsequent calls reuse the same promise. Non-null computed signals with `?? defaults` ensure safe reads.
**Alternatives considered:** APP_INITIALIZER (eager), load in authGuard, load only in dashboard
**Rationale:** Lazy pattern is most resilient — works regardless of which route loads first, no wasted calls if settings aren't needed. QA review identified cross-route timing as the biggest risk (R8).
