# Feature: Animated Timer Component

**Level:** 2
**Date:** 2026-03-26
**Status:** Approved

## Context

Timer displays are the most-looked-at element in FitBreak. Currently they render as static text that snaps between values. Adding animated digit transitions (flip/roll) transforms the experience from "reading a number" to "watching a clock" — a visual upgrade that makes the daily countdown feel alive and polished.

This is also a unification effort: today, timer formatting is duplicated across TimerRingComponent (dashboard), stepper, and strength. A shared animated timer component consolidates this.

## User Stories

- As a user watching my break countdown, I want digits to transition smoothly so the timer feels alive and polished.
  - AC: Digits animate individually — only the digit that changed plays the animation.
  - AC: Animation duration ~300ms, no jank on 1-second ticks.
  - AC: `prefers-reduced-motion: reduce` disables all animations — instant swap.

- As a user, I want to choose between flip and roll animation styles so the timer feels personalized.
  - AC: Settings page has "Анімація таймера" section with Фліп / Прокрутка chips.
  - AC: Preference stored in DB, applied globally to all timer instances.
  - AC: Default is `flip`.

## UX Flow

### Component sizes

| Variant | Use case | Approx font size |
|---------|----------|-------------------|
| `big` | Dashboard timer ring, stepper fullscreen | 2.5rem / 5rem (context-dependent) |
| `medium` | Strength rest timer, break timer | ~1.5rem |
| `small` | Exercise set countdown (future) | ~1rem |

### Animation modes

**Flip (default):** Split-panel flip. Each digit has a top half and bottom half. On change, the old top half rotates down (rotateX -90deg), new bottom half rotates up. A horizontal "seam" line separates the halves. Classic departure board aesthetic.

**Roll:** Digits slide vertically like a slot machine. Each digit slot has a strip of 0-9, translateY moves to the target position.

### Structure

```
[M] [M] : [S] [S]
          static
```

Colon is static — visual anchor for the eye. Only digits that actually changed animate.

### Content projection

`<ng-content>` for labels below digits. Used in dashboard ("до перерви"), stepper ("залишилось"), etc.

### Accessibility

- Animated digits are decorative — AT reads a visually-hidden `<span>` with the raw time
- `aria-live="off"` on visual digits (no announcement every second)
- `font-variant-numeric: tabular-nums` to prevent layout shift

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .digit * { animation: none !important; transition: none !important; }
}
```

## Technical Design

### New component

`src/app/shared/components/animated-timer/animated-timer.component.ts`

```typescript
@Component({ selector: 'app-animated-timer' })
export class AnimatedTimerComponent {
  remainingSeconds = input.required<number>();
  size = input<'big' | 'medium' | 'small'>('medium');
  mode = input<'flip' | 'roll' | undefined>(undefined); // override, else SettingsService
  // <ng-content> for labels
}
```

**Internal logic:**
- Compute 4 digits from remainingSeconds: [M tens] [M ones] [S tens] [S ones]
- Track previous values via effect() — compare old vs new
- On change: toggle animation CSS class on the specific digit slot
- After animation ends (animationend event or timeout), reset the class

**Flip digit structure (per digit):**
```html
<div class="digit flip">
  <div class="top">{{ currentDigit }}</div>
  <div class="bottom">{{ currentDigit }}</div>
  <!-- Animation overlays for flip-out (old) and flip-in (new) -->
  <div class="flip-overlay top" [class.animating]="changed">{{ oldDigit }}</div>
  <div class="flip-overlay bottom" [class.animating]="changed">{{ currentDigit }}</div>
</div>
```

**Roll digit structure (per digit):**
```html
<div class="digit roll">
  <div class="strip" [style.transform]="'translateY(-' + (currentDigit * digitHeight) + 'px)'">
    @for (n of [0,1,2,3,4,5,6,7,8,9]; track n) {
      <div class="strip-digit">{{ n }}</div>
    }
  </div>
</div>
```

### Refactor TimerRingComponent

Clean break — remove internal time rendering, use `<ng-content>`:

```html
<!-- Before -->
<div class="content">
  <span class="time">{{ formattedTime() }}</span>
  @if (label()) { <span class="label">{{ label() }}</span> }
</div>

<!-- After -->
<div class="content">
  <ng-content />
</div>
```

Remove: `formattedTime` computed, `label` input.
Keep: `remainingSeconds`, `totalSeconds`, `strokeWidth` inputs (for ring progress).

### Integration changes

**Dashboard template:**
```html
<app-timer-ring [remainingSeconds]="remainingSeconds()" [totalSeconds]="totalSeconds()">
  <app-animated-timer [remainingSeconds]="remainingSeconds()" size="big">
    <span class="label">до перерви</span>
  </app-animated-timer>
</app-timer-ring>
```

**Stepper template:**
```html
<app-animated-timer [remainingSeconds]="stepper.remainingSec()" size="big">
  <span class="timer-label">залишилось</span>
</app-animated-timer>
```

**Strength rest timer:** Replace with `<app-animated-timer size="medium">`.

### Settings: animation style preference

**DB migration:**
```sql
ALTER TABLE user_settings
ADD COLUMN timer_animation_style text NOT NULL DEFAULT 'flip'
CHECK (timer_animation_style IN ('flip', 'roll'));
```

**SettingsService:** Add `timerAnimationStyle()` computed signal.

**Settings page:** Add "Анімація таймера" chip selector section (Фліп / Прокрутка).

**Schema doc + TypeScript types:** Update to match.

### CSS approach

- `transform: rotateX()` + `perspective` for flip (GPU-composited)
- `transform: translateY()` for roll (GPU-composited)
- `backface-visibility: hidden` on flip panels
- `overflow: hidden` on digit containers
- Color: `currentColor` — inherits from parent
- Font: `font-family: 'Exo 2', monospace` (existing timer font)
- `font-variant-numeric: tabular-nums`

## Edge Cases & Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Animation jank on 1s ticks | Medium | 300ms duration, GPU-only properties, animate only changed digits |
| Timer ring content centering | Medium | Test layout with animated timer inside ring overlay |
| Stepper white-on-dark color | Low | Component uses currentColor, parent sets color |
| Settings migration | Low | Default 'flip', no data migration needed |
| Reduced motion not tested | Low | Test with `prefers-reduced-motion: reduce` |

## Acceptance Criteria

- [ ] Animated timer component works at 3 sizes (big, medium, small)
- [ ] Flip animation: split-panel flip on digit change, only changed digits animate
- [ ] Roll animation: vertical slide on digit change
- [ ] Colon is static
- [ ] Content projection works for labels
- [ ] Dashboard timer ring uses animated timer via ng-content
- [ ] Stepper uses animated timer standalone
- [ ] Strength rest timer uses animated timer
- [ ] Settings page has animation style selector
- [ ] Animation preference persisted in DB and applied globally
- [ ] `prefers-reduced-motion` disables animations
- [ ] Dark mode works (currentColor inheritance)
- [ ] No layout shift during animations (tabular-nums)
- [ ] Screen reader gets raw time value, not animated digit spam

## Open Questions

None — all resolved during exploration.
