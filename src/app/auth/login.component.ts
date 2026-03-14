import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  styles: `
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      min-height: 100dvh;
      padding: 16px;
      background: var(--mat-sys-surface);
    }

    .login-wrapper {
      width: 100%;
      max-width: 400px;
    }

    .app-title {
      text-align: center;
      margin-bottom: 24px;
      font-size: 2rem;
      font-weight: 700;
      color: var(--mat-sys-primary);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    mat-form-field {
      width: 100%;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.85rem;

      &::before,
      &::after {
        content: '';
        flex: 1;
        border-top: 1px solid var(--mat-sys-outline-variant);
      }
    }

    .google-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    mat-progress-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
    }
  `,
  template: `
    <div class="login-wrapper">
      <div class="app-title">FitBreak</div>

      <mat-card appearance="outlined">
        @if (loading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        <mat-card-content>
          <form (ngSubmit)="onEmailLogin()">
            <mat-form-field>
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                autocomplete="email"
                [disabled]="loading()"
              />
            </mat-form-field>

            <mat-form-field>
              <mat-label>Пароль</mat-label>
              <input
                matInput
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="current-password"
                [disabled]="loading()"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Сховати пароль' : 'Показати пароль'"
              >
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <div class="actions">
              <button mat-flat-button type="submit" [disabled]="loading()">Увійти</button>

              <div class="divider">або</div>

              <button
                mat-outlined-button
                type="button"
                class="google-btn"
                (click)="onGoogleLogin()"
                [disabled]="loading()"
              >
                <mat-icon>login</mat-icon>
                Увійти через Google
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  email = '';
  password = '';
  loading = signal(false);
  showPassword = signal(false);

  async onEmailLogin(): Promise<void> {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    try {
      await this.auth.signInWithEmail(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch {
      this.snackBar.open('Невірний email або пароль', 'OK', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  async onGoogleLogin(): Promise<void> {
    this.loading.set(true);
    try {
      await this.auth.signInWithGoogle();
    } catch {
      this.snackBar.open('Помилка входу через Google', 'OK', { duration: 4000 });
      this.loading.set(false);
    }
  }
}
