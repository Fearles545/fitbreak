import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-install-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (visible()) {
      <div class="install-banner">
        <span>Додай FitBreak на головний екран</span>
        <button mat-button (click)="install()">
          <mat-icon>install_mobile</mat-icon>
          Встановити
        </button>
        <button mat-icon-button (click)="dismiss()" aria-label="Закрити">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    }
  `,
  styles: `
    .install-banner {
      position: fixed;
      bottom: 80px;
      left: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      border-radius: 12px;
      box-shadow: var(--mat-sys-level3);
      z-index: 1000;
      animation: slide-up 0.3s ease-out;

      span {
        flex: 1;
        font-weight: 500;
      }
    }

    @keyframes slide-up {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
})
export class InstallPromptComponent implements OnInit, OnDestroy {
  protected readonly visible = signal(false);
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private boundHandler = this.onBeforeInstallPrompt.bind(this);

  ngOnInit(): void {
    if (localStorage.getItem('pwa-install-dismissed')) return;

    window.addEventListener('beforeinstallprompt', this.boundHandler as EventListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeinstallprompt', this.boundHandler as EventListener);
  }

  private onBeforeInstallPrompt(event: BeforeInstallPromptEvent): void {
    event.preventDefault();
    this.deferredPrompt = event;
    this.visible.set(true);
  }

  protected async install(): Promise<void> {
    if (!this.deferredPrompt) return;

    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      this.visible.set(false);
    }
    this.deferredPrompt = null;
  }

  protected dismiss(): void {
    localStorage.setItem('pwa-install-dismissed', 'true');
    this.visible.set(false);
    this.deferredPrompt = null;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
