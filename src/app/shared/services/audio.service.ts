import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private context: AudioContext | null = null;

  /** Must be called on first user gesture (click/tap) to unlock AudioContext */
  init(): void {
    if (!this.context) {
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  /** Break reminder: xylophone double hit with harmonics */
  playBreakReminder(): void {
    this.init();
    const ctx = this.context;
    if (!ctx) return;

    this.playBellHit(ctx, 1200, ctx.currentTime);
    setTimeout(() => {
      this.playBellHit(ctx, 1500, ctx.currentTime);
    }, 300);
  }

  /** Stepper interval signal: sawtooth double buzz */
  playStepperInterval(): void {
    this.playTone(440, 0.3, 0, 'sawtooth', 0.6);
    this.playTone(440, 0.3, 0.4, 'sawtooth', 0.6);
  }

  /** Stepper finish: longer buzz × 3 */
  playStepperFinish(): void {
    this.playTone(440, 0.4, 0, 'sawtooth', 0.6);
    this.playTone(440, 0.4, 0.5, 'sawtooth', 0.6);
    this.playTone(440, 0.6, 1.0, 'sawtooth', 0.6);
  }

  /** Countdown lead-in tick: short high beep */
  playCountdownTick(): void {
    this.playTone(800, 0.1, 0, 'sine', 0.3);
  }

  /** Countdown "go" sound: higher pitch, slightly longer */
  playCountdownGo(): void {
    this.playTone(1200, 0.15, 0, 'sine', 0.4);
  }

  /** Rest timer end: single xylophone hit */
  playRestTimerEnd(): void {
    this.init();
    const ctx = this.context;
    if (!ctx) return;
    this.playBellHit(ctx, 1500, ctx.currentTime);
  }

  /** Layered sine harmonics for bell/xylophone timbre */
  private playBellHit(ctx: AudioContext, baseFreq: number, startTime: number): void {
    [1, 2.76, 5.4].forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = baseFreq * ratio;
      const vol = [1.0, 0.4, 0.2][i];
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }

  private playTone(frequency: number, durationSec: number, delaySec = 0, waveType: OscillatorType = 'sine', volume = 0.3): void {
    this.init();
    const ctx = this.context;
    if (!ctx) return;

    const startTime = ctx.currentTime + delaySec;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = waveType;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + durationSec);
  }
}
