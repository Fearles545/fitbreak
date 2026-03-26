import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import type { MoodRating } from '@shared/models/fitbreak.models';

@Component({
  selector: 'app-mood-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      margin-bottom: 32px;
      text-align: center;
    }

    .mood-label {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 12px;
    }

    .mood-options {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .mood-btn {
      font-size: 1.8rem;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mood-btn.selected {
      border-color: var(--mat-sys-primary);
      background: var(--mat-sys-primary-container);
    }
  `,
  template: `
    @if (showLabel()) {
      <div class="mood-label">Як ти себе почуваєш?</div>
    }
    <div class="mood-options" role="radiogroup" aria-label="Як ти себе почуваєш?">
      @for (m of moodOptions; track m.value) {
        <button
          class="mood-btn"
          [class.selected]="selected() === m.value"
          (click)="selected.set(m.value)"
          role="radio"
          [attr.aria-checked]="selected() === m.value"
          [attr.aria-label]="m.label"
        >
          {{ m.emoji }}
        </button>
      }
    </div>
  `,
})
export class MoodPickerComponent {
  selected = model<MoodRating | null>(null);
  showLabel = input(true);

  readonly moodOptions: readonly { value: MoodRating; emoji: string; label: string }[] = [
    { value: 'great', emoji: '😊', label: 'Чудово' },
    { value: 'good', emoji: '🙂', label: 'Добре' },
    { value: 'okay', emoji: '😐', label: 'Нормально' },
    { value: 'bad', emoji: '😫', label: 'Погано' },
  ];
}
