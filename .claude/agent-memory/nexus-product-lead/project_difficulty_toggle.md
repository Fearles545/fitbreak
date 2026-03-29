---
name: Difficulty toggle solves progression without template duplication
description: Exercise progression (easy/medium/hard) handled via difficulty_overrides JSONB, not by duplicating templates (DECISION-016)
type: project
---

Yulia's knee rehabilitation has a progression plan (week 1-2 fewer reps without weights, week 3-4 full reps with weights, week 5+ increased volume). Instead of duplicating templates per phase, a difficulty toggle was designed:

- `difficulty_overrides` JSONB on each exercise defines what easy/medium/hard means (reps, duration, descriptive note)
- `last_difficulty` on `workout_templates` stores the last choice per template
- Toggle is per-template, not global — different templates can be at different progression levels
- User can change difficulty mid-workout; remaining exercises adjust, completed ones stay logged as-is
- Each exercise defines its own scaling (squats scale by reps, plank scales by duration, leg raises scale by adding weight)

**Why:** Template duplication was rejected because the exercises are the same — only parameters change. Duplicating would create maintenance burden and confuse the rotation cycle. A global difficulty setting was rejected because different templates may be at different progression levels.

**How to apply:** When progression or customization requests come up, first check if difficulty_overrides can handle it. The pattern is: same exercises, different parameters = difficulty toggle. Different exercises entirely = new template. Resist pressure to add more difficulty levels beyond easy/medium/hard — three is enough for a personal app.
