# Feature: Muscle Group Metadata for Rotations

**Level:** 1
**Date:** 2026-03-27
**Status:** Approved

## Context

To analyze and balance fitbreaks by muscle group coverage, we need explicit metadata on what each rotation trains and at what intensity. Currently this requires traversing template → exercise slots → exercises → muscle_groups — complex and indirect. Adding structured metadata directly to templates and snapshotting it into break logs makes analytics queries trivial.

## Design Decision: Immutable Templates

Templates (rotations) are treated as immutable. If adjustments are needed, create a new template rather than editing an existing one. This guarantees historical break logs always reference accurate data.

Recorded as a project decision — no versioning or soft-delete needed.

## Data Model Changes

### New JSONB type

```typescript
interface TargetMuscleGroup {
  group: MuscleGroup;
  intensity: 1 | 2 | 3; // 1 = light stretch, 2 = moderate, 3 = intense
}
```

### workout_templates — add column

```sql
ALTER TABLE public.workout_templates
  ADD COLUMN target_muscle_groups jsonb DEFAULT '[]';
```

Optional, nullable for backward compatibility. Populated for all micro-break templates.

### BreakEntry — add field

```typescript
// work_sessions.breaks[] JSONB
interface BreakEntry {
  // ... existing fields ...
  muscleGroups?: TargetMuscleGroup[]; // NEW — snapshot from template on completion
}
```

Optional — old break entries won't have it. Progress V2 handles both cases.

## Implementation

### 1. Migration

- Add `target_muscle_groups jsonb default '[]'` to workout_templates
- Update TypeScript interfaces: `WorkoutTemplate`, `BreakEntry`, `TargetMuscleGroup`
- Update `docs/fitbreak-supabase-schema.sql` (source of truth)

### 2. Seed data — populate existing templates

```sql
UPDATE workout_templates SET target_muscle_groups = '[
  {"group": "neck", "intensity": 1},
  {"group": "eyes", "intensity": 1}
]' WHERE name = 'Шия + Очі';

UPDATE workout_templates SET target_muscle_groups = '[
  {"group": "shoulders", "intensity": 2},
  {"group": "upper-back", "intensity": 2}
]' WHERE name = 'Грудний відділ + Плечі';

UPDATE workout_templates SET target_muscle_groups = '[
  {"group": "hip-flexors", "intensity": 2},
  {"group": "lower-back", "intensity": 1},
  {"group": "glutes", "intensity": 1}
]' WHERE name = 'Стегна + Поперек';

UPDATE workout_templates SET target_muscle_groups = '[
  {"group": "full-body", "intensity": 3}
]' WHERE name = 'Активна розминка';
```

Exact groups and intensities to be reviewed with CEO during implementation — the above is a starting proposal.

### 3. Snapshot on break completion

In `BreakTimerService.completeBreak()`:
- Look up the active rotation's template
- Copy `target_muscle_groups` into the BreakEntry as `muscleGroups`
- Already have `_templates` signal loaded in the service

### 4. Progress V2 integration

Progress V2's rotation balance section reads `muscleGroups` from break entries:
- Aggregate by group across all breaks in the period
- Weight by intensity for load balancing view
- Fallback: breaks without `muscleGroups` (old data) — derive from rotationType using a static map

## Acceptance Criteria

- [ ] Migration adds `target_muscle_groups jsonb` to workout_templates
- [ ] All 4 micro-break templates populated with muscle groups + intensity
- [ ] BreakEntry interface updated with optional `muscleGroups` field
- [ ] `completeBreak()` snapshots template's muscle groups into break log
- [ ] `docs/fitbreak-supabase-schema.sql` updated
- [ ] TypeScript interfaces in `shared/models/` match schema
- [ ] Old break entries (without muscleGroups) don't break anything
