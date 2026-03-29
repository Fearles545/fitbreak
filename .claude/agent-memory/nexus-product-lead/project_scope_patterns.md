---
name: Scope creep patterns observed in this project
description: Recurring patterns where features risk expanding beyond what 2 users and 5-10h/week can support
type: project
---

Patterns to watch for:

1. **"But what if we have more users" creep** — Marketplace, self-service template management, admin dashboards. The app has 2 users. Leo manually assigns rotations. Any feature justified by hypothetical user growth should be parked unless it's architecturally cheap (like adding a DB field that enables future work).

2. **Template/exercise duplication instead of parameterization** — The instinct to create separate templates for variations (easy vs hard, week 1 vs week 3) when a parameter (difficulty toggle) is cleaner. Always ask: are the exercises the same? If yes, parameterize.

3. **Building admin UI before it's needed** — With 2 users, SQL inserts are fine for adding rotations. Admin UI is a parking lot item. The threshold: when Leo is adding rotations more than once a month, it might be worth it.

4. **Hardcoding what should be data** — The rotation constants were the original sin. Watch for any new feature that bakes user-specific or content-specific assumptions into code instead of reading from the database.

**How to apply:** When evaluating any feature request, run it against these patterns. If it matches, push back with the specific pattern name. The budget is 5-10h/week with one developer — every hour spent on premature infrastructure is an hour not spent on features that drive daily engagement.
