# FitBreak

Personal health tool for building a habit of taking breaks, exercising, and staying active throughout the workday. Single-user app, not a SaaS.

## Tech Stack

- **Frontend:** Angular 21 (standalone components, signals, new control flow) + Angular Material
- **Backend:** Supabase (Auth + PostgreSQL + Row Level Security)
- **Audio:** Web Audio API (programmatic sound generation, no audio files)
- **PWA:** @angular/pwa (service worker, manifest, installable from browser)

No separate backend server. Angular communicates directly with Supabase via JS SDK.

## Project Structure

Flat feature-based. Each folder in `src/app/` is a self-contained feature:

```
src/app/
├── auth/              # login, register, auth guard, auth.service
├── dashboard/         # start screen, active session dashboard, timer-ring, week-calendar
├── break-timer/       # break prompt, break execution mode, break-timer.service
├── strength/          # strength execution, rest timer, program editor, strength.service
├── stepper/           # stepper fullscreen timer, stepper.service
├── progress/          # analytics, calendar heatmap, streaks, progress.service
├── settings/          # all settings, settings.service
├── shared/
│   ├── components/    # exercise-card, mood-picker, technique-viewer, timer-display
│   ├── services/      # supabase.service, audio.service, wake-lock.service
│   └── models/        # TypeScript interfaces, types, enums (see fitbreak-data-model.ts)
└── app.routes.ts      # top-level routing with lazy loading per feature
```

**Rules:**
- Each feature folder contains its own components, services, routes, and models
- `shared/` is ONLY for code reused across 2+ features
- No barrel files (index.ts) unless there are 5+ exports from a folder
- Lazy load each feature via `loadChildren` or `loadComponent` in routes

## Database Schema

**CRITICAL: The Supabase schema (`fitbreak-supabase-schema.sql`) is the source of truth.**

- Do NOT rename database columns or tables without explicit approval
- TypeScript interfaces in `shared/models/` must match the DB schema exactly
- Use camelCase in TypeScript, snake_case in SQL — map via Supabase SDK or manual mapping in services
- JSONB fields (`technique`, `exercises`, `breaks`, `visuals`, `progression`, `stepper_config`, `stepper_log`) store nested objects — their internal key names (camelCase) must stay consistent between TypeScript interfaces and what gets written to the DB
- If you need a new field — ADD it, don't rename existing ones
- All tables have RLS enabled. Every query goes through `auth.uid() = user_id` policy

**Tables:** exercises, workout_templates, work_sessions, workout_logs, user_settings
**Analytics functions:** weekly_break_stats(), weekly_workout_stats() — called via `supabase.rpc()`

## Architecture Patterns

### State Management
Pure Angular Signals. No NgRx, no BehaviorSubjects for state.

```typescript
// Pattern for feature services
@Injectable({ providedIn: 'root' })
export class BreakTimerService {
  private _session = signal<WorkSession | null>(null);
  
  readonly session = this._session.asReadonly();
  readonly isActive = computed(() => this._session()?.status === 'active');
  
  // Methods mutate signals directly
  async startSession() { ... }
}
```

RxJS is used ONLY for:
- Wrapping Supabase SDK promises into Observables (via `from()`)
- Stream-based operations where signals don't fit (e.g., timer intervals)

### Supabase Integration
Domain-based services. `SupabaseService` in shared holds only the client instance and auth methods. Each feature has its own service for data operations.

```typescript
// shared/services/supabase.service.ts — thin wrapper
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client = createClient(environment.supabaseUrl, environment.supabaseKey);
  get supabase() { return this.client; }
  get auth() { return this.client.auth; }
}

// break-timer/break-timer.service.ts — domain logic
@Injectable({ providedIn: 'root' })
export class BreakTimerService {
  private supabase = inject(SupabaseService);
  // All break-timer related queries and mutations here
}
```

### Supabase Query Pattern
Wrap Supabase calls in a reusable helper to convert to Observable with error handling:

```typescript
// shared/services/supabase.service.ts
query<T>(queryPromise: PromiseLike<{ data: T | null; error: any }>): Observable<T> {
  return from(queryPromise).pipe(
    map(({ data, error }) => {
      if (error) throw error;
      return data as T;
    })
  );
}
```

## Coding Conventions

### Language
- Code, comments, commit messages — **English**
- UI text (labels, buttons, messages, exercise names) — **Ukrainian** (hardcoded, no i18n)
- Exercise names have both `name` (Ukrainian) and `nameEn` (English, for YouTube search)

### Angular Specifics
- Standalone components only (no NgModules)
- New control flow (`@if`, `@for`, `@switch`) — no `*ngIf`, `*ngFor`
- Signals for component state, `input()` / `output()` / `model()` for component API
- `inject()` function instead of constructor injection
- Typed reactive forms or Signal Forms where applicable
- `toSignal()` / `toObservable()` for bridging signals ↔ RxJS

### TypeScript
- Strict mode enabled
- Explicit return types on public methods
- No `any` — use `unknown` and narrow, or define proper types
- Interfaces over classes for data models
- Prefer `const` assertions and literal types

### Styling
- Angular Material theming via CSS custom properties
- Component-scoped styles (default ViewEncapsulation)
- Responsive design: desktop-first for dashboard/break-timer, mobile-friendly for strength/stepper
- Dark theme support via Angular Material's built-in theming

### File Naming
- `feature-name.component.ts` / `.html` / `.scss`
- `feature-name.service.ts`
- `feature-name.routes.ts`
- `feature-name.model.ts` (if feature-specific types exist)

## Key UX Principles

These are non-negotiable design decisions:

1. **Zero-decision break flow** — app auto-suggests next rotation from queue. User only presses "Start" and "Done". Choosing a different rotation is possible but hidden behind "Choose another" link.

2. **Frictionless tracking** — workout completion is logged automatically on "Done" press. No mandatory forms. Mood is optional (one tap on emoji). Notes are optional (hidden behind extra button).

3. **Exercise technique is always accessible** — every exercise has visual content (YouTube/GIF) + step-by-step text technique + warnings. Visual block is collapsible (collapsed by default for exercises done 5+ times).

4. **Stepper fullscreen mode** — dark background, large countdown timer visible from 1-2m distance, dim mode after 30s inactivity, Wake Lock API keeps screen on.

5. **Tab notification for breaks** — change tab title to "⏰ Час на перерву!", beep after 2 min delay via Web Audio API. No modal popups blocking work.

## Audio System

All sounds generated programmatically via Web Audio API (OscillatorNode). No audio files.

- Break reminder: 800 Hz, 200ms
- Stepper interval signal: 1000 Hz, 150ms × 2 (double beep)
- Stepper finish: 600 Hz, 1000ms
- Rest timer end: 700 Hz, 300ms

## Documentation

- `docs/fitbreak-project-brief.md` — full project brief (flows, screens, features)
- `docs/fitbreak-data-model.ts` — TypeScript interfaces for all entities
- `docs/fitbreak-supabase-schema.sql` — complete DB schema (source of truth)

Read these files before making architectural decisions. When in doubt — check the brief.
