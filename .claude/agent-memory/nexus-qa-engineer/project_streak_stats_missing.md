---
name: streak_stats RPC confirmed in schema SQL
description: streak_stats function IS present in schema SQL (lines 401-441) -- originally flagged as missing but verified present as of 2026-03-26
type: project
---

Previously flagged as missing from `docs/fitbreak-supabase-schema.sql`, but confirmed present at lines 401-441. The function returns `current_streak` and `longest_streak`. Both DashboardService and ProgressService call it.

**Why:** Corrects a false-positive QA finding from an earlier review.

**How to apply:** No action needed -- the schema file is in sync with the live DB for this function.
