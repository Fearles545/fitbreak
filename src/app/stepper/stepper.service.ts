import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/services/supabase.service';
import { AudioService } from '@shared/services/audio.service';
import { WakeLockService } from '@shared/services/wake-lock.service';
import { AuthService } from '../auth/auth.service';

export type StepperState = 'idle' | 'running' | 'paused' | 'finished';

export interface StepperResult {
  targetDurationMin: number;
  actualDurationMin: number;
  pauseCount: number;
  totalPauseMin: number;
}

@Injectable({ providedIn: 'root' })
export class StepperService {
  private supabase = inject(SupabaseService);
  private audio = inject(AudioService);
  private wakeLock = inject(WakeLockService);
  private auth = inject(AuthService);

  private _state = signal<StepperState>('idle');
  private _remainingMs = signal(0);
  private _totalMs = signal(0);
  private _pauseCount = signal(0);
  private _totalPauseMs = signal(0);
  private _intervalMin = signal(5);
  private _startedAt = signal<string | null>(null);

  private tickId: ReturnType<typeof setInterval> | null = null;
  private lastTickTime = 0;
  private pauseStartTime = 0;
  private lastIntervalBeepAt = 0;

  readonly state = this._state.asReadonly();
  readonly remainingMs = this._remainingMs.asReadonly();
  readonly totalMs = this._totalMs.asReadonly();
  readonly pauseCount = this._pauseCount.asReadonly();
  readonly intervalMin = this._intervalMin.asReadonly();

  readonly remainingSec = computed(() => Math.ceil(this._remainingMs() / 1000));
  readonly totalSec = computed(() => Math.ceil(this._totalMs() / 1000));
  readonly elapsedSec = computed(() => this.totalSec() - this.remainingSec());
  readonly progress = computed(() => {
    const total = this._totalMs();
    if (total <= 0) return 0;
    return ((total - this._remainingMs()) / total) * 100;
  });

  readonly elapsedFormatted = computed(() => {
    const sec = this.elapsedSec();
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  });

  readonly remainingFormatted = computed(() => {
    const sec = Math.max(0, this.remainingSec());
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  });

  async start(durationMin: number, intervalMin: number): Promise<void> {
    this.audio.init();
    const totalMs = durationMin * 60 * 1000;

    this._totalMs.set(totalMs);
    this._remainingMs.set(totalMs);
    this._pauseCount.set(0);
    this._totalPauseMs.set(0);
    this._intervalMin.set(intervalMin);
    this._startedAt.set(new Date().toISOString());
    this._state.set('running');
    this.lastIntervalBeepAt = 0;

    await this.wakeLock.request();
    this.startTick();
  }

  pause(): void {
    if (this._state() !== 'running') return;
    this._state.set('paused');
    this._pauseCount.update(c => c + 1);
    this.pauseStartTime = Date.now();
    this.stopTick();
  }

  resume(): void {
    if (this._state() !== 'paused') return;
    const pauseDuration = Date.now() - this.pauseStartTime;
    this._totalPauseMs.update(t => t + pauseDuration);
    this._state.set('running');
    this.startTick();
  }

  async stop(): Promise<StepperResult> {
    this.stopTick();
    await this.wakeLock.release();

    const result = this.getResult();
    this._state.set('finished');
    this.audio.playStepperFinish();

    return result;
  }

  async saveWorkoutLog(mood?: string): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    const result = this.getResult();
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const { error } = await this.supabase.supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        workout_type: 'stepper',
        date: today,
        started_at: this._startedAt() ?? now,
        completed_at: now,
        duration_min: Math.round(result.actualDurationMin),
        stepper_log: {
          targetDurationMin: result.targetDurationMin,
          actualDurationMin: result.actualDurationMin,
          pauseCount: result.pauseCount,
          totalPauseMin: result.totalPauseMin,
        },
        mood: mood || null,
      });

    if (error) throw error;
  }

  reset(): void {
    this.stopTick();
    this._state.set('idle');
    this._remainingMs.set(0);
    this._totalMs.set(0);
    this._pauseCount.set(0);
    this._totalPauseMs.set(0);
    this._startedAt.set(null);
  }

  private getResult(): StepperResult {
    const totalMs = this._totalMs();
    const remainingMs = this._remainingMs();
    const elapsed = totalMs - remainingMs;

    return {
      targetDurationMin: Math.round(totalMs / 60000),
      actualDurationMin: Math.round(elapsed / 60000 * 10) / 10,
      pauseCount: this._pauseCount(),
      totalPauseMin: Math.round(this._totalPauseMs() / 60000 * 10) / 10,
    };
  }

  private startTick(): void {
    this.lastTickTime = Date.now();
    this.tickId = setInterval(() => this.tick(), 250);
  }

  private stopTick(): void {
    if (this.tickId) {
      clearInterval(this.tickId);
      this.tickId = null;
    }
  }

  private tick(): void {
    const now = Date.now();
    const delta = now - this.lastTickTime;
    this.lastTickTime = now;

    const remaining = this._remainingMs() - delta;

    if (remaining <= 0) {
      this._remainingMs.set(0);
      this.stop();
      return;
    }

    this._remainingMs.set(remaining);

    // Interval beep check
    const elapsedMin = (this._totalMs() - remaining) / 60000;
    const intervalMin = this._intervalMin();
    const intervalCount = Math.floor(elapsedMin / intervalMin);
    if (intervalCount > this.lastIntervalBeepAt) {
      this.lastIntervalBeepAt = intervalCount;
      this.audio.playStepperInterval();
    }
  }
}
