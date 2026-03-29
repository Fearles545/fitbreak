---
name: DB Data Inventory — Stored vs Surfaced
description: Complete audit of what data FitBreak stores in Supabase vs what the UI actually shows to the user. Key gap analysis for future feature planning.
type: project
---

## Current State (2026-03-29)

### 5 tables: exercises, workout_templates, work_sessions, workout_logs, user_settings
### 3 RPC functions: streak_stats(), weekly_break_stats(), weekly_workout_stats()
### 1 maintenance function: cleanup_stale_sessions()
### 2 active users: Leo + Yulia (knee rehab exercises)
### Migration applied: add_knee_rotation_keys (CHECK constraint update)

## What UI currently surfaces

- Current & longest streak (dashboard + progress)
- Week-over-week break count, completion rate, workout count (progress)
- 7-day calendar with activity dots (dashboard)
- Day summary: break list with status/mood, workout info (day-summary)
- Real-time: next break countdown, completed breaks today (dashboard)

## Rich data stored but NOT surfaced

### BreakEntry JSONB (work_sessions.breaks)
- `extended` / `extendedByMin` — postponement patterns
- `replacedWith` — rotation swap preferences
- `actualWorkSeconds` — real work interval duration
- `startedAt` vs `scheduledAt` — break responsiveness delay
- `reason` — text reason for extending

### PauseEntry JSONB (work_sessions.pauses)
- Full pause history with timestamps — frequency, duration, time-of-day patterns

### ExerciseLog / SetLog JSONB (workout_logs.exercises)
- Set-by-set data: repsCompleted, durationSec, completed, skipped
- Could power exercise progression tracking over time

### StepperLog JSONB (workout_logs.stepper_log)
- targetDurationMin vs actualDurationMin — consistency
- pauseCount, totalPauseMin — endurance trends

### Mood (workout_logs.mood, BreakEntry.mood)
- Collected in breaks and workouts, only shown in day-summary
- Never charted or trended over time

### workout_logs.notes
- Collected, never reviewed or surfaced

## Derivable but not computed
- All-time totals (lifetime breaks, workouts, active minutes)
- Day-of-week activity patterns
- Time-of-day break skip patterns
- Per-rotation completion rates
- Average break responsiveness (scheduled → started gap)
- Exercise progression trends (reps/sets over weeks)

**Why:** Leo wants to make sure users get value from all the data being collected.
**How to apply:** Reference this inventory when planning analytics/stats features. New SQL functions will likely be needed for the derivable metrics.
