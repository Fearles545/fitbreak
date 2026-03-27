import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AnimatedTimerComponent } from '@shared/components/animated-timer/animated-timer.component';
import { TimerRingComponent } from '@shared/components/timer-ring/timer-ring.component';
import { AudioService } from '@shared/services/audio.service';
import type { AnimationMode } from '@shared/components/animated-timer/digit-state';
import type { Exercise } from '@shared/models/fitbreak.models';

type TimerState = 'ready' | 'lead-in' | 'counting' | 'switch-side' | 'done';

@Component({
  selector: 'app-break-execution',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    AnimatedTimerComponent,
    TimerRingComponent,
  ],
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

    /* ── Lead-in ── */
    .lead-in {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
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

    /* ── Countdown ── */
    .countdown-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin: 12px 0;
    }

    .countdown-section app-timer-ring {
      width: 180px;
      height: 180px;
    }

    .side-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--mat-sys-on-surface-variant);
    }

    .skip-link {
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
      background: none;
      border: none;
      cursor: pointer;
      text-decoration: underline;
      padding: 8px;
    }

    /* ── Switch side ── */
    .switch-side {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 200px;
    }

    .switch-side-text {
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .switch-side-icon {
      font-size: 2.5rem;
      color: var(--mat-sys-tertiary);
    }
  `,
  template: `
    @if (exercise(); as exercise) {
      <div class="exec-header">
        <button mat-icon-button (click)="onBack()" aria-label="Назад">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span class="exec-progress-text">
          Вправа {{ currentIndex() + 1 }} з {{ totalCount() }}
        </span>
      </div>

      <mat-progress-bar mode="determinate" [value]="progressPercent()" />

      <h2 class="exercise-name">{{ exercise.name }}</h2>
      <p class="exercise-desc">{{ exercise.short_description }}</p>

      @switch (timerState()) {
        @case ('lead-in') {
          <div class="lead-in" aria-live="assertive">
            @if (leadInCount() > 0) {
              <span class="lead-in-number">{{ leadInCount() }}</span>
            } @else {
              <span class="lead-in-go">Вперед!</span>
            }
          </div>
        }

        @case ('counting') {
          <div class="countdown-section">
            @if (isBilateral()) {
              <span class="side-label">{{ sideLabel() }}</span>
            }
            <app-timer-ring
              [remainingSeconds]="remainingSeconds()"
              [totalSeconds]="durationSec()">
              <app-animated-timer
                [remainingSeconds]="remainingSeconds()"
                [mode]="animationMode()"
                size="big" />
            </app-timer-ring>
            <button class="skip-link" (click)="skipTimer()">Пропустити</button>
          </div>
        }

        @case ('switch-side') {
          <div class="switch-side">
            <span class="switch-side-icon">↔</span>
            <span class="switch-side-text">Тепер інша сторона</span>
          </div>
        }

        @default {
          <!-- ready or done: show full exercise info -->
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

          @if (exercise.is_bilateral && timerState() === 'ready') {
            <div class="bilateral-indicator">↔ Виконай на обидві сторони</div>
          }

          @if (timerState() === 'ready') {
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
          }

          <div class="exec-actions">
            @if (isTimed() && timerState() === 'ready') {
              <button mat-flat-button (click)="startCountdown()">
                <mat-icon>play_arrow</mat-icon>
                Почати
              </button>
            } @else {
              <button mat-flat-button (click)="next.emit()">
                {{ isLast() ? 'Завершити розминку' : 'Готово — наступна' }}
              </button>
            }
          </div>
        }
      }
    }
  `,
})
export class BreakExecutionComponent {
  private audio = inject(AudioService);
  private destroyRef = inject(DestroyRef);

  exercise = input.required<Exercise | null>();
  currentIndex = input.required<number>();
  totalCount = input.required<number>();
  progressPercent = input.required<number>();
  isLast = input.required<boolean>();
  animationMode = input<AnimationMode>('roll');

  next = output();
  back = output();

  timerState = signal<TimerState>('ready');
  leadInCount = signal(3);
  remainingSeconds = signal(0);
  currentSide = signal<1 | 2>(1);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private switchTimeoutId: ReturnType<typeof setTimeout> | null = null;

  isTimed = computed(() => {
    const ex = this.exercise();
    if (!ex) return false;
    return ex.exercise_type !== 'reps' && !!ex.default_duration_sec && ex.default_duration_sec > 0;
  });

  durationSec = computed(() => this.exercise()?.default_duration_sec ?? 0);
  isBilateral = computed(() => this.exercise()?.is_bilateral ?? false);

  sideLabel = computed(() =>
    this.currentSide() === 1 ? 'Ліва сторона' : 'Права сторона',
  );

  constructor() {
    effect(() => {
      this.exercise(); // track changes
      this.resetTimer();
    });

    this.destroyRef.onDestroy(() => this.cleanup());
  }

  startCountdown(): void {
    this.leadInCount.set(3);
    this.timerState.set('lead-in');
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
        this.startMainCountdown();
      }
    }, 1000);
  }

  skipTimer(): void {
    this.clearInterval();
    this.onCountdownComplete();
  }

  protected onBack(): void {
    this.cleanup();
    this.back.emit();
  }

  private startMainCountdown(): void {
    this.remainingSeconds.set(this.durationSec());
    this.timerState.set('counting');

    this.intervalId = setInterval(() => {
      const remaining = this.remainingSeconds() - 1;
      this.remainingSeconds.set(remaining);

      if (remaining <= 0) {
        this.clearInterval();
        this.onCountdownComplete();
      }
    }, 1000);
  }

  private onCountdownComplete(): void {
    this.audio.playRestTimerEnd();

    if (this.isBilateral() && this.currentSide() === 1) {
      this.timerState.set('switch-side');
      this.switchTimeoutId = setTimeout(() => {
        this.currentSide.set(2);
        this.startCountdown();
      }, 2000);
    } else {
      this.timerState.set('done');
    }
  }

  private resetTimer(): void {
    this.cleanup();
    this.timerState.set('ready');
    this.currentSide.set(1);
    this.remainingSeconds.set(0);
    this.leadInCount.set(3);
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private cleanup(): void {
    this.clearInterval();
    if (this.switchTimeoutId) {
      clearTimeout(this.switchTimeoutId);
      this.switchTimeoutId = null;
    }
  }
}
