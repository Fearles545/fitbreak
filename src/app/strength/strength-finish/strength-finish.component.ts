import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MoodPickerComponent } from '@shared/components/mood-picker/mood-picker.component';
import type { MoodRating } from '@shared/models/fitbreak.models';

@Component({
  selector: 'app-strength-finish',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MoodPickerComponent],
  styles: `
    :host {
      display: block;
      text-align: center;
      padding-top: 48px;
    }

    .summary-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin-bottom: 24px;
    }

    .summary-stats {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 32px;
      text-align: left;
      max-width: 250px;
      margin-left: auto;
      margin-right: auto;
    }

    .stat {
      display: flex;
      justify-content: space-between;
      font-size: 0.95rem;
    }

    .stat-label {
      color: var(--mat-sys-on-surface-variant);
    }

    .stat-value {
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }
  `,
  template: `
    <div class="summary-title">Тренування завершено! 🎉</div>

    <div class="summary-stats">
      <div class="stat">
        <span class="stat-label">Програма</span>
        <span class="stat-value">{{ templateName() }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Вправ</span>
        <span class="stat-value">{{ exerciseCount() }}</span>
      </div>
    </div>

    <app-mood-picker [(selected)]="selectedMood" />

    <button mat-flat-button (click)="finish.emit(selectedMood() ?? undefined)">Зберегти і вийти</button>
  `,
})
export class StrengthFinishComponent {
  templateName = input.required<string>();
  exerciseCount = input.required<number>();

  finish = output<MoodRating | undefined>();

  selectedMood = signal<MoodRating | null>(null);
}
