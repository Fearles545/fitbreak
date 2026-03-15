import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TimerRingComponent } from '@shared/components/timer-ring/timer-ring.component';
import { WeekCalendarComponent } from '@shared/components/week-calendar/week-calendar.component';
import { AudioService } from '@shared/services/audio.service';
import { WorkdayService } from '@shared/services/workday.service';
import { ROTATION_INFO, ROTATION_ORDER } from '@shared/models/rotation.constants';
import { toDisplayDate } from '@shared/utils/date.utils';
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

    .timer-section.paused {
      opacity: 0.5;
    }

    .paused-indicator {
      text-align: center;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 16px;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .session-actions {
      margin-top: 32px;
      text-align: center;
    }

    .session-actions + .secondary-actions {
      margin-top: 16px;
    }

    .end-day {
      margin-top: 12px;
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
          <button mat-icon-button class="logout-btn" (click)="onLogout()" aria-label="Вийти">
            <mat-icon>logout</mat-icon>
          </button>
        </div>

        <app-week-calendar [activities]="dashboard.weekActivities()" />

        @if (dashboard.session()) {
          <!-- Active or paused session view -->
          <div class="timer-section" [class.paused]="isPaused()">
            <app-timer-ring
              [remainingSeconds]="remainingSeconds()"
              [totalSeconds]="totalSeconds()"
              label="до перерви"
            />
          </div>

          @if (isPaused()) {
            <div class="paused-indicator">⏸ Пауза</div>
          }

          @if (nextRotation()) {
            <div class="next-rotation">
              <div class="next-rotation-label">Наступна розминка</div>
              <div class="next-rotation-name">
                {{ nextRotation()!.icon }} {{ nextRotation()!.name }}
              </div>
              <div class="next-rotation-meta">~{{ nextRotation()!.duration }} хв</div>
            </div>
          }

          <div class="day-stats">
            Перерв: {{ dashboard.completedBreaks() }} · {{ elapsedTime() }}
          </div>

          <div class="session-actions">
            @if (isPaused()) {
              <button mat-flat-button (click)="onResumeWorkday()">
                <mat-icon>play_arrow</mat-icon>
                Продовжити
              </button>
            } @else {
              <button matButton="outlined" (click)="onPauseWorkday()">
                <mat-icon>pause</mat-icon>
                Пауза
              </button>
            }
          </div>

          @if (!isPaused()) {
            <div class="secondary-actions">
              <button matButton="outlined" (click)="router.navigate(['/strength'])">
                <mat-icon>fitness_center</mat-icon>
                Силове
              </button>
              <button matButton="outlined" (click)="router.navigate(['/stepper'])">
                <mat-icon>directions_walk</mat-icon>
                Степер
              </button>
            </div>
          }

          <div class="end-day">
            <button matButton="text" (click)="onEndWorkday()">Завершити робочий день</button>
          </div>
        } @else {
          <!-- Start screen -->
          <div class="actions">
            <button mat-flat-button (click)="onStartWorkday()">Почати робочий день</button>

            <div class="secondary-actions">
              <button matButton="outlined" (click)="router.navigate(['/strength'])">
                <mat-icon>fitness_center</mat-icon>
                Силове
              </button>
              <button matButton="outlined" (click)="router.navigate(['/stepper'])">
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
  protected workday = inject(WorkdayService);
  private auth = inject(AuthService);
  private audio = inject(AudioService);
  protected router = inject(Router);

  firstName = computed(() => {
    const user = this.auth.user();
    const meta = user?.user_metadata;
    const fullName = meta?.['full_name'] ?? meta?.['name'] ?? '';
    return (fullName as string).split(' ')[0] || 'Друже';
  });

  formattedDate = computed(() => toDisplayDate());

  totalSeconds = computed(() => {
    const session = this.dashboard.session();
    return (session?.break_interval_min ?? 45) * 60;
  });

  remainingSeconds = computed(() => this.workday.remainingSeconds());
  isPaused = computed(() => this.workday.currentActivity() === 'paused');

  nextRotation = computed(() => {
    const session = this.dashboard.session();
    if (!session) return null;
    const idx = session.current_rotation_index ?? 0;
    const key = ROTATION_ORDER[idx % ROTATION_ORDER.length];
    const info = ROTATION_INFO[key];
    return info ? { name: info.name, icon: info.icon, duration: info.defaultDurationMin } : null;
  });

  elapsedTime = computed(() => {
    const session = this.dashboard.session();
    if (!session) return '';

    const start = new Date(session.started_at).getTime();
    const now = this.workday.now();

    // Subtract total paused time
    let totalPausedMs = 0;
    for (const pause of session.pauses) {
      if (!pause.resumedAt) continue;
      totalPausedMs += new Date(pause.resumedAt).getTime() - new Date(pause.pausedAt).getTime();
    }
    if (session.paused_at) {
      totalPausedMs += Math.max(0, now - new Date(session.paused_at).getTime());
    }

    const elapsed = Math.floor((now - start - totalPausedMs) / 1000 / 60);
    const hours = Math.floor(elapsed / 60);
    const mins = elapsed % 60;
    if (hours > 0) return `${hours}г ${mins}хв`;
    return `${mins} хв`;
  });

  async ngOnInit(): Promise<void> {
    await this.dashboard.cleanupStaleSessions();
    await this.dashboard.refreshSession();
    this.workday.init();
    this.dashboard.loadWeekActivities();
  }

  async onStartWorkday(): Promise<void> {
    this.audio.init();
    await this.workday.startWorkday();
  }

  async onPauseWorkday(): Promise<void> {
    await this.workday.pauseWorkday();
  }

  async onResumeWorkday(): Promise<void> {
    await this.workday.resumeWorkday();
  }

  async onEndWorkday(): Promise<void> {
    await this.workday.endWorkday();
    this.dashboard.loadWeekActivities();
  }

  async onLogout(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
