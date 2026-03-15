# Implementation Progress

## Plan A: Schema Migration + TypeScript Models — DONE
- [x] Supabase migration applied (paused_at, pauses, next_break_at columns + 'paused' status)
- [x] SessionStatus type updated with 'paused'
- [x] PauseEntry interface added
- [x] WorkSession interface updated (pauses, paused_at, next_break_at)
- [x] BreakEntry extended (extended, extendedByMin, reason)
- [x] database.types.ts updated (Row/Insert/Update for work_sessions)
- [x] docs/fitbreak-supabase-schema.sql updated
- [x] docs/fitbreak-data-model.ts updated
- [x] Build passes

## Plan B: WorkdayService + Timer Refactor — DONE
- [x] Created WorkdayService (shared/services/workday.service.ts) with currentActivity, now, remainingSeconds, break trigger effect
- [x] Orchestration methods: init(), startWorkday(), endWorkday(), onBreakStarted(), onBreakCompleted(), onBreakSkipped()
- [x] Plan E stubs: startActivity(), endActivity()
- [x] Removed nextBreakAt computed from DashboardService, renamed loadTodaySession→refreshSession
- [x] DashboardService.startWorkday() now sets next_break_at on insert
- [x] DashboardComponent: removed all timer logic (now, tick, effect, visibilitychange), delegates to WorkdayService
- [x] BreakTimerService: completeBreak/skipBreak write next_break_at, call workday lifecycle methods
- [x] BreakTimerComponent: uses workday.onBreakStarted() instead of notifier.cancel()
- [x] Visibilitychange listener moved to WorkdayService (root-level, survives navigation)
- [x] Build passes
## Plan C: Pause / Resume Workday — DONE
- [x] pauseWorkday(): cancel notifier, stop tick, update DB (status='paused', paused_at=now)
- [x] resumeWorkday(): compute remaining from next_break_at-paused_at, append PauseEntry, update DB, restart tick
- [x] Resume edge case: if break was due during pause, reset to full interval
- [x] refreshSession() now queries .in('status', ['active', 'paused'])
- [x] refreshSession() only shows loading spinner on initial load (no flash on pause/resume)
- [x] init() handles paused session state
- [x] remainingSeconds shows frozen time when paused (next_break_at - paused_at)
- [x] elapsedTime subtracts total paused time (completed pauses + current active pause)
- [x] Template: paused indicator with pulse animation, pause/resume buttons, timer ring faded when paused
- [x] End-day button available in both active and paused states
- [x] Build passes
## Plan D: Break Prompt UX Improvements — DONE
- [x] extendWork() in BreakTimerService: logs extended BreakEntry, sets custom next_break_at, no rotation advance
- [x] "Потрібно ще працювати" expand with duration chips (10/15/30 хв) + optional reason input
- [x] "Завершити день" link on break prompt, reuses workday.endWorkday()
- [x] Reordered: primary (start) → secondary (extend) → tertiary links (choose another · skip · end day)
- [x] Build passes
## Plan E: Stepper / Strength Integration — DONE
- [x] startActivity(): stops tick + cancels notifier if session exists, sets currentActivity
- [x] endActivity(): guarded by activity type, resets next_break_at to full interval, restarts tick
- [x] StepperComponent: startActivity on start, endActivity on finish + destroyRef cleanup
- [x] StrengthComponent: startActivity on pick template, endActivity on finish + destroyRef cleanup
- [x] Dashboard: stepper/strength buttons visible during active session
- [x] Weekend workout (no session) works without crash
- [x] Build passes
## Plan F: Auto-complete Stale Sessions — DONE
- [x] cleanupStaleSessions(): bulk updates sessions where status IN (active, paused) AND date < today
- [x] Sets status=completed, ended_at=now, paused_at=null
- [x] hasCleanedUp flag prevents re-running on navigation within same session
- [x] Called before refreshSession() in ngOnInit
- [x] Build passes
