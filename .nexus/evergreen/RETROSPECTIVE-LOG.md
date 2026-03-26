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

### RETRO-004: Signal circular dependency in effects
**Date:** 2026-03-26
**What happened:** AnimatedTimerComponent's `updateEffect` read `_digitStates()` signal to compare old vs new digits, then wrote to the same signal. This created an infinite loop that froze the browser tab ("this page is slowing down").
**What we learned:** Never read and write the same signal inside an `effect()`. Use a plain (non-reactive) variable to track previous state when you need to compare old vs new values.
**Action:** Pattern to follow: `private previousValue = X;` (plain), not `private _prev = signal(X)`, when the only purpose is diffing inside an effect.

### RETRO-005: CSS flip clock is deceptively hard
**Date:** 2026-03-26
**What happened:** Implemented split-panel flip animation for timer digits. Three separate CSS bugs stacked: inverted half positioning, wrong transform-origin, and missing visibility constraints on overlay cards. Even after fixes, the base card's bottom half "spoils" the new digit before the flip-in animation unfolds.
**What we learned:** Flip clock CSS requires precise coordination of 3 card layers with correct z-ordering, clipping, and timing. Simple CSS transitions (roll, fade, blur) achieve equivalent visual impact with a fraction of the complexity. Third-party flip libraries exist but are overkill for digit-level animation.
**Action:** Dropped flip in favor of 5 simpler animation modes. If flip is revisited, use a proven CSS reference implementation rather than building from scratch.

### RETRO-006: FE architect review catches structural debt early
**Date:** 2026-03-26
**What happened:** CEO felt accumulated tech debt after Sprint 2 tasks 1-3. Ran a full FE architect review across all 35 files. Found 2 runtime bugs (flip fallback, non-reactive boolean), 2 architecture violations (shared→feature imports), 4 oversized components (655, 644, 519, 453 LOC), duplicated mood picker in 3 components, missing error handling in all async component methods, and accessibility gaps.
**What we learned:** Periodic architecture reviews catch debt that accumulates invisibly. The two bugs (`'flip'` fallback that could render nothing, plain boolean that breaks signal tracking) were real — not theoretical. The shared→feature import violations would have compounded with every new feature.
**Action:** Consider running FE architect review after every 3-5 features, not just when debt "feels" bad. The 8-phase plan (bugs → error handling → shared components → architecture → decomposition → polish) worked well as a prioritized sequence.

### RETRO-007: Component decomposition reduces LOC but watch for data flow
**Date:** 2026-03-26
**What happened:** Split BreakTimerComponent (655→170 LOC) and StrengthComponent (644→~300 LOC) into parent+sub-components. QA review found zero bugs in the extraction — all input/output types matched correctly.
**What we learned:** The "presentation sub-component" pattern (inputs + outputs, no service injection) makes extraction safe and mechanical. Keeping all service calls in the parent prevents DI coupling in children. The mood picker extraction to shared/ was the highest-ROI change — eliminated identical code from 3 components.
**Action:** Follow this pattern for future decompositions. Components over 400 LOC are candidates for splitting.
