---
name: RLS — Marketplace Templates Need Additive SELECT Policy
description: Marketplace workout_templates need a second SELECT policy allowing all authenticated users to read is_marketplace=true rows
type: project
---

## Marketplace RLS Consideration (2026-03-29)

Current RLS on `workout_templates`: `auth.uid() = user_id` for all operations (SELECT, INSERT, UPDATE, DELETE).

When marketplace templates are introduced (DECISION-015), an **additive SELECT policy** is needed:

```sql
CREATE POLICY "Users can view marketplace templates"
  ON workout_templates FOR SELECT
  USING (is_marketplace = true);
```

This works because PostgreSQL RLS policies are OR-combined — a row is visible if ANY policy grants access. So users see:
1. Their own templates (existing policy)
2. All marketplace templates (new policy)

INSERT/UPDATE/DELETE remain restricted to `auth.uid() = user_id` — no user can modify marketplace templates (owned by system user).

**Why:** Without this, marketplace templates owned by the system user would be invisible to regular users.

**How to apply:** Add this policy in the same migration that adds `is_marketplace` column. The `exercises` table will need a similar additive policy if marketplace exercises are stored there.
