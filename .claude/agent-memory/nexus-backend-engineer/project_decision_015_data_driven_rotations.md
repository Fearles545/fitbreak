---
name: DECISION-015 — Data-Driven Rotations (Sprint 4)
description: Sprint 4 migration plan to replace hardcoded rotation keys with template-based system, marketplace flag, and JSONB migration
type: project
---

## DECISION-015: Data-Driven Rotations (2026-03-29)

Planned schema changes for Sprint 4:

### New columns on `workout_templates`
- `rotation_key` text — replaces the role of `exercises.micro_break_rotation`
- `is_marketplace` boolean — marketplace templates visible to all users
- `source_template_id` uuid — tracks which marketplace template a user's copy came from

### Changes to `user_settings`
- Add `enabled_template_ids uuid[]` — replaces current string-based rotation arrays
- Add `template_order uuid[]` — ordering of templates
- Drop old string-based rotation references

### Columns to drop
- `exercises.micro_break_rotation` column and its CHECK constraint

### JSONB migration (historical data)
- `work_sessions.breaks` (BreakEntry[]) needs migration: add `templateId`, `templateName`, `templateIcon`, stop using `rotationType`

### Marketplace approach
- `is_marketplace = true` flag on `workout_templates`, not a separate table
- System user UUID for marketplace content ownership
- Additive SELECT RLS policy: all authenticated users can read marketplace templates

**Why:** Current rotation system is hardcoded to string keys. Adding per-user custom rotations (like Yulia's knee-safe sets) exposed that rotations need to be template-driven, not enum-driven.

**How to apply:** When writing the Sprint 4 migration, this is the authoritative plan. Migration must be reversible. Update `docs/fitbreak-supabase-schema.sql` and regenerate TypeScript types after applying.
