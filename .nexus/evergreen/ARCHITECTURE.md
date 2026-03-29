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
│   │                 mood-picker, chip-selector, confirm-dialog
│   ├── services/   — supabase, audio, wake-lock, break-notifier, workday, session
│   ├── models/     — database.types, fitbreak.models (incl. DayActivity), rotation.constants
│   ├── constants/  — health-tips (static data, future DB candidates)
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

SQL functions: `weekly_break_stats()`, `weekly_workout_stats()`, `streak_stats()`, `cleanup_stale_sessions()`, `daily_activity_stats()`, `rotation_stats()`, `all_time_totals()`

Notable columns:
- `exercises.timer_sec` — optional countdown timer duration (null = no timer). Defined per exercise, independent from `default_duration_sec`.
- `workout_templates.target_muscle_groups` — JSONB `[{group, intensity}]`. Snapshotted into `BreakEntry.muscleGroups` on break completion.
- Templates are **immutable** — create new instead of editing. Guarantees historical data accuracy.

Source of truth: `docs/fitbreak-supabase-schema.sql`

### Shared Components: Strategy Pattern
- `AnimatedTimerComponent` — orchestrator (layout, sizing, digit state). Pure presentational — mode via input.
- `strategies/` — one component per animation mode (roll, fade, scale, blur, slot)
- `TimerRingComponent` — SVG ring with `<ng-content>` for flexible content
- `MoodPickerComponent` — reusable mood selector with model input, ARIA radiogroup semantics
- `ChipSelectorComponent` — reusable numeric chip selector with optional custom input
- `SkeletonComponent` — inline shimmer element (width/height/variant inputs), CSS-only animation. Available for future use.
- `ConfirmDialogComponent` — lightweight reusable confirm dialog (message + confirm/cancel labels). Used by dashboard for pause/early-break.
- `ExerciseTimerDialogComponent` — countdown timer dialog with 3-2-1 lead-in. Opens from break-execution when exercise has `timer_sec`. Self-contained, no bilateral handling.
- Adding new animation: create strategy component + add `@case` + add DB value

### WorkdayService: Activity State Machine
```
idle → working → break-due → on-break → back-to-work → working → ...
                 ↘ paused ↗
```
- `'break-due'`: timer expired, overtime counting up, single beep fired
- `'back-to-work'`: break completed, waiting for user to resume
- State reconstructed from DB on reload: `next_break_at = null` → back-to-work, `next_break_at <= now` → break-due
- `BreakNotifierService`: single beep + persistent tab title (no repeated beeps)

### Loading: Stale-While-Revalidate
- `DashboardService` uses `_loaded` signal — `loading` is `computed(() => !_loaded())`. First visit shows spinner, re-visits show cached data with silent refresh.
- `SessionService` has similar pattern: `refreshSession()` only sets loading if no session exists yet.
- Pattern: show previous data instantly, refresh in background. Spinner only on truly empty state.

### PWA
- `manifest.webmanifest` in `public/` — standalone display, Deep Purple theme
- `ngsw-config.json` — Angular service worker config (prefetch app shell, lazy cache fonts/icons)
- `provideServiceWorker()` in `app.config.ts` — registers in production only
- `InstallPromptComponent` — listens for `beforeinstallprompt`, shows one-time install banner (Android Chrome)
- `SwUpdate.versionUpdates` in `App` component — snackbar on new version
- Icons: `public/icons/icon-192x192.png`, `icon-512x512.png`

### Supabase Type Safety
- `asJson<T>(value: T): Json` helper in `shared/utils/supabase.utils.ts` for JSONB writes
- Replaces scattered `as any` casts. Centralizes the intentional type assertion.
- Read casts (`as unknown as WorkSession`) remain — these are inherent to Supabase's generic JSONB→typed conversion

## Known Gaps

- **`formattedDate` in DashboardComponent** — computed with no signal dependency, won't update past midnight. Minor UX issue.

## Multi-User Notes

- Second user (Yulia) added 2026-03-29 with custom knee rehabilitation exercises
- Rotation constants (`ROTATION_ORDER`, `ROTATION_INFO`) are currently hardcoded — Sprint 4 will make them data-driven from `workout_templates`
- Each user has their own `exercises`, `workout_templates`, `user_settings` rows (RLS-scoped)
- New rotation keys added to DB CHECK constraint require a migration until Sprint 4 removes the constraint

## Current State (2026-03-29)

- **Working:** Auth, dashboard, break rotation (with optional countdown timer), strength, stepper, settings, day summary, progress (V2 with period selector), animated timers, route transitions, tab timer, timer flow redesign, muscle group tracking, PWA (installable, service worker, update prompt)
- **Tests:** None written (Vitest configured)
- **Sprint 3 complete** — all 4 tasks done
- **Sprint 4 planned** — data-driven rotations + difficulty toggle
- **Second user** — Yulia seeded with custom exercises (2 rotations + 2 strength workouts)
- **Docs added** — `docs/adding-rotation.md`, `docs/adding-strength-workout.md` for exercise data entry
