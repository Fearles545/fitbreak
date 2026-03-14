import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private context: AudioContext | null = null;

  /** Must be called on first user gesture (click/tap) to unlock AudioContext */
  init(): void {
    if (!this.context) {
      this.context = new AudioContext();
    }
    // Resume if suspended (browser policy)
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  /** Break reminder: 800 Hz, 200ms */
  playBreakReminder(): void {
    this.playTone(800, 0.2);
  }

  /** Stepper interval signal: 1000 Hz, 150ms × 2 (double beep) */
  playStepperInterval(): void {
    this.playTone(1000, 0.15, 0);
    this.playTone(1000, 0.15, 0.25);
  }

  /** Stepper finish: 600 Hz, 1000ms */
  playStepperFinish(): void {
    this.playTone(600, 1.0);
  }

  /** Rest timer end: 700 Hz, 300ms */
  playRestTimerEnd(): void {
    this.playTone(700, 0.3);
  }

  private playTone(frequency: number, durationSec: number, delayMs = 0): void {
    this.init();
    const ctx = this.context;
    if (!ctx) return;

    const startTime = ctx.currentTime + delayMs;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    // Smooth fade out to avoid click
    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + durationSec);
  }
}
