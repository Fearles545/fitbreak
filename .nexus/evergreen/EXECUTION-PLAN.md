# Execution Plan — FitBreak

## Current Sprint

### Sprint 4 (started 2026-03-29) — COMPLETE

**Goals:** Make rotations and exercises fully data-driven. Remove hardcoded constants. Support per-user customization without code changes.

| # | Task | Level | Status |
|---|------|-------|--------|
| 1 | Data-driven rotations — DB migration | 1 | done |
| 2 | Data-driven rotations — FE migration | 2 | done |
| 3 | Workout difficulty toggle — DB + model | 1 | done |
| 4 | Workout difficulty toggle — FE | 2 | done |

**Decisions:** DECISION-015 (data-driven rotations), DECISION-016 (difficulty toggle).

## Parking Lot

- [ ] **Manual add/edit of fitbreaks** — deferred from Sprint 1. Revisit when CEO feels the need weekly.
- [ ] **Settings V2** — theme, language, notification sounds, rotation order customization
- [x] **Proper logo** — new design (monitor + stretching person), SVG cleaned, PWA icons generated
- [ ] **Canvas timer upgrade** — upgrade timer-ring from SVG to Canvas for richer animations
- [x] **Mobile experience (PWA)** — manifest, service worker, install prompt, update snackbar, Android-only
- [ ] **Stepper reload protection** — prevent accidental page reload from losing stepper progress; back up in-progress data to localStorage
- [ ] **Rotation marketplace (draft idea)** — system-owned templates browseable by all users, adopt as copy with `source_template_id` link. `is_marketplace` flag + RLS policy for read access. Not needed now (2 users, Leo-curated), but architecture supports it.
- [ ] **Admin UI for user management** — assign rotations/templates to users via UI instead of SQL. Low priority until user count grows.
- [ ] **Populate difficulty_overrides** — Yulia's exercises need easy/medium/hard parameter data seeded. Toggle exists but is inert without data.

## Completed Sprints

### Sprint 3 (2026-03-27)

**Goals:** Better data utilization — surface existing data meaningfully. Improve break execution UX.

| # | Task | Level | Status |
|---|------|-------|--------|
| 1 | Known gaps — settings direct nav resolver + chip debounce | 0 | done |
| 2 | Muscle group metadata | 1 | done |
| 3 | Exercise countdown (timer dialog) | 1 | done |
| 4 | Progress V2 (volume tracking) | 2 | done |

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
