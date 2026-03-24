import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/services/supabase.service';
import { startOfWeek } from 'date-fns';
import { toDateKey } from '@shared/utils/date.utils';

export interface WeeklyBreakStats {
  week_start: string;
  total_breaks: number;
  completed_breaks: number;
  skipped_breaks: number;
  completion_rate: number;
}

export interface WeeklyWorkoutStats {
  week_start: string;
  strength_count: number;
  stepper_count: number;
  total_duration_min: number;
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private supabase = inject(SupabaseService);

  private _breakStats = signal<WeeklyBreakStats[]>([]);
  private _workoutStats = signal<WeeklyWorkoutStats[]>([]);
  private _currentStreak = signal(0);
  private _longestStreak = signal(0);
  private _loading = signal(false);

  readonly loading = this._loading.asReadonly();
  readonly currentStreak = this._currentStreak.asReadonly();
  readonly longestStreak = this._longestStreak.asReadonly();

  private currentWeekStart = toDateKey(startOfWeek(new Date(), { weekStartsOn: 1 }));

  readonly thisWeekBreaks = computed(() =>
    this._breakStats().find(s => s.week_start === this.currentWeekStart) ?? null,
  );
  readonly lastWeekBreaks = computed(() =>
    this._breakStats().find(s => s.week_start !== this.currentWeekStart) ?? null,
  );
  readonly thisWeekWorkouts = computed(() =>
    this._workoutStats().find(s => s.week_start === this.currentWeekStart) ?? null,
  );
  readonly lastWeekWorkouts = computed(() =>
    this._workoutStats().find(s => s.week_start !== this.currentWeekStart) ?? null,
  );

  async load(): Promise<void> {
    this._loading.set(true);
    try {
      await Promise.all([
        this.loadWeeklyStats(),
        this.loadStreaks(),
      ]);
    } finally {
      this._loading.set(false);
    }
  }

  private async loadWeeklyStats(): Promise<void> {
    const [breakResult, workoutResult] = await Promise.all([
      this.supabase.supabase.rpc('weekly_break_stats', { weeks_back: 2 }),
      this.supabase.supabase.rpc('weekly_workout_stats', { weeks_back: 2 }),
    ]);

    if (breakResult.error) throw breakResult.error;
    if (workoutResult.error) throw workoutResult.error;

    this._breakStats.set(breakResult.data as WeeklyBreakStats[]);
    this._workoutStats.set(workoutResult.data as WeeklyWorkoutStats[]);
  }

  private async loadStreaks(): Promise<void> {
    const { data, error } = await this.supabase.supabase.rpc('streak_stats');

    if (error) throw error;

    if (data && data.length > 0) {
      this._currentStreak.set(data[0].current_streak ?? 0);
      this._longestStreak.set(data[0].longest_streak ?? 0);
    }
  }
}
