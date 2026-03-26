import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { getLast7Days, isToday as checkIsToday, toDateKey } from '@shared/utils/date.utils';

import type { DayActivity } from '@shared/models/fitbreak.models';

@Component({
  selector: 'app-week-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  styles: `
    :host {
      display: block;
    }

    .week {
      display: flex;
      gap: 4px;
      justify-content: center;
    }

    .day {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .day-label {
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .day.today .day-label {
      color: var(--mat-sys-primary);
      font-weight: 700;
    }

    .day-cell {
      width: 100%;
      aspect-ratio: 1;
      max-width: 48px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      background: var(--mat-sys-surface-container);
      transition: background 0.2s, outline-color 0.2s;
    }

    .day.today .day-cell {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 1px;
    }

    .day.has-activity .day-cell {
      background: var(--mat-sys-primary-container);
    }

    .day-number {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      line-height: 1;
    }

    .day.has-activity .day-number {
      color: var(--mat-sys-on-primary-container);
    }

    .activity-icons {
      display: flex;
      align-items: center;
      gap: 1px;
      height: 16px;
    }

    .activity-icons mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--mat-sys-on-primary-container);
    }

    .break-badge {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--mat-sys-on-primary-container);
      line-height: 1;
    }

    .empty-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--mat-sys-outline-variant);
    }
  `,
  template: `
    <div class="week">
      @for (day of days(); track day.date) {
        <div class="day" [class.today]="day.isToday" [class.has-activity]="day.hasActivity">
          <span class="day-label">{{ day.label }}</span>
          <div class="day-cell">
            <span class="day-number">{{ day.dayNumber }}</span>
            @if (day.hasActivity) {
              <div class="activity-icons">
                @if (day.breakCount > 0) {
                  <span class="break-badge">{{ day.breakCount }}</span>
                  <mat-icon>timer</mat-icon>
                }
                @if (day.hasStrength) {
                  <mat-icon>fitness_center</mat-icon>
                }
                @if (day.hasStepper) {
                  <mat-icon>directions_walk</mat-icon>
                }
              </div>
            } @else {
              <div class="empty-dot"></div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class WeekCalendarComponent {
  activities = input<DayActivity[]>([]);

  days = computed(() => {
    const activityMap = new Map(
      this.activities().map(a => [a.date, a]),
    );

    return getLast7Days().map(date => {
      const dateStr = toDateKey(date);
      const activity = activityMap.get(dateStr);

      return {
        date: dateStr,
        label: format(date, 'EEEEEE', { locale: uk }),
        dayNumber: format(date, 'd'),
        isToday: checkIsToday(date),
        breakCount: activity?.breakCount ?? 0,
        hasStrength: activity?.hasStrength ?? false,
        hasStepper: activity?.hasStepper ?? false,
        hasActivity: (activity?.breakCount ?? 0) > 0 || activity?.hasStrength || activity?.hasStepper,
      };
    });
  });
}
