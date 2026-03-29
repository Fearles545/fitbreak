# Adding a New Strength Workout

## Overview

A strength workout = **exercises** + **workout template**.

No rotation key needed — strength exercises are grouped by `category = 'strength'` and linked via a workout template.

## Required Data

### Workout Template

| Field | Format | Example |
|---|---|---|
| `name` | Free-form | `Full Body B` |
| `description` | Ukrainian purpose | `Альтернативна програма: випади, тяга, планка` |
| `icon` | Single emoji | `🏋️` |
| `estimated_duration_min` | Integer | `25` |
| `target_muscle_groups` | `{group, intensity}[]` | `[{group: "quads", intensity: 3}, {group: "core", intensity: 2}]` |

### Exercises (any count)

| Field | Required | Description |
|---|---|---|
| `name` | yes | Ukrainian name |
| `name_en` | no | English name (for YouTube search) |
| `muscle_groups` | yes | See allowed values below |
| `short_description` | yes | One-liner purpose, Ukrainian |
| `exercise_type` | yes | `reps` / `timed` / `timed-hold` / `bilateral` |
| `default_reps` | if reps | Reps per set (e.g. `15`) |
| `default_sets` | yes | Number of sets (typically `3`) |
| `default_duration_sec` | if timed | Hold/work duration per set (e.g. `30`) |
| `default_rest_sec` | yes | Rest between sets in seconds (default `60`) |
| `is_bilateral` | if bilateral | `true` = done on each side |
| `technique` | yes | Step-by-step instructions (see format below) |
| `warnings` | no | Things to avoid, Ukrainian |
| `tips` | no | Helpful hints, Ukrainian |
| `timer_sec` | recommended | Countdown timer duration in seconds. **Without this, no timer button shows during the exercise.** Use `default_duration_sec` value if unsure. |
| `sort_order` | yes | Order within the workout: 1, 2, 3... |

#### Exercise type guide

| Type | Use when | Fields to set |
|---|---|---|
| `reps` | Counting repetitions | `default_reps` + `default_sets` + `default_rest_sec` |
| `timed` | Work for X seconds | `default_duration_sec` + `default_sets` + `default_rest_sec` |
| `timed-hold` | Static hold (plank, wall sit) | `default_duration_sec` + `default_sets` + `default_rest_sec` |
| `bilateral` | Same movement each side | `default_reps` or `default_duration_sec` + `default_sets` + `is_bilateral: true` |

#### Allowed muscle groups

`neck`, `eyes`, `shoulders`, `upper-back`, `chest`, `arms`, `wrists`, `core`, `lower-back`, `glutes`, `hip-flexors`, `quads`, `hamstrings`, `calves`, `full-body`

#### Technique format

```
1. Instruction in Ukrainian
2. Next step [!Key form cue]
3. Another step
```

Mark critical form cues with `[!...]` — they become `keyPoint` in the data. Typically 2-4 steps per exercise.

## Input Format

```
Workout: <name>
Description: <Ukrainian description>
Icon: <emoji>
Duration: <N> min

Exercise 1: <Ukrainian name> (<English name>)
  muscles: <comma-separated>
  type: <exercise_type>, <reps> reps, <sets> sets, <rest> sec rest
  technique:
    1. Step one
    2. Step two [!Key point]
    3. Step three
  warnings: <comma-separated>
  tips: <comma-separated>

Exercise 2: ...
```

## Differences from Micro-Break Rotations

| | Micro-Break | Strength |
|---|---|---|
| `category` | `micro-break` | `strength` |
| `micro_break_rotation` | required (rotation key) | none |
| `default_sets` | none (single pass) | yes (typically 3) |
| `default_rest_sec` | none | yes (typically 60 sec) |
| `workout_type` | `micro-break` | `strength` |
| Code changes needed | type + constants + DB constraint | none |
