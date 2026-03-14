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
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreakNotifierService } from '@shared/services/break-notifier.service';
import { BreakTimerService } from './break-timer.service';
import type { MicroBreakRotation, MoodRating } from '@shared/models/fitbreak.models';

type BreakMode = 'prompt' | 'execution' | 'mood';

@Component({
  selector: 'app-break-timer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
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

    /* ── Prompt ── */
    .prompt-title {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin-bottom: 24px;
    }

    .suggested-card {
      padding: 20px;
      border-radius: 16px;
      background: var(--mat-sys-primary-container);
      text-align: center;
      margin-bottom: 16px;
    }

    .suggested-icon {
      font-size: 2rem;
      line-height: 1;
    }

    .suggested-name {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--mat-sys-on-primary-container);
      margin-top: 8px;
    }

    .suggested-meta {
      font-size: 0.85rem;
      color: var(--mat-sys-on-primary-container);
      opacity: 0.8;
      margin-top: 4px;
    }

    .prompt-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 24px;
    }

    .choose-another {
      text-align: center;
      margin-top: 8px;
    }

    .choose-link {
      color: var(--mat-sys-primary);
      cursor: pointer;
      font-size: 0.85rem;
      background: none;
      border: none;
      text-decoration: underline;
    }

    .rotation-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }

    .rotation-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container);
      cursor: pointer;
      border: none;
      width: 100%;
      text-align: left;
    }

    .rotation-option:hover {
      background: var(--mat-sys-surface-container-high);
    }

    .rotation-option-icon {
      font-size: 1.3rem;
    }

    .rotation-option-info {
      flex: 1;
    }

    .rotation-option-name {
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .rotation-option-meta {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    /* ── Execution ── */
    .exec-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .exec-progress-text {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .exercise-name {
      font-size: 1.4rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin: 16px 0 4px;
    }

    .exercise-desc {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 16px;
    }

    .exercise-params {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }

    .param {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .param mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .technique {
      margin-bottom: 20px;
    }

    .technique-title {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 8px;
    }

    .technique-step {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
      line-height: 1.4;
    }

    .step-number {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .step-text {
      color: var(--mat-sys-on-surface);
      font-size: 0.9rem;
    }

    .key-point {
      color: var(--mat-sys-primary);
      font-weight: 500;
      font-size: 0.8rem;
      margin-top: 2px;
    }

    .warnings {
      padding: 12px 16px;
      border-radius: 12px;
      background: var(--mat-sys-error-container);
      margin-bottom: 16px;
    }

    .warnings-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--mat-sys-on-error-container);
      margin-bottom: 4px;
    }

    .warnings li {
      font-size: 0.8rem;
      color: var(--mat-sys-on-error-container);
      margin-left: 16px;
    }

    .bilateral-indicator {
      text-align: center;
      padding: 8px 16px;
      border-radius: 8px;
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .exec-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 24px;
    }

    /* ── Mood ── */
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

    .mood-options {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 32px;
    }

    .mood-btn {
      font-size: 2rem;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 2px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.15s, transform 0.15s;
    }

    .mood-btn:hover {
      transform: scale(1.1);
    }

    .mood-btn.selected {
      border-color: var(--mat-sys-primary);
      background: var(--mat-sys-primary-container);
    }
  `,
  template: `
    <div class="container">
      @switch (mode()) {
        @case ('prompt') {
          <div class="prompt-title">⏰ Час на перерву!</div>

          @if (suggestedOption(); as option) {
            <div class="suggested-card">
              <div class="suggested-icon">{{ option.icon }}</div>
              <div class="suggested-name">{{ option.name }}</div>
              <div class="suggested-meta">~{{ option.durationMin }} хв · {{ option.exerciseCount }} вправ</div>
            </div>
          }

          <div class="prompt-actions">
            <button mat-flat-button (click)="onStartSuggested()">
              Почати розминку
            </button>
            <button mat-outlined-button (click)="onSkip()">
              Пропустити
            </button>
          </div>

          <div class="choose-another">
            <button class="choose-link" (click)="showOptions.set(!showOptions())">
              {{ showOptions() ? 'Сховати' : 'Обрати іншу' }}
            </button>
          </div>

          @if (showOptions()) {
            <div class="rotation-options">
              @for (option of breakService.rotationOptions(); track option.key) {
                @if (!option.isSuggested) {
                  <button class="rotation-option" (click)="onPickRotation(option.key)">
                    <span class="rotation-option-icon">{{ option.icon }}</span>
                    <div class="rotation-option-info">
                      <div class="rotation-option-name">{{ option.name }}</div>
                      <div class="rotation-option-meta">~{{ option.durationMin }} хв · {{ option.exerciseCount }} вправ</div>
                    </div>
                  </button>
                }
              }
            </div>
          }
        }

        @case ('execution') {
          @if (breakService.currentExercise(); as exercise) {
            <div class="exec-header">
              <button mat-icon-button (click)="onBackToPrompt()" aria-label="Назад">
                <mat-icon>arrow_back</mat-icon>
              </button>
              <span class="exec-progress-text">
                Вправа {{ breakService.currentExerciseIndex() + 1 }} з {{ breakService.exerciseCount() }}
              </span>
            </div>

            <mat-progress-bar mode="determinate" [value]="progressPercent()" />

            <h2 class="exercise-name">{{ exercise.name }}</h2>
            <p class="exercise-desc">{{ exercise.short_description }}</p>

            <div class="exercise-params">
              @if (exercise.exercise_type === 'reps' && exercise.default_reps) {
                <div class="param">
                  <mat-icon>repeat</mat-icon>
                  {{ exercise.default_reps }} повторень
                </div>
              }
              @if (exercise.default_duration_sec) {
                <div class="param">
                  <mat-icon>timer</mat-icon>
                  {{ exercise.default_duration_sec }} сек
                </div>
              }
              @if (exercise.is_bilateral) {
                <div class="param">
                  <mat-icon>swap_horiz</mat-icon>
                  на кожну сторону
                </div>
              }
            </div>

            @if (exercise.is_bilateral) {
              <div class="bilateral-indicator">
                ↔ Виконай на обидві сторони
              </div>
            }

            <div class="technique">
              <div class="technique-title">Техніка</div>
              @for (step of exercise.technique; track step.order) {
                <div class="technique-step">
                  <span class="step-number">{{ step.order }}</span>
                  <div>
                    <div class="step-text">{{ step.text }}</div>
                    @if (step.keyPoint) {
                      <div class="key-point">☝ {{ step.keyPoint }}</div>
                    }
                  </div>
                </div>
              }
            </div>

            @if (exercise.warnings && exercise.warnings.length > 0) {
              <div class="warnings">
                <div class="warnings-title">⚠️ Увага</div>
                <ul>
                  @for (w of exercise.warnings; track w) {
                    <li>{{ w }}</li>
                  }
                </ul>
              </div>
            }

            <div class="exec-actions">
              <button mat-flat-button (click)="onNextExercise()">
                {{ breakService.isLastExercise() ? 'Завершити розминку' : 'Готово — наступна' }}
              </button>
            </div>
          }
        }

        @case ('mood') {
          <div class="mood-section">
            <div class="mood-title">Розминка завершена! 🎉</div>
            <div class="mood-subtitle">Як ти себе почуваєш?</div>

            <div class="mood-options">
              @for (m of moodOptions; track m.value) {
                <button class="mood-btn" [class.selected]="selectedMood() === m.value"
                        (click)="selectedMood.set(m.value)"
                        [attr.aria-label]="m.label">
                  {{ m.emoji }}
                </button>
              }
            </div>

            <button mat-flat-button (click)="onFinish()">
              Повернутись до роботи
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class BreakTimerComponent implements OnInit {
  protected breakService = inject(BreakTimerService);
  private notifier = inject(BreakNotifierService);
  private router = inject(Router);

  mode = signal<BreakMode>('prompt');
  showOptions = signal(false);
  selectedMood = signal<string | null>(null);

  readonly moodOptions = [
    { value: 'great', emoji: '😊', label: 'Чудово' },
    { value: 'good', emoji: '🙂', label: 'Добре' },
    { value: 'okay', emoji: '😐', label: 'Нормально' },
    { value: 'bad', emoji: '😫', label: 'Погано' },
  ];

  suggestedOption = computed(() => {
    return this.breakService.rotationOptions().find(o => o.isSuggested) ?? null;
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
    this.notifier.cancel();
    const suggested = this.breakService.suggestedRotation();
    await this.breakService.startBreak(suggested);
    this.mode.set('execution');
  }

  async onPickRotation(rotation: MicroBreakRotation): Promise<void> {
    this.notifier.cancel();
    await this.breakService.startBreak(rotation);
    this.mode.set('execution');
  }

  async onSkip(): Promise<void> {
    this.notifier.cancel();
    await this.breakService.skipBreak();
    this.router.navigate(['/dashboard']);
  }

  onBackToPrompt(): void {
    this.breakService.reset();
    this.mode.set('prompt');
  }

  async onNextExercise(): Promise<void> {
    if (this.breakService.isLastExercise()) {
      this.mode.set('mood');
    } else {
      this.breakService.nextExercise();
    }
  }

  async onFinish(): Promise<void> {
    this.notifier.cancel();
    await this.breakService.completeBreak((this.selectedMood() as MoodRating) ?? undefined);
    this.router.navigate(['/dashboard']);
  }
}
