import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/services/supabase.service';
import { startOfWeek, startOfMonth } from 'date-fns';
import { toDateKey } from '@shared/utils/date.utils';

export type Period = 'week' | 'month' | 'all';

export interface DailyActivityStat {
  date: string;
  completed_breaks: number;
  total_breaks: number;
  skipped_breaks: number;
  strength_count: number;
  stepper_count: number;
  work_duration_min: number | null;
}

export interface RotationStat {
  rotation_type: string;
  completed: number;
  skipped: number;
  total: number;
}

export interface AllTimeTotals {
  total_breaks_completed: number;
  total_workouts: number;
  total_stepper_sessions: number;
  total_workout_minutes: number;
  first_active_date: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private supabase = inject(SupabaseService);

  private _loading = signal(false);
  private _currentStreak = signal(0);
  private _longestStreak = signal(0);
  private _period = signal<Period>('week');
  private _dailyStats = signal<DailyActivityStat[]>([]);
  private _rotationStats = signal<RotationStat[]>([]);
  private _allTimeTotals = signal<AllTimeTotals | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly currentStreak = this._currentStreak.asReadonly();
  readonly longestStreak = this._longestStreak.asReadonly();
  readonly period = this._period.asReadonly();
  readonly dailyStats = this._dailyStats.asReadonly();
  readonly rotationStats = this._rotationStats.asReadonly();
  readonly allTimeTotals = this._allTimeTotals.asReadonly();

  // ── Derived: breaks ──
  readonly totalCompleted = computed(() =>
    this._dailyStats().reduce((sum, d) => sum + d.completed_breaks, 0),
  );

  readonly totalBreaks = computed(() =>
    this._dailyStats().reduce((sum, d) => sum + d.total_breaks, 0),
  );

  readonly completionRate = computed(() => {
    const total = this.totalBreaks();
    if (total === 0) return 0;
    return Math.round((this.totalCompleted() / total) * 100);
  });

  // ── Derived: workouts ──
  readonly totalStrength = computed(() =>
    this._dailyStats().reduce((sum, d) => sum + d.strength_count, 0),
  );

  readonly totalStepper = computed(() =>
    this._dailyStats().reduce((sum, d) => sum + d.stepper_count, 0),
  );

  readonly totalWorkoutCount = computed(() =>
    this.totalStrength() + this.totalStepper(),
  );

  async load(): Promise<void> {
    this._loading.set(true);
    try {
      await Promise.all([
        this.loadStreaks(),
        this.loadPeriodData(),
        this.loadAllTimeTotals(),
      ]);
    } finally {
      this._loading.set(false);
    }
  }

  async setPeriod(period: Period): Promise<void> {
    this._period.set(period);
    try {
      await this.loadPeriodData();
    } catch {
      this._dailyStats.set([]);
      this._rotationStats.set([]);
    }
  }

  private async loadStreaks(): Promise<void> {
    const { data, error } = await this.supabase.supabase.rpc('streak_stats');
    if (error) throw error;
    if (data && data.length > 0) {
      this._currentStreak.set(data[0].current_streak ?? 0);
      this._longestStreak.set(data[0].longest_streak ?? 0);
    }
  }

  private async loadPeriodData(): Promise<void> {
    const { start, end } = this.getDateRange();

    const [dailyResult, rotationResult] = await Promise.all([
      this.supabase.supabase.rpc('daily_activity_stats', { p_start: start, p_end: end }),
      this.supabase.supabase.rpc('rotation_stats', { p_start: start, p_end: end }),
    ]);

    if (dailyResult.error) throw dailyResult.error;
    if (rotationResult.error) throw rotationResult.error;

    this._dailyStats.set((dailyResult.data ?? []) as DailyActivityStat[]);
    this._rotationStats.set((rotationResult.data ?? []) as RotationStat[]);
  }

  private async loadAllTimeTotals(): Promise<void> {
    const { data, error } = await this.supabase.supabase.rpc('all_time_totals');
    if (error) throw error;
    if (data && data.length > 0) {
      this._allTimeTotals.set(data[0] as unknown as AllTimeTotals);
    }
  }

  private getDateRange(): { start: string; end: string } {
    const now = new Date();
    const end = toDateKey(now);

    switch (this._period()) {
      case 'week':
        return { start: toDateKey(startOfWeek(now, { weekStartsOn: 1 })), end };
      case 'month':
        return { start: toDateKey(startOfMonth(now)), end };
      case 'all':
        return { start: '2020-01-01', end };
    }
  }
}
