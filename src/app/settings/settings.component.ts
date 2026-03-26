import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SettingsService } from './settings.service';
import { DashboardService } from '../dashboard/dashboard.service';
import type { TablesUpdate } from '@shared/models/database.types';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
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

    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 32px;
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin: 0;
    }

    .section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--mat-sys-primary);
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .setting-group {
      margin-bottom: 20px;
    }

    .setting-label {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 8px;
    }

    .chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .chip {
      padding: 8px 20px;
      border-radius: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      cursor: pointer;
      font-size: 0.9rem;
      transition:
        background 0.15s,
        border-color 0.15s;
    }

    .chip:hover {
      background: var(--mat-sys-surface-container);
    }

    .chip.selected {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      border-color: var(--mat-sys-primary);
    }

    .custom-input {
      width: 120px;
      margin-top: 12px;
    }

    .hint {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .hint mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
  `,
  template: `
    <div class="container">
      <div class="header">
        <button mat-icon-button (click)="onBack()" aria-label="Назад">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Налаштування</h1>
      </div>

      <!-- Перерви -->
      <div class="section">
        <div class="section-title">Перерви</div>

        <div class="setting-group">
          <div class="setting-label">Інтервал між перервами</div>
          <div class="chips" role="radiogroup" aria-label="Інтервал між перервами">
            @for (opt of breakIntervalOptions; track opt) {
              <button
                class="chip"
                [class.selected]="breakInterval() === opt && !breakCustomActive()"
                (click)="setBreakInterval(opt)"
                role="radio"
                [attr.aria-checked]="breakInterval() === opt && !breakCustomActive()"
              >
                {{ opt }} хв
              </button>
            }
            <button
              class="chip"
              [class.selected]="breakCustomActive()"
              (click)="activateBreakCustom()"
              role="radio"
              [attr.aria-checked]="breakCustomActive()"
            >
              Інше
            </button>
          </div>
          @if (breakCustomActive()) {
            <mat-form-field class="custom-input" appearance="outline">
              <input
                matInput
                type="number"
                [min]="15"
                [max]="120"
                [ngModel]="breakInterval()"
                (ngModelChange)="setBreakInterval($event)"
                aria-label="Власний інтервал у хвилинах"
              />
              <span matTextSuffix>хв</span>
            </mat-form-field>
          }
          @if (hasActiveSession()) {
            <div class="hint">
              <mat-icon>info</mat-icon>
              Зміни застосуються з наступного робочого дня
            </div>
          }
        </div>
      </div>

      <!-- Степер -->
      <div class="section">
        <div class="section-title">Степер</div>

        <div class="setting-group">
          <div class="setting-label">Тривалість за замовчуванням</div>
          <div class="chips" role="radiogroup" aria-label="Тривалість степера">
            @for (opt of stepperDurationOptions; track opt) {
              <button
                class="chip"
                [class.selected]="stepperDuration() === opt && !stepperDurationCustomActive()"
                (click)="setStepperDuration(opt)"
                role="radio"
                [attr.aria-checked]="stepperDuration() === opt && !stepperDurationCustomActive()"
              >
                {{ opt }} хв
              </button>
            }
            <button
              class="chip"
              [class.selected]="stepperDurationCustomActive()"
              (click)="activateStepperDurationCustom()"
              role="radio"
              [attr.aria-checked]="stepperDurationCustomActive()"
            >
              Інше
            </button>
          </div>
          @if (stepperDurationCustomActive()) {
            <mat-form-field class="custom-input" appearance="outline">
              <input
                matInput
                type="number"
                [min]="5"
                [max]="120"
                [ngModel]="stepperDuration()"
                (ngModelChange)="setStepperDuration($event)"
                aria-label="Власна тривалість у хвилинах"
              />
              <span matTextSuffix>хв</span>
            </mat-form-field>
          }
        </div>

        <div class="setting-group">
          <div class="setting-label">Сигнал кожні</div>
          <div class="chips" role="radiogroup" aria-label="Інтервал сигналу степера">
            @for (opt of stepperIntervalOptions; track opt) {
              <button
                class="chip"
                [class.selected]="stepperInterval() === opt && !stepperIntervalCustomActive()"
                (click)="setStepperInterval(opt)"
                role="radio"
                [attr.aria-checked]="stepperInterval() === opt && !stepperIntervalCustomActive()"
              >
                {{ opt }} хв
              </button>
            }
            <button
              class="chip"
              [class.selected]="stepperIntervalCustomActive()"
              (click)="activateStepperIntervalCustom()"
              role="radio"
              [attr.aria-checked]="stepperIntervalCustomActive()"
            >
              Інше
            </button>
          </div>
          @if (stepperIntervalCustomActive()) {
            <mat-form-field class="custom-input" appearance="outline">
              <input
                matInput
                type="number"
                [min]="1"
                [max]="30"
                [ngModel]="stepperInterval()"
                (ngModelChange)="setStepperInterval($event)"
                aria-label="Власний інтервал сигналу у хвилинах"
              />
              <span matTextSuffix>хв</span>
            </mat-form-field>
          }
        </div>
      </div>

      <!-- Таймер -->
      <div class="section">
        <div class="section-title">Таймер</div>

        <div class="setting-group">
          <div class="setting-label">Анімація таймера</div>
          <div class="chips" role="radiogroup" aria-label="Анімація таймера">
            @for (opt of timerAnimationOptions; track opt.value) {
              <button
                class="chip"
                [class.selected]="timerAnimation() === opt.value"
                (click)="setTimerAnimation(opt.value)"
                role="radio"
                [attr.aria-checked]="timerAnimation() === opt.value"
              >
                {{ opt.label }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Силове -->
      <div class="section">
        <div class="section-title">Силове</div>

        <div class="setting-group">
          <div class="setting-label">Відпочинок між підходами</div>
          <div class="chips" role="radiogroup" aria-label="Відпочинок між підходами">
            @for (opt of restOptions; track opt) {
              <button
                class="chip"
                [class.selected]="restBetweenSets() === opt && !restCustomActive()"
                (click)="setRestBetweenSets(opt)"
                role="radio"
                [attr.aria-checked]="restBetweenSets() === opt && !restCustomActive()"
              >
                {{ opt }} сек
              </button>
            }
            <button
              class="chip"
              [class.selected]="restCustomActive()"
              (click)="activateRestCustom()"
              role="radio"
              [attr.aria-checked]="restCustomActive()"
            >
              Інше
            </button>
          </div>
          @if (restCustomActive()) {
            <mat-form-field class="custom-input" appearance="outline">
              <input
                matInput
                type="number"
                [min]="15"
                [max]="300"
                [ngModel]="restBetweenSets()"
                (ngModelChange)="setRestBetweenSets($event)"
                aria-label="Власний час відпочинку у секундах"
              />
              <span matTextSuffix>сек</span>
            </mat-form-field>
          }
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private dashboard = inject(DashboardService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  readonly breakIntervalOptions = [30, 45, 60];
  readonly stepperDurationOptions = [20, 30, 45, 60, 90];
  readonly stepperIntervalOptions = [3, 5, 10, 15];
  readonly restOptions = [30, 60, 90, 120];

  breakInterval = signal(45);
  stepperDuration = signal(60);
  stepperInterval = signal(5);
  restBetweenSets = signal(60);
  timerAnimation = signal<string>('roll');

  readonly timerAnimationOptions = [
    { value: 'roll', label: 'Прокрутка' },
    { value: 'fade', label: 'Згасання' },
    { value: 'scale', label: 'Пульс' },
    { value: 'blur', label: 'Розмиття' },
    { value: 'slot', label: 'Барабан' },
  ];

  breakCustomActive = signal(false);
  stepperDurationCustomActive = signal(false);
  stepperIntervalCustomActive = signal(false);
  restCustomActive = signal(false);

  hasActiveSession = computed(() => !!this.dashboard.session());

  async ngOnInit(): Promise<void> {
    await this.settingsService.ensureLoaded();
    const s = this.settingsService.settings();
    if (s) {
      this.breakInterval.set(s.default_break_interval_min ?? 45);
      this.stepperDuration.set(s.default_stepper_duration_min ?? 60);
      this.stepperInterval.set(s.default_stepper_interval_min ?? 5);
      this.restBetweenSets.set(s.default_rest_between_sets_sec ?? 60);

      this.breakCustomActive.set(!this.breakIntervalOptions.includes(this.breakInterval()));
      this.stepperDurationCustomActive.set(
        !this.stepperDurationOptions.includes(this.stepperDuration()),
      );
      this.stepperIntervalCustomActive.set(
        !this.stepperIntervalOptions.includes(this.stepperInterval()),
      );
      this.restCustomActive.set(!this.restOptions.includes(this.restBetweenSets()));
      this.timerAnimation.set(s.timer_animation_style ?? 'flip');
    }
  }

  setBreakInterval(value: number): void {
    if (value < 15 || value > 120) return;
    this.breakInterval.set(value);
    this.breakCustomActive.set(!this.breakIntervalOptions.includes(value));
    this.save({ default_break_interval_min: value });
  }

  setStepperDuration(value: number): void {
    if (value < 5 || value > 120) return;
    this.stepperDuration.set(value);
    this.stepperDurationCustomActive.set(!this.stepperDurationOptions.includes(value));
    this.save({ default_stepper_duration_min: value });
  }

  setStepperInterval(value: number): void {
    if (value < 1 || value > 30) return;
    this.stepperInterval.set(value);
    this.stepperIntervalCustomActive.set(!this.stepperIntervalOptions.includes(value));
    this.save({ default_stepper_interval_min: value });
  }

  setRestBetweenSets(value: number): void {
    if (value < 15 || value > 300) return;
    this.restBetweenSets.set(value);
    this.restCustomActive.set(!this.restOptions.includes(value));
    this.save({ default_rest_between_sets_sec: value });
  }

  setTimerAnimation(value: string): void {
    this.timerAnimation.set(value);
    this.save({ timer_animation_style: value });
  }

  activateBreakCustom(): void {
    this.breakCustomActive.set(true);
  }

  activateStepperDurationCustom(): void {
    this.stepperDurationCustomActive.set(true);
  }

  activateStepperIntervalCustom(): void {
    this.stepperIntervalCustomActive.set(true);
  }

  activateRestCustom(): void {
    this.restCustomActive.set(true);
  }

  onBack(): void {
    this.router.navigate(['/dashboard']);
  }

  private async save(changes: TablesUpdate<'user_settings'>): Promise<void> {
    try {
      await this.settingsService.update(changes);
    } catch {
      this.snackBar.open('Не вдалося зберегти', 'OK', { duration: 3000 });
    }
  }
}
