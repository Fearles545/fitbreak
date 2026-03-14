import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface DayActivity {
  date: string;
  breakCount: number;
  hasStrength: boolean;
  hasStepper: boolean;
}

@Component({
  selector: 'app-week-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  styles: `
    :host {
      display: block;
    }

    .week {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    .day {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 40px;
    }

    .day-label {
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase;
    }

    .day.today .day-label {
      color: var(--mat-sys-primary);
      font-weight: 700;
    }

    .day-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--mat-sys-surface-container);
      font-size: 0.65rem;
      gap: 1px;
    }

    .day.today .day-circle {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 2px;
    }

    .day.has-activity .day-circle {
      background: var(--mat-sys-primary-container);
    }

    .icons {
      display: flex;
      gap: 2px;
      align-items: center;
      font-size: 0.75rem;
      line-height: 1;
    }

    .break-count {
      font-size: 0.6rem;
      font-weight: 600;
      color: var(--mat-sys-on-primary-container);
    }

    .workout-icon {
      font-size: 0.7rem;
      line-height: 1;
    }

    .empty {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--mat-sys-outline-variant);
    }
  `,
  template: `
    <div class="week">
      @for (day of days(); track day.date) {
        <div class="day" [class.today]="day.isToday" [class.has-activity]="day.hasActivity">
          <span class="day-label">{{ day.label }}</span>
          <div class="day-circle">
            @if (day.hasActivity) {
              <div class="icons">
                @if (day.breakCount > 0) {
                  <span class="break-count">⏰{{ day.breakCount }}</span>
                }
                @if (day.hasStrength) {
                  <span class="workout-icon">🏋️</span>
                }
                @if (day.hasStepper) {
                  <span class="workout-icon">🪜</span>
                }
              </div>
            } @else {
              <div class="empty"></div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class WeekCalendarComponent {
  activities = input<DayActivity[]>([]);

  private readonly dayLabels = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  days = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activityMap = new Map(
      this.activities().map(a => [a.date, a]),
    );

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const activity = activityMap.get(dateStr);
      const isToday = i === 6;

      return {
        date: dateStr,
        label: this.dayLabels[date.getDay()],
        isToday,
        breakCount: activity?.breakCount ?? 0,
        hasStrength: activity?.hasStrength ?? false,
        hasStepper: activity?.hasStepper ?? false,
        hasActivity: (activity?.breakCount ?? 0) > 0 || activity?.hasStrength || activity?.hasStepper,
      };
    });
  });
}
