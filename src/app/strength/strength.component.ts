import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StrengthService, WorkoutMode } from './strength.service';
import { StrengthRestComponent } from './strength-rest/strength-rest.component';
import { StrengthFinishComponent } from './strength-finish/strength-finish.component';
import { WorkdayService } from '@shared/services/workday.service';
import { SettingsService } from '../settings/settings.service';
import type { DifficultyLevel, MoodRating, WorkoutTemplate } from '@shared/models/fitbreak.models';

@Component({
  selector: 'app-strength',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    StrengthRestComponent,
    StrengthFinishComponent,
  ],
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

    /* ── Pick template ── */
    .pick-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin-bottom: 16px;
    }

    .template-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .template-card {
      padding: 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container);
      cursor: pointer;
      border: none;
      width: 100%;
      text-align: left;
    }

    .template-card:hover {
      background: var(--mat-sys-surface-container-high);
    }

    .template-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .template-meta {
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
    }

    .mode-toggle {
      display: flex;
      gap: 8px;
      margin: 20px 0;
    }

    .mode-chip {
      flex: 1;
      padding: 10px;
      border-radius: 12px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      cursor: pointer;
      text-align: center;
    }

    .mode-chip.selected {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      border-color: var(--mat-sys-primary);
    }

    .mode-chip-label { font-size: 0.9rem; font-weight: 500; }
    .mode-chip-desc { font-size: 0.7rem; opacity: 0.8; margin-top: 2px; }

    .difficulty-toggle {
      display: flex;
      gap: 6px;
      justify-content: center;
      margin-bottom: 16px;
    }

    .diff-chip {
      padding: 6px 14px;
      border-radius: 16px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      cursor: pointer;
      font-size: 0.8rem;
    }

    .diff-chip.selected {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      border-color: var(--mat-sys-tertiary);
      font-weight: 500;
    }

    .difficulty-note {
      text-align: center;
      font-size: 0.8rem;
      font-style: italic;
      color: var(--mat-sys-on-tertiary-container);
      background: var(--mat-sys-tertiary-container);
      padding: 6px 12px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .round-indicator {
      text-align: center;
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 12px;
    }

    .back-link { margin-top: 16px; }

    /* ── Exercise ── */
    .exec-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .exec-title {
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

    .set-tracker {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 20px;
      border-radius: 16px;
      background: var(--mat-sys-primary-container);
      margin-bottom: 20px;
    }

    .set-label { font-size: 0.85rem; color: var(--mat-sys-on-primary-container); }
    .set-number { font-family: 'Exo 2', monospace; font-size: 2rem; font-weight: 700; color: var(--mat-sys-on-primary-container); }
    .set-target { font-size: 0.9rem; color: var(--mat-sys-on-primary-container); opacity: 0.7; }

    .exercise-params {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      justify-content: center;
    }

    .param {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .param mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .technique { margin-bottom: 16px; }

    .technique-toggle {
      font-size: 0.8rem;
      color: var(--mat-sys-primary);
      cursor: pointer;
      background: none;
      border: none;
      margin-bottom: 8px;
    }

    .technique-step {
      display: flex;
      gap: 10px;
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .step-number {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .step-text { color: var(--mat-sys-on-surface); font-size: 0.85rem; }

    .key-point {
      color: var(--mat-sys-primary);
      font-weight: 500;
      font-size: 0.75rem;
      margin-top: 2px;
    }

    .exec-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 24px;
    }

    .skip-link { text-align: center; }

    .skip-btn {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.85rem;
      cursor: pointer;
      background: none;
      border: none;
      text-decoration: underline;
    }
  `,
  template: `
    <div class="container">
      @switch (strength.state()) {
        @case ('idle') {
          <h1 class="pick-title">🏋️ Силове тренування</h1>

          <div class="mode-toggle">
            <button
              class="mode-chip"
              [class.selected]="selectedMode() === 'classic'"
              (click)="selectedMode.set('classic')"
            >
              <div class="mode-chip-label">Класичний</div>
              <div class="mode-chip-desc">всі підходи однієї вправи</div>
            </button>
            <button
              class="mode-chip"
              [class.selected]="selectedMode() === 'circuit'"
              (click)="selectedMode.set('circuit')"
            >
              <div class="mode-chip-label">Коловий</div>
              <div class="mode-chip-desc">всі вправи по колу</div>
            </button>
          </div>

          <div class="template-list">
            @for (t of strength.templates(); track t.id) {
              <button class="template-card" (click)="onPickTemplate(t)">
                <div class="template-name">{{ t.icon }} {{ t.name }}</div>
                <div class="template-meta">
                  {{ t.exercises.length }} вправ · ~{{ t.estimated_duration_min }} хв
                </div>
              </button>
            }
          </div>

          <div class="back-link">
            <button mat-button (click)="router.navigate(['/dashboard'])">
              <mat-icon>arrow_back</mat-icon> Назад
            </button>
          </div>
        }

        @case ('exercising') {
          @if (strength.currentExerciseState(); as es) {
            <div class="exec-header">
              <span class="exec-title">
                {{ strength.template()?.name }} — вправа {{ strength.currentExerciseIndex() + 1 }} з
                {{ strength.exerciseCount() }}
              </span>
            </div>

            @if (strength.mode() === 'circuit') {
              <div class="round-indicator">
                Раунд {{ strength.currentRound() }} / {{ strength.totalRounds() }}
              </div>
            }

            <mat-progress-bar mode="determinate" [value]="exerciseProgress()" />

            <div class="difficulty-toggle" role="radiogroup" aria-label="Складність">
              @for (d of difficultyOptions; track d.value) {
                <button
                  class="diff-chip"
                  [class.selected]="strength.selectedDifficulty() === d.value"
                  [attr.aria-checked]="strength.selectedDifficulty() === d.value"
                  role="radio"
                  (click)="strength.setDifficulty(d.value)"
                >{{ d.label }}</button>
              }
            </div>

            @if (effectiveNote()) {
              <div class="difficulty-note">{{ effectiveNote() }}</div>
            }

            <h2 class="exercise-name">{{ es.exercise.name }}</h2>
            <p class="exercise-desc">{{ es.exercise.short_description }}</p>

            @if (strength.mode() === 'classic') {
              <div class="set-tracker">
                <span class="set-label">Підхід</span>
                <span class="set-number">{{ strength.currentSetNumber() }}</span>
                <span class="set-target">/ {{ strength.totalSetsForCurrent() }}</span>
              </div>
            }

            <div class="exercise-params">
              @if (effectiveReps()) {
                <div class="param">
                  <mat-icon>repeat</mat-icon>
                  {{ effectiveReps() }} повторень
                </div>
              }
              @if (effectiveDuration()) {
                <div class="param">
                  <mat-icon>timer</mat-icon>
                  {{ effectiveDuration() }} сек
                </div>
              }
            </div>

            <div class="technique">
              <button class="technique-toggle" (click)="showTechnique.set(!showTechnique())">
                {{ showTechnique() ? '▾ Сховати техніку' : '▸ Показати техніку' }}
              </button>
              @if (showTechnique()) {
                @for (step of es.exercise.technique; track step.order) {
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
              }
            </div>

            <div class="exec-actions">
              <button mat-flat-button (click)="onCompleteSet()">Готово</button>
              <div class="skip-link">
                <button class="skip-btn" (click)="strength.skipExercise()">
                  Пропустити вправу
                </button>
              </div>
            </div>
          }
        }

        @case ('resting') {
          <app-strength-rest
            [remainingSec]="strength.restRemainingSec()"
            [progressPercent]="restProgress()"
            [nextPreview]="nextPreview()"
            [animationMode]="settings.timerAnimationStyle()"
            (skip)="strength.skipRest()"
            (extend)="strength.extendRest($event)"
          />
        }

        @case ('finished') {
          <app-strength-finish
            [templateName]="strength.template()?.name ?? ''"
            [exerciseCount]="strength.exerciseCount()"
            (finish)="onFinish($event)"
          />
        }
      }
    </div>
  `,
})
export class StrengthComponent implements OnInit {
  protected strength = inject(StrengthService);
  private workday = inject(WorkdayService);
  protected router = inject(Router);
  protected settings = inject(SettingsService);
  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);

  selectedMode = signal<WorkoutMode>('circuit');
  showTechnique = signal(false);

  readonly difficultyOptions: { value: DifficultyLevel; label: string }[] = [
    { value: 'easy', label: 'Легко' },
    { value: 'medium', label: 'Середньо' },
    { value: 'hard', label: 'Важко' },
  ];

  private effectiveParams = computed(() => {
    const es = this.strength.currentExerciseState();
    if (!es) return { reps: null, durationSec: null, note: undefined };
    return this.strength.getEffectiveParams(es.exercise);
  });

  effectiveReps = computed(() => this.effectiveParams().reps);
  effectiveDuration = computed(() => this.effectiveParams().durationSec);
  effectiveNote = computed(() => this.effectiveParams().note);

  exerciseProgress = computed(() => {
    const total = this.strength.exerciseCount();
    if (total === 0) return 0;
    return ((this.strength.currentExerciseIndex() + 1) / total) * 100;
  });

  restProgress = computed(() => {
    const total = this.strength.restTotalSec();
    if (total <= 0) return 0;
    return ((total - this.strength.restRemainingSec()) / total) * 100;
  });

  nextPreview = computed(() => {
    if (this.strength.mode() === 'circuit') {
      const round = this.strength.currentRound();
      const total = this.strength.totalRounds();
      return `Раунд ${round + 1} / ${total}`;
    }

    const es = this.strength.currentExerciseState();
    if (!es) return null;

    if (es.completedSets.length < es.targetSets) {
      return `Підхід ${es.completedSets.length + 1} / ${es.targetSets}`;
    }

    const idx = this.strength.currentExerciseIndex();
    if (idx < this.strength.exerciseCount() - 1) {
      return 'Наступна вправа';
    }

    return null;
  });

  ngOnInit(): void {
    this.strength.loadStrengthTemplates().catch(() => {
      this.snackBar.open('Не вдалося завантажити шаблони тренувань.', 'OK', { duration: 5000 });
    });
    this.destroyRef.onDestroy(() => {
      if (this.strength.state() === 'resting') {
        this.strength.skipRest();
      }
      this.workday.endActivity();
    });
  }

  async onPickTemplate(template: WorkoutTemplate): Promise<void> {
    try {
      this.workday.startActivity('strength');
      await this.strength.loadTemplate(template.id);
      this.strength.start(this.selectedMode());
      this.showTechnique.set(true);
    } catch {
      this.snackBar.open('Не вдалося завантажити тренування.', 'OK', { duration: 5000 });
    }
  }

  onCompleteSet(): void {
    this.strength.completeSet();
    this.showTechnique.set(false);
  }

  async onFinish(mood?: MoodRating): Promise<void> {
    try {
      await this.strength.saveWorkoutLog(mood);
      this.strength.reset();
      await this.workday.endActivity();
      this.router.navigate(['/dashboard']);
    } catch {
      this.snackBar.open('Не вдалося зберегти результат тренування.', 'OK', { duration: 5000 });
    }
  }
}
