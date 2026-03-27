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
import { ROTATION_INFO } from '@shared/models/rotation.constants';
import { toDateKey } from '@shared/utils/date.utils';
import { ProgressService, type Period } from './progress.service';

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

    .streak-main, .streak-best {
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

    /* ── Period chips ── */
    .period-chips {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
    }

    .period-chip {
      flex: 1;
      padding: 8px 12px;
      border-radius: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      font-size: 0.85rem;
      cursor: pointer;
      text-align: center;
    }

    .period-chip.active {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      border-color: var(--mat-sys-primary);
    }

    /* ── Section ── */
    .section-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }

    .stat-card {
      padding: 16px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container);
      margin-bottom: 16px;
    }

    /* ── Stat row ── */
    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 6px 0;
    }

    .stat-label {
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface);
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    /* ── Day grid ── */
    .day-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
      margin: 12px 0;
    }

    .day-cell {
      text-align: center;
      padding: 8px 0;
      border-radius: 10px;
      background: var(--mat-sys-surface-container-high);
    }

    .day-cell-label {
      font-size: 0.65rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 2px;
    }

    .day-cell-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .day-cell-value.empty {
      color: var(--mat-sys-on-surface-variant);
      opacity: 0.4;
    }

    .day-cell.today {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: -2px;
    }

    /* ── Week rows (for month view) ── */
    .week-rows {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 12px 0;
    }

    .week-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .week-label {
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
      min-width: 48px;
    }

    .week-value {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    /* ── Rotation balance ── */
    .rotation-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
    }

    .rotation-row + .rotation-row {
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .rotation-icon {
      font-size: 1.2rem;
      flex-shrink: 0;
      width: 24px;
      text-align: center;
    }

    .rotation-name {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface);
      min-width: 80px;
    }

    .rotation-bar-container {
      flex: 1;
      height: 8px;
      border-radius: 4px;
      background: var(--mat-sys-surface-container-high);
      overflow: hidden;
    }

    .rotation-bar {
      height: 100%;
      border-radius: 4px;
      background: var(--mat-sys-primary);
      transition: width 0.3s ease;
    }

    .rotation-count {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      min-width: 24px;
      text-align: right;
    }

    /* ── All-time footer ── */
    .all-time-footer {
      text-align: center;
      padding: 20px 0;
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .all-time-number {
      font-weight: 600;
      color: var(--mat-sys-on-surface);
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

    .section-empty {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
      padding: 16px 0;
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

        <!-- Period selector -->
        <div class="period-chips" role="radiogroup" aria-label="Період">
          @for (p of periods; track p.key) {
            <button
              class="period-chip"
              [class.active]="progress.period() === p.key"
              (click)="onPeriodChange(p.key)"
              role="radio"
              [attr.aria-checked]="progress.period() === p.key">
              {{ p.label }}
            </button>
          }
        </div>

        <!-- Breaks section -->
        <div class="section-title">Фітбрейки</div>
        @if (progress.totalBreaks() > 0) {
          <div class="stat-card">
            <div class="stat-row">
              <span class="stat-label">Виконано</span>
              <span class="stat-value">{{ progress.totalCompleted() }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Виконання</span>
              <span class="stat-value">{{ progress.completionRate() }}%</span>
            </div>

            <!-- Day grid (week) or week rows (month) -->
            @if (progress.period() === 'week') {
              <div class="day-grid" role="list" aria-label="Перерви по днях">
                @for (day of weekDays(); track day.label) {
                  <div class="day-cell" [class.today]="day.isToday" role="listitem"
                    [attr.aria-label]="day.label + ': ' + day.breaks + ' перерв'">
                    <div class="day-cell-label">{{ day.label }}</div>
                    <div class="day-cell-value" [class.empty]="day.breaks === 0">
                      {{ day.breaks || '—' }}
                    </div>
                  </div>
                }
              </div>
            } @else if (progress.period() === 'month') {
              <div class="week-rows">
                @for (w of monthWeeks(); track w.label) {
                  <div class="week-row">
                    <span class="week-label">{{ w.label }}</span>
                    <span class="week-value">{{ w.breaks }} перерв</span>
                  </div>
                }
              </div>
            }

            <!-- Rotation balance -->
            @if (rotationRows().length > 0) {
              @for (r of rotationRows(); track r.key) {
                <div class="rotation-row">
                  <span class="rotation-icon">{{ r.icon }}</span>
                  <span class="rotation-name">{{ r.name }}</span>
                  <div class="rotation-bar-container" aria-hidden="true">
                    <div class="rotation-bar" [style.width.%]="r.percent"></div>
                  </div>
                  <span class="rotation-count">{{ r.completed }}</span>
                </div>
              }
            }
          </div>
        } @else {
          <div class="section-empty">Немає даних за цей період</div>
        }

        <!-- Workouts section -->
        <div class="section-title">Тренування</div>
        @if (progress.totalWorkoutCount() > 0) {
          <div class="stat-card">
            <div class="stat-row">
              <span class="stat-label">Силових</span>
              <span class="stat-value">{{ progress.totalStrength() }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Степер</span>
              <span class="stat-value">{{ progress.totalStepper() }}</span>
            </div>

            @if (progress.period() === 'week') {
              <div class="day-grid" role="list" aria-label="Тренування по днях">
                @for (day of weekDaysWorkouts(); track day.label) {
                  <div class="day-cell" [class.today]="day.isToday" role="listitem"
                    [attr.aria-label]="day.label + ': ' + day.count + ' тренувань'">
                    <div class="day-cell-label">{{ day.label }}</div>
                    <div class="day-cell-value" [class.empty]="day.count === 0">
                      {{ day.count || '—' }}
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="section-empty">Немає даних за цей період</div>
        }

        <!-- All-time footer -->
        @if (progress.allTimeTotals(); as totals) {
          <div class="all-time-footer">
            <span class="all-time-number">{{ totals.total_breaks_completed }}</span> фітбрейків ·
            <span class="all-time-number">{{ totals.total_workouts }}</span> тренувань
            @if (totals.first_active_date) {
              · з {{ formatMonth(totals.first_active_date) }}
            }
          </div>
        }
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

  readonly periods = [
    { key: 'week' as Period, label: 'Тиждень' },
    { key: 'month' as Period, label: 'Місяць' },
    { key: 'all' as Period, label: 'Весь час' },
  ];

  private readonly dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  protected hasAnyData = computed(() => {
    return this.progress.currentStreak() > 0
      || this.progress.longestStreak() > 0
      || this.progress.totalBreaks() > 0
      || this.progress.totalWorkoutCount() > 0
      || (this.progress.allTimeTotals()?.total_breaks_completed ?? 0) > 0;
  });

  protected streakMessage = computed(() => {
    const streak = this.progress.currentStreak();
    if (streak === 0) return 'Почни нову серію сьогодні!';
    if (streak >= 14) return 'Неймовірна стабільність!';
    if (streak >= 7) return 'Тижнева серія — чудово!';
    if (streak >= 3) return 'Гарна серія, не зупиняйся!';
    return 'Продовжуй у тому ж дусі!';
  });

  protected weekDays = computed(() => {
    const stats = this.progress.dailyStats();
    const today = new Date();
    const todayKey = toDateKey(today);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

    return this.dayLabels.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = toDateKey(d);
      const stat = stats.find(s => s.date === key);
      return {
        label,
        breaks: stat?.completed_breaks ?? 0,
        isToday: key === todayKey,
      };
    });
  });

  protected weekDaysWorkouts = computed(() => {
    const stats = this.progress.dailyStats();
    const today = new Date();
    const todayKey = toDateKey(today);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

    return this.dayLabels.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = toDateKey(d);
      const stat = stats.find(s => s.date === key);
      return {
        label,
        count: (stat?.strength_count ?? 0) + (stat?.stepper_count ?? 0),
        isToday: key === todayKey,
      };
    });
  });

  protected monthWeeks = computed(() => {
    const stats = this.progress.dailyStats();
    const weeks = new Map<number, number>();

    for (const stat of stats) {
      const d = new Date(stat.date);
      const weekNum = Math.ceil(d.getDate() / 7);
      weeks.set(weekNum, (weeks.get(weekNum) ?? 0) + stat.completed_breaks);
    }

    return Array.from(weeks.entries())
      .sort(([a], [b]) => a - b)
      .map(([num, breaks]) => ({
        label: `Тиж ${num}`,
        breaks,
      }));
  });

  protected rotationRows = computed(() => {
    const stats = this.progress.rotationStats();
    if (stats.length === 0) return [];

    const maxCompleted = Math.max(...stats.map(s => s.completed), 1);

    return stats.map(s => {
      const info = ROTATION_INFO[s.rotation_type as keyof typeof ROTATION_INFO];
      return {
        key: s.rotation_type,
        icon: info?.icon ?? '⏰',
        name: info?.name ?? s.rotation_type,
        completed: s.completed,
        percent: (s.completed / maxCompleted) * 100,
      };
    });
  });

  async ngOnInit(): Promise<void> {
    await this.progress.load();
  }

  async onPeriodChange(period: Period): Promise<void> {
    await this.progress.setPeriod(period);
  }

  protected formatMonth(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
  }
}
