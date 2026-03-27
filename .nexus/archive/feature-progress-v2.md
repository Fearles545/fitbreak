# Feature: Progress V2 — Volume Tracking & Better Data Surfacing

**Level:** 2
**Date:** 2026-03-27
**Status:** Approved

## Context

FitBreak collects rich data (breaks with timing/mood/rotation, workouts, stepper sessions, pauses) but the Progress page only shows 3 numbers with week-over-week comparison. The Dashboard has a 7-day calendar which is fine. The opportunity is making the Progress page a proper deep-dive so the user can see daily/weekly/monthly volume and patterns — reinforcing the habit loop.

## User Stories

- As a user, I want to see how many breaks I've done this week/month/all-time so that I stay motivated
  - AC: Period selector (week/month/all) switches all stats
  - AC: Break count, completion rate, and per-day breakdown visible for selected period
- As a user, I want to see which rotations I do most and least so that I balance my exercises
  - AC: Rotation balance section shows completed/skipped per rotation type
- As a user, I want to see my workout and stepper activity over time so that I track consistency
  - AC: Workout count and total duration shown for selected period
  - AC: Per-day breakdown with workout type distinction
- As a user, I want to see all-time totals so that I feel the cumulative effect
  - AC: Footer shows lifetime breaks, workouts, and first active date
- As a user, I want a quick weekly summary on the dashboard without navigating to Progress
  - AC: Idle/start screen shows "Цей тиждень: N перерв · N тренувань" below streak card

## UX Flow

### Progress Page Structure

```
/progress
├── Header + back button (keep)
├── Streak card: current + best (keep as-is)
├── Streak message (keep)
├── Period chips: Тиждень | Місяць | Весь час
│
├── Section: "Фітбрейки"
│   ├── Row: total completed / completion rate %
│   ├── Day grid: 7 cells (Пн-Нд) with break count per day, dash for empty
│   │   Week: Mon-Sun cells. Month: 4 rows (weekly totals). All-time: omit grid.
│   └── Rotation balance: 4 rows (icon + name + count + CSS width-% fill bar)
│
├── Section: "Тренування"
│   ├── Row: strength count + stepper count + total duration
│   └── Day grid: same layout, workout count per day
│
└── All-time footer
    └── "247 фітбрейків · 34 тренування · з березня 2026"
```

### Period Selector Behavior
- Default: "Тиждень" (current week, Mon-Sun)
- "Місяць": current calendar month
- "Весь час": from first active date to now
- Adaptive: hide periods with no meaningful data (< 1 week = no selector)

### Dashboard Addition
- Below streak card on idle/start screen
- One-liner computed from existing `weekActivities` signal
- Format: "Цей тиждень: 12 перерв · 2 тренування"
- No new service calls needed

### UI States
| State | Behavior |
|---|---|
| Loading | Spinner (existing pattern) |
| Empty (no data at all) | Motivational empty state (existing) |
| < 7 days of data | No period selector, show available data |
| Period with no data | "Немає даних за цей період" per section |

### Accessibility
- Period chips: role="radiogroup" with aria-label
- Day grid cells: aria-label with day name + numeric value
- Rotation fill bars: aria-hidden (count is in text already)
- Rotation rows: semantic list
- All text meets WCAG AA contrast

## Technical Design

### New SQL Functions (3)

**`daily_activity_stats(p_start date, p_end date)`**
Returns per-day: date, completed_breaks, total_breaks, skipped_breaks, workout_count, strength_count, stepper_count, work_duration_min.
Source: work_sessions (JSONB unnest for breaks) + workout_logs.
Single query with LEFT JOIN.

**`rotation_stats(p_start date, p_end date)`**
Returns per-rotation: rotation_type, completed, skipped, total.
Source: work_sessions.breaks[] JSONB unnest grouped by rotationType.

**`all_time_totals()`**
Returns: total_breaks_completed, total_workouts, total_stepper_sessions, total_workout_minutes, first_active_date.
Source: work_sessions + workout_logs. Avoids JSONB unnest where possible (use row-level counts).

All functions: `SECURITY DEFINER`, `set search_path = ''`, filter by `(select auth.uid()) = user_id`.

### Component Changes

**progress.component.ts — refactor**
- Add period signal + chip selector
- Add sections for breaks, workouts, bar charts, rotation balance
- Keep streak card as-is
- Estimated: ~350-400 LOC (one component for now, split if exceeds)

**progress.service.ts — refactor**
- Add `loadPeriod(period)` method calling new RPCs
- Signal-based: `dailyStats`, `rotationStats`, `allTimeTotals`
- Computed signals for display transforms only (totals, rates, formatting)
- Keep existing streak loading

**dashboard.component.ts — minor addition**
- Add `weekSummary` computed signal from existing `weekActivities`
- Add one-liner in template below streak card

### Day Grid Approach (replaces bar charts)
CSS grid, no charting library.
- **Week view:** 7 cells (Пн–Нд), each shows break/workout count. Empty days = muted "—". Today subtly highlighted.
- **Month view:** 4 rows, one per week, showing weekly totals. Labeled "Тиж 1", "Тиж 2", etc.
- **All-time view:** no day grid — just aggregate numbers.

### Rotation Balance Approach
4 rows, each: icon + name + count + CSS fill bar.
Fill bar = `div` with `width: ${(count / maxCount) * 100}%` and `background: var(--mat-sys-primary)`.
Pure CSS, no library.

### No DB Schema Changes
All data already exists. Only new SQL functions + frontend changes.

## Edge Cases & Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Day grid getting fiddly | Low | Simple CSS grid, fallback to plain text list |
| Empty periods look sad | Low | Adaptive period selector + empty state per section |
| JSONB unnesting perf on large datasets | Low | Reasonable date range defaults, avoid unnecessary unnesting in all_time_totals |
| Stale data after ending workday | Low | Re-fetch on ngOnInit (existing pattern) |
| Breaking existing streak card | Low | Keep streak_stats() call untouched, add sections below |

## Acceptance Criteria

- [ ] Period selector (chips) switches between week/month/all-time
- [ ] Break section shows: total completed, completion rate, day grid, rotation balance with fill bars
- [ ] Workout section shows: strength + stepper counts, total duration, day grid
- [ ] All-time footer with lifetime totals and first active date
- [ ] Dashboard idle screen shows weekly summary one-liner
- [ ] Empty states for new users and empty periods
- [ ] WCAG AA: contrast, ARIA labels, keyboard nav on chips
- [ ] 3 new SQL functions deployed via migration

## Open Questions

None — all resolved during exploration.

## Decisions Made During Exploration

1. No charting library — use CSS grid for day breakdown, CSS width for rotation fill bars
2. Month view groups by week (4 rows) instead of 30 day cells
3. All-time view shows aggregate numbers only, no day grid
4. One component for now, split if exceeds ~400 LOC
5. SQL functions handle aggregation, FE service stays thin (display transforms only)
6. Existing ChipSelectorComponent pattern reused for period selector
