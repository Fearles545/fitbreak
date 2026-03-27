import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  ExerciseTimerDialogComponent,
  type ExerciseTimerDialogData,
} from '@shared/components/exercise-timer-dialog/exercise-timer-dialog.component';
import type { Exercise } from '@shared/models/fitbreak.models';

@Component({
  selector: 'app-break-execution',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  styles: `
    .exec-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .exec-progress-text {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .exercise-name {
      font-size: 1.4rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin: 16px 0 4px;
    }

    .exercise-desc {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 16px;
    }

    .exercise-params {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }

    .param {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .param mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .technique {
      margin-bottom: 20px;
    }

    .technique-title {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 8px;
    }

    .technique-step {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
      line-height: 1.4;
    }

    .step-number {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .step-text {
      color: var(--mat-sys-on-surface);
      font-size: 0.9rem;
    }

    .key-point {
      color: var(--mat-sys-primary);
      font-weight: 500;
      font-size: 0.8rem;
      margin-top: 2px;
    }

    .warnings {
      padding: 12px 16px;
      border-radius: 12px;
      background: var(--mat-sys-error-container);
      margin-bottom: 16px;
    }

    .warnings-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--mat-sys-on-error-container);
      margin-bottom: 4px;
    }

    .warnings li {
      font-size: 0.8rem;
      color: var(--mat-sys-on-error-container);
      margin-left: 16px;
    }

    .bilateral-indicator {
      text-align: center;
      padding: 8px 16px;
      border-radius: 8px;
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .exec-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 24px;
    }
  `,
  template: `
    @if (exercise(); as exercise) {
      <div class="exec-header">
        <button mat-icon-button (click)="back.emit()" aria-label="Назад">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span class="exec-progress-text">
          Вправа {{ currentIndex() + 1 }} з {{ totalCount() }}
        </span>
      </div>

      <mat-progress-bar mode="determinate" [value]="progressPercent()" />

      <h2 class="exercise-name">{{ exercise.name }}</h2>
      <p class="exercise-desc">{{ exercise.short_description }}</p>

      <div class="exercise-params">
        @if (exercise.exercise_type === 'reps' && exercise.default_reps) {
          <div class="param">
            <mat-icon>repeat</mat-icon>
            {{ exercise.default_reps }} повторень
          </div>
        }
        @if (exercise.default_duration_sec) {
          <div class="param">
            <mat-icon>timer</mat-icon>
            {{ exercise.default_duration_sec }} сек
          </div>
        }
        @if (exercise.is_bilateral) {
          <div class="param">
            <mat-icon>swap_horiz</mat-icon>
            на кожну сторону
          </div>
        }
      </div>

      @if (exercise.is_bilateral) {
        <div class="bilateral-indicator">↔ Виконай на обидві сторони</div>
      }

      <div class="technique">
        <div class="technique-title">Техніка</div>
        @for (step of exercise.technique; track step.order) {
          <div class="technique-step">
            <span class="step-number">{{ step.order }}</span>
            <div>
              <div class="step-text">{{ step.text }}</div>
              @if (step.keyPoint) {
                <div class="key-point">☝ {{ step.keyPoint }}</div>
              }
            </div>
          </div>
        }
      </div>

      @if (exercise.warnings && exercise.warnings.length > 0) {
        <div class="warnings">
          <div class="warnings-title">⚠️ Увага</div>
          <ul>
            @for (w of exercise.warnings; track w) {
              <li>{{ w }}</li>
            }
          </ul>
        </div>
      }

      <div class="exec-actions">
        <button mat-flat-button (click)="next.emit()">
          {{ isLast() ? 'Завершити розминку' : 'Готово — наступна' }}
        </button>
        @if (hasTimer()) {
          <button mat-stroked-button (click)="openTimer()">
            <mat-icon>timer</mat-icon>
            Таймер · {{ timerSec() }} сек
          </button>
        }
      </div>
    }
  `,
})
export class BreakExecutionComponent {
  private dialog = inject(MatDialog);

  exercise = input.required<Exercise | null>();
  currentIndex = input.required<number>();
  totalCount = input.required<number>();
  progressPercent = input.required<number>();
  isLast = input.required<boolean>();

  next = output();
  back = output();

  hasTimer = computed(() => {
    const ex = this.exercise();
    return !!ex?.timer_sec && ex.timer_sec > 0;
  });

  timerSec = computed(() => this.exercise()?.timer_sec ?? 0);

  openTimer(): void {
    const ex = this.exercise();
    if (!ex?.timer_sec) return;

    this.dialog.open(ExerciseTimerDialogComponent, {
      data: {
        seconds: ex.timer_sec,
        exerciseName: ex.name,
      } satisfies ExerciseTimerDialogData,
      disableClose: true,
      autoFocus: false,
    });
  }
}
