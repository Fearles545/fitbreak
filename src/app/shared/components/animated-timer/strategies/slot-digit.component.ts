import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import type { DigitState } from '../digit-state';

@Component({
  selector: 'app-slot-digit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      position: relative;
      overflow: hidden;
      display: block;
    }

    .sizer {
      visibility: hidden;
      display: block;
    }

    .value {
      position: absolute;
      inset: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .settling {
      animation: slot-settle 100ms ease-out;
    }

    @keyframes slot-settle {
      0% { transform: translateY(-0.15em); }
      60% { transform: translateY(0.03em); }
      100% { transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .settling { animation: none !important; }
    }
  `,
  template: `
    <span class="sizer">0</span>
    <span class="value" [class.settling]="settled()">{{ displayValue() }}</span>
  `,
})
export class SlotDigitComponent {
  private destroyRef = inject(DestroyRef);

  state = input.required<DigitState>();

  readonly displayValue = signal(0);
  readonly settled = signal(false);

  private cycleTimer: ReturnType<typeof setInterval> | null = null;
  private settleTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.cleanup());
  }

  private cycleEffect = effect(() => {
    const s = this.state();

    if (s.animating) {
      this.startCycling(s.current);
    } else {
      this.displayValue.set(s.current);
    }
  });

  private startCycling(target: number): void {
    this.cleanup();
    this.settled.set(false);

    let count = 0;
    this.cycleTimer = setInterval(() => {
      this.displayValue.set(Math.floor(Math.random() * 10));
      count++;
      if (count >= 6) {
        if (this.cycleTimer) clearInterval(this.cycleTimer);
        this.cycleTimer = null;
        this.displayValue.set(target);
        this.settled.set(true);

        this.settleTimer = setTimeout(() => this.settled.set(false), 150);
      }
    }, 50);
  }

  private cleanup(): void {
    if (this.cycleTimer) { clearInterval(this.cycleTimer); this.cycleTimer = null; }
    if (this.settleTimer) { clearTimeout(this.settleTimer); this.settleTimer = null; }
  }
}
