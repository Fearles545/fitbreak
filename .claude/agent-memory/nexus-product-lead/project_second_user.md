---
name: Second user onboarded — Yulia
description: Yulia (second user) onboarded 2026-03-29 with custom knee rehabilitation exercises, exposing hardcoded rotation assumptions
type: project
---

Yulia onboarded as the second FitBreak user on 2026-03-29 with custom knee rehabilitation exercises (2 custom rotations: knee-safe-active, knee-activation) plus standard rotations 1-3 and 2 strength workouts.

**Why:** This was the first real test of the app beyond Leo's own usage. It immediately exposed that rotations were hardcoded on the frontend — adding a rotation required code changes, DB migration, and redeployment. The assumption that "single-user app" meant "only Leo" broke down the moment a second user appeared.

**How to apply:** FitBreak is no longer single-user in practice. When evaluating features, consider both Leo (desk worker, standard exercises) and Yulia (rehabilitation focus, progression needs). Any feature that assumes a single exercise profile is now wrong. However, the app is still "personal" in the sense of small user count with curated content — don't design for anonymous scale.
