import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AnimatedTimerComponent } from '@shared/components/animated-timer/animated-timer.component';
import type { AnimationMode } from '@shared/components/animated-timer/digit-state';

@Component({
  selector: 'app-strength-rest',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressBarModule, AnimatedTimerComponent],
  styles: `
    :host {
      display: block;
      text-align: center;
      padding-top: 32px;
    }

    .rest-label {
      font-size: 1rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 16px;
    }

    .rest-timer {
      color: var(--mat-sys-on-surface);
      --timer-font-size: 4rem;
    }

    .rest-progress {
      margin: 24px auto;
      max-width: 300px;
    }

    .rest-next {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 16px 0 24px;
    }

    .rest-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }
  `,
  template: `
    <div class="rest-label">Відпочинок</div>
    <app-animated-timer class="rest-timer"
      [remainingSeconds]="remainingSec()"
      [mode]="animationMode()"
      size="big" />

    <div class="rest-progress">
      <mat-progress-bar mode="determinate" [value]="progressPercent()" />
    </div>

    <div class="rest-next">
      @if (nextPreview()) {
        Далі: {{ nextPreview() }}
      }
    </div>

    <div class="rest-actions">
      <button matButton="outlined" (click)="extend.emit(30)">+30 сек</button>
      <button mat-flat-button (click)="skip.emit()">Пропустити відпочинок</button>
    </div>
  `,
})
export class StrengthRestComponent {
  remainingSec = input.required<number>();
  progressPercent = input.required<number>();
  nextPreview = input.required<string | null>();
  animationMode = input.required<AnimationMode>();

  skip = output();
  extend = output<number>();
}
