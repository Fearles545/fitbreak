import { Injectable, inject, signal } from '@angular/core';
import { AudioService } from './audio.service';
import { DeviceContextService } from './device-context.service';
import { SettingsService } from '../../settings/settings.service';
import type { VibrationPattern } from '@shared/models/fitbreak.models';

const VIBRATION_PATTERNS: Record<Exclude<VibrationPattern, 'off'>, number[]> = {
  short: [200],
  long: [500],
  double: [200, 100, 200],
};

/**
 * Multi-channel break notification:
 * - Sound (3 variants, configurable repeat)
 * - Vibration (3 patterns or off, device-gated)
 * - Tab title change (desktop browser only, not in standalone PWA)
 */
@Injectable({ providedIn: 'root' })
export class BreakNotifierService {
  private audio = inject(AudioService);
  private device = inject(DeviceContextService);
  private settings = inject(SettingsService);

  private _active = signal(false);
  private repeatTimer: ReturnType<typeof setInterval> | null = null;
  private repeatCount = 0;

  readonly isActive = this._active.asReadonly();

  /** Fire notification channels based on settings + device context */
  trigger(): void {
    if (this._active()) return;
    this._active.set(true);

    // Tab title (desktop browser only — not in standalone PWA)
    if (!this.device.isPwa()) {
      document.title = '⏰ Час на перерву! — FitBreak';
    }

    // First round
    this.fireRound();

    // Repeat if configured
    const totalCount = this.settings.breakReminderCount();
    if (totalCount > 1) {
      this.repeatCount = 1;
      const intervalMs = this.settings.breakReminderIntervalSec() * 1000;
      this.repeatTimer = setInterval(() => {
        this.repeatCount++;
        this.fireRound();
        if (this.repeatCount >= totalCount) {
          this.clearRepeatTimer();
        }
      }, intervalMs);
    }
  }

  /** Cancel all notifications and clear repeat timer */
  cancel(): void {
    this.clearRepeatTimer();
    document.title = 'FitBreak';
    this._active.set(false);
  }

  private fireRound(): void {
    // Sound
    const count = this.settings.breakReminderCount();
    if (count > 0) {
      this.audio.playBreakSound(this.settings.breakNotificationSound());
    }

    // Vibration (device-gated)
    const pattern = this.settings.breakVibrationPattern();
    if (pattern !== 'off' && this.device.hasVibration()) {
      navigator.vibrate(VIBRATION_PATTERNS[pattern]);
    }
  }

  private clearRepeatTimer(): void {
    if (this.repeatTimer !== null) {
      clearInterval(this.repeatTimer);
      this.repeatTimer = null;
    }
    this.repeatCount = 0;
  }
}
