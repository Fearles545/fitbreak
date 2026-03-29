# Feature: Workout Difficulty Toggle

**Level:** 2
**Date:** 2026-03-29
**Status:** Approved
**Decision:** DECISION-016

## Context

Yulia's knee rehabilitation exercises have a 3-phase progression (fewer reps without weights → full reps with weights → increased volume). Rather than duplicating templates per phase, a difficulty toggle (easy/medium/hard) lets the same exercises adapt parameters. Also benefits all users — switch to easy on a bad day, hard when feeling strong.

## User Stories

- As a user starting a strength workout, I want to see the current difficulty level so I know what parameters to expect
  - AC: Difficulty chip (Легко/Середньо/Важко) visible on the workout screen
  - AC: Pre-selected to template's `last_difficulty`

- As a user, I want to change difficulty before or during a workout so I can adapt to how I feel
  - AC: Tapping chips changes difficulty immediately
  - AC: Remaining exercises update their displayed params
  - AC: Already-completed exercises stay logged as-is

- As a user, I want my difficulty choice remembered per template
  - AC: On workout completion, `last_difficulty` saved to template
  - AC: Next session starts at last choice

- As a user, exercises without difficulty variants should show defaults regardless of toggle
  - AC: If `difficulty_overrides` is null, exercise uses `default_reps`/`default_duration_sec`
  - AC: No difficulty note shown for exercises without overrides

## UX Flow

1. User picks strength template → difficulty chips shown (Легко / Середньо / Важко), pre-selected to `last_difficulty`
2. User can change difficulty at any point during workout
3. Each exercise shows adjusted params (reps/duration from selected level's overrides, falling back to defaults)
4. If override has a `note` (e.g. "З обтяжувачем 5 кг"), shown below params in tertiary-container styling
5. On completion, `last_difficulty` persisted

**UI placement:** Chip selector above the exercise card, same row style as mode selector (classic/circuit).

**Labels:** Легко / Середньо / Важко

**Accessibility:** `role="radiogroup"` with `aria-label="Складність"`. Reuse existing `ChipSelectorComponent`.

**States:**
- Exercise has overrides for selected level → show override params + note
- Exercise has overrides but not for selected level → fall back to defaults
- Exercise has no overrides → show defaults, no note

## Technical Design

### Components modified
- `strength.component.ts` — add ChipSelector for difficulty, display effective params + note
- `strength.service.ts` — add `selectedDifficulty` signal, `getEffectiveParams()` helper, save on complete

### No new components
Reuse `ChipSelectorComponent` (already used in settings).

### State management
```
template.last_difficulty → selectedDifficulty signal
                                    ↓
exercise.difficulty_overrides[level] ?? exercise.default_* → display
```

### Key logic
```typescript
function getEffectiveParams(exercise: Exercise, level: DifficultyLevel) {
  const overrides = exercise.difficulty_overrides?.[level];
  return {
    reps: overrides?.reps ?? exercise.default_reps,
    durationSec: overrides?.durationSec ?? exercise.default_duration_sec,
    note: overrides?.note,
  };
}
```

### Persistence
On `completeWorkout()`, update template:
```typescript
.update({ last_difficulty: selectedDifficulty() })
.eq('id', templateId)
```

### Data model
Already done (Sprint 4 task #3):
- `exercises.difficulty_overrides` — JSONB, nullable
- `workout_templates.last_difficulty` — text, default 'medium', CHECK constraint

## Edge Cases & Risks

| Risk | Severity | Mitigation |
|---|---|---|
| All exercises currently have null overrides — toggle is inert | Low | By design — toggle becomes useful when exercises are populated with override data |
| Saving `last_difficulty` on "immutable" template | None | `last_difficulty` is user preference metadata, not exercise content (like `is_active`) |
| User changes difficulty mid-workout | None | Completed exercises already logged with actual values in ExerciseLog |

## Acceptance Criteria

- [ ] Difficulty chips visible on strength workout screen
- [ ] Chips pre-select to template's `last_difficulty`
- [ ] Changing difficulty updates reps/duration display for current + remaining exercises
- [ ] Difficulty note shown when override has a `note` field
- [ ] Exercises without `difficulty_overrides` show defaults regardless of toggle
- [ ] `last_difficulty` saved on workout completion
- [ ] Build passes, no regressions

## Open Questions

None — design is agreed.
