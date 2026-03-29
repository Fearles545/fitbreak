# Adding a New Micro-Break Rotation

## Overview

A rotation = **rotation key** + **3-5 exercises** + **workout template**.

Adding a rotation requires changes in 3 places:

1. **DB** — `ALTER TABLE exercises` to add the key to `micro_break_rotation` CHECK constraint
2. **TypeScript** — `MicroBreakRotation` union in `src/app/shared/models/fitbreak.models.ts`
3. **Constants** — `ROTATION_ORDER` + `ROTATION_INFO` in `src/app/shared/models/rotation.constants.ts`

## Required Data

### Rotation

| Field | Format | Example |
|---|---|---|
| `key` | kebab-case | `wrists-forearms` |
| `name` | Ukrainian | `Зап'ястя + Передпліччя` |
| `icon` | Single emoji | `🤲` |
| `defaultDurationMin` | Integer (minutes) | `3` |

### Exercises (3-5 per rotation)

| Field | Required | Description |
|---|---|---|
| `name` | yes | Ukrainian name |
| `name_en` | no | English name (for YouTube search) |
| `muscle_groups` | yes | See allowed values below |
| `short_description` | yes | One-liner purpose, Ukrainian |
| `exercise_type` | yes | `reps` / `timed` / `bilateral` / `timed-hold` |
| `default_duration_sec` | yes | Timer length (typically 30-60) |
| `default_reps` | if reps | Number of repetitions |
| `is_bilateral` | if bilateral | `true` = done on each side |
| `technique` | yes | Step-by-step instructions (see format below) |
| `warnings` | no | Things to avoid, Ukrainian |
| `tips` | no | Helpful hints, Ukrainian |
| `timer_sec` | recommended | Countdown timer duration in seconds. **Without this, no timer button shows during the exercise.** Use `default_duration_sec` value if unsure. |
| `sort_order` | yes | Order within rotation: 1, 2, 3... |

#### Exercise type guide

| Type | Use when | Fields to set |
|---|---|---|
| `reps` | Counting repetitions | `default_reps` + `default_duration_sec` |
| `timed` | Do for X seconds | `default_duration_sec` |
| `bilateral` | Same movement each side | `default_duration_sec` + `is_bilateral: true` |
| `timed-hold` | Static hold | `default_duration_sec` |

#### Allowed muscle groups

`neck`, `eyes`, `shoulders`, `upper-back`, `chest`, `arms`, `wrists`, `core`, `lower-back`, `glutes`, `hip-flexors`, `quads`, `hamstrings`, `calves`, `full-body`

#### Technique format

```
1. Instruction in Ukrainian
2. Next step [!Key form cue]
3. Another step
```

Mark critical form cues with `[!...]` — they become `keyPoint` in the data. Typically 2-4 steps per exercise.

### Workout Template (auto-generated from rotation)

| Field | Value |
|---|---|
| `name` | Same as rotation name |
| `description` | Ukrainian purpose sentence |
| `icon` | Same emoji as rotation |
| `estimated_duration_min` | Same as `defaultDurationMin` |
| `target_muscle_groups` | Array of `{group, intensity}` — intensity: 1 (light), 2 (moderate), 3 (intense) |
| `sort_order` | Next available (current max: 4 for micro-breaks) |

## Input Format

```
Rotation: <key>
Name: <Ukrainian name>
Icon: <emoji>
Duration: <N> min

Exercise 1: <Ukrainian name> (<English name>)
  muscles: <comma-separated>
  type: <exercise_type>, <reps> reps, <duration> sec
  technique:
    1. Step one
    2. Step two [!Key point]
    3. Step three
  warnings: <comma-separated>
  tips: <comma-separated>

Exercise 2: ...
```
