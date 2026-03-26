import { Injectable, inject, signal } from '@angular/core';
import { AudioService } from './audio.service';

/**
 * Manages break notification:
 * - Single beep on timer fire
 * - Tab title change (persistent until cancelled)
 */
@Injectable({ providedIn: 'root' })
export class BreakNotifierService {
  private audio = inject(AudioService);
  private _active = signal(false);

  readonly isActive = this._active.asReadonly();

  /** Fire single beep + tab title change */
  trigger(): void {
    if (this._active()) return;
    this._active.set(true);

    document.title = '⏰ Час на перерву! — FitBreak';
    this.audio.playBreakReminder();
  }

  /** Restore tab title and clear active state */
  cancel(): void {
    document.title = 'FitBreak';
    this._active.set(false);
  }
}
