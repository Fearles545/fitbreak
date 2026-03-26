# Feature: Timer Flow Redesign

**Level:** 3
**Date:** 2026-03-26
**Status:** Approved

## Context

The current break timer flow has two problems that don't match real work patterns:

1. **Auto-restart after break** — timer starts counting immediately, but user may not be working yet (coffee, chat, etc.). Makes tracked work time inaccurate.
2. **Auto-navigation on timer expiry** — forces user out of dashboard into break prompt. Feels intrusive when you're mid-thought or consciously choosing to work longer.

CEO has an established break habit and wants minimal notifications — one beep + tab title is enough.

## User Stories

### US-1: I return to work on my own terms
As a user, after completing a break I see a "back to work" state so the next timer starts only when I'm actually working.
- AC: After break completion, dashboard shows "Повернутись до роботи" state (not a countdown)
- AC: Next timer starts only when user taps the button
- AC: Time between break end and "back to work" tap is NOT counted as work time

### US-2: I see when a break is due but I'm not forced into it
As a user, when my timer reaches 0, I see a prominent button on the dashboard — the app doesn't navigate me away.
- AC: Timer reaching 0 does NOT auto-navigate to `/break`
- AC: Dashboard shows "break due" state with a big "Час на перерву" button
- AC: Timer continues counting UP past 0, showing overtime (e.g., "+3:24")

### US-3: I know how long I actually worked
As a user, my actual work time is tracked accurately.
- AC: Break entry records `actualWorkSeconds` (time from timer start/resume to break start)
- AC: Dashboard shows actual elapsed time when timer is past the interval

### US-4: Extend work is natural, not a rejection
As a user, when a break is suggested I can keep working without dismissing anything.
- AC: "Break due" state on dashboard is persistent but non-intrusive
- AC: No modal, no route change, no interruption beyond the initial notification

### US-5: Break notification is minimal and respectful
As a user, when my timer reaches 0 I get one beep and a tab title change — that's it.
- AC: Single beep at 0:00 (no repeated beeps)
- AC: Tab title changes to "⏰ Час на перерву! — FitBreak" and stays until break starts
- AC: No further audio interruptions — visual only from that point
- AC: Notification clears when user starts a break

## UX Flow

### Dashboard States (5 total)

```
NO SESSION ──tap "Почати"──→ WORKING ──timer 0──→ BREAK DUE
                                ↑                      │
                                │              tap "Час на перерву"
                                │                      ↓
                           BACK TO WORK ←── ON BREAK (/break route)
                           tap "Повернутись"
```

| State | Timer Ring | Primary CTA | Tab Title | Audio |
|-------|-----------|-------------|-----------|-------|
| No session | Hidden/empty | Почати робочий день | FitBreak | — |
| Working | Countdown | — (timer is focus) | MM:SS — FitBreak | — |
| Paused | Frozen | Продовжити | Пауза — FitBreak | — |
| Break due | Overtime color + count-up | **Час на перерву** | ⏰ Час на перерву! | 1 beep |
| On break | — (different route) | — | — | — |
| Back to work | Completion state | **Повернутись до роботи** | FitBreak | — |

### Break Due State Details
- Timer ring changes visual (color shift via CSS token, e.g., tertiary/warning)
- Counter switches from "32:15" countdown to "+0:12" count-up
- Big prominent filled button: "Час на перерву"
- Next rotation card visible below
- Rest of dashboard (stats, quick launch) unchanged — user can still navigate

### Back to Work State Details
- Timer ring shows completion/idle state (no countdown)
- Big button: "Повернутись до роботи"
- Last break summary visible (rotation name, duration)
- Tapping button → timer restarts, state → WORKING

### Accessibility
- "Час на перерву" button: `aria-label` with overtime context
- Count-up timer: `aria-live="polite"`, announce overtime every minute (not every second)
- State transitions: `role="status"` on indicator area
- Color change on ring is NOT the only indicator — text + button provide redundant cues

## Technical Design

### Activity States
```typescript
// Current
type Activity = 'idle' | 'working' | 'paused' | 'on-break' | 'stepper' | 'strength';

// New
type Activity = 'idle' | 'working' | 'paused' | 'break-due' | 'on-break' | 'back-to-work' | 'stepper' | 'strength';
```

### Components to Modify

**WorkdayService** (biggest change)
- Remove `breakTriggerEffect` auto-navigation
- Replace with: `remaining === 0` → set `'break-due'`, trigger notifier (once)
- Add `resumeAfterBreak()` — sets `'working'`, calculates new `next_break_at`, restarts tick
- `remainingSeconds` handles negative values OR add `overtimeSeconds` computed

**BreakNotifierService** (simplification)
- `trigger()` → single beep + tab title. Remove 4 scheduled timeouts.
- `cancel()` unchanged

**SessionService** (data enrichment)
- Record `actualWorkSeconds` in break entry on `completeBreak()`
- Track work-start timestamp for accurate calculation

**DashboardComponent + template** (new states)
- Computed signals: `isBreakDue`, `isBackToWork`, `overtimeSeconds`
- Template: `@switch` on activity for CTA rendering
- Timer ring: overtime visual state
- Handler: `onResumeAfterBreak()`

**BreakTimerComponent** (minor)
- After `completeBreak()` → navigate to dashboard (user sees "back to work" state)
- No change to break execution

**TimerRingComponent** (possible)
- May need `overtime` input for visual state change, or handle via CSS class from parent

### Data Model Changes

**BreakEntry (JSONB in work_sessions.breaks[])** — additive field:
```typescript
actualWorkSeconds?: number;  // seconds from work start/resume to break start
```

No migration needed — JSONB field, optional, backward compatible.

### State Reconstruction on Reload

Activity must be derivable from DB data when app restarts:
- `status === 'active'` + `next_break_at > now` → `'working'`
- `status === 'active'` + `next_break_at <= now` → `'break-due'`
- `status === 'active'` + last break has `completedAt` + no valid `next_break_at` → `'back-to-work'`

This logic lives in `WorkdayService` initialization / `SessionService.refreshSession()`.

## Edge Cases & Risks

**R1: State persistence across app restarts (medium)**
User closes app in `'break-due'` or `'back-to-work'` state. Must reconstruct from DB.
Mitigation: Derive activity from session data — `next_break_at` vs `now` + last break status.

**R2: Back-to-work state needs a DB marker (medium)**
After break completion, need to distinguish "back to work" from "break due".
Mitigation: Set `next_break_at = null` after break completion. Null + active session = back-to-work. Non-null + past = break-due.

**R3: Overtime counter formatting (low)**
Need `+MM:SS` display format. Minor UI work.

**R4: Break notifier single-beep reliability (low)**
Web Audio API context may need resume. Existing `playBreakReminder()` handles this.

## Acceptance Criteria

- [ ] Timer expiry shows "break due" state on dashboard with overtime counter — no auto-navigation
- [ ] Single beep + tab title on expiry, no repeated beeps
- [ ] User taps "Час на перерву" to enter break flow
- [ ] After break completion, dashboard shows "back to work" state
- [ ] User taps "Повернутись до роботи" to restart timer
- [ ] `actualWorkSeconds` recorded in break entries
- [ ] App restart correctly reconstructs `break-due` and `back-to-work` states
- [ ] Existing pause/resume flow still works
- [ ] Existing skip/extend-work options still accessible from break prompt

## Open Questions

1. **Timer ring visual for overtime** — color change via CSS token? Different ring style? Or just rely on the count-up text and button? → Decide during implementation.
2. **"Back to work" state — show last break info?** Listed as nice-to-have. Could just show the button without details to keep it minimal.
3. **`next_break_at = null` as marker** — cleanest approach for distinguishing back-to-work from break-due, but need to verify no other code depends on `next_break_at` being non-null during active sessions.
