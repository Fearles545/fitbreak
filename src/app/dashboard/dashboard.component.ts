import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TimerRingComponent } from '@shared/components/timer-ring/timer-ring.component';
import { WeekCalendarComponent } from '@shared/components/week-calendar/week-calendar.component';
import { AudioService } from '@shared/services/audio.service';
import { BreakNotifierService } from '@shared/services/break-notifier.service';
import { AuthService } from '../auth/auth.service';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TimerRingComponent,
    WeekCalendarComponent,
  ],
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
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .greeting {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin: 0;
    }

    .date {
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 2px;
    }

    .streak {
      text-align: center;
      margin: 16px 0 24px;
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .streak-count {
      font-weight: 700;
      color: var(--mat-sys-primary);
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 32px;
    }

    .secondary-actions {
      display: flex;
      gap: 12px;
    }

    .secondary-actions button {
      flex: 1;
    }

    /* Active session */
    .timer-section {
      display: flex;
      justify-content: center;
      margin: 16px 0 24px;
    }

    .timer-section app-timer-ring {
      width: 220px;
      height: 220px;
    }

    .next-rotation {
      text-align: center;
      padding: 16px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container);
    }

    .next-rotation-label {
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 4px;
    }

    .next-rotation-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .next-rotation-meta {
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 2px;
    }

    .day-stats {
      text-align: center;
      margin-top: 16px;
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .end-day {
      margin-top: 32px;
      text-align: center;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 64px 0;
    }

    .logout-btn {
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  template: `
    <div class="container">
      @if (dashboard.loading()) {
        <div class="loading">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <div class="header">
          <div>
            <h1 class="greeting">Привіт, {{ firstName() }}!</h1>
            <div class="date">{{ formattedDate() }}</div>
          </div>
          <button mat-icon-button class="logout-btn" (click)="onLogout()"
                  aria-label="Вийти">
            <mat-icon>logout</mat-icon>
          </button>
        </div>

        <app-week-calendar [activities]="dashboard.weekActivities()" />

        @if (dashboard.isActive()) {
          <!-- Active session view -->
          <div class="timer-section">
            <app-timer-ring
              [remainingSeconds]="remainingSeconds()"
              [totalSeconds]="totalSeconds()"
              label="до перерви" />
          </div>

          @if (nextRotation()) {
            <div class="next-rotation">
              <div class="next-rotation-label">Наступна розминка</div>
              <div class="next-rotation-name">{{ nextRotation()!.icon }} {{ nextRotation()!.name }}</div>
              <div class="next-rotation-meta">~{{ nextRotation()!.duration }} хв</div>
            </div>
          }

          <div class="day-stats">
            Перерв: {{ dashboard.completedBreaks() }} · {{ elapsedTime() }}
          </div>

          <div class="end-day">
            <button mat-outlined-button (click)="onEndWorkday()">
              Завершити робочий день
            </button>
          </div>
        } @else {
          <!-- Start screen -->
          <div class="actions">
            <button mat-flat-button (click)="onStartWorkday()">
              Почати робочий день
            </button>

            <div class="secondary-actions">
              <button mat-outlined-button disabled>
                <mat-icon>fitness_center</mat-icon>
                Силове
              </button>
              <button mat-outlined-button disabled>
                <mat-icon>directions_walk</mat-icon>
                Степер
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  protected dashboard = inject(DashboardService);
  private auth = inject(AuthService);
  private audio = inject(AudioService);
  private notifier = inject(BreakNotifierService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private now = signal(Date.now());
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private breakTriggered = false;

  private breakTrigger = effect(() => {
    const remaining = this.remainingSeconds();
    const isActive = this.dashboard.isActive();
    if (isActive && remaining === 0 && !this.breakTriggered) {
      this.breakTriggered = true;
      this.notifier.trigger();
      this.router.navigate(['/break']);
    }
    // Reset flag when timer is running again (returned from break)
    if (remaining > 0) {
      this.breakTriggered = false;
    }
  });

  // Rotation names for display
  private readonly rotationNames: Record<string, { name: string; icon: string; duration: number }> = {
    'neck-eyes': { name: 'Шия + Очі', icon: '👁️', duration: 3 },
    'thoracic-shoulders': { name: 'Грудний відділ + Плечі', icon: '🦴', duration: 4 },
    'hips-lower-back': { name: 'Стегна + Поперек', icon: '🦵', duration: 4 },
    'active': { name: 'Активна розминка', icon: '⚡', duration: 3 },
  };

  private readonly rotationOrder = ['neck-eyes', 'thoracic-shoulders', 'hips-lower-back', 'active'];

  firstName = computed(() => {
    const user = this.auth.user();
    const meta = user?.user_metadata;
    const fullName = meta?.['full_name'] ?? meta?.['name'] ?? '';
    return (fullName as string).split(' ')[0] || 'Друже';
  });

  formattedDate = computed(() => {
    return new Date().toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
    });
  });

  totalSeconds = computed(() => {
    const session = this.dashboard.session();
    return (session?.break_interval_min ?? 45) * 60;
  });

  remainingSeconds = computed(() => {
    const nextBreak = this.dashboard.nextBreakAt();
    if (!nextBreak) return 0;
    const diff = Math.floor((nextBreak - this.now()) / 1000);
    return Math.max(0, diff);
  });

  nextRotation = computed(() => {
    const session = this.dashboard.session();
    if (!session) return null;
    const idx = session.current_rotation_index ?? 0;
    const rotationKey = this.rotationOrder[idx % this.rotationOrder.length];
    return this.rotationNames[rotationKey] ?? null;
  });

  elapsedTime = computed(() => {
    const session = this.dashboard.session();
    if (!session) return '';
    const start = new Date(session.started_at).getTime();
    const elapsed = Math.floor((this.now() - start) / 1000 / 60);
    const hours = Math.floor(elapsed / 60);
    const mins = elapsed % 60;
    if (hours > 0) return `${hours}г ${mins}хв`;
    return `${mins} хв`;
  });

  ngOnInit(): void {
    this.dashboard.loadTodaySession();
    this.dashboard.loadWeekActivities();
    this.startTick();

    // Recalculate on tab return
    const onVisibility = () => {
      if (!document.hidden) {
        this.now.set(Date.now());
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      this.stopTick();
    });
  }

  async onStartWorkday(): Promise<void> {
    this.audio.init(); // Unlock AudioContext on user gesture
    await this.dashboard.startWorkday();
    this.startTick();
  }

  async onEndWorkday(): Promise<void> {
    await this.dashboard.endWorkday();
    this.stopTick();
    this.dashboard.loadWeekActivities();
  }

  async onLogout(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }

  private startTick(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.now.set(Date.now());
    }, 1000);
  }

  private stopTick(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
