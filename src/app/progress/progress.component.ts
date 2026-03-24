import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProgressService } from './progress.service';

@Component({
  selector: 'app-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      min-height: 100dvh;
      background: var(--mat-sys-surface);
      padding: 24px 16px;
    }

    .container {
      max-width: 480px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
    }

    .header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin: 0;
      flex: 1;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 64px 0;
    }

    /* ── Streak ── */
    .streak-card {
      display: flex;
      gap: 16px;
      padding: 20px;
      border-radius: 16px;
      background: var(--mat-sys-primary-container);
      margin-bottom: 16px;
    }

    .streak-main {
      flex: 1;
      text-align: center;
    }

    .streak-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--mat-sys-on-primary-container);
      line-height: 1;
    }

    .streak-label {
      font-size: 0.8rem;
      color: var(--mat-sys-on-primary-container);
      opacity: 0.8;
      margin-top: 4px;
    }

    .streak-divider {
      width: 1px;
      background: var(--mat-sys-on-primary-container);
      opacity: 0.2;
    }

    .streak-best {
      flex: 1;
      text-align: center;
    }

    .streak-best-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--mat-sys-on-primary-container);
      opacity: 0.6;
      line-height: 1;
    }

    .streak-message {
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
      margin-bottom: 24px;
    }

    /* ── Weekly comparison ── */
    .section-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }

    .comparison-card {
      padding: 16px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container);
      margin-bottom: 16px;
    }

    .comparison-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
    }

    .comparison-row + .comparison-row {
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .comparison-label {
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface);
      flex: 1;
    }

    .comparison-values {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .comparison-this-week {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      min-width: 36px;
      text-align: right;
    }

    .comparison-trend {
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 8px;
      min-width: 40px;
      text-align: center;
    }

    .trend-up {
      background: color-mix(in srgb, var(--mat-sys-primary) 15%, transparent);
      color: var(--mat-sys-primary);
    }

    .trend-down {
      background: color-mix(in srgb, var(--mat-sys-error) 15%, transparent);
      color: var(--mat-sys-error);
    }

    .trend-neutral {
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface-variant);
    }

    /* ── Empty state ── */
    .empty-state {
      text-align: center;
      padding: 48px 24px;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 12px;
    }

    .empty-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin-bottom: 4px;
    }

    .empty-text {
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  template: `
    <div class="container">
      <div class="header">
        <button mat-icon-button (click)="router.navigate(['/dashboard'])" aria-label="Назад">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Прогрес</h1>
      </div>

      @if (progress.loading()) {
        <div class="loading">
          <mat-spinner diameter="40" />
        </div>
      } @else if (hasAnyData()) {
        <!-- Streak -->
        <div class="streak-card">
          <div class="streak-main">
            <div class="streak-number">{{ progress.currentStreak() }}</div>
            <div class="streak-label">днів поспіль</div>
          </div>
          <div class="streak-divider"></div>
          <div class="streak-best">
            <div class="streak-best-number">{{ progress.longestStreak() }}</div>
            <div class="streak-label">найкращий</div>
          </div>
        </div>

        <div class="streak-message">{{ streakMessage() }}</div>

        <!-- Weekly comparison -->
        <div class="section-title">Цей тиждень</div>
        <div class="comparison-card">
          <div class="comparison-row">
            <span class="comparison-label">Фітбрейків</span>
            <div class="comparison-values">
              <span class="comparison-this-week">{{ thisWeekCompleted() }}</span>
              <span class="comparison-trend" [class]="breaksTrendClass()">{{ breaksTrend() }}</span>
            </div>
          </div>

          <div class="comparison-row">
            <span class="comparison-label">Виконання</span>
            <div class="comparison-values">
              <span class="comparison-this-week">{{ thisWeekRate() }}%</span>
              <span class="comparison-trend" [class]="rateTrendClass()">{{ rateTrend() }}</span>
            </div>
          </div>

          <div class="comparison-row">
            <span class="comparison-label">Тренувань</span>
            <div class="comparison-values">
              <span class="comparison-this-week">{{ thisWeekWorkoutCount() }}</span>
              <span class="comparison-trend" [class]="workoutTrendClass()">{{ workoutTrend() }}</span>
            </div>
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <div class="empty-title">Поки що немає даних</div>
          <div class="empty-text">Почни робочий день і роби перерви — прогрес з'явиться тут</div>
        </div>
      }
    </div>
  `,
})
export class ProgressComponent implements OnInit {
  protected progress = inject(ProgressService);
  protected router = inject(Router);

  protected hasAnyData = computed(() => {
    return this.progress.currentStreak() > 0
      || this.progress.thisWeekBreaks() !== null
      || this.progress.thisWeekWorkouts() !== null;
  });

  // ── Streak message ──
  protected streakMessage = computed(() => {
    const streak = this.progress.currentStreak();
    if (streak === 0) return 'Почни нову серію сьогодні!';
    if (streak >= 14) return 'Неймовірна стабільність!';
    if (streak >= 7) return 'Тижнева серія — чудово!';
    if (streak >= 3) return 'Гарна серія, не зупиняйся!';
    return 'Продовжуй у тому ж дусі!';
  });

  // ── This week values ──
  protected thisWeekCompleted = computed(() =>
    this.progress.thisWeekBreaks()?.completed_breaks ?? 0,
  );

  protected thisWeekRate = computed(() =>
    Math.round(this.progress.thisWeekBreaks()?.completion_rate ?? 0),
  );

  protected thisWeekWorkoutCount = computed(() => {
    const w = this.progress.thisWeekWorkouts();
    return (w?.strength_count ?? 0) + (w?.stepper_count ?? 0);
  });

  // ── Trend calculations ──
  protected breaksTrend = computed(() =>
    formatTrend(
      this.progress.thisWeekBreaks()?.completed_breaks ?? 0,
      this.progress.lastWeekBreaks()?.completed_breaks ?? 0,
    ),
  );

  protected breaksTrendClass = computed(() =>
    trendClass(
      this.progress.thisWeekBreaks()?.completed_breaks ?? 0,
      this.progress.lastWeekBreaks()?.completed_breaks ?? 0,
    ),
  );

  protected rateTrend = computed(() =>
    formatTrend(
      this.progress.thisWeekBreaks()?.completion_rate ?? 0,
      this.progress.lastWeekBreaks()?.completion_rate ?? 0,
      '%',
    ),
  );

  protected rateTrendClass = computed(() =>
    trendClass(
      this.progress.thisWeekBreaks()?.completion_rate ?? 0,
      this.progress.lastWeekBreaks()?.completion_rate ?? 0,
    ),
  );

  protected workoutTrend = computed(() => {
    const thisCount = (this.progress.thisWeekWorkouts()?.strength_count ?? 0)
      + (this.progress.thisWeekWorkouts()?.stepper_count ?? 0);
    const lastCount = (this.progress.lastWeekWorkouts()?.strength_count ?? 0)
      + (this.progress.lastWeekWorkouts()?.stepper_count ?? 0);
    return formatTrend(thisCount, lastCount);
  });

  protected workoutTrendClass = computed(() => {
    const thisCount = (this.progress.thisWeekWorkouts()?.strength_count ?? 0)
      + (this.progress.thisWeekWorkouts()?.stepper_count ?? 0);
    const lastCount = (this.progress.lastWeekWorkouts()?.strength_count ?? 0)
      + (this.progress.lastWeekWorkouts()?.stepper_count ?? 0);
    return trendClass(thisCount, lastCount);
  });

  async ngOnInit(): Promise<void> {
    await this.progress.load();
  }
}

function formatTrend(current: number, previous: number, suffix = ''): string {
  if (previous === 0 && current === 0) return '—';
  if (previous === 0) return `+${Math.round(current)}${suffix}`;
  const diff = Math.round(current - previous);
  if (diff > 0) return `+${diff}${suffix}`;
  if (diff < 0) return `${diff}${suffix}`;
  return '=';
}

function trendClass(current: number, previous: number): string {
  const diff = current - previous;
  if (diff > 0) return 'comparison-trend trend-up';
  if (diff < 0) return 'comparison-trend trend-down';
  return 'comparison-trend trend-neutral';
}
