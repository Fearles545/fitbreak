---
name: Second User Onboarded — Yulia
description: Yulia (user_id accd3a74-460b-4ee8-b5da-fcd105bc375c) onboarded with custom knee-safe exercise rotations and workouts
type: project
---

## Second User — Yulia (2026-03-29)

- **user_id:** `accd3a74-460b-4ee8-b5da-fcd105bc375c`
- Custom knee rehabilitation exercise set seeded directly via SQL
- 32 exercises total, 7 workout templates
- 2 micro-break rotations: `knee-safe-active`, `knee-activation` (added to CHECK constraint via migration `add_knee_rotation_keys`)
- Standard rotations 1-3 copied from Leo's data
- 2 strength workouts (knee-safe)

**Why:** FitBreak is no longer single-user in practice. RLS policies must work correctly for both users. Any data seeding or marketplace features must account for multiple user_ids.

**How to apply:** When writing migrations or RLS policies, always verify they work for both user_ids. The CHECK constraint on `exercises.micro_break_rotation` now includes knee-specific keys (though DECISION-015 plans to drop this column entirely).
