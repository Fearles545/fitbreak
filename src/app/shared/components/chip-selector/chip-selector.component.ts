import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-chip-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule],
  styles: `
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .chip {
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      font-size: 0.85rem;
      cursor: pointer;
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
  `,
  template: `
    <div class="chips" role="radiogroup" [attr.aria-label]="ariaLabel()">
      @for (opt of options(); track opt) {
        <button
          class="chip"
          [class.selected]="selected() === opt && !customActive()"
          (click)="onSelect(opt)"
          role="radio"
          [attr.aria-checked]="selected() === opt && !customActive()"
        >
          {{ opt }} {{ suffix() }}
        </button>
      }
      @if (allowCustom()) {
        <button
          class="chip"
          [class.selected]="customActive()"
          (click)="onCustomClick()"
          role="radio"
          [attr.aria-checked]="customActive()"
        >
          Інше
        </button>
      }
    </div>
    @if (allowCustom() && customActive()) {
      <mat-form-field class="custom-input" appearance="outline">
        <input
          matInput
          type="number"
          [min]="customMin()"
          [max]="customMax()"
          [ngModel]="selected()"
          (ngModelChange)="onCustomInput($event)"
          [attr.aria-label]="'Власне значення в ' + suffix()"
        />
        <span matTextSuffix>{{ suffix() }}</span>
      </mat-form-field>
    }
  `,
})
export class ChipSelectorComponent {
  private destroyRef = inject(DestroyRef);

  options = input.required<number[]>();
  selected = model.required<number>();
  ariaLabel = input('');
  suffix = input('');
  allowCustom = input(false);
  customMin = input(0);
  customMax = input(999);

  change = output<number>();

  customActive = signal(false);
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
    });
  }

  /** Called by parent after loading saved value to set initial custom state */
  syncCustomState(): void {
    this.customActive.set(!this.options().includes(this.selected()));
  }

  onSelect(value: number): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.selected.set(value);
    this.customActive.set(false);
    this.change.emit(value);
  }

  onCustomClick(): void {
    this.customActive.set(true);
  }

  onCustomInput(value: number): void {
    const min = this.customMin();
    const max = this.customMax();
    if (value < min || value > max) return;
    this.selected.set(value);

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.change.emit(value), 500);
  }
}
