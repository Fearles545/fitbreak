# Architecture — FitBreak

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Angular (standalone, signals, new control flow) | 21.1 |
| UI | Angular Material (M3) | 21.2 |
| Backend | Supabase (Auth + PostgreSQL + RLS) | 2.99 |
| Dates | date-fns | 4.1 |
| Reactive | RxJS (Supabase wrappers only) | 7.8 |
| Audio | Web Audio API | native |
| PWA | @angular/pwa | 21 |
| Tests | Vitest | 4.0 |
| Deploy | GitHub Pages via angular-cli-ghpages | — |

## Project Structure

Flat feature-based. Each folder in `src/app/` is self-contained.

```
src/app/
├── auth/           — login, auth guard, auth service
├── dashboard/      — start screen, week-calendar data (dashboard.service slim)
├── break-timer/    — break-timer.service + sub-components:
│   ├── break-prompt/    — rotation picker, extend-work, skip/choose
│   └── break-execution/ — exercise display, technique, progress
├── day-summary/    — end-of-day summary shown after ending workday
├── strength/       — strength.service + sub-components:
│   ├── strength-rest/   — rest timer between sets
│   └── strength-finish/ — workout summary + mood picker
├── stepper/        — stepper fullscreen timer
├── progress/       — streaks, weekly comparison (progress.service + progress.component)
├── settings/       — settings page + settings.service (lazy-load pattern)
├── shared/
│   ├── components/ — timer-ring, week-calendar, animated-timer (with strategies/),
│   │                 mood-picker, chip-selector
│   ├── services/   — supabase, audio, wake-lock, break-notifier, workday, session
│   ├── models/     — database.types, fitbreak.models (incl. DayActivity), rotation.constants
│   └── utils/      — date.utils, supabase.utils (asJson helper)
└── app.routes.ts   — lazy-loaded routes with auth guards
```

## Key Patterns

### State: Pure Angular Signals
```typescript
private _state = signal<T | null>(null);
readonly state = this._state.asReadonly();
readonly derived = computed(() => /* ... */);
```
No NgRx, no BehaviorSubjects for state. RxJS only for Supabase promise wrapping.

### Services: Domain-Based
- `SupabaseService` — thin wrapper (client + auth only)
- `SessionService` — owns work session state (shared/). Consumed by WorkdayService, BreakTimerService, DashboardComponent, SettingsComponent
- Each feature has its own service for queries and mutations
- `SettingsService` uses lazy `ensureLoaded()` pattern — first consumer triggers load, others reuse same promise
- Non-null computed signals with `?? defaults` for safe cross-feature reads

### Component Decomposition Pattern
- Parent components are thin orchestrators (manage state, service calls, mode switching)
- Sub-components are presentation-only (inputs + outputs, no service injection)
- Shared reusable components: `MoodPickerComponent`, `ChipSelectorComponent`, `AnimatedTimerComponent`
- `AnimatedTimerComponent` is pure presentational — receives animation mode via `[mode]` input, no SettingsService injection

### Components: OnPush + Standalone
- All components use `ChangeDetectionStrategy.OnPush`
- All components are standalone (no NgModules)
- `inject()` function for DI (no constructor injection)

### Routing: Lazy-Loaded
- Every feature loaded via `loadComponent` in routes
- `authGuard` / `guestGuard` on all routes

### Theming: M3 + CSS Tokens
- Primary: Deep Purple `#5E35B1`
- Use `var(--mat-sys-*)` tokens, never hardcoded colors
- No `color="primary"` on Material components (M2 pattern)
- Dark mode: automatic via `color-scheme: light dark`

## Database

5 tables with RLS (`(select auth.uid()) = user_id`):
- `exercises` — exercise library
- `workout_templates` — workout programs
- `work_sessions` — daily sessions with breaks/pauses (JSONB)
- `workout_logs` — completed workout logs (JSONB)
- `user_settings` — preferences (CHECK constraints on integer ranges)

SQL functions: `weekly_break_stats()`, `weekly_workout_stats()`, `streak_stats()`, `cleanup_stale_sessions()`

Source of truth: `docs/fitbreak-supabase-schema.sql`

### Shared Components: Strategy Pattern
- `AnimatedTimerComponent` — orchestrator (layout, sizing, digit state). Pure presentational — mode via input.
- `strategies/` — one component per animation mode (roll, fade, scale, blur, slot)
- `TimerRingComponent` — SVG ring with `<ng-content>` for flexible content
- `MoodPickerComponent` — reusable mood selector with model input, ARIA radiogroup semantics
- `ChipSelectorComponent` — reusable numeric chip selector with optional custom input
- Adding new animation: create strategy component + add `@case` + add DB value

### Supabase Type Safety
- `asJson<T>(value: T): Json` helper in `shared/utils/supabase.utils.ts` for JSONB writes
- Replaces scattered `as any` casts. Centralizes the intentional type assertion.
- Read casts (`as unknown as WorkSession`) remain — these are inherent to Supabase's generic JSONB→typed conversion

## Known Gaps (from FE arch review + QA, 2026-03-26)

- **Settings not loaded on direct URL navigation** to `/stepper` or `/strength` — `ensureLoaded()` only called from Dashboard/Settings. Animation mode falls back to `'roll'`. Consider route-level resolver.
- **Custom chip input saves on every keypress** in Settings — no debounce. Pre-existing, not a regression.
- **`formattedDate` in DashboardComponent** — computed with no signal dependency, won't update past midnight. Minor UX issue.

## Current State (2026-03-26)

- **Working:** Auth, dashboard, break rotation, strength, stepper, settings, day summary, progress, animated timers, route transitions, tab timer
- **Tests:** None written (Vitest configured)
- **Sprint 2 in progress** — tasks 1-3 done, tech debt sprint complete, tasks 4-5 remaining
