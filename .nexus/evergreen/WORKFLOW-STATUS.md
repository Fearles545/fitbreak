# Workflow Status — FitBreak

**Last updated:** 2026-03-29
**Last session:** Second user onboarding + per-user architecture exploration

## Current State

🟡 **Sprint 4 planned, not started. Second user (Yulia) seeded with custom exercises.**

## Sprint 4 (planned)

Per-User Data Architecture — make rotations data-driven, add difficulty toggle.

| # | Task | Level | Status |
|---|------|-------|--------|
| 1 | Data-driven rotations — DB migration | 1 | pending |
| 2 | Data-driven rotations — FE migration | 2 | pending |
| 3 | Workout difficulty toggle — DB + model | 1 | pending |
| 4 | Workout difficulty toggle — FE | 2 | pending |

## Active Work

_None — Sprint 4 not started._

## Blockers

_None._

## Next Steps

1. Start Sprint 4 task #1 (DB migration for data-driven rotations)
2. Tasks #1 and #3 can run in parallel (both DB work)
3. FE work (#2, #4) follows after DB is ready

## Recent Decisions

- DECISION-015: Data-driven rotations — remove hardcoded `ROTATION_ORDER`, `ROTATION_INFO`, `MicroBreakRotation` type. Derive everything from `workout_templates`.
- DECISION-016: Workout difficulty toggle — `difficulty_overrides` JSONB per exercise, `last_difficulty` per template. Easy/medium/hard with per-exercise parameter scaling.

## Session Notes

Second user (Yulia) onboarded with knee rehabilitation exercises: 2 custom rotations (knee-safe-active, knee-activation) + standard rotations 1-3 + 2 strength workouts. This exposed that rotations are hardcoded on FE — triggered architecture exploration. Deep analysis from backend engineer, product lead, and codebase explorer. Decided to make rotations fully data-driven (Sprint 4). Also designed difficulty toggle system for exercise progression. Created docs: `docs/adding-rotation.md`, `docs/adding-strength-workout.md`. Marketplace idea parked — not needed for 2 users but architecture supports it later.
