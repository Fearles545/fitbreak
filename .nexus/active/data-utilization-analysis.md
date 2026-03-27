# Data Utilization Analysis — FitBreak

> Audit date: 2026-03-27
> Author: Backend Engineer (Nexus)
> Purpose: Identify underutilized data in Supabase that could provide value to the user.

## Database Overview

| Table | Rows model | Key JSONB fields |
|-------|-----------|------------------|
| `exercises` | Exercise library | `technique`, `visuals`, `progression` |
| `workout_templates` | Workout programs | `exercises` (slots), `stepper_config` |
| `work_sessions` | One per workday | `breaks` (BreakEntry[]), `pauses` (PauseEntry[]) |
| `workout_logs` | Per completed workout | `exercises` (ExerciseLog[]), `stepper_log` (StepperLog) |
| `user_settings` | One per user | Flat config values |

| SQL Function | Purpose | Called by |
|-------------|---------|----------|
| `streak_stats()` | Current & longest streak | Dashboard, Progress |
| `weekly_break_stats(weeks_back)` | Break counts & completion rate per week | Progress |
| `weekly_workout_stats(weeks_back)` | Workout counts & duration per week | Progress |
| `cleanup_stale_sessions()` | Close forgotten sessions from past days | SessionService on load |

---

## Currently Surfaced in UI

### Dashboard
- Current streak (from `streak_stats()`)
- 7-day calendar: break count badges, workout type icons per day
- Active session: completed breaks count, elapsed work time, next break countdown, overtime indicator
- Next rotation preview

### Progress Page
- Current & longest streak
- This week vs last week comparison: breaks completed, completion %, workout count
- Trend arrows (up/down/neutral)

### Day Summary (after ending session)
- Session time range
- Completed vs total breaks, work duration, average mood
- Break-by-break log: type, scheduled time, status, mood
- Workout log: type, duration, mood

---

## Stored but NOT Surfaced

### 1. Break Postponement Patterns

**Source:** `work_sessions.breaks[]` — `extended`, `extendedByMin`, `reason`

**What we know:** Every time the user clicks "extend" instead of taking a break, we record it with duration and optional reason.

**Potential insights:**
- Average postponements per day
- Which rotation types get extended most (correlation with `rotationType`)
- Time-of-day pattern (do postponements cluster in the morning? after lunch?)
- Trend: is the user getting better or worse at taking breaks on time?

**Complexity:** Medium — needs new SQL function aggregating JSONB array elements with `extended = true`.

---

### 2. Rotation Swap Preferences

**Source:** `work_sessions.breaks[]` — `replacedWith`

**What we know:** When the user swaps a scheduled rotation for a different one, we store both the original and the replacement.

**Potential insights:**
- Most/least preferred rotation types
- Swap frequency — does the user actually like the configured rotation order?
- Could auto-suggest reordering rotations based on actual preferences

**Complexity:** Low — simple aggregation over JSONB `replacedWith IS NOT NULL`.

---

### 3. Actual Work Intervals

**Source:** `work_sessions.breaks[]` — `actualWorkSeconds`

**What we know:** The real duration between breaks (or from session start to first break), accounting for pauses.

**Potential insights:**
- Average actual work interval vs configured `breakIntervalMin`
- Consistency: does the user typically work longer or shorter than planned?
- Longest uninterrupted work stretch

**Complexity:** Low — arithmetic on existing field.

---

### 4. Break Responsiveness

**Source:** `work_sessions.breaks[]` — `scheduledAt` vs `startedAt`

**What we know:** The gap between when a break was scheduled and when the user actually started it.

**Potential insights:**
- Average response time to break notifications
- Trend over time (getting faster or slower?)
- Correlation with time of day or rotation type

**Complexity:** Low — timestamp diff.

---

### 5. Pause Patterns

**Source:** `work_sessions.pauses[]` — `pausedAt`, `resumedAt`

**What we know:** Every time the user pauses and resumes work — full timestamp history.

**Potential insights:**
- Average pauses per day, average pause duration
- Total pause time per day (already partially computed for work time, but not shown independently)
- Pause timing patterns (lunch break detection, meeting patterns)

**Complexity:** Low-Medium — JSONB array aggregation.

---

### 6. Exercise Progression (Strength)

**Source:** `workout_logs.exercises[]` — `ExerciseLog` containing `SetLog[]`

**What we know:** For every strength workout, we store each exercise with each set: reps completed, duration, whether it was completed or skipped.

**Potential insights:**
- Per-exercise progression: "Push-ups: 3x10 → 3x12 → 3x15 over 6 weeks"
- Volume trends (total reps per workout over time)
- Exercise skip rate (which exercises get skipped most)
- Set completion rate

**Complexity:** High — requires joining across multiple workout_logs, unnesting JSONB arrays, grouping by exerciseId, ordering by date.

---

### 7. Stepper Consistency

**Source:** `workout_logs.stepper_log` — `targetDurationMin`, `actualDurationMin`, `pauseCount`, `totalPauseMin`

**What we know:** Target vs actual duration, how many times paused, total pause time.

**Potential insights:**
- Completion rate trend (actual/target ratio over time)
- Endurance improvement (fewer pauses, shorter total pause time)
- Consistency: does the user regularly hit the target?

**Complexity:** Low — direct fields, just need to query over time.

---

### 8. Mood Trends

**Source:** `workout_logs.mood`, `work_sessions.breaks[].mood`

**What we know:** Mood after workouts (great/good/okay/bad) and after individual breaks (emoji).

**Potential insights:**
- Mood trend over weeks/months
- Mood correlation with: time of day, rotation type, workout type, break count
- "Your mood is better on days you complete all breaks"

**Complexity:** Medium — mood is stored as text/emoji, needs mapping to numeric for trending.

---

### 9. Workout Notes

**Source:** `workout_logs.notes`, `workout_logs.exercises[].notes`

**What we know:** Free-text notes per workout and per exercise.

**Potential insights:**
- Personal journal/history view
- Searchable workout diary

**Complexity:** Low — just display.

---

## Not Stored, Could Be Derived

These don't exist as fields but can be computed from existing data:

| Insight | Source | SQL Complexity |
|---------|--------|---------------|
| All-time totals (lifetime breaks, workouts, minutes) | `work_sessions`, `workout_logs` | Low |
| Day-of-week activity heatmap | `work_sessions.date`, `workout_logs.date` | Low |
| Time-of-day break skip heatmap | `breaks[].scheduledAt` + `breaks[].skipped` | Medium |
| Per-rotation completion rate | `breaks[].rotationType` + `breaks[].skipped` | Medium |
| Best streak month | `streak_stats()` extended | Medium |
| Workout frequency trend | `workout_logs` count per week, extended range | Low |

---

## Recommendations for Surfacing

### Quick wins (Low complexity, high value)
1. **All-time totals** — "Ви зробили 247 фітбрейків за весь час" (motivational)
2. **Stepper trends** — actual vs target chart, already clean numeric fields
3. **Workout notes history** — just display what's already stored

### Medium effort, high insight
4. **Per-rotation completion rates** — shows which rotations work and which don't
5. **Break responsiveness trend** — shows habit formation over time
6. **Mood trends** — weekly mood average chart

### Larger features
7. **Exercise progression charts** — complex JSONB querying but very valuable for strength training motivation
8. **Day-of-week / time-of-day heatmaps** — comprehensive activity patterns
9. **Postponement analysis** — "You extend breaks most on Mondays after 15:00"

---

## Technical Notes

- Most new insights require **new SQL functions** (similar to existing `weekly_break_stats`)
- JSONB array aggregation is the main pattern — `jsonb_array_elements()` with lateral joins
- All functions must use `(select auth.uid()) = user_id` for RLS compliance
- Consider `SECURITY DEFINER` + `set search_path = ''` pattern (matches existing functions)
- For exercise progression: may need a materialized view or caching if query becomes heavy
