---
name: Data-driven rotations — removing hardcoded constants
description: Sprint 4 migrates rotations from hardcoded FE constants to fully template-driven architecture (DECISION-015)
type: project
---

Rotations are being migrated from hardcoded frontend constants (`ROTATION_ORDER`, `ROTATION_INFO`, `MicroBreakRotation` type, `rotationKeyFromTemplate()` reverse-engineering map) to fully data-driven from `workout_templates` table.

Key changes (Sprint 4, tasks 1-2):
- `workout_templates` becomes single source of truth for rotation metadata (name, icon, duration)
- `user_settings` stores template UUIDs instead of string rotation keys
- `exercises.micro_break_rotation` column dropped — exercises linked via template JSONB
- Historical `BreakEntry` records migrated to use `templateId` + denormalized `templateName`/`templateIcon`
- Strength workouts were already data-driven — micro-breaks converging to same pattern

**Why:** Adding Yulia's custom rotations required code changes + DB migration + redeployment. This is unsustainable. The database already models per-user rotations correctly; the frontend constants were redundant friction.

**How to apply:** After Sprint 4, adding new rotations or exercises should be a pure data operation (SQL inserts or future admin UI). Any feature proposal that re-introduces hardcoded exercise/rotation assumptions should be challenged. The principle is: if the data model can express it, the code shouldn't constrain it.
