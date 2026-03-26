# Execution Plan — FitBreak

## Current Sprint

### Sprint 2 (started 2026-03-26)

**Goals:** Upgrade the daily feel — visual polish across the app. Redesign the core timer flow.

| # | Task | Level | Status |
|---|------|-------|--------|
| 1 | Tab timer display + logo/favicon — remaining time in tab title, recognizable branding | 1 | done |
| 2 | Route transitions — View Transitions API, smooth page navigation | 1 | done |
| 3 | Timer number animations — flip clock style, CSS-only | 2 | todo |
| 4 | Dashboard UX refresh — UX research → implementation | 2 | todo |
| 5 | Timer flow redesign — no auto-restart, "ready for break" button, actual work time tracking | 3 | todo |

**Sequence:** Polish first (1-4), then core feature (5). UX research for task 4 happens during sprint.

## Parking Lot

- [ ] **Manual add/edit of fitbreaks** — deferred from Sprint 1. Revisit when CEO feels the need weekly.
- [ ] **Progress V2** — calendar heatmap, exercise progression, monthly view
- [ ] **Settings V2** — theme, language, notification sounds, rotation order customization
- [ ] **Exercise countdown timer** — for timed exercises (e.g. "look at 6+ meters for 20s"), add 3-2-1 countdown then auto-timer
- [ ] **Proper logo** — replace placeholder with professional design, generate all PWA sizes

## Completed Sprints

### Sprint 1 (2026-03-24 → 2026-03-26)

**Goals:** Make the daily loop customizable, add daily reward moment, build motivational mirror

| # | Task | Level | Status |
|---|------|-------|--------|
| 1 | Stepper timer layout fix — visibility in dimmed/light mode | 0 | done |
| 2 | Settings page — break interval, stepper defaults, rest timer with custom values | 2 | done |
| 3 | Day summary screen — fitbreak count hero, work duration, mood, break/workout lists | 1 | done |
| 4 | Progress page V1 — streak counter, weekly comparison with trend indicators | 2 | done |

**Also delivered:** RLS hardening, SQL function optimization, stale session cleanup RPC, dashboard init parallelization.
