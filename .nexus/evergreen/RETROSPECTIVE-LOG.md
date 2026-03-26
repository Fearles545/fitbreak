# Retrospective Log — FitBreak

Lessons learned from sprints and incidents.

## Format

```
### RETRO-NNN: Title
**Date:** YYYY-MM-DD
**What happened:** Brief description
**What we learned:** Key takeaway
**Action:** What changes as a result
```

---

### RETRO-001: Manual Supabase user creation is fragile
**Date:** 2026-03-24
**What happened:** Tried to manually INSERT into auth.users/auth.identities for a test account. Failed twice — first because of generated columns (confirmed_at, email), then because GoTrue expects empty strings '' not NULLs for token columns (Go's sql.Scan can't convert NULL to string).
**What we learned:** Supabase's auth schema has undocumented expectations that manual SQL inserts can't easily satisfy. Auth logs (mcp__supabase__get_logs service:auth) reveal the actual Go-level scan errors — the client-side error is generic and unhelpful.
**Action:** For future test accounts, use the same INSERT pattern that worked (with all varchar token fields set to ''). Or just use Google OAuth with a different account.

### RETRO-002: QA agent catches real risks that are easy to miss
**Date:** 2026-03-24
**What happened:** During settings feature exploration, ran QA agent for risk analysis. It found 4 red-severity risks (load timing across routes, upsert without onConflict, null→NOT NULL constraint) that were incorporated into the implementation before coding.
**What we learned:** Running QA before implementation (not just after) prevents architectural bugs that are expensive to fix later. The cross-route settings loading issue (R8) would have been a real production bug.
**Action:** Continue using QA agent during /nexus-explore for risk analysis on Level 2+ features.

### RETRO-003: Sprint 1 completed in a single session
**Date:** 2026-03-26
**What happened:** All 4 Sprint 1 tasks completed in one session — stepper fix (Level 0), settings (Level 2), day summary (Level 1), progress V1 (Level 2). Infrastructure hardening (RLS, SQL functions, stale session cleanup) was done alongside feature work.
**What we learned:** The /nexus-explore pipeline for settings caught risks early (QA agent found 4 red-severity issues before coding). Having a clear feature spec before implementation made coding faster. Nexus workflow (plan → explore → build → save) worked well for the first sprint.
**Action:** Keep the same workflow for Sprint 2. Consider running QA review after implementation too (not just before).
