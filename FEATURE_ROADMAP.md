# Feature Roadmap

## Implemented

Features shipped, in dependency order:

1. ~~**Auth flow**~~ — login with email/password or Google, session persistence, auth guard
2. ~~**Types + Seed data**~~ — typed Supabase client, JSONB sub-types, seed SQL with exercises and templates
3. ~~**Dashboard**~~ — start screen, week calendar, active session with countdown timer
4. ~~**Break timer**~~ — break prompt, exercise execution step-by-step, mood picker, rotation queue
5. ~~**Audio + Notifications**~~ — Web Audio beeps (xylophone/buzzer), tab title change, timed reminder sequence
6. ~~**Stepper**~~ — fullscreen cardio timer, interval signals, dim mode, wake lock, pause tracking
7. ~~**Strength**~~ — workout execution with set tracking, rest timer, circuit training mode
8. ~~**Pause workday + WorkdayService**~~ — pause/resume workday, break timer orchestration via WorkdayService, stepper/strength integration, extend work time, stale session cleanup

## Next Up

9. **Progress** — analytics, calendar heatmap, streaks, weekly stats via `rpc()` functions
10. **Settings** — user preferences, break intervals, exercise rotation config, sound selection

## Ideas & Deferred

Features scoped out during implementation — worth revisiting.

### UX Enhancements
- **Day timeline** — visual diagram of the workday: work blocks, break rotations, pauses, strength/stepper workouts with clickable details. All data already available (breaks, pauses, workout_logs have timestamps)
- **Day summary screen** — show stats (breaks taken, duration, mood trend) after ending workday instead of just returning to start screen
- **Collapsible technique after 5+ completions** — auto-collapse the visual/technique block for exercises the user has done many times
- **Rotation advance configurability** — setting for "always advance rotation index" vs "only advance if the suggested rotation was used"
- **Tab title flash** — animated border or favicon badge in addition to title text change for break reminders

### Workout Features
- **Program editor** — UI for creating/editing workout templates (exercise order, sets, reps, rest times). Currently templates are seed-data only
- **Registration page** — currently login-only, registration is done via Supabase Dashboard

### Technical
- **Canvas timer ring** — upgrade timer-ring from SVG to Canvas for smoother animations and visual effects
- **Web Worker for background timing** — fallback for `setTimeout` reliability in background tabs (browsers throttle timers)
