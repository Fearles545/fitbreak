---
name: DECISION-016 — Workout Difficulty Toggle
description: Per-template difficulty overrides stored in exercises.difficulty_overrides JSONB and workout_templates.last_difficulty
type: project
---

## DECISION-016: Workout Difficulty Toggle (2026-03-29)

### New columns

**`exercises` table:**
- `difficulty_overrides` JSONB — structure: `{"easy": {reps, durationSec, note}, "medium": {...}, "hard": {...}}`
- Overrides the base `reps`/`duration_sec` values when a non-default difficulty is selected

**`workout_templates` table:**
- `last_difficulty` text — values: `easy`, `medium`, `hard` (default: `medium`)
- Per-template, not global — different templates can be at different difficulty levels

### Design rationale
- Difficulty is per-template because a user might do easy knee rehab but hard upper body
- Overrides are on the exercise, not the template, because the same exercise in different templates gets the same scaling
- `medium` is the baseline — it matches the existing `reps`/`duration_sec` values, so no data migration needed for existing exercises

**Why:** Users (especially Yulia with knee rehab) need the ability to scale exercise intensity up or down without creating duplicate exercises.

**How to apply:** When implementing, add columns with defaults so existing data is unaffected. The `difficulty_overrides` JSONB keys must be camelCase to match TypeScript interfaces.
