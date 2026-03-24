# Execution Plan — FitBreak

## Sprint 1 (2026-03-24)

### Goals
1. Make the daily loop customizable (Settings)
2. Add the daily reward moment (Day Summary)
3. Build the motivational mirror (Progress V1)

### Sprint Backlog

| # | Task | Level | Status |
|---|------|-------|--------|
| 1 | Stepper timer layout fix | 0 | done |
| 2 | Settings page — daily-loop settings (break interval, rest timer, stepper defaults) | 2 | in progress |
| 3 | Day summary screen — show breaks, completion rate, workouts, mood when ending workday | 1 | pending |
| 4 | Progress page V1 — streak counter, this week vs last week comparison | 2 | pending |

**WIP limit:** 2 active features

### Notes
- Settings must wire up `user_settings` table to `startWorkday()` — break interval is currently hardcoded at 45min
- Day summary data already exists in `work_sessions.breaks[]` and `workout_logs`
- Progress V1 can leverage existing `weekly_break_stats()` and `weekly_workout_stats()` RPCs
- Skip for V1: calendar heatmap, exercise progression charts, monthly view, theme/language settings
- Settings should support custom values in addition to predefined options

## Parking Lot

- [ ] **Timer flow redesign** — no auto-restart after break, big "ready for break" button, track actual vs configured work time, data insights for stats/advice
- [ ] **Manual add/edit of fitbreaks** — deferred from Sprint 1. Revisit when CEO feels the need weekly.
- [ ] **Progress V2** — calendar heatmap, exercise progression, monthly view
- [ ] **Settings V2** — theme, language, notification sounds, rotation order customization
- [ ] **Tab timer display** — show remaining time in browser tab title for desktop glanceability
- [ ] **Logo/favicon update** — replace default Angular logo with FitBreak branding

## Completed Sprints

_None yet._
