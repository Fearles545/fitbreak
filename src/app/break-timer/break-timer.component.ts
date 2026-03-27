import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MoodPickerComponent } from '@shared/components/mood-picker/mood-picker.component';
import { WorkdayService } from '@shared/services/workday.service';
import { BreakNotifierService } from '@shared/services/break-notifier.service';
import { BreakTimerService } from './break-timer.service';
import { BreakPromptComponent } from './break-prompt/break-prompt.component';
import { BreakExecutionComponent } from './break-execution/break-execution.component';
import { SettingsService } from '../settings/settings.service';
import type { MicroBreakRotation, MoodRating } from '@shared/models/fitbreak.models';

type BreakMode = 'prompt' | 'execution' | 'mood';

@Component({
  selector: 'app-break-timer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MoodPickerComponent, BreakPromptComponent, BreakExecutionComponent],
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      min-height: 100dvh;
      background: var(--mat-sys-surface);
      padding: 24px 16px;
    }

    .container {
      max-width: 480px;
      margin: 0 auto;
    }

    .mood-section {
      text-align: center;
      padding-top: 48px;
    }

    .mood-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin-bottom: 8px;
    }

    .mood-subtitle {
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 32px;
    }
  `,
  template: `
    <div class="container">
      @switch (mode()) {
        @case ('prompt') {
          <app-break-prompt
            [suggestedOption]="suggestedOption()"
            [rotationOptions]="breakService.rotationOptions()"
            (startSuggested)="onStartSuggested()"
            (pickRotation)="onPickRotation($event)"
            (extendWork)="onExtendWork($event.minutes, $event.reason)"
            (skip)="onSkip()"
            (endDay)="onEndDay()"
          />
        }

        @case ('execution') {
          <app-break-execution
            [exercise]="breakService.currentExercise()"
            [currentIndex]="breakService.currentExerciseIndex()"
            [totalCount]="breakService.exerciseCount()"
            [progressPercent]="progressPercent()"
            [isLast]="breakService.isLastExercise()"
            [animationMode]="settings.timerAnimationStyle()"
            (next)="onNextExercise()"
            (back)="onBackToPrompt()"
          />
        }

        @case ('mood') {
          <div class="mood-section">
            <div class="mood-title">Розминка завершена! 🎉</div>
            <div class="mood-subtitle">Як ти себе почуваєш?</div>

            <app-mood-picker [(selected)]="selectedMood" [showLabel]="false" />

            <button mat-flat-button (click)="onFinish()">Повернутись до роботи</button>
          </div>
        }
      }
    </div>
  `,
})
export class BreakTimerComponent implements OnInit {
  protected breakService = inject(BreakTimerService);
  protected settings = inject(SettingsService);
  private workday = inject(WorkdayService);
  private notifier = inject(BreakNotifierService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  mode = signal<BreakMode>('prompt');
  selectedMood = signal<MoodRating | null>(null);

  suggestedOption = computed(() => {
    return this.breakService.rotationOptions().find((o) => o.isSuggested) ?? null;
  });

  progressPercent = computed(() => {
    const total = this.breakService.exerciseCount();
    if (total === 0) return 0;
    return ((this.breakService.currentExerciseIndex() + 1) / total) * 100;
  });

  ngOnInit(): void {
    this.breakService.loadTemplates();
  }

  async onStartSuggested(): Promise<void> {
    try {
      this.workday.onBreakStarted();
      const suggested = this.breakService.suggestedRotation();
      await this.breakService.startBreak(suggested);
      this.mode.set('execution');
    } catch {
      this.snackBar.open('Не вдалося розпочати перерву.', 'OK', { duration: 5000 });
    }
  }

  async onPickRotation(rotation: MicroBreakRotation): Promise<void> {
    try {
      this.workday.onBreakStarted();
      await this.breakService.startBreak(rotation);
      this.mode.set('execution');
    } catch {
      this.snackBar.open('Не вдалося розпочати перерву.', 'OK', { duration: 5000 });
    }
  }

  async onExtendWork(minutes: number, reason?: string): Promise<void> {
    try {
      this.notifier.cancel();
      await this.breakService.extendWork(minutes, reason);
      this.router.navigate(['/dashboard']);
    } catch {
      this.snackBar.open('Не вдалося продовжити роботу.', 'OK', { duration: 5000 });
    }
  }

  async onSkip(): Promise<void> {
    try {
      this.notifier.cancel();
      await this.breakService.skipBreak();
      this.router.navigate(['/dashboard']);
    } catch {
      this.snackBar.open('Не вдалося пропустити перерву.', 'OK', { duration: 5000 });
    }
  }

  async onEndDay(): Promise<void> {
    try {
      await this.workday.endWorkday();
      this.router.navigate(['/dashboard']);
    } catch {
      this.snackBar.open('Не вдалося завершити робочий день.', 'OK', { duration: 5000 });
    }
  }

  onBackToPrompt(): void {
    this.breakService.reset();
    this.mode.set('prompt');
  }

  onNextExercise(): void {
    if (this.breakService.isLastExercise()) {
      this.mode.set('mood');
    } else {
      this.breakService.nextExercise();
    }
  }

  async onFinish(): Promise<void> {
    try {
      await this.breakService.completeBreak(this.selectedMood() ?? undefined);
      this.router.navigate(['/dashboard']);
    } catch {
      this.snackBar.open('Не вдалося зберегти результат перерви.', 'OK', { duration: 5000 });
    }
  }
}
