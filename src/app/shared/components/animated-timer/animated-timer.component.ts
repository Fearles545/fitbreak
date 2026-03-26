import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import type { AnimationMode, DigitState } from './digit-state';
import { RollDigitComponent } from './strategies/roll-digit.component';
import { FadeDigitComponent } from './strategies/fade-digit.component';
import { ScaleDigitComponent } from './strategies/scale-digit.component';
import { BlurDigitComponent } from './strategies/blur-digit.component';
import { SlotDigitComponent } from './strategies/slot-digit.component';

type TimerSize = 'big' | 'medium' | 'small';

@Component({
  selector: 'app-animated-timer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RollDigitComponent,
    FadeDigitComponent,
    ScaleDigitComponent,
    BlurDigitComponent,
    SlotDigitComponent,
  ],
  styles: `
    :host {
      display: block;
      color: currentColor;
    }

    .timer-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .digits {
      display: flex;
      align-items: center;
      font-family: 'Exo 2', monospace;
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      line-height: 1;
    }

    .colon {
      display: flex;
      align-items: center;
      font-weight: 700;
      opacity: 0.7;
    }

    /* ── Size variants ── */

    :host(.size-big) .digits { font-size: var(--timer-font-size, 2.5rem); }
    :host(.size-big) .colon { font-size: var(--timer-font-size, 2.5rem); padding: 0 2px; }

    :host(.size-medium) .digits { font-size: 1.5rem; }
    :host(.size-medium) .colon { font-size: 1.5rem; padding: 0 1px; }

    :host(.size-small) .digits { font-size: 1rem; }
    :host(.size-small) .colon { font-size: 1rem; padding: 0 1px; }

    /* ── Visually hidden for screen readers ── */

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `,
  template: `
    <div class="timer-wrapper">
      <span class="sr-only">{{ formattedTime() }}</span>

      <div class="digits" aria-hidden="true">
        @for (digit of digitStates(); track $index; let idx = $index) {
          @if (idx === 2) {
            <span class="colon">:</span>
          }

          @switch (animationMode()) {
            @case ('roll') { <app-roll-digit [state]="digit" /> }
            @case ('fade') { <app-fade-digit [state]="digit" /> }
            @case ('scale') { <app-scale-digit [state]="digit" /> }
            @case ('blur') { <app-blur-digit [state]="digit" /> }
            @case ('slot') { <app-slot-digit [state]="digit" /> }
          }
        }
      </div>

      <ng-content />
    </div>
  `,
  host: {
    '[class.size-big]': 'size() === "big"',
    '[class.size-medium]': 'size() === "medium"',
    '[class.size-small]': 'size() === "small"',
  },
})
export class AnimatedTimerComponent {
  private destroyRef = inject(DestroyRef);

  remainingSeconds = input.required<number>();
  size = input<TimerSize>('medium');
  mode = input<AnimationMode | undefined>(undefined);

  private _digitStates = signal<DigitState[]>([
    { current: 0, previous: 0, animating: false },
    { current: 0, previous: 0, animating: false },
    { current: 0, previous: 0, animating: false },
    { current: 0, previous: 0, animating: false },
  ]);

  private previousDigits = [0, 0, 0, 0];
  private firstRun = true;
  private animationTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.animationTimer) clearTimeout(this.animationTimer);
    });
  }

  readonly digitStates = this._digitStates.asReadonly();

  readonly animationMode = computed((): AnimationMode =>
    this.mode() ?? 'roll',
  );

  readonly formattedTime = computed(() => {
    const total = Math.max(0, this.remainingSeconds());
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  });

  private updateEffect = effect(() => {
    const total = Math.max(0, this.remainingSeconds());
    const m = Math.floor(total / 60);
    const s = total % 60;

    const newDigits = [
      Math.floor(m / 10),
      m % 10,
      Math.floor(s / 10),
      s % 10,
    ];

    const skipAnimation = this.firstRun;
    this.firstRun = false;

    const updated = this.previousDigits.map((prev, i) => {
      const changed = !skipAnimation && prev !== newDigits[i];
      return {
        current: newDigits[i],
        previous: prev,
        animating: changed,
      };
    });

    this.previousDigits = newDigits;
    this._digitStates.set(updated);

    if (this.animationTimer) clearTimeout(this.animationTimer);
    this.animationTimer = setTimeout(() => {
      this._digitStates.update(states =>
        states.map(s => ({ ...s, animating: false })),
      );
    }, 500);
  });
}
