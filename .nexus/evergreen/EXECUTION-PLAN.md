# Execution Plan — FitBreak

## Current Sprint

### Sprint 3 (started 2026-03-27)

**Goals:** Better data utilization — surface existing data meaningfully. Improve break execution UX.

| # | Task | Level | Status | Spec |
|---|------|-------|--------|------|
| 1 | Known gaps — settings direct nav resolver + chip debounce | 0 | done | — |
| 2 | Muscle group metadata — add target_muscle_groups (group + intensity) to templates, snapshot into BreakEntry on completion | 1 | done | feature-muscle-group-metadata.md |
| 3 | Exercise countdown — lead-in 3-2-1, timed countdown, bilateral support | 1 | done | feature-exercise-countdown.md |
| 4 | Progress V2 — period selector, break/workout volume, rotation balance, all-time totals, dashboard summary | 2 | todo | feature-progress-v2.md |

**Sequence:** Quick fixes (1), then data foundation (2), then parallel — countdown (3) and progress (4). #2 before #4 (dependency: rotation balance needs muscle group data).

**Decision:** Templates are immutable. If adjustments needed, create new template. Guarantees historical data accuracy.

## Parking Lot

- [ ] **Manual add/edit of fitbreaks** — deferred from Sprint 1. Revisit when CEO feels the need weekly.
- [ ] **Settings V2** — theme, language, notification sounds, rotation order customization
- [ ] **Proper logo** — replace placeholder with professional design, generate all PWA sizes
- [ ] **Canvas timer upgrade** — upgrade timer-ring from SVG to Canvas for richer animations

## Completed Sprints

### Sprint 2 (2026-03-26)

**Goals:** Upgrade the daily feel — visual polish across the app. Redesign the core timer flow.

| # | Task | Level | Status |
|---|------|-------|--------|
| 1 | Tab timer display + logo/favicon | 1 | done |
| 2 | Route transitions — View Transitions API | 1 | done |
| 3 | Timer number animations — 5 strategies | 2 | done |
| 3.5 | Tech debt sprint — 8-phase refactoring | 2 | done |
| 4 | Dashboard UX refresh — streak card, health tips, nav island, loading | 2 | done |
| 5 | Timer flow redesign — no auto-nav, back-to-work, single beep | 3 | done |

### Sprint 1 (2026-03-24 → 2026-03-26)

**Goals:** Make the daily loop customizable, add daily reward moment, build motivational mirror

| # | Task | Level | Status |
|---|------|-------|--------|
| 1 | Stepper timer layout fix — visibility in dimmed/light mode | 0 | done |
| 2 | Settings page — break interval, stepper defaults, rest timer with custom values | 2 | done |
| 3 | Day summary screen — fitbreak count hero, work duration, mood, break/workout lists | 1 | done |
| 4 | Progress page V1 — streak counter, weekly comparison with trend indicators | 2 | done |

**Also delivered:** RLS hardening, SQL function optimization, stale session cleanup RPC, dashboard init parallelization.
