import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from '../../auth/auth.service';
import { SettingsService } from '../../settings/settings.service';
import { toDateKey } from '../utils/date.utils';
import type { WorkSession } from '../models/fitbreak.models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private settings = inject(SettingsService);

  private _session = signal<WorkSession | null>(null);
  private _loading = signal(false);
  private hasCleanedUp = false;

  readonly session = this._session.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly completedBreaks = computed(() => {
    const breaks = this._session()?.breaks ?? [];
    return breaks.filter((b) => !b.skipped && b.completedAt).length;
  });

  async cleanupStaleSessions(): Promise<void> {
    if (this.hasCleanedUp) return;
    this.hasCleanedUp = true;

    const { error } = await this.supabase.supabase.rpc('cleanup_stale_sessions');
    if (error) throw error;
  }

  async refreshSession(): Promise<void> {
    if (!this._session()) this._loading.set(true);
    try {
      const today = toDateKey();
      const { data, error } = await this.supabase.supabase
        .from('work_sessions')
        .select('*')
        .eq('date', today)
        .in('status', ['active', 'paused'])
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
    const breakIntervalMin = this.settings.breakIntervalMin();

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
}
