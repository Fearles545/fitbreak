import { computed, inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '@shared/services/supabase.service';
import { AuthService } from '../auth/auth.service';
import type { UserSettings } from '@shared/models/fitbreak.models';
import type { TablesUpdate } from '@shared/models/database.types';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  private _settings = signal<UserSettings | null>(null);
  readonly settings = this._settings.asReadonly();

  readonly breakIntervalMin = computed(() =>
    this._settings()?.default_break_interval_min ?? 45);
  readonly stepperDurationMin = computed(() =>
    this._settings()?.default_stepper_duration_min ?? 60);
  readonly stepperIntervalMin = computed(() =>
    this._settings()?.default_stepper_interval_min ?? 5);
  readonly restBetweenSetsSec = computed(() =>
    this._settings()?.default_rest_between_sets_sec ?? 60);

  private loadPromise: Promise<void> | null = null;

  async ensureLoaded(): Promise<void> {
    if (this._settings()) return;
    if (!this.loadPromise) this.loadPromise = this.doLoad();
    return this.loadPromise;
  }

  private async doLoad(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    const { data } = await this.supabase.supabase
      .from('user_settings')
      .upsert({ user_id: user.id }, { onConflict: 'user_id' })
      .select()
      .single();

    if (data) this._settings.set(data as UserSettings);
  }

  async update(changes: TablesUpdate<'user_settings'>): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    const prev = this._settings();
    this._settings.set({ ...prev!, ...changes } as UserSettings);

    const { error } = await this.supabase.supabase
      .from('user_settings')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (error) {
      this._settings.set(prev);
      throw error;
    }
  }
}
