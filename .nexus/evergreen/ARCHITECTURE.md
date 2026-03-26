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
├── dashboard/      — start screen, active session, timer-ring, week-calendar
├── break-timer/    — break prompt, break execution, break-timer service
├── day-summary/    — end-of-day summary shown after ending workday
├── strength/       — strength execution, rest timer, program editor
├── stepper/        — stepper fullscreen timer
├── progress/       — streaks, weekly comparison (progress.service + progress.component)
├── settings/       — settings page + settings.service (lazy-load pattern)
├── shared/
│   ├── components/ — timer-ring, week-calendar
│   ├── services/   — supabase, audio, wake-lock, break-notifier, workday
│   ├── models/     — database.types, fitbreak.models, rotation.constants
│   └── utils/      — date.utils (toDateKey)
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
- Each feature has its own service for queries and mutations
- `SettingsService` uses lazy `ensureLoaded()` pattern — first consumer triggers load, others reuse same promise
- Non-null computed signals with `?? defaults` for safe cross-feature reads

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

## Current State (2026-03-26)

- **Working:** Auth, dashboard, break rotation, strength, stepper, settings, day summary, progress
- **Tests:** None written (Vitest configured)
- **All Sprint 1 features delivered**
