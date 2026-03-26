import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AnimatedTimerComponent } from '@shared/components/animated-timer/animated-timer.component';
import { MoodPickerComponent } from '@shared/components/mood-picker/mood-picker.component';
import { StepperService } from './stepper.service';
import { WorkdayService } from '@shared/services/workday.service';
import { SettingsService } from '../settings/settings.service';
import type { MoodRating } from '@shared/models/fitbreak.models';


type StepperView = 'setup' | 'running' | 'summary';

@Component({
  selector: 'app-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, AnimatedTimerComponent, MoodPickerComponent],
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      min-height: 100dvh;
    }

    /* ── Setup ── */
    .setup {
      padding: 24px 16px;
      background: var(--mat-sys-surface);
      min-height: 100vh;
    }

    .setup-container {
      max-width: 480px;
      margin: 0 auto;
    }

    .setup h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin-bottom: 24px;
    }

    .config-group {
      margin-bottom: 24px;
    }

    .config-label {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 8px;
    }

    .config-options {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .config-chip {
      padding: 8px 20px;
      border-radius: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      cursor: pointer;
      font-size: 0.9rem;
    }

    .config-chip.selected {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      border-color: var(--mat-sys-primary);
    }

    .setup-actions {
      margin-top: 32px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* ── Running (dark fullscreen) ── */
    .running {
      background: #0a0a0a;
      color-scheme: dark;
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      user-select: none;
      transition: opacity 0.5s ease;
    }

    .running.dimmed {
      opacity: 0.5;
    }

    .stepper-timer {
      --timer-font-size: 5rem;
      color: #fff;
    }

    .stepper-timer-label {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.5);
      margin-top: 8px;
    }

    .elapsed {
      font-family: 'Exo 2', monospace;
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 24px;
    }

    .interval-info {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.3);
      margin-top: 4px;
    }

    .progress-bar-wrapper {
      width: 100%;
      max-width: 400px;
      margin-top: 32px;
    }

    .progress-bar-wrapper mat-progress-bar {
      --mdc-linear-progress-active-indicator-color: var(--mat-sys-primary);
      --mdc-linear-progress-track-color: rgba(255, 255, 255, 0.1);
    }

    .running-controls {
      display: flex;
      gap: 24px;
      margin-top: 48px;
    }

    .control-btn {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      background: transparent;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .control-btn:hover {
      border-color: rgba(255, 255, 255, 0.6);
    }

    .control-btn mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .control-btn.stop-btn {
      border-color: color-mix(in srgb, var(--mat-sys-error) 50%, transparent);
    }

    .control-btn.stop-btn:hover {
      border-color: color-mix(in srgb, var(--mat-sys-error) 80%, transparent);
    }

    .pause-indicator {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 16px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 0.6;
      }
      50% {
        opacity: 1;
      }
    }

    /* ── Summary ── */
    .summary {
      padding: 24px 16px;
      background: var(--mat-sys-surface);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .summary-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin-bottom: 24px;
    }

    .summary-stats {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 32px;
      min-width: 200px;
    }

    .stat {
      display: flex;
      justify-content: space-between;
      font-size: 0.95rem;
    }

    .stat-label {
      color: var(--mat-sys-on-surface-variant);
    }

    .stat-value {
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

  `,
  template: `
    @switch (view()) {
      @case ('setup') {
        <div class="setup">
          <div class="setup-container">
            <h1>🪜 Степер</h1>

            <div class="config-group">
              <div class="config-label">Тривалість</div>
              <div class="config-options">
                @for (d of durationOptions; track d) {
                  <button
                    class="config-chip"
                    [class.selected]="selectedDuration() === d"
                    (click)="selectedDuration.set(d)"
                  >
                    {{ d }} хв
                  </button>
                }
              </div>
            </div>

            <div class="config-group">
              <div class="config-label">Сигнал кожні</div>
              <div class="config-options">
                @for (i of intervalOptions; track i) {
                  <button
                    class="config-chip"
                    [class.selected]="selectedInterval() === i"
                    (click)="selectedInterval.set(i)"
                  >
                    {{ i }} хв
                  </button>
                }
              </div>
            </div>

            <div class="setup-actions">
              <button mat-flat-button (click)="onStart()">Почати</button>
              <button matButton="outlined" (click)="onBack()">Назад</button>
            </div>
          </div>
        </div>
      }

      @case ('running') {
        <div class="running" [class.dimmed]="isDimmed()" (click)="onTap()" (touchstart)="onTap()">
          <app-animated-timer
            class="stepper-timer"
            [remainingSeconds]="stepper.remainingSec()"
            [mode]="settings.timerAnimationStyle()"
            size="big">
            <span class="stepper-timer-label">залишилось</span>
          </app-animated-timer>

          <div class="elapsed">{{ stepper.elapsedFormatted() }} пройшло</div>
          <div class="interval-info">сигнал кожні {{ stepper.intervalMin() }} хв</div>

          <div class="progress-bar-wrapper">
            <mat-progress-bar mode="determinate" [value]="stepper.progress()" />
          </div>

          @if (stepper.state() === 'paused') {
            <div class="pause-indicator">⏸ Пауза</div>
          }

          <div class="running-controls">
            @if (stepper.state() === 'running') {
              <button
                class="control-btn"
                (click)="onPause(); $event.stopPropagation()"
                aria-label="Пауза"
              >
                <mat-icon>pause</mat-icon>
              </button>
            } @else {
              <button
                class="control-btn"
                (click)="onResume(); $event.stopPropagation()"
                aria-label="Продовжити"
              >
                <mat-icon>play_arrow</mat-icon>
              </button>
            }
            <button
              class="control-btn stop-btn"
              (click)="onStop(); $event.stopPropagation()"
              aria-label="Зупинити"
            >
              <mat-icon>stop</mat-icon>
            </button>
          </div>
        </div>
      }

      @case ('summary') {
        <div class="summary">
          <div class="summary-title">Тренування завершено! 🎉</div>

          <div class="summary-stats">
            <div class="stat">
              <span class="stat-label">Тривалість</span>
              <span class="stat-value">{{ stepper.result()?.actualDurationMin }} хв</span>
            </div>
            <div class="stat">
              <span class="stat-label">Ціль</span>
              <span class="stat-value">{{ stepper.result()?.targetDurationMin }} хв</span>
            </div>
            <div class="stat">
              <span class="stat-label">Паузи</span>
              <span class="stat-value">{{ stepper.result()?.pauseCount }}</span>
            </div>
          </div>

          <app-mood-picker [(selected)]="selectedMood" />

          <button mat-flat-button (click)="onFinish()">Зберегти і вийти</button>
        </div>
      }
    }
  `,
})
export class StepperComponent implements OnInit {
  protected stepper = inject(StepperService);
  private workday = inject(WorkdayService);
  protected settings = inject(SettingsService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  view = signal<StepperView>('setup');
  selectedMood = signal<MoodRating | null>(null);
  isDimmed = signal(false);

  // Auto-transition to summary when stepper finishes (timer reaches 0)
  private _autoFinish = effect(() => {
    if (this.stepper.state() === 'finished' && this.view() === 'running') {
      this.clearDimTimer();
      this.isDimmed.set(false);
      this.view.set('summary');
    }
  });

  selectedDuration = signal(this.settings.stepperDurationMin());
  selectedInterval = signal(this.settings.stepperIntervalMin());

  readonly durationOptions = this.buildOptions([20, 30, 45, 60, 90], this.settings.stepperDurationMin());
  readonly intervalOptions = this.buildOptions([3, 5, 10, 15], this.settings.stepperIntervalMin());

  private buildOptions(defaults: number[], current: number): number[] {
    if (defaults.includes(current)) return defaults;
    return [...defaults, current].sort((a, b) => a - b);
  }

  private dimTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      this.clearDimTimer();
      if (this.stepper.state() === 'running' || this.stepper.state() === 'paused') {
        this.stepper.stop();
      }
      this.workday.endActivity();
    });
  }

  async onStart(): Promise<void> {
    this.workday.startActivity('stepper');
    await this.stepper.start(this.selectedDuration(), this.selectedInterval());
    this.settings.update({
      default_stepper_duration_min: this.selectedDuration(),
      default_stepper_interval_min: this.selectedInterval(),
    });
    this.view.set('running');
    this.resetDimTimer();
  }

  onPause(): void {
    this.stepper.pause();
    this.resetDimTimer();
  }

  onResume(): void {
    this.stepper.resume();
    this.resetDimTimer();
  }

  async onStop(): Promise<void> {
    await this.stepper.stop();
    // view transitions to 'summary' via autoFinish effect
  }

  onTap(): void {
    if (this.view() === 'running') {
      this.isDimmed.set(false);
      this.resetDimTimer();
    }
  }

  async onFinish(): Promise<void> {
    await this.stepper.saveWorkoutLog(this.selectedMood() ?? undefined);
    this.stepper.reset();
    await this.workday.endActivity();
    this.router.navigate(['/dashboard']);
  }

  onBack(): void {
    this.router.navigate(['/dashboard']);
  }

  private resetDimTimer(): void {
    this.clearDimTimer();
    this.dimTimer = setTimeout(() => {
      if (this.stepper.state() === 'running') {
        this.isDimmed.set(true);
      }
    }, 30_000);
  }

  private clearDimTimer(): void {
    if (this.dimTimer) {
      clearTimeout(this.dimTimer);
      this.dimTimer = null;
    }
  }
}
