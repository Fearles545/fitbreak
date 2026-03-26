# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# FitBreak

Personal health tool for building a habit of taking breaks, exercising, and staying active throughout the workday. Single-user app, not a SaaS.

## Development Commands

```bash
npm start            # Dev server (ng serve) at localhost:4200
npm run build        # Production build
npm run watch        # Dev build with file watching
npm test             # Run all tests (Vitest via @angular/build:unit-test)
npx ng test --grep "test name"  # Run a single test by name
```

**Test framework:** Vitest (not Karma/Jasmine). Tests use `vitest/globals` — `describe`, `it`, `expect` are available globally without imports. Test files: `*.spec.ts`. Angular TestBed works as usual.

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
  get supabase() {
    return this.client;
  }
  get auth() {
    return this.client.auth;
  }
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

### Angular (project-specific conventions)

- `changeDetection: ChangeDetectionStrategy.OnPush` on all components
- Prefer inline templates for small components
- WCAG AA compliance required — must pass AXE checks
- Do NOT install `@angular/animations` — deprecated in v20.2, Material v21 uses CSS animations
- No explicit `provideHttpClient()` needed — Angular 21 provides it by default

_Generic Angular 21 best practices (standalone, signals, inject(), control flow, etc.) are covered by `.claude/skills/angular-*`._

### Material M3

- Do NOT use `color="primary"` on components — M2 pattern, doesn't work in M3
- Style with CSS tokens: `background: var(--mat-sys-primary); color: var(--mat-sys-on-primary);`
- Icons: Material Symbols Outlined (not legacy Material Icons). Default font set configured in `app.config.ts` via `MAT_ICON_DEFAULT_OPTIONS`
- Theme: Deep Purple `#5E35B1`, generated palettes in `src/_theme-colors.scss`
- Dark mode: `color-scheme: light dark` on body — auto-follows OS preference via M3 `light-dark()` tokens

### Styling

- Component-scoped styles (default ViewEncapsulation)
- Responsive design: desktop-first for dashboard/break-timer, mobile-friendly for strength/stepper

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

## Nexus Integration

This project uses Nexus for project context management.

**CEO:** Ihor — self-taught Angular developer, wants full AI support with critical thinking and engagement.

**Entry point:** `.nexus/NEXUS-INDEX.md`

**Evergreen docs:** `.nexus/evergreen/` — project identity, architecture, decisions, execution plan, workflow status, retrospectives. Consult these before major decisions.

**Agents:** `.claude/agents/nexus-*.md` — product lead, frontend architect, backend engineer, UX designer, QA engineer. Auto-delegated via Nexus commands.

## Session Protocol

**Starting a session:** Run `/nexus-status` to see where you left off.

**Ending a session:** Always run `/nexus-save` before closing. This preserves decisions, creates handoff notes, and keeps the project brain current. If CEO says "I'm done", "finishing up", "closing", "на сьогодні все", "закінчую" — remind them to run `/nexus-save` first.

**If you see a .nexus/.save-reminder file** — previous session ended without saving. Remind CEO immediately.
