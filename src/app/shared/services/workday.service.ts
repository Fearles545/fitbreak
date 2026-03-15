import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BreakNotifierService } from './break-notifier.service';
import { DashboardService } from '../../dashboard/dashboard.service';

export type WorkdayActivity = 'idle' | 'working' | 'on-break' | 'paused' | 'stepper' | 'strength';

@Injectable({ providedIn: 'root' })
export class WorkdayService {
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
    if (!session || this._currentActivity() !== 'working') return 0;
    const nextBreak = session.next_break_at;
    if (!nextBreak) return 0;
    const diff = Math.floor((new Date(nextBreak).getTime() - this._now()) / 1000);
    return Math.max(0, diff);
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
  init(): void {
    const session = this.dashboard.session();
    if (session?.status === 'active') {
      this._currentActivity.set('working');
      this.startTick();
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
    await this.dashboard.endWorkday();
    this._currentActivity.set('idle');
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

  /** Stub for Plan E — pause timer when starting stepper/strength */
  startActivity(_type: 'stepper' | 'strength'): void {
    // Will be implemented in Plan E
  }

  /** Stub for Plan E — resume timer after activity */
  endActivity(): void {
    // Will be implemented in Plan E
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
