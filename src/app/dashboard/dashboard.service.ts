import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/services/supabase.service';
import { toDateKey, getLast7Days } from '@shared/utils/date.utils';
import { AuthService } from '../auth/auth.service';
import type { DayActivity } from '@shared/models/fitbreak.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  private _weekActivities = signal<DayActivity[]>([]);

  readonly weekActivities = this._weekActivities.asReadonly();

  async loadWeekActivities(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    const days = getLast7Days();
    const startDate = toDateKey(days[0]);
    const endDate = toDateKey(days[days.length - 1]);

    const [sessionsResult, workoutsResult] = await Promise.all([
      this.supabase.supabase
        .from('work_sessions')
        .select('date, breaks')
        .gte('date', startDate)
        .lte('date', endDate),
      this.supabase.supabase
        .from('workout_logs')
        .select('date, workout_type')
        .gte('date', startDate)
        .lte('date', endDate),
    ]);

    if (sessionsResult.error) throw sessionsResult.error;
    if (workoutsResult.error) throw workoutsResult.error;

    const activityMap = new Map<string, DayActivity>();

    for (const session of sessionsResult.data ?? []) {
      const breaks = (session.breaks as any[]) ?? [];
      const completed = breaks.filter((b: any) => !b.skipped && b.completedAt).length;
      const existing = activityMap.get(session.date) ?? {
        date: session.date,
        breakCount: 0,
        hasStrength: false,
        hasStepper: false,
      };
      existing.breakCount += completed;
      activityMap.set(session.date, existing);
    }

    for (const log of workoutsResult.data ?? []) {
      const existing = activityMap.get(log.date) ?? {
        date: log.date,
        breakCount: 0,
        hasStrength: false,
        hasStepper: false,
      };
      if (log.workout_type === 'strength') existing.hasStrength = true;
      if (log.workout_type === 'stepper') existing.hasStepper = true;
      activityMap.set(log.date, existing);
    }

    this._weekActivities.set(Array.from(activityMap.values()));
  }
}
