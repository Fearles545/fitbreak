import { Injectable, inject } from '@angular/core';
import { AudioService } from './audio.service';

/**
 * Manages break notification sequence:
 * - First beep immediately on timer fire
 * - Then beep at +1m, +2m, +3m, +4m (5 total)
 * - Cancel all pending beeps on break start/skip
 * - Tab title management
 */
@Injectable({ providedIn: 'root' })
export class BreakNotifierService {
  private audio = inject(AudioService);
  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
  private originalTitle = 'FitBreak';
  private active = false;

  /** Start the notification sequence */
  trigger(): void {
    if (this.active) return;
    this.active = true;

    // Change tab title
    this.originalTitle = document.title;
    document.title = '⏰ Час на перерву! — FitBreak';

    // Immediate beep
    this.audio.playBreakReminder();

    // Schedule 4 more beeps at 1-minute intervals
    for (let i = 1; i <= 4; i++) {
      const timeout = setTimeout(() => {
        this.audio.playBreakReminder();
      }, i * 60 * 1000);
      this.pendingTimeouts.push(timeout);
    }
  }

  /** Cancel all pending beeps and restore tab title */
  cancel(): void {
    this.pendingTimeouts.forEach(t => clearTimeout(t));
    this.pendingTimeouts = [];
    document.title = this.originalTitle;
    this.active = false;
  }

  get isActive(): boolean {
    return this.active;
  }
}
