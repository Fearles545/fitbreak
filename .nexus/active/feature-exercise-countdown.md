# Feature: Exercise Countdown Timer with Lead-in

**Level:** 1
**Date:** 2026-03-27
**Status:** Approved

## Context

During break execution, timed exercises (e.g. "утримуй 30 сек") only show a text label with the duration. The user has to mentally count or use a separate timer. Adding an in-app countdown with a 3-2-1 lead-in makes the break flow more guided and hands-free — aligned with UX principle #1 (zero-decision).

## User Stories

- As a user, I want a countdown timer for timed exercises so that I don't have to count in my head
  - AC: Exercises with `default_duration_sec` show a start button that triggers lead-in → countdown
  - AC: Lead-in counts 3 → 2 → 1 → "Вперед!" with audio ticks
  - AC: Countdown shows remaining seconds with timer ring animation
  - AC: Completion triggers a beep and shows "next" action
- As a user, I want bilateral exercises to time each side separately
  - AC: For bilateral exercises, countdown runs twice with a side-switch prompt between them

## UX Flow

### State machine (per exercise)

```
ready → lead-in (3,2,1) → counting (N..0) → done
                                              ↓
                              [bilateral] → switch-side → lead-in → counting → done
```

### What the user sees

**Ready state:**
- Exercise name, technique, params (existing)
- Big "Почати" button replaces the current "Готово — наступна" for timed exercises

**Lead-in (3 sec):**
- Large centered number: 3 → 2 → 1 → "Вперед!"
- Short beep on each tick
- Exercise info stays visible but dimmed

**Counting:**
- Timer ring with AnimatedTimerComponent showing seconds
- Exercise name still visible above
- No action needed — hands-free
- Optional: "Пропустити" text button (small, not prominent)

**Done:**
- Beep on completion
- "Готово — наступна" button appears (same as current flow)
- For bilateral: "Тепер інша сторона" prompt → auto-starts lead-in for side 2

### Non-timed exercises

No change. Reps-based exercises keep current behavior ("Готово — наступна" button).

## Technical Design

### Component changes

**break-execution.component.ts — extend**

New signals:
```typescript
private _timerState = signal<'ready' | 'lead-in' | 'counting' | 'done'>('ready');
private _leadInCount = signal(3);
private _remainingSeconds = signal(0);
private _currentSide = signal<1 | 2>(1); // for bilateral
```

Logic:
- `startCountdown()` → sets state to 'lead-in', runs 3-2-1 with `setInterval(1000)`
- Lead-in ends → state to 'counting', starts main countdown
- Main countdown reaches 0 → state to 'done', play completion beep
- Bilateral: on done for side 1 → show switch prompt → auto-start side 2

### Existing components reused

- `TimerRingComponent` — ring visual during countdown
- `AnimatedTimerComponent` — animated digits (receives `remainingSeconds` input)
- `AudioService.playBeep()` — lead-in ticks + completion sound

### Template structure (within break-execution)

```html
@if (isTimed() && timerState() === 'ready') {
  <!-- Start button instead of "next" -->
}
@if (timerState() === 'lead-in') {
  <!-- Large centered 3/2/1/Вперед! -->
}
@if (timerState() === 'counting') {
  <!-- Timer ring + animated timer -->
}
@if (timerState() === 'done') {
  <!-- Bilateral switch or next button -->
}
```

### No schema changes

Timer is purely a UX enhancement during break execution. BreakEntry already stores `completedAt` timestamp. No new data needed.

### No new services

All logic fits in the component. `setInterval` for countdown, `AudioService` for beeps. Simple enough to not warrant a service.

## Edge Cases

| Case | Handling |
|---|---|
| User navigates away mid-countdown | `clearInterval` in `OnDestroy`, break not marked complete |
| Exercise has 0 or null duration_sec | Treat as reps-based, no timer |
| Very short duration (< 5 sec) | Still show lead-in + countdown, just fast |
| User wants to skip timer | "Пропустити" link below timer, advances to done state |
| Bilateral with only 1 side completed | "done" state only after both sides |

## Acceptance Criteria

- [ ] Timed exercises show "Почати" button instead of immediate "Готово"
- [ ] Lead-in counts 3-2-1 with beep per tick
- [ ] Countdown shows timer ring + animated seconds
- [ ] Completion beep when timer reaches 0
- [ ] Bilateral exercises run twice with side-switch prompt
- [ ] Non-timed exercises unchanged
- [ ] Skip option available during countdown
- [ ] Timer cleanup on component destroy

## Decisions

- Lead-in is always 3 seconds (not configurable)
- Auto-start side 2 for bilateral (no extra button)
- Timer lives in break-execution component, not extracted to shared (single use case for now)
