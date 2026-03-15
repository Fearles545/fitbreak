# Implementation Plans

Exploration uncovered that the workday lifecycle lacks pause support, features (break timer, stepper, strength) are disconnected silos with no orchestrator, and business logic leaked into DashboardComponent. 6 decisions made, 6 ideas rejected, resulting in 6 implementation plans below. Plans A–C deliver the core: "pauseable workday with orchestrated features."

## Dependency Graph

```
Plan A (Schema) ──→ Plan B (WorkdayService) ──→ Plan C (Pause)
                                             ──→ Plan D (Break Prompt UX)
                                             ──→ Plan E (Stepper/Strength Integration)
Plan F (Stale Sessions) — independent
```

Plan A is the foundation. Plans C, D, E are independent of each other but all require B.

---

## Plan A: Schema Migration + TypeScript Models

**Goal**: DB schema and TypeScript types support pause state, pauses history, and stored `next_break_at`.
**Scope**: Supabase migration, `shared/models/fitbreak.models.ts`, `docs/fitbreak-supabase-schema.sql`
**Estimated size**: S
**Dependencies**: None
**Priority**: 1 — unblocks everything

### Steps:
1. Apply Supabase migration via MCP tool:
   ```sql
   ALTER TABLE work_sessions
     DROP CONSTRAINT IF EXISTS work_sessions_status_check;
   ALTER TABLE work_sessions
     ADD CONSTRAINT work_sessions_status_check
     CHECK (status IN ('active', 'paused', 'completed'));
   ALTER TABLE work_sessions
     ADD COLUMN IF NOT EXISTS paused_at timestamptz,
     ADD COLUMN IF NOT EXISTS pauses jsonb DEFAULT '[]',
     ADD COLUMN IF NOT EXISTS next_break_at timestamptz;
   ```
2. Update `SessionStatus` type: add `'paused'`
3. Add `PauseEntry` interface: `{ pausedAt: string; resumedAt?: string }`
4. Update `WorkSession` interface: add `paused_at`, `pauses: PauseEntry[]`, `next_break_at`
5. Add `BreakEntry` optional fields: `extended?: boolean`, `extendedByMin?: number`, `reason?: string`
6. Regenerate Supabase types if needed (`database.types.ts`)
7. Update `docs/fitbreak-supabase-schema.sql` to match (source of truth)

### Acceptance criteria:
- [ ] Migration applies without errors
- [ ] `npm run build` succeeds with updated types
- [ ] Existing code still works (new columns are nullable/defaulted, no breaking changes)

### Risks / Notes:
- All new columns have defaults or are nullable — zero impact on existing functionality
- `next_break_at` will be `null` for existing sessions — Plan B handles backfilling/computing it

---

## Plan B: WorkdayService + Timer Refactor

**Goal**: A new `WorkdayService` orchestrates the workday state machine and owns all timer/notification logic. `DashboardComponent` becomes a thin view layer.
**Scope**: New `shared/services/workday.service.ts`, refactor `dashboard.service.ts`, refactor `dashboard.component.ts`, update `break-timer.service.ts`
**Estimated size**: M
**Dependencies**: Plan A (needs `next_break_at` column and updated types)
**Priority**: 2 — architectural foundation for pause, integration, and all future workday features

### Steps:
1. Create `WorkdayService` in `shared/services/workday.service.ts`:
   - `currentActivity` signal: `'idle' | 'working' | 'on-break' | 'paused' | 'stepper' | 'strength'`
   - `now` signal (1s tick via `setInterval`)
   - `startTick()` / `stopTick()` — only tick when `currentActivity === 'working'`
   - `remainingSeconds` computed: reads `session.next_break_at - now`
   - Break trigger effect: when `remainingSeconds === 0` and `currentActivity === 'working'`, trigger notifier + navigate to `/break`, set `currentActivity = 'on-break'`
   - Inject `DashboardService` for session CRUD, `BreakNotifierService` for notifications, `Router` for navigation
2. Add orchestration methods to `WorkdayService`:
   - `startWorkday()` — delegates to `DashboardService`, sets `next_break_at = now + interval`, starts tick, sets activity to `'working'`
   - `endWorkday()` — cancels notifier, stops tick, delegates to `DashboardService`, sets activity to `'idle'`
   - `onBreakStarted()` — cancels notifier, stops tick, sets activity to `'on-break'`
   - `onBreakCompleted()` / `onBreakSkipped()` — starts tick, sets activity to `'working'`
   - `startActivity(type)` — stub for Plan E (pauses timer if active session exists)
   - `endActivity()` — stub for Plan E
3. Refactor `DashboardService`:
   - Remove: `nextBreakAt` computed (moves to WorkdayService)
   - Keep: `_session` signal, `session` readonly, `isActive`, `completedBreaks`, `totalBreaks`, session CRUD methods, `weekActivities`
   - `startWorkday()` — add `next_break_at` field to the insert
   - Expose `refreshSession()` (renamed from `loadTodaySession`) for WorkdayService to call after state changes
4. Refactor `DashboardComponent`:
   - Remove: `now` signal, `startTick()`/`stopTick()`, `remainingSeconds` computed, `breakTriggered` flag, `breakTrigger` effect, `visibilitychange` listener
   - Inject `WorkdayService` — read `remainingSeconds`, `currentActivity` for template
   - Keep: UI-only computeds (`firstName`, `formattedDate`, `nextRotation`, `elapsedTime`, `totalSeconds`)
   - `onStartWorkday()` → calls `workday.startWorkday()`
   - `onEndWorkday()` → calls `workday.endWorkday()`
5. Update `BreakTimerService`:
   - `completeBreak()` — include `next_break_at = now + interval` in the update; call `workday.onBreakCompleted()` instead of `dashboard.loadTodaySession()`
   - `skipBreak()` — include `next_break_at = now + interval` in the update; call `workday.onBreakSkipped()`
6. Update `BreakTimerComponent`:
   - Call `workday.onBreakStarted()` when break execution begins (not just notifier cancel)
7. Move `visibilitychange` listener to `WorkdayService` (recalculate `now` on tab return)

### Acceptance criteria:
- [ ] Dashboard countdown timer works exactly as before (no visible change to user)
- [ ] Break trigger fires correctly, navigates to /break
- [ ] Break completion/skip resets timer correctly
- [ ] `DashboardComponent` has zero timer logic — only reads signals and calls methods
- [ ] `WorkdayService` is the single owner of tick lifecycle and break trigger
- [ ] `npm run build` succeeds

### Risks / Notes:
- This is a pure refactor — no new user-facing features. The app should behave identically after this plan.
- Circular dependency risk: `WorkdayService` → `DashboardService` → `WorkdayService`. Avoid by keeping DashboardService unaware of WorkdayService — WorkdayService calls DashboardService, not the other way around.
- `BreakTimerService` currently injects `DashboardService`. After refactor, it should inject `WorkdayService` for lifecycle events and `DashboardService` only for session data reads.
- `elapsedTime` computed stays in component for now but should subtract total paused time once Plan C lands.

---

## Plan C: Pause / Resume Workday

**Goal**: User can pause and resume an active workday. Break timer stops during pause. Pauses are tracked for analytics/timeline.
**Scope**: `workday.service.ts`, `dashboard.service.ts`, `dashboard.component.ts`
**Estimated size**: M
**Dependencies**: Plan B (WorkdayService must exist and own timer lifecycle)
**Priority**: 3 — the primary user-facing feature

### Steps:
1. Add `pauseWorkday()` to `WorkdayService`:
   - Cancel notifier, stop tick
   - Set `currentActivity = 'paused'`
   - Update DB: `status = 'paused'`, `paused_at = now`
   - Update local session signal
2. Add `resumeWorkday()` to `WorkdayService`:
   - Compute remaining: `next_break_at - paused_at`
   - Append `{ pausedAt, resumedAt: now }` to `pauses` array
   - Update DB: `status = 'active'`, `paused_at = null`, `next_break_at = now + remaining`, updated `pauses` array
   - Update local session signal
   - Start tick, set `currentActivity = 'working'`
3. Update `DashboardService.loadTodaySession()`:
   - Change `.eq('status', 'active')` to `.in('status', ['active', 'paused'])`
4. Add `isPaused` computed to `DashboardService` (or `WorkdayService`)
5. Update `WorkdayService` init: if loaded session is paused, set `currentActivity = 'paused'` (don't start tick)
6. Update `DashboardComponent` template:
   - Show paused state: frozen timer ring, "Пауза" indicator with pulse animation
   - Show "Продовжити" (Resume) button when paused
   - Show "Пауза" button when active (next to or replacing the end-day button area)
   - `onPauseWorkday()` → `workday.pauseWorkday()`
   - `onResumeWorkday()` → `workday.resumeWorkday()`
7. Update `elapsedTime` computed: subtract total paused minutes
   - `totalPausedMs` = sum of `(resumedAt - pausedAt)` from `pauses` array + current pause if active

### Acceptance criteria:
- [ ] Pause button appears during active session, stops timer and notifier
- [ ] Paused state shows frozen timer with "Пауза" indicator
- [ ] Resume restarts timer from where it left off (not from full interval)
- [ ] Multiple pause/resume cycles work correctly (pauses array accumulates)
- [ ] Page refresh during pause shows paused state (DB-persisted)
- [ ] `elapsedTime` shows actual working time (minus paused time)
- [ ] `npm run build` succeeds

### Risks / Notes:
- Resume math: `remaining = next_break_at - paused_at`, then `next_break_at = now + remaining`. Two fields, one formula, one place.
- If `remaining <= 0` on resume (paused_at was already past next_break_at — break was due during pause), trigger break immediately or reset to full interval. Suggest: reset to full interval (break during lunch doesn't count).
- Test edge case: pause → close browser → reopen next day → should be caught by stale session cleanup (Plan F), not resume logic.

---

## Plan D: Break Prompt UX Improvements

**Goal**: Break prompt screen offers "extend work time" (with duration + reason) and "end workday" options.
**Scope**: `break-timer.component.ts`, `break-timer.service.ts`
**Estimated size**: S
**Dependencies**: Plan B (needs WorkdayService for `endWorkday()` and `next_break_at` management)
**Priority**: 4 — quality of life, same `next_break_at` mechanics

### Steps:
1. Add `extendWork(minutes, reason?)` to `BreakTimerService` (or `WorkdayService`):
   - Cancel notifier
   - Append BreakEntry with `{ extended: true, extendedByMin: minutes, reason }` to session's `breaks` array
   - Set `next_break_at = now + minutes * 60 * 1000`
   - Update DB, refresh session
   - Navigate to dashboard
2. Add "Потрібно ще працювати" button to break prompt template:
   - Tap → shows inline form: duration chips (10, 15, 30 хв) + optional reason text input
   - Confirm → calls `extendWork(selectedMinutes, reason)`
3. Add "Завершити робочий день" button to break prompt template:
   - Tap → calls `workday.endWorkday()`, navigates to dashboard
4. Reorder break prompt actions for clarity:
   - Primary: "Почати розминку"
   - Secondary: "Потрібно ще працювати" (expand for details)
   - Tertiary: "Пропустити" and "Завершити день"

### Acceptance criteria:
- [ ] "Потрібно ще працювати" shows duration picker + optional reason field
- [ ] Selecting duration and confirming resets timer to custom duration
- [ ] BreakEntry with `extended: true` is logged in session's breaks array
- [ ] "Завершити день" ends workday and returns to dashboard start screen
- [ ] Original prompt actions (start, skip, choose another) still work

### Risks / Notes:
- Keep the prompt clean — too many options violates "zero-decision" principle. Use progressive disclosure: primary action prominent, extend/end-day less prominent.
- Reason field is optional — don't force the user to explain why they need to work.

---

## Plan E: Stepper / Strength Integration with Workday

**Goal**: Starting a stepper or strength workout during an active workday auto-pauses the break timer. Finishing resets it. Dashboard shows workout buttons during active session.
**Scope**: `workday.service.ts`, `stepper.component.ts`, `strength.component.ts`, `dashboard.component.ts`
**Estimated size**: S
**Dependencies**: Plan B (needs `WorkdayService.startActivity()` / `endActivity()`)
**Priority**: 5 — connects the silos, fixes the "break fires after workout" bug

### Steps:
1. Implement `startActivity(type)` in `WorkdayService`:
   - If active session exists: stop tick, cancel notifier, set `currentActivity = type`
   - If no active session (weekend workout): just set `currentActivity = type`, no timer ops
2. Implement `endActivity()` in `WorkdayService`:
   - If active session exists: set `next_break_at = now + interval`, update DB, start tick, set `currentActivity = 'working'`
   - If no active session: set `currentActivity = 'idle'`
3. Update `StepperComponent`:
   - `onStart()` → add `workday.startActivity('stepper')`
   - `onFinish()` / `onBack()` → add `workday.endActivity()`
4. Update `StrengthComponent` (same pattern):
   - On workout start → `workday.startActivity('strength')`
   - On workout finish/back → `workday.endActivity()`
5. Update `DashboardComponent` template:
   - Show stepper/strength buttons during active session (move from start screen to shared area, or duplicate)
   - Keep them on start screen too (standalone workouts)

### Acceptance criteria:
- [ ] Starting stepper during active workday pauses break timer (no beeps, no break trigger)
- [ ] Finishing stepper resets break timer to full interval
- [ ] Starting stepper on weekend (no active session) works — no crash, no timer ops
- [ ] Stepper/strength buttons visible during active session on dashboard
- [ ] Break doesn't fire immediately after returning from workout
- [ ] `npm run build` succeeds

### Risks / Notes:
- `StepperComponent.onBack()` (user cancels without starting) should also call `endActivity()` to clean up
- If user navigates away from stepper via browser back/URL without finishing, `destroyRef.onDestroy` should call `endActivity()` as cleanup
- Strength component uses same pattern — review its completion/cancel flows for the same cleanup needs

---

## Plan F: Auto-complete Stale Sessions

**Goal**: Active or paused sessions from previous days are automatically completed on app load.
**Scope**: `dashboard.service.ts`
**Estimated size**: S
**Dependencies**: None (works with current schema, but pairs well after Plan A)
**Priority**: 6 — data integrity fix, not blocking daily usage

### Steps:
1. Add `cleanupStaleSessions()` to `DashboardService`:
   - Query: `work_sessions` where `status IN ('active', 'paused') AND date < today`
   - For each: update `status = 'completed'`, `ended_at = now`, `paused_at = null`
   - No user prompt — just auto-complete silently
2. Call `cleanupStaleSessions()` in `DashboardComponent.ngOnInit()` (or in `WorkdayService` init after Plan B)
3. Run before `loadTodaySession()` to ensure clean state

### Acceptance criteria:
- [ ] Yesterday's active session is auto-completed on today's app load
- [ ] Paused sessions from previous days are also completed
- [ ] Today's active session is NOT affected
- [ ] No errors when there are no stale sessions (common case)

### Risks / Notes:
- `ended_at` could be more accurate: use the last break's `completedAt` timestamp if available, otherwise `now`. Using `now` is simpler and good enough — the date is already wrong regardless.
- This should run once per app load, not on every navigation to dashboard. Consider a `hasCleanedUp` flag.
