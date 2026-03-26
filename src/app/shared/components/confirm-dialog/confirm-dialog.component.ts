import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  styles: `
    :host {
      display: block;
      padding: 24px;
    }

    .dialog-message {
      font-size: 1rem;
      color: var(--mat-sys-on-surface);
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 20px;
    }
  `,
  template: `
    <div class="dialog-message">{{ data.message }}</div>
    <div class="dialog-actions">
      <button matButton="text" (click)="dialogRef.close(false)">
        {{ data.cancelLabel ?? 'Скасувати' }}
      </button>
      <button mat-flat-button (click)="dialogRef.close(true)">
        {{ data.confirmLabel ?? 'Так' }}
      </button>
    </div>
  `,
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
}
