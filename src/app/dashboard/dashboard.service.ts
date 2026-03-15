import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/services/supabase.service';
import { toDateKey, getLast7Days } from '@shared/utils/date.utils';
import { AuthService } from '../auth/auth.service';
import type { WorkSession } from '@shared/models/fitbreak.models';
import type { DayActivity } from '@shared/components/week-calendar/week-calendar.component';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  private _session = signal<WorkSession | null>(null);
  private _weekActivities = signal<DayActivity[]>([]);
  private _loading = signal(false);

  readonly session = this._session.asReadonly();
  readonly weekActivities = this._weekActivities.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isActive = computed(() => this._session()?.status === 'active');

  readonly completedBreaks = computed(() => {
    const breaks = this._session()?.breaks ?? [];
    return breaks.filter((b) => !b.skipped && b.completedAt).length;
  });

  readonly totalBreaks = computed(() => {
    return (this._session()?.breaks ?? []).length;
  });

  async refreshSession(): Promise<void> {
    this._loading.set(true);
    try {
      const today = toDateKey();
      const { data, error } = await this.supabase.supabase
        .from('work_sessions')
        .select('*')
        .eq('date', today)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      this._session.set(data as unknown as WorkSession | null);
    } finally {
      this._loading.set(false);
    }
  }

  async startWorkday(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    const now = new Date();
    const today = toDateKey();
    const breakIntervalMin = 45;

    const { data, error } = await this.supabase.supabase
      .from('work_sessions')
      .insert({
        user_id: user.id,
        date: today,
        started_at: now.toISOString(),
        status: 'active',
        break_interval_min: breakIntervalMin,
        breaks: [],
        current_rotation_index: 0,
        next_break_at: new Date(now.getTime() + breakIntervalMin * 60_000).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    this._session.set(data as unknown as WorkSession);
  }

  async endWorkday(): Promise<void> {
    const session = this._session();
    if (!session) return;

    const { error } = await this.supabase.supabase
      .from('work_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (error) throw error;
    this._session.set(null);
  }

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
