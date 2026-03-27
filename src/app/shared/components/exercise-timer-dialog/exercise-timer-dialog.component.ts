import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AudioService } from '@shared/services/audio.service';

export interface ExerciseTimerDialogData {
  seconds: number;
  exerciseName: string;
}

type TimerPhase = 'lead-in' | 'counting' | 'done';

@Component({
  selector: 'app-exercise-timer-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  styles: `
    .timer-dialog {
      text-align: center;
      padding: 16px 8px;
      min-width: 240px;
    }

    .exercise-name {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 20px;
    }

    .lead-in-number {
      font-size: 5rem;
      font-weight: 700;
      color: var(--mat-sys-primary);
      line-height: 1;
    }

    .lead-in-go {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--mat-sys-primary);
    }

    .countdown-number {
      font-size: 4rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
      line-height: 1;
      font-family: 'Exo 2', monospace;
    }

    .countdown-label {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
    }

    .display {
      height: 120px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .done-icon {
      font-size: 3rem;
      width: 48px;
      height: 48px;
      color: var(--mat-sys-primary);
    }

    .done-text {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin-top: 8px;
    }

    .actions {
      margin-top: 20px;
    }
  `,
  template: `
    <div class="timer-dialog">
      <div class="exercise-name">{{ data.exerciseName }}</div>

      <div class="display">
        @switch (phase()) {
          @case ('lead-in') {
            @if (leadInCount() > 0) {
              <span class="lead-in-number">{{ leadInCount() }}</span>
            } @else {
              <span class="lead-in-go">Вперед!</span>
            }
          }
          @case ('counting') {
            <span class="countdown-number">{{ remainingSeconds() }}</span>
            <span class="countdown-label">сек</span>
          }
          @case ('done') {
            <mat-icon class="done-icon">check_circle</mat-icon>
            <span class="done-text">Готово!</span>
          }
        }
      </div>

      <div class="actions">
        @if (phase() === 'done') {
          <button mat-flat-button (click)="dialogRef.close()">OK</button>
        } @else {
          <button mat-stroked-button (click)="dialogRef.close()">Закрити</button>
        }
      </div>
    </div>
  `,
})
export class ExerciseTimerDialogComponent implements OnInit {
  data = inject<ExerciseTimerDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ExerciseTimerDialogComponent>);
  private audio = inject(AudioService);
  private destroyRef = inject(DestroyRef);

  phase = signal<TimerPhase>('lead-in');
  leadInCount = signal(3);
  remainingSeconds = signal(0);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearInterval());
  }

  ngOnInit(): void {
    this.startLeadIn();
  }

  private startLeadIn(): void {
    this.leadInCount.set(3);
    this.phase.set('lead-in');
    this.audio.playCountdownTick();

    this.intervalId = setInterval(() => {
      const count = this.leadInCount() - 1;
      this.leadInCount.set(count);

      if (count > 0) {
        this.audio.playCountdownTick();
      } else if (count === 0) {
        this.audio.playCountdownGo();
      } else {
        this.clearInterval();
        this.startCountdown();
      }
    }, 1000);
  }

  private startCountdown(): void {
    this.remainingSeconds.set(this.data.seconds);
    this.phase.set('counting');

    this.intervalId = setInterval(() => {
      const remaining = this.remainingSeconds() - 1;
      this.remainingSeconds.set(remaining);

      if (remaining <= 0) {
        this.clearInterval();
        this.phase.set('done');
        this.audio.playRestTimerEnd();
      }
    }, 1000);
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
