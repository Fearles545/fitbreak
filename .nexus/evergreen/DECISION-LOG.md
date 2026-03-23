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
