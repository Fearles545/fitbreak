import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { BreakNotifierService } from './break-notifier.service';
import { DashboardService } from '../../dashboard/dashboard.service';
import type { PauseEntry, WorkSession } from '../models/fitbreak.models';

export type WorkdayActivity = 'idle' | 'working' | 'on-break' | 'paused' | 'stepper' | 'strength';

@Injectable({ providedIn: 'root' })
export class WorkdayService {
  private supabase = inject(SupabaseService);
  private dashboard = inject(DashboardService);
  private notifier = inject(BreakNotifierService);
  private router = inject(Router);

  private _currentActivity = signal<WorkdayActivity>('idle');
  private _now = signal(Date.now());
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private breakTriggered = false;

  readonly currentActivity = this._currentActivity.asReadonly();
  readonly now = this._now.asReadonly();

  readonly remainingSeconds = computed(() => {
    const session = this.dashboard.session();
    const activity = this._currentActivity();

    if (!session || !session.next_break_at) return 0;

    if (activity === 'working') {
      const diff = Math.floor((new Date(session.next_break_at).getTime() - this._now()) / 1000);
      return Math.max(0, diff);
    }

    if (activity === 'paused' && session.paused_at) {
      // Frozen at the moment of pause
      const diff = Math.floor(
        (new Date(session.next_break_at).getTime() - new Date(session.paused_at).getTime()) / 1000,
      );
      return Math.max(0, diff);
    }

    return 0;
  });

  private breakTriggerEffect = effect(() => {
    const remaining = this.remainingSeconds();
    const activity = this._currentActivity();
    const session = this.dashboard.session();

    if (activity === 'working' && remaining === 0 && session?.next_break_at && !this.breakTriggered) {
      this.breakTriggered = true;
      this.notifier.trigger();
      this.router.navigate(['/break']);
    }
    if (remaining > 0) {
      this.breakTriggered = false;
    }
  });

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this._currentActivity() === 'working') {
        this._now.set(Date.now());
      }
    });
  }

  /** Sync workday state with the loaded session. Call after refreshSession(). */
  async init(): Promise<void> {
    const session = this.dashboard.session();
    if (session?.status === 'active') {
      if (!session.next_break_at) {
        await this.backfillNextBreakAt(session);
      }
      this._currentActivity.set('working');
      this.startTick();
    } else if (session?.status === 'paused') {
      this._currentActivity.set('paused');
      this.stopTick();
    } else {
      this._currentActivity.set('idle');
      this.stopTick();
    }
  }

  async startWorkday(): Promise<void> {
    await this.dashboard.startWorkday();
    this._currentActivity.set('working');
    this.startTick();
  }

  async endWorkday(): Promise<void> {
    this.notifier.cancel();
    this.stopTick();

    // If ending while paused, finalize the current pause entry
    const session = this.dashboard.session();
    if (session?.paused_at) {
      const now = new Date().toISOString();
      const pauseEntry: PauseEntry = { pausedAt: session.paused_at, resumedAt: now };
      const pauses = [...session.pauses, pauseEntry];
      const { error: pauseError } = await this.supabase.supabase
        .from('work_sessions')
        .update({ paused_at: null, pauses: pauses as any })
        .eq('id', session.id);
      if (pauseError) throw pauseError;
    }

    await this.dashboard.endWorkday();
    this._currentActivity.set('idle');
  }

  async pauseWorkday(): Promise<void> {
    const session = this.dashboard.session();
    if (!session) return;

    this.notifier.cancel();
    this.stopTick();
    this._currentActivity.set('paused');

    const { error } = await this.supabase.supabase
      .from('work_sessions')
      .update({
        status: 'paused',
        paused_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (error) throw error;
    await this.dashboard.refreshSession();
  }

  async resumeWorkday(): Promise<void> {
    const session = this.dashboard.session();
    if (!session || !session.paused_at) return;

    const now = new Date();
    const pausedAtMs = new Date(session.paused_at).getTime();
    const nextBreakAtMs = session.next_break_at ? new Date(session.next_break_at).getTime() : null;

    // Compute remaining break timer time
    let remainingMs: number;
    if (nextBreakAtMs && nextBreakAtMs > pausedAtMs) {
      remainingMs = nextBreakAtMs - pausedAtMs;
    } else {
      // Break was due during pause — reset to full interval
      remainingMs = session.break_interval_min * 60_000;
    }

    const pauseEntry: PauseEntry = { pausedAt: session.paused_at, resumedAt: now.toISOString() };
    const pauses = [...session.pauses, pauseEntry];

    const { error } = await this.supabase.supabase
      .from('work_sessions')
      .update({
        status: 'active',
        paused_at: null,
        next_break_at: new Date(now.getTime() + remainingMs).toISOString(),
        pauses: pauses as any,
      })
      .eq('id', session.id);

    if (error) throw error;
    await this.dashboard.refreshSession();
    this._currentActivity.set('working');
    this.startTick();
  }

  onBreakStarted(): void {
    this.notifier.cancel();
    this.stopTick();
    this._currentActivity.set('on-break');
  }

  async onBreakCompleted(): Promise<void> {
    this.notifier.cancel();
    await this.dashboard.refreshSession();
    this._currentActivity.set('working');
    this.startTick();
  }

  async onBreakSkipped(): Promise<void> {
    this.notifier.cancel();
    await this.dashboard.refreshSession();
    this._currentActivity.set('working');
    this.startTick();
  }

  startActivity(type: 'stepper' | 'strength'): void {
    const session = this.dashboard.session();
    if (session) {
      this.notifier.cancel();
      this.stopTick();
    }
    this._currentActivity.set(type);
  }

  async endActivity(): Promise<void> {
    const activity = this._currentActivity();
    if (activity !== 'stepper' && activity !== 'strength') return;

    const session = this.dashboard.session();
    if (session) {
      const intervalMs = session.break_interval_min * 60_000;
      const { error } = await this.supabase.supabase
        .from('work_sessions')
        .update({
          next_break_at: new Date(Date.now() + intervalMs).toISOString(),
        })
        .eq('id', session.id);
      if (error) throw error;
      await this.dashboard.refreshSession();
      this._currentActivity.set('working');
      this.startTick();
    } else {
      this._currentActivity.set('idle');
    }
  }

  /** Backfill next_break_at for sessions created before Plan B migration */
  private async backfillNextBreakAt(session: WorkSession): Promise<void> {
    const intervalMs = session.break_interval_min * 60_000;
    let nextBreakAtMs: number;

    if (session.breaks.length === 0) {
      nextBreakAtMs = new Date(session.started_at).getTime() + intervalMs;
    } else {
      const lastBreak = session.breaks[session.breaks.length - 1];
      const anchor = lastBreak.completedAt ?? lastBreak.scheduledAt;
      nextBreakAtMs = new Date(anchor).getTime() + intervalMs;
    }

    const { error } = await this.supabase.supabase
      .from('work_sessions')
      .update({ next_break_at: new Date(nextBreakAtMs).toISOString() })
      .eq('id', session.id);
    if (error) throw error;
    await this.dashboard.refreshSession();
  }

  private startTick(): void {
    if (this.intervalId) return;
    this._now.set(Date.now());
    this.intervalId = setInterval(() => {
      this._now.set(Date.now());
    }, 1000);
  }

  private stopTick(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
