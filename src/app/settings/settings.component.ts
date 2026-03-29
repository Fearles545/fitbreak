import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  viewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChipSelectorComponent } from '@shared/components/chip-selector/chip-selector.component';
import { SettingsService } from './settings.service';
import { SessionService } from '@shared/services/session.service';
import { DeviceContextService } from '@shared/services/device-context.service';
import { AudioService } from '@shared/services/audio.service';
import { PushService } from '@shared/services/push.service';
import type { BreakNotificationSound, VibrationPattern } from '@shared/models/fitbreak.models';
import type { TablesUpdate } from '@shared/models/database.types';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatSlideToggleModule, ChipSelectorComponent],
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

    /* Animation chips — string-based, no custom */
    .anim-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .anim-chip {
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      font-size: 0.85rem;
      cursor: pointer;
    }

    .anim-chip.selected {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      border-color: var(--mat-sys-primary);
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .toggle-label {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface);
    }

    .permission-hint {
      font-size: 0.75rem;
      color: var(--mat-sys-error);
      margin-top: 4px;
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
          <app-chip-selector
            [options]="breakIntervalOptions"
            [(selected)]="breakInterval"
            [allowCustom]="true"
            [customMin]="15"
            [customMax]="120"
            suffix="хв"
            ariaLabel="Інтервал між перервами"
            (change)="save({ default_break_interval_min: $event })"
          />
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
          <app-chip-selector
            [options]="stepperDurationOptions"
            [(selected)]="stepperDuration"
            [allowCustom]="true"
            [customMin]="5"
            [customMax]="120"
            suffix="хв"
            ariaLabel="Тривалість степера"
            (change)="save({ default_stepper_duration_min: $event })"
          />
        </div>
        <div class="setting-group">
          <div class="setting-label">Сигнал кожні</div>
          <app-chip-selector
            [options]="stepperIntervalOptions"
            [(selected)]="stepperInterval"
            [allowCustom]="true"
            [customMin]="1"
            [customMax]="30"
            suffix="хв"
            ariaLabel="Інтервал сигналу степера"
            (change)="save({ default_stepper_interval_min: $event })"
          />
        </div>
      </div>

      <!-- Таймер -->
      <div class="section">
        <div class="section-title">Таймер</div>
        <div class="setting-group">
          <div class="setting-label">Анімація таймера</div>
          <div class="anim-chips" role="radiogroup" aria-label="Анімація таймера">
            @for (opt of timerAnimationOptions; track opt.value) {
              <button
                class="anim-chip"
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
          <app-chip-selector
            [options]="restOptions"
            [(selected)]="restBetweenSets"
            [allowCustom]="true"
            [customMin]="15"
            [customMax]="300"
            suffix="сек"
            ariaLabel="Відпочинок між підходами"
            (change)="save({ default_rest_between_sets_sec: $event })"
          />
        </div>
      </div>

      <!-- Сповіщення -->
      <div class="section">
        <div class="section-title">Сповіщення</div>

        <div class="setting-group">
          <div class="setting-label">Звук перерви</div>
          <div class="anim-chips" role="radiogroup" aria-label="Звук перерви">
            @for (opt of soundOptions; track opt.value) {
              <button
                class="anim-chip"
                [class.selected]="notificationSound() === opt.value"
                (click)="setNotificationSound(opt.value)"
                role="radio"
                [attr.aria-checked]="notificationSound() === opt.value"
              >
                {{ opt.label }}
              </button>
            }
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-label">Повторення</div>
          <div class="anim-chips" role="radiogroup" aria-label="Повторення нагадування">
            @for (opt of reminderCountOptions; track opt.value) {
              <button
                class="anim-chip"
                [class.selected]="reminderCount() === opt.value"
                (click)="setReminderCount(opt.value)"
                role="radio"
                [attr.aria-checked]="reminderCount() === opt.value"
              >
                {{ opt.label }}
              </button>
            }
          </div>
        </div>

        @if (reminderCount() > 1) {
          <div class="setting-group">
            <div class="setting-label">Інтервал повторення</div>
            <div class="anim-chips" role="radiogroup" aria-label="Інтервал повторення">
              @for (opt of reminderIntervalOptions; track opt.value) {
                <button
                  class="anim-chip"
                  [class.selected]="reminderInterval() === opt.value"
                  (click)="setReminderInterval(opt.value)"
                  role="radio"
                  [attr.aria-checked]="reminderInterval() === opt.value"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>
        }

        @if (device.hasVibration()) {
          <div class="setting-group">
            <div class="setting-label">Вібрація</div>
            <div class="anim-chips" role="radiogroup" aria-label="Вібрація">
              @for (opt of vibrationOptions; track opt.value) {
                <button
                  class="anim-chip"
                  [class.selected]="vibrationPattern() === opt.value"
                  (click)="setVibrationPattern(opt.value)"
                  role="radio"
                  [attr.aria-checked]="vibrationPattern() === opt.value"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>
        }

        @if (device.hasNotificationApi()) {
          <div class="setting-group">
            <div class="toggle-row">
              <span class="toggle-label">Сповіщення на екрані</span>
              <mat-slide-toggle
                [checked]="systemNotification()"
                [disabled]="device.notificationPermission() === 'denied'"
                (change)="toggleSystemNotification($event.checked)"
              />
            </div>
            @if (device.notificationPermission() === 'denied') {
              <div class="permission-hint">
                Дозвіл заблоковано в налаштуваннях браузера
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private sessionService = inject(SessionService);
  private audioService = inject(AudioService);
  private pushService = inject(PushService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private chipSelectors = viewChildren(ChipSelectorComponent);
  readonly device = inject(DeviceContextService);

  readonly breakIntervalOptions = [30, 45, 60];
  readonly stepperDurationOptions = [20, 30, 45, 60, 90];
  readonly stepperIntervalOptions = [3, 5, 10, 15];
  readonly restOptions = [30, 60, 90, 120];

  breakInterval = signal(45);
  stepperDuration = signal(60);
  stepperInterval = signal(5);
  restBetweenSets = signal(60);
  timerAnimation = signal<string>('roll');

  // Notification settings
  notificationSound = signal<BreakNotificationSound>('default');
  reminderCount = signal(1);
  reminderInterval = signal(60);
  vibrationPattern = signal<VibrationPattern>('double');
  systemNotification = signal(true);

  readonly timerAnimationOptions = [
    { value: 'roll', label: 'Прокрутка' },
    { value: 'fade', label: 'Згасання' },
    { value: 'scale', label: 'Пульс' },
    { value: 'blur', label: 'Розмиття' },
    { value: 'slot', label: 'Барабан' },
  ];

  readonly soundOptions: { value: BreakNotificationSound; label: string }[] = [
    { value: 'default', label: 'Стандартний' },
    { value: 'gentle', label: "М'який" },
    { value: 'energetic', label: 'Енергійний' },
  ];

  readonly reminderCountOptions = [
    { value: 1, label: '1 раз' },
    { value: 3, label: '3 рази' },
    { value: 5, label: '5 разів' },
    { value: 0, label: 'Вимкнено' },
  ];

  readonly reminderIntervalOptions = [
    { value: 30, label: '30 сек' },
    { value: 60, label: '1 хв' },
    { value: 120, label: '2 хв' },
  ];

  readonly vibrationOptions: { value: VibrationPattern; label: string }[] = [
    { value: 'short', label: 'Коротка' },
    { value: 'long', label: 'Довга' },
    { value: 'double', label: 'Подвійна' },
    { value: 'off', label: 'Вимк.' },
  ];

  hasActiveSession = computed(() => !!this.sessionService.session());

  async ngOnInit(): Promise<void> {
    await this.settingsService.ensureLoaded();
    const s = this.settingsService.settings();
    if (s) {
      this.breakInterval.set(s.default_break_interval_min ?? 45);
      this.stepperDuration.set(s.default_stepper_duration_min ?? 60);
      this.stepperInterval.set(s.default_stepper_interval_min ?? 5);
      this.restBetweenSets.set(s.default_rest_between_sets_sec ?? 60);
      this.timerAnimation.set(s.timer_animation_style ?? 'roll');
      this.notificationSound.set(s.break_notification_sound ?? 'default');
      this.reminderCount.set(s.break_reminder_count ?? 1);
      this.reminderInterval.set(s.break_reminder_interval_sec ?? 60);
      this.vibrationPattern.set(s.break_vibration_pattern ?? 'double');
      this.systemNotification.set(s.enable_break_system_notification ?? true);

      // Sync custom state after values are loaded
      setTimeout(() => {
        for (const chip of this.chipSelectors()) {
          chip.syncCustomState();
        }
      });
    }
  }

  setTimerAnimation(value: string): void {
    this.timerAnimation.set(value);
    this.save({ timer_animation_style: value });
  }

  setNotificationSound(value: BreakNotificationSound): void {
    this.notificationSound.set(value);
    this.audioService.playBreakSound(value);
    this.save({ break_notification_sound: value });
  }

  setReminderCount(value: number): void {
    this.reminderCount.set(value);
    this.save({ break_reminder_count: value });
  }

  setReminderInterval(value: number): void {
    this.reminderInterval.set(value);
    this.save({ break_reminder_interval_sec: value });
  }

  setVibrationPattern(value: VibrationPattern): void {
    this.vibrationPattern.set(value);
    if (value !== 'off' && this.device.hasVibration()) {
      const patterns: Record<string, number[]> = {
        short: [200],
        long: [500],
        double: [200, 100, 200],
      };
      navigator.vibrate(patterns[value]);
    }
    this.save({ break_vibration_pattern: value });
  }

  async toggleSystemNotification(checked: boolean): Promise<void> {
    if (checked) {
      // Subscribe if not already subscribed (first time or after revoke)
      const subscribed = await this.pushService.subscribe();
      if (!subscribed) {
        this.systemNotification.set(false);
        return;
      }
    }
    // Don't unsubscribe on disable — just save the preference.
    // Edge Function checks this flag before sending.
    // Keeps subscription alive so re-enabling doesn't need a new permission prompt.
    this.systemNotification.set(checked);
    this.save({ enable_break_system_notification: checked });
  }

  onBack(): void {
    this.router.navigate(['/dashboard']);
  }

  async save(changes: TablesUpdate<'user_settings'>): Promise<void> {
    try {
      await this.settingsService.update(changes);
    } catch {
      this.snackBar.open('Не вдалося зберегти', 'OK', { duration: 3000 });
    }
  }
}
