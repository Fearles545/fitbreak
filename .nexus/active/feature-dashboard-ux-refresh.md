# Feature: Dashboard UX Refresh

**Level:** 2
**Date:** 2026-03-26
**Status:** Approved

## Context

The dashboard is the daily front door to FitBreak. Currently it's functional but visually plain — a timer, minimal stats, basic buttons. For an app whose boundary is "must earn its place on screen every day," the dashboard needs to feel rewarding, motivating, and polished. This refresh upgrades both the start screen and active session views.

## User Stories

### US-1: Start screen motivation
As a user opening FitBreak, I want to see my current streak and a health tip so I'm motivated to start my workday.
- AC: Streak counter visible on start screen (from `streak_stats()` RPC)
- AC: Health tip displayed, changes daily (deterministic from day-of-year)
- AC: Streak card reuses visual language from progress page (primary-container)

### US-2: Richer active session stats
As a user during my workday, I want to see clear progress — breaks done, work time, and visual context.
- AC: Day stats section shows break count + work time (already exists, verify it's prominent enough)
- AC: Next rotation preview remains visible

### US-3: Visual polish
As a daily user, I want the dashboard to feel polished — proper card hierarchy, consistent spacing, smooth interactions.
- AC: M3 surface containers, proper visual hierarchy
- AC: Navigation buttons grouped in a visual "island" card
- AC: Start button is visually dominant CTA (larger, icon, elevated treatment)

### US-4: Improved loading experience
As a user, I don't want the screen to flash/blink between loading and content states.
- AC: Skeleton loader overlay instead of spinner — content area stays stable, dimmed overlay with shimmer placeholders
- AC: Skeleton loader is a reusable shared component (`SkeletonLoaderComponent`)

### US-5: Week calendar upgrade
As a user, I want the week calendar to look polished and informative at a glance.
- AC: Larger day cells with better visual differentiation
- AC: Material Symbols icons instead of emojis (cleaner at small sizes)
- AC: Better today indicator and active-day styling
- AC: Break count as a readable element, not crammed into tiny circle

## UX Flow

### Start Screen (no session)
1. Greeting + date (top left)
2. Nav island (top right or below greeting): progress, settings, logout — grouped visually
3. Week calendar (enhanced)
4. Streak card (current streak + motivational message)
5. **"Почати робочий день"** — hero CTA, visually dominant
6. Secondary actions: Силове / Степер (in a visual group)
7. Health tip (bottom, subtle)

### Active Session
1. Timer ring with animated countdown (hero)
2. Next rotation preview card
3. Day stats (breaks + work time)
4. Actions: Pause/Resume
5. Secondary: Силове / Степер (nav island style)
6. "Завершити робочий день" (bottom, subtle)

### Loading
- Skeleton overlay on top of section, content slightly dimmed
- Shimmer animation on placeholder shapes
- No layout shift when content loads

## Technical Design

### Components to create
- `src/app/shared/components/skeleton-loader/skeleton-loader.component.ts` — reusable skeleton with configurable shapes (circle, rectangle, text lines). CSS-only shimmer animation. Used app-wide.

### Components to modify
- `DashboardComponent` — new template: streak card, health tip, nav island, enhanced start CTA, skeleton loading integration
- `WeekCalendarComponent` — visual redesign: larger cells, Material Symbols, better layout

### Service changes
- `DashboardService` — add `loadStreak()` method + `currentStreak` signal. Calls existing `streak_stats()` RPC. Runs in parallel with `loadWeekActivities()` during init.

### New constants
- `src/app/shared/constants/health-tips.ts` — static array of Ukrainian health tip strings. Selected by `dayOfYear % tips.length`. Future: migrate to DB table.

### No changes needed
- No database migrations
- No new RPC functions (streak_stats already exists)
- No routing changes
- No new services

## Edge Cases & Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Streak RPC fails | Low | Graceful degradation — hide streak card, existing snackbar handles errors |
| Week calendar redesign | Low | Single consumer (dashboard), safe to change |
| Skeleton layout drift | Medium | Keep shapes generic (rects, circles), not pixel-perfect replicas |
| Dark mode colors | Low | All using M3 CSS tokens — auto-adapts |
| Small screens (320px) | Low | Test nav island + calendar fit, flex-wrap as fallback |

## Open Questions

1. **Nav island layout** — horizontal row of icon buttons in a card? Or a different arrangement? (decide during implementation)
2. **Health tips content** — need to write 15-30 Ukrainian health tips. Can start with ~10 and grow.
3. **Start button style** — mat-flat-button with icon + larger padding? Or a full custom card-style CTA? (decide during implementation)
4. **Streak on active session** — show streak during active session too, or only on start screen? (leaning: start screen only, active session focuses on current day progress)

## Acceptance Criteria

- [ ] Skeleton loader component exists in shared/, reusable, CSS-only shimmer
- [ ] Dashboard uses skeleton loader instead of spinner — no blink on load
- [ ] Streak card on start screen with current streak + motivational message
- [ ] Health tip on start screen, changes daily
- [ ] Week calendar visually upgraded (larger, Material Symbols, better styling)
- [ ] Navigation buttons in a visual island/card
- [ ] Start button is visually dominant hero CTA
- [ ] Dark mode works correctly for all new elements
- [ ] WCAG AA: streak card has aria-label, all new elements accessible
