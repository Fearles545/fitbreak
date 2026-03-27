import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InstallPromptComponent } from '@shared/components/install-prompt/install-prompt.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, InstallPromptComponent],
  template: `
    <router-outlet />
    <app-install-prompt />
  `,
})
export class App implements OnInit {
  private swUpdate = inject(SwUpdate);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        const ref = this.snackBar.open('Доступне оновлення', 'Оновити');
        ref.onAction().subscribe(() => document.location.reload());
      }
    });
  }
}
