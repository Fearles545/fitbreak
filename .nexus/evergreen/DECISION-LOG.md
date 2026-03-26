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

### DECISION-006: SRP strategy pattern for timer animations
**Date:** 2026-03-26
**Context:** Animated timer component needed multiple animation modes (flip, roll, etc.). Initial implementation had all animation CSS/templates inline in one component — over 200 lines of mixed concerns. CEO requested SRP separation.
**Decision:** Extract each animation mode into its own digit component under `strategies/`. The orchestrator (`AnimatedTimerComponent`) handles layout, sizing, and digit state tracking; delegates rendering to the active strategy via `@switch`. Flip mode dropped — replaced with 5 working modes: roll, fade, scale, blur, slot.
**Alternatives considered:** (A) All-in-one component with CSS classes, (B) Angular CDK animation strategies, (C) Third-party flip clock library (FlipClock.js, FlipDown.js)
**Rationale:** Sub-components give clean SRP — adding a new animation = 1 new file + 1 `@case`. Libraries were overkill (full countdown widgets, not digit-level animation). Flip clock CSS is notoriously broken (z-layering, split-panel positioning) — simpler CSS transitions are more reliable.

### DECISION-007: Extract SessionService from DashboardService
**Date:** 2026-03-26
**Context:** FE architecture review found that `WorkdayService` (shared/) imported `DashboardService` (feature/) for session state — a layering violation. `AnimatedTimerComponent` (shared/) also imported `SettingsService` (feature/). These cross-boundary imports made the dependency graph fragile.
**Decision:** Extract session ownership (`_session` signal, `refreshSession()`, `startWorkday()`, `endWorkday()`, `cleanupStaleSessions()`, `completedBreaks`) into a new `SessionService` in `shared/services/`. DashboardService keeps only `weekActivities` + `loadWeekActivities()`. AnimatedTimerComponent receives animation mode via `@Input` instead of injecting SettingsService.
**Alternatives considered:** (A) Leave as-is and accept the coupling, (B) Move DashboardService to shared/ entirely
**Rationale:** Option B would move feature logic into shared. Option A is a ticking time bomb. Extracting just the session state (consumed by 4 services/components) is the minimal clean cut. AnimatedTimerComponent as a pure presentational component (inputs only) is the correct pattern.

### DECISION-008: Tech debt sprint before continuing features
**Date:** 2026-03-26
**Context:** After Sprint 2 tasks 1-3, CEO felt accumulated tech debt would slow future development. FE architect review found 2 bugs, 2 architecture violations, 4 oversized components, duplicated patterns, missing error handling, and accessibility gaps.
**Decision:** Pause feature work. Execute an 8-phase tech debt sprint addressing all findings before continuing with Sprint 2 tasks 4-5.
**Alternatives considered:** (A) Fix only critical bugs and continue, (B) Address debt incrementally during feature work
**Rationale:** The architecture violations (shared→feature imports) would compound with every new feature. Component sizes (655, 644 LOC) were approaching unmaintainable. Addressing it all at once is cleaner than piecemeal fixes scattered across feature PRs.

### DECISION-009: Stale-while-revalidate loading for dashboard
**Date:** 2026-03-26
**Context:** Dashboard loading UX went through 4 iterations: (1) skeleton overlay — too clunky, (2) inline skeleton elements — didn't look right, (3) dimmed overlay with spinner — caused shaky transitions on re-navigation because content rendered underneath changed when data loaded, (4) stale-while-revalidate.
**Decision:** First visit shows a simple spinner (no data cached yet). Re-visits show previous data instantly and silently refresh in background. `DashboardService._loaded` signal stays true after first successful load; `loading` computed is `!_loaded`. `SessionService` already had a similar pattern.
**Alternatives considered:** (A) Skeleton loader overlay, (B) Inline skeleton elements, (C) Dimmed overlay + spinner, (D) Stale-while-revalidate
**Rationale:** Options A-C all caused visual artifacts — either flash on fast loads, layout mismatch between skeleton and content, or shaky transitions when re-navigating. Stale-while-revalidate is the standard pattern for pages with cached data. The data rarely changes within a session, so showing stale data for ~500ms is invisible to the user.

### DECISION-010: User-controlled break flow (no auto-navigation)
**Date:** 2026-03-26
**Context:** Timer expiry auto-navigated to `/break`, which felt intrusive when mid-thought. Auto-restart after break counted non-work time (coffee, chat) as work. Repeated beeps (5 at 1-min intervals) were annoying when consciously working longer.
**Decision:** Timer expiry shows "break due" state on dashboard (overtime counter, big CTA) instead of navigating away. After break completion, "back to work" state waits for user to signal readiness. Single beep + tab title on expiry, no repeated notifications. Early break available via icon button with confirmation dialog. `next_break_at = null` in DB marks back-to-work state.
**Alternatives considered:** (A) Escalating beep intervals (backoff), (B) Single beep + visual only, (C) Two beeps then snooze chip
**Rationale:** CEO has established break habit — minimal notification is enough. Option B chosen for beeps. User-controlled flow tracks actual work time accurately (`actualWorkSeconds` in BreakEntry). The app becomes a supportive companion, not a demanding boss.

### DECISION-011: Confirm dialog for pause and early break
**Date:** 2026-03-26
**Context:** Pause and early-break buttons moved to icon-only buttons flanking the timer ring. Small touch targets near the timer increase risk of accidental taps.
**Decision:** Both buttons open a lightweight `ConfirmDialogComponent` before executing. Reusable component in `shared/components/confirm-dialog/`.
**Alternatives considered:** (A) No confirmation, (B) Inline toggle (tap to arm, tap to confirm), (C) Long press
**Rationale:** Simple dialog is the standard Material pattern, minimal code, prevents accidental pauses/breaks without adding cognitive load.
