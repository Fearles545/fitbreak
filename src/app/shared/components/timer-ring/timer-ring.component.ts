import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-timer-ring',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }

    .timer-ring-wrapper {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .track {
      fill: none;
      stroke: var(--mat-sys-surface-variant);
    }

    .progress {
      fill: none;
      stroke: var(--mat-sys-primary);
      stroke-linecap: round;
      transition: stroke-dashoffset 0.5s ease;
    }

    .content {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .time {
      font-family: 'Exo 2', monospace;
      font-size: 2.5rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      line-height: 1;
    }

    .label {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
    }
  `,
  template: `
    <div class="timer-ring-wrapper">
      <svg viewBox="0 0 200 200">
        <circle class="track" cx="100" cy="100" [attr.r]="radius"
                [attr.stroke-width]="strokeWidth()" />
        <circle class="progress" cx="100" cy="100" [attr.r]="radius"
                [attr.stroke-width]="strokeWidth()"
                [attr.stroke-dasharray]="circumference"
                [attr.stroke-dashoffset]="dashOffset()" />
      </svg>
      <div class="content">
        <span class="time">{{ formattedTime() }}</span>
        @if (label()) {
          <span class="label">{{ label() }}</span>
        }
      </div>
    </div>
  `,
})
export class TimerRingComponent {
  remainingSeconds = input.required<number>();
  totalSeconds = input.required<number>();
  label = input<string>('');
  strokeWidth = input<number>(8);

  readonly radius = 90;
  readonly circumference = 2 * Math.PI * this.radius;

  dashOffset = computed(() => {
    const total = this.totalSeconds();
    if (total <= 0) return this.circumference;
    const progress = Math.max(0, Math.min(1, this.remainingSeconds() / total));
    return this.circumference * (1 - progress);
  });

  formattedTime = computed(() => {
    const total = Math.max(0, this.remainingSeconds());
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  });
}
