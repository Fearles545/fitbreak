---
name: streak_stats RPC not in schema SQL
description: The streak_stats function is in database.types.ts (generated from live DB) but not in docs/fitbreak-supabase-schema.sql — fresh deployments will break
type: project
---

The ProgressService calls `rpc('streak_stats')` but this function is not defined in the schema SQL file. It was likely created directly in the Supabase SQL editor. The generated types include it, confirming it exists in the live database.

**Why:** The schema SQL file is documented as the source of truth for deployments. Any function not in it will be missing on a fresh setup.

**How to apply:** When reviewing new RPC usage, always verify the function exists in the schema SQL file. Flag any RPC calls that reference functions not in the schema.
