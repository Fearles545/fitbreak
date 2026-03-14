import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WakeLockService {
  private wakeLock: WakeLockSentinel | null = null;

  async request(): Promise<void> {
    if (!('wakeLock' in navigator)) return;

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.wakeLock.addEventListener('release', () => {
        this.wakeLock = null;
      });
    } catch {
      // Permission denied or not supported — silent fail
    }

    // Re-acquire on tab return (browser releases on visibility change)
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  async release(): Promise<void> {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  private onVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && !this.wakeLock) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch { /* silent */ }
    }
  };
}
