import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import type { MicroBreakRotation } from '@shared/models/fitbreak.models';
import type { RotationOption } from '../break-timer.service';

@Component({
  selector: 'app-break-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  styles: `
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

    .suggested-icon { font-size: 2rem; line-height: 1; }

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

    .prompt-links {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
    }

    .choose-link {
      color: var(--mat-sys-primary);
      cursor: pointer;
      font-size: 0.85rem;
      background: none;
      border: none;
      text-decoration: underline;
    }

    .link-divider {
      color: var(--mat-sys-outline-variant);
      font-size: 0.8rem;
    }

    .extend-section {
      margin-top: 16px;
      padding: 16px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container);
    }

    .extend-label {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 12px;
    }

    .duration-chips {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .duration-chip {
      flex: 1;
      padding: 8px 0;
      border-radius: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      font-size: 0.85rem;
      cursor: pointer;
    }

    .duration-chip.selected {
      background: var(--mat-sys-primary-container);
      border-color: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary-container);
      font-weight: 500;
    }

    .extend-reason {
      width: 100%;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      font-size: 0.85rem;
      margin-bottom: 12px;
      box-sizing: border-box;
    }

    .extend-reason:focus {
      outline: none;
      border-color: var(--mat-sys-primary);
    }

    .extend-reason::placeholder {
      color: var(--mat-sys-on-surface-variant);
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

    .rotation-option-icon { font-size: 1.3rem; }

    .rotation-option-info { flex: 1; }

    .rotation-option-name {
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .rotation-option-meta {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  template: `
    <div class="prompt-title">⏰ Час на перерву!</div>

    @if (suggestedOption(); as option) {
      <div class="suggested-card">
        <div class="suggested-icon">{{ option.icon }}</div>
        <div class="suggested-name">{{ option.name }}</div>
        <div class="suggested-meta">
          ~{{ option.durationMin }} хв · {{ option.exerciseCount }} вправ
        </div>
      </div>
    }

    <div class="prompt-actions">
      <button mat-flat-button (click)="startSuggested.emit()">Почати розминку</button>
      <button matButton="outlined" (click)="showExtend.set(!showExtend())">
        {{ showExtend() ? 'Сховати' : 'Потрібно ще працювати' }}
      </button>
    </div>

    @if (showExtend()) {
      <div class="extend-section">
        <div class="extend-label">На скільки продовжити?</div>
        <div class="duration-chips">
          @for (opt of extendOptions; track opt.min) {
            <button
              class="duration-chip"
              [class.selected]="selectedExtendMin() === opt.min"
              (click)="selectedExtendMin.set(opt.min)"
            >
              {{ opt.label }}
            </button>
          }
        </div>
        <input
          class="extend-reason"
          placeholder="Причина (необов'язково)"
          aria-label="Причина продовження"
          [value]="extendReason()"
          (input)="onReasonInput($event)"
        />
        <button mat-flat-button [disabled]="!selectedExtendMin()" (click)="onExtendClick()">
          Продовжити роботу
        </button>
      </div>
    }

    <div class="prompt-links">
      <button class="choose-link" (click)="showOptions.set(!showOptions())">
        {{ showOptions() ? 'Сховати' : 'Обрати іншу' }}
      </button>
      <span class="link-divider">·</span>
      <button class="choose-link" (click)="skip.emit()">Пропустити</button>
      <span class="link-divider">·</span>
      <button class="choose-link" (click)="endDay.emit()">Завершити день</button>
    </div>

    @if (showOptions()) {
      <div class="rotation-options">
        @for (option of rotationOptions(); track option.key) {
          @if (!option.isSuggested) {
            <button class="rotation-option" (click)="pickRotation.emit(option.key)">
              <span class="rotation-option-icon">{{ option.icon }}</span>
              <div class="rotation-option-info">
                <div class="rotation-option-name">{{ option.name }}</div>
                <div class="rotation-option-meta">
                  ~{{ option.durationMin }} хв · {{ option.exerciseCount }} вправ
                </div>
              </div>
            </button>
          }
        }
      </div>
    }
  `,
})
export class BreakPromptComponent {
  suggestedOption = input.required<RotationOption | null>();
  rotationOptions = input.required<RotationOption[]>();

  startSuggested = output();
  pickRotation = output<MicroBreakRotation>();
  extendWork = output<{ minutes: number; reason?: string }>();
  skip = output();
  endDay = output();

  showOptions = signal(false);
  showExtend = signal(false);
  selectedExtendMin = signal<number | null>(null);
  extendReason = signal('');

  readonly extendOptions = [
    { min: 10, label: '10 хв' },
    { min: 15, label: '15 хв' },
    { min: 30, label: '30 хв' },
  ];

  onReasonInput(event: Event): void {
    this.extendReason.set((event.target as HTMLInputElement).value);
  }

  onExtendClick(): void {
    const minutes = this.selectedExtendMin();
    if (!minutes) return;
    this.extendWork.emit({ minutes, reason: this.extendReason() || undefined });
  }
}
