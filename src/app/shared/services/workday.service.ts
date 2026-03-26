import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BreakNotifierService } from './break-notifier.service';
import { SessionService } from './session.service';
import type { PauseEntry } from '../models/fitbreak.models';
import { asJson } from '../utils/supabase.utils';

export type WorkdayActivity = 'idle' | 'working' | 'on-break' | 'paused' | 'break-due' | 'back-to-work' | 'stepper' | 'strength';

@Injectable({ providedIn: 'root' })
export class WorkdayService {
  private supabase = inject(SupabaseService);
  private session = inject(SessionService);
  private notifier = inject(BreakNotifierService);

  private _currentActivity = signal<WorkdayActivity>('idle');
  private _now = signal(Date.now());
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private breakTriggered = false;

  readonly currentActivity = this._currentActivity.asReadonly();
  readonly now = this._now.asReadonly();

  /** Seconds remaining until break. Negative = overtime. */
  readonly remainingSeconds = computed(() => {
    const session = this.session.session();
    const activity = this._currentActivity();

    if (!session || !session.next_break_at) return 0;

    if (activity === 'working' || activity === 'break-due') {
      return Math.floor((new Date(session.next_break_at).getTime() - this._now()) / 1000);
    }

    if (activity === 'paused' && session.paused_at) {
      return Math.floor(
        (new Date(session.next_break_at).getTime() - new Date(session.paused_at).getTime()) / 1000,
      );
    }

    return 0;
  });

  /** Positive overtime seconds (0 when not in overtime) */
  readonly overtimeSeconds = computed(() => {
    const remaining = this.remainingSeconds();
    return remaining < 0 ? Math.abs(remaining) : 0;
  });

  private breakTriggerEffect = effect(() => {
    const remaining = this.remainingSeconds();
    const activity = this._currentActivity();
    const session = this.session.session();

    if (activity === 'working' && remaining <= 0 && session?.next_break_at && !this.breakTriggered) {
      this.breakTriggered = true;
      this._currentActivity.set('break-due');
      this.notifier.trigger();
    }
    if (remaining > 0) {
      this.breakTriggered = false;
    }
  });

  private tabTitleEffect = effect(() => {
    const activity = this._currentActivity();
    const remaining = this.remainingSeconds();

    // Break notifier manages its own title when break-due
    if (this.notifier.isActive()) return;

    switch (activity) {
      case 'working': {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        document.title = `${m}:${s.toString().padStart(2, '0')} — FitBreak`;
        break;
      }
      case 'paused': {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        document.title = `⏸ ${m}:${s.toString().padStart(2, '0')} — FitBreak`;
        break;
      }
      case 'on-break':
        document.title = '🏃 Перерва — FitBreak';
        break;
      case 'stepper':
      case 'strength':
        document.title = '💪 Тренування — FitBreak';
        break;
      case 'back-to-work':
      case 'idle':
      default:
        document.title = 'FitBreak';
        break;
    }
  });

  constructor() {
    document.addEventListener('visibilitychange', () => {
      const activity = this._currentActivity();
      if (!document.hidden && (activity === 'working' || activity === 'break-due')) {
        this._now.set(Date.now());
      }
    });
  }

  /** Sync workday state with the loaded session. Call after refreshSession(). */
  async init(): Promise<void> {
    const session = this.session.session();
    if (session?.status === 'active') {
      if (!session.next_break_at) {
        // Back-to-work: session active but no next_break_at (set after break completion)
        this._currentActivity.set('back-to-work');
        this.stopTick();
      } else {
        const nextBreakMs = new Date(session.next_break_at).getTime();
        if (nextBreakMs <= Date.now()) {
          // Break is overdue — restore break-due state
          this._currentActivity.set('break-due');
          this.breakTriggered = true;
          this.notifier.trigger();
          this.startTick();
        } else {
          this._currentActivity.set('working');
          this.startTick();
        }
      }
    } else if (session?.status === 'paused') {
      this._currentActivity.set('paused');
      this.stopTick();
    } else {
      this._currentActivity.set('idle');
      this.stopTick();
    }
  }

  async startWorkday(): Promise<void> {
    await this.session.startWorkday();
    this._currentActivity.set('working');
    this.startTick();
  }

  async endWorkday(): Promise<void> {
    this.notifier.cancel();
    this.stopTick();

    // If ending while paused, finalize the current pause entry
    const session = this.session.session();
    if (session?.paused_at) {
      const now = new Date().toISOString();
      const pauseEntry: PauseEntry = { pausedAt: session.paused_at, resumedAt: now };
      const pauses = [...session.pauses, pauseEntry];
      const { error: pauseError } = await this.supabase.supabase
        .from('work_sessions')
        .update({ paused_at: null, pauses: asJson(pauses) })
        .eq('id', session.id);
      if (pauseError) throw pauseError;
    }

    await this.session.endWorkday();
    this._currentActivity.set('idle');
  }

  async pauseWorkday(): Promise<void> {
    const session = this.session.session();
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
    await this.session.refreshSession();
  }

  async resumeWorkday(): Promise<void> {
    const session = this.session.session();
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
        pauses: asJson(pauses),
      })
      .eq('id', session.id);

    if (error) throw error;
    await this.session.refreshSession();
    this._currentActivity.set('working');
    this.startTick();
  }

  /** User taps "back to work" after completing a break */
  async resumeAfterBreak(): Promise<void> {
    const session = this.session.session();
    if (!session) return;

    const now = new Date();
    const intervalMs = session.break_interval_min * 60_000;

    const { error } = await this.supabase.supabase
      .from('work_sessions')
      .update({
        next_break_at: new Date(now.getTime() + intervalMs).toISOString(),
      })
      .eq('id', session.id);

    if (error) throw error;
    await this.session.refreshSession();
    this.breakTriggered = false;
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
    this.stopTick();
    await this.session.refreshSession();
    this._currentActivity.set('back-to-work');
  }

  async onBreakSkipped(): Promise<void> {
    this.notifier.cancel();
    await this.session.refreshSession();
    this.breakTriggered = false;
    this._currentActivity.set('working');
    this.startTick();
  }

  startActivity(type: 'stepper' | 'strength'): void {
    const session = this.session.session();
    if (session) {
      this.notifier.cancel();
      this.stopTick();
    }
    this._currentActivity.set(type);
  }

  async endActivity(): Promise<void> {
    const activity = this._currentActivity();
    if (activity !== 'stepper' && activity !== 'strength') return;

    const session = this.session.session();
    if (session) {
      const intervalMs = session.break_interval_min * 60_000;
      const { error } = await this.supabase.supabase
        .from('work_sessions')
        .update({
          next_break_at: new Date(Date.now() + intervalMs).toISOString(),
        })
        .eq('id', session.id);
      if (error) throw error;
      await this.session.refreshSession();
      this._currentActivity.set('working');
      this.startTick();
    } else {
      this._currentActivity.set('idle');
    }
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
