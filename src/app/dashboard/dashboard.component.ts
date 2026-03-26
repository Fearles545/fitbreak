import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AnimatedTimerComponent } from '@shared/components/animated-timer/animated-timer.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { TimerRingComponent } from '@shared/components/timer-ring/timer-ring.component';
import { WeekCalendarComponent } from '@shared/components/week-calendar/week-calendar.component';
import { AudioService } from '@shared/services/audio.service';
import { WorkdayService } from '@shared/services/workday.service';
import { ROTATION_INFO, ROTATION_ORDER } from '@shared/models/rotation.constants';
import { toDisplayDate } from '@shared/utils/date.utils';
import { getTodayTip } from '@shared/constants/health-tips';
import { AuthService } from '../auth/auth.service';
import { SettingsService } from '../settings/settings.service';
import { SessionService } from '@shared/services/session.service';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    AnimatedTimerComponent,
    TimerRingComponent,
    WeekCalendarComponent,
  ],
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      min-height: 100dvh;
      background: var(--mat-sys-surface);
      padding: 20px 16px;
    }

    .container {
      max-width: 480px;
      margin: 0 auto;
    }

    /* ── Transitions ── */
    .fade-in {
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .fade-in { animation: none; }
      .paused-indicator { animation: none; }
      .loading-spinner { animation-duration: 1.5s; }
      .break-due-cta { animation: none; }
    }

    /* ── Loading ── */
    .loading {
      display: flex;
      justify-content: center;
      padding: 64px 0;
    }

    .loading-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid var(--mat-sys-surface-container-high);
      border-top-color: var(--mat-sys-primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .greeting {
      font-size: 1.4rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin: 0;
    }

    .date {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 2px;
    }

    /* ── Nav island ── */
    .nav-island {
      display: flex;
      gap: 4px;
      background: var(--mat-sys-surface-container);
      border-radius: 16px;
      padding: 4px;
    }

    .nav-island button {
      color: var(--mat-sys-on-surface-variant);
    }

    /* ── Streak card ── */
    .streak-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-radius: 16px;
      background: var(--mat-sys-primary-container);
      margin-top: 16px;
    }

    .streak-icon {
      font-size: 2rem;
      line-height: 1;
    }

    .streak-content {
      flex: 1;
      min-width: 0;
    }

    .streak-number {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--mat-sys-on-primary-container);
      line-height: 1.2;
    }

    .streak-label {
      font-size: 0.8rem;
      color: var(--mat-sys-on-primary-container);
      opacity: 0.8;
    }

    /* ── Start CTA ── */
    .start-section {
      margin-top: 28px;
    }

    .start-button {
      width: 100%;
      height: 56px;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 16px;
      letter-spacing: 0.01em;
    }

    .start-button mat-icon {
      margin-right: 8px;
    }

    /* ── Quick launch island ── */
    .quick-launch {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    .quick-launch-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 12px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container);
      border: none;
      cursor: pointer;
      transition: background 0.2s;
      color: var(--mat-sys-on-surface);
    }

    .quick-launch-card:hover {
      background: var(--mat-sys-surface-container-high);
    }

    .quick-launch-card:active {
      background: var(--mat-sys-surface-container-highest);
    }

    .quick-launch-card:focus-visible {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 2px;
    }

    .quick-launch-card mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: var(--mat-sys-primary);
    }

    .quick-launch-label {
      font-size: 0.85rem;
      font-weight: 500;
    }

    /* ── Health tip ── */
    .health-tip {
      margin-top: 24px;
      padding: 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container);
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .health-tip mat-icon {
      color: var(--mat-sys-primary);
      flex-shrink: 0;
      margin-top: 1px;
    }

    .health-tip-text {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.5;
    }

    /* ── Active session ── */
    .timer-section {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin: 12px 0 20px;
    }

    .timer-section app-timer-ring {
      width: 200px;
      height: 200px;
    }

    .timer-label {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
    }

    .timer-section.paused {
      opacity: 0.5;
    }

    .timer-action {
      color: var(--mat-sys-on-surface-variant);
      align-self: flex-end;
      margin-bottom: 8px;
    }

    .paused-indicator {
      text-align: center;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 12px;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* ── Next rotation ── */
    .next-rotation {
      text-align: center;
      padding: 14px;
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

    /* ── Day stats ── */
    .day-stats {
      text-align: center;
      margin-top: 12px;
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
    }

    /* ── Session actions ── */
    .session-actions {
      margin-top: 24px;
      text-align: center;
    }

    .end-day {
      margin-top: 8px;
      text-align: center;
    }

    /* ── Break due state ── */
    .timer-section.break-due app-timer-ring {
      --timer-ring-progress-color: var(--mat-sys-tertiary);
    }

    .overtime-label {
      font-size: 0.85rem;
      color: var(--mat-sys-tertiary);
      margin-top: 4px;
    }

    .break-due-cta {
      width: 100%;
      height: 56px;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 16px;
      letter-spacing: 0.01em;
      margin-top: 20px;
      animation: gentlePulse 2.5s ease-in-out infinite;
    }

    @keyframes gentlePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    .break-due-cta mat-icon {
      margin-right: 8px;
    }

    /* ── Back to work state ── */
    .back-to-work-section {
      text-align: center;
      margin-top: 12px;
    }

    .back-to-work-message {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin-bottom: 4px;
    }

    .back-to-work-sub {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 20px;
    }

    .back-to-work-cta {
      width: 100%;
      height: 56px;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 16px;
      letter-spacing: 0.01em;
    }

    .back-to-work-cta mat-icon {
      margin-right: 8px;
    }

    /* ── Error state ── */
    .error-state {
      text-align: center;
      padding: 48px 24px;
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 12px;
      color: var(--mat-sys-error);
    }

    .error-text {
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 16px;
    }

    /* ── Responsive ── */
    @media (min-width: 400px) {
      :host { padding: 24px 16px; }
      .header { margin-bottom: 24px; }
      .greeting { font-size: 1.5rem; }
      .timer-section { margin: 16px 0 24px; }
      .timer-section app-timer-ring { width: 220px; height: 220px; }
      .session-actions { margin-top: 32px; }
      .start-section { margin-top: 32px; }
      .streak-card { margin-top: 20px; }
    }
  `,
  template: `
    <div class="container">
      <!-- Header (always visible) -->
      <div class="header">
        <div>
          <h1 class="greeting">Привіт, {{ firstName() }}!</h1>
          <div class="date">{{ formattedDate() }}</div>
        </div>
        <nav class="nav-island" aria-label="Навігація">
          <button mat-icon-button (click)="onNavigate('/progress')" aria-label="Прогрес">
            <mat-icon aria-hidden="true">bar_chart</mat-icon>
          </button>
          <button mat-icon-button (click)="onNavigate('/settings')" aria-label="Налаштування">
            <mat-icon aria-hidden="true">settings</mat-icon>
          </button>
          <button mat-icon-button (click)="onLogout()" aria-label="Вийти">
            <mat-icon aria-hidden="true">logout</mat-icon>
          </button>
        </nav>
      </div>

      @if (loadError()) {
        <!-- ═══ Error state ═══ -->
        <div class="error-state">
          <div class="error-icon">
            <mat-icon aria-hidden="true" style="font-size: inherit; width: auto; height: auto">cloud_off</mat-icon>
          </div>
          <div class="error-text">Не вдалося завантажити дані</div>
          <button mat-flat-button (click)="onRetry()">Спробувати ще раз</button>
        </div>
      } @else if (isLoading()) {
        <!-- ═══ First load spinner ═══ -->
        <div class="loading" role="status" aria-label="Завантаження...">
          <div class="loading-spinner"></div>
        </div>
      } @else {
        <div class="fade-in">
        <!-- Week calendar -->
        <app-week-calendar [activities]="dashboard.weekActivities()" />

        @if (sessionService.session()) {
          @if (isBackToWork()) {
            <!-- ═══ Back to work state ═══ -->
            <div class="back-to-work-section">
              <div class="back-to-work-message">Перерва завершена!</div>
              <div class="back-to-work-sub">Натисни, коли будеш готовий працювати</div>

              <button mat-flat-button class="back-to-work-cta" (click)="onResumeAfterBreak()">
                <mat-icon aria-hidden="true">play_circle</mat-icon>
                Повернутись до роботи
              </button>
            </div>

          } @else if (isBreakDue()) {
            <!-- ═══ Break due state ═══ -->
            <div class="timer-section break-due">
              <app-timer-ring
                [remainingSeconds]="0"
                [totalSeconds]="totalSeconds()">
                <app-animated-timer
                  [remainingSeconds]="workday.overtimeSeconds()"
                  [mode]="settings.timerAnimationStyle()"
                  size="big"
                  [prefix]="'+'">
                  <span class="overtime-label">понад інтервал</span>
                </app-animated-timer>
              </app-timer-ring>
            </div>

            @if (nextRotation()) {
              <div class="next-rotation">
                <div class="next-rotation-label">Запропонована розминка</div>
                <div class="next-rotation-name">
                  {{ nextRotation()!.icon }} {{ nextRotation()!.name }}
                </div>
                <div class="next-rotation-meta">~{{ nextRotation()!.duration }} хв</div>
              </div>
            }

            <button
              mat-flat-button
              class="break-due-cta"
              (click)="onStartBreak()"
              [attr.aria-label]="'Час на перерву. Ви працюєте на ' + overtimeMinutes() + ' хвилин довше'">
              <mat-icon aria-hidden="true">self_improvement</mat-icon>
              Час на перерву
            </button>

          } @else if (isPaused()) {
            <!-- ═══ Paused state ═══ -->
            <div class="paused-indicator" aria-label="Пауза">⏸ Пауза</div>

            <div class="timer-section paused">
              <app-timer-ring
                [remainingSeconds]="remainingSeconds()"
                [totalSeconds]="totalSeconds()">
                <app-animated-timer
                  [remainingSeconds]="remainingSeconds()"
                  [mode]="settings.timerAnimationStyle()"
                  size="big">
                  <span class="timer-label">до перерви</span>
                </app-animated-timer>
              </app-timer-ring>
            </div>

            <div class="session-actions">
              <button mat-flat-button (click)="onResumeWorkday()">
                <mat-icon aria-hidden="true">play_arrow</mat-icon>
                Продовжити
              </button>
            </div>

          } @else {
            <!-- ═══ Working state ═══ -->
            <div class="timer-section">
              <button mat-icon-button class="timer-action" (click)="onConfirmPause()" aria-label="Пауза" matTooltip="Пауза">
                <mat-icon aria-hidden="true">pause</mat-icon>
              </button>

              <app-timer-ring
                [remainingSeconds]="remainingSeconds()"
                [totalSeconds]="totalSeconds()">
                <app-animated-timer
                  [remainingSeconds]="remainingSeconds()"
                  [mode]="settings.timerAnimationStyle()"
                  size="big">
                  <span class="timer-label">до перерви</span>
                </app-animated-timer>
              </app-timer-ring>

              <button mat-icon-button class="timer-action" (click)="onConfirmEarlyBreak()" aria-label="Перерва зараз" matTooltip="Перерва зараз">
                <mat-icon aria-hidden="true">self_improvement</mat-icon>
              </button>
            </div>

            @if (nextRotation()) {
              <div class="next-rotation">
                <div class="next-rotation-label">Наступна розминка</div>
                <div class="next-rotation-name">
                  {{ nextRotation()!.icon }} {{ nextRotation()!.name }}
                </div>
                <div class="next-rotation-meta">~{{ nextRotation()!.duration }} хв</div>
              </div>
            }
          }

          <!-- Day stats (all active session states) -->
          <div class="day-stats">
            Перерв: {{ sessionService.completedBreaks() }} · {{ elapsedTime() }}
          </div>

          @if (!isBackToWork()) {
            <div class="quick-launch">
              <button class="quick-launch-card" (click)="onNavigate('/strength')" aria-label="Силове тренування">
                <mat-icon aria-hidden="true">fitness_center</mat-icon>
                <span class="quick-launch-label">Силове</span>
              </button>
              <button class="quick-launch-card" (click)="onNavigate('/stepper')" aria-label="Степер">
                <mat-icon aria-hidden="true">directions_walk</mat-icon>
                <span class="quick-launch-label">Степер</span>
              </button>
            </div>
          }

          <div class="end-day">
            <button matButton="text" (click)="onEndWorkday()">Завершити робочий день</button>
          </div>
        } @else {
          <!-- ═══ Start screen ═══ -->

          <!-- Streak -->
          @if (dashboard.currentStreak() > 0) {
            <div class="streak-card" role="status" [attr.aria-label]="'Поточна серія: ' + dashboard.currentStreak() + ' днів'">
              <span class="streak-icon" aria-hidden="true">🔥</span>
              <div class="streak-content">
                <div class="streak-number">{{ dashboard.currentStreak() }} {{ streakDaysLabel() }}</div>
                <div class="streak-label">{{ streakMessage() }}</div>
              </div>
            </div>
          }

          <!-- Start CTA -->
          <div class="start-section">
            <button mat-flat-button class="start-button" (click)="onStartWorkday()">
              <mat-icon aria-hidden="true">play_circle</mat-icon>
              Почати робочий день
            </button>
          </div>

          <!-- Quick launch -->
          <div class="quick-launch">
            <button class="quick-launch-card" (click)="onNavigate('/strength')" aria-label="Силове тренування">
              <mat-icon aria-hidden="true">fitness_center</mat-icon>
              <span class="quick-launch-label">Силове</span>
            </button>
            <button class="quick-launch-card" (click)="onNavigate('/stepper')" aria-label="Степер">
              <mat-icon aria-hidden="true">directions_walk</mat-icon>
              <span class="quick-launch-label">Степер</span>
            </button>
          </div>

          <!-- Health tip -->
          <div class="health-tip">
            <mat-icon aria-hidden="true">lightbulb</mat-icon>
            <span class="health-tip-text">{{ healthTip }}</span>
          </div>
        }
        </div><!-- /fade-in -->
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  protected sessionService = inject(SessionService);
  protected dashboard = inject(DashboardService);
  protected workday = inject(WorkdayService);
  private auth = inject(AuthService);
  private audio = inject(AudioService);
  protected settings = inject(SettingsService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  protected readonly healthTip = getTodayTip();
  protected loadError = signal(false);

  protected isLoading = computed(() =>
    this.sessionService.loading() || this.dashboard.loading(),
  );

  firstName = computed(() => {
    const user = this.auth.user();
    const meta = user?.user_metadata;
    const fullName = meta?.['full_name'] ?? meta?.['name'] ?? '';
    return (fullName as string).split(' ')[0] || 'Друже';
  });

  formattedDate = computed(() => toDisplayDate());

  totalSeconds = computed(() => {
    const session = this.sessionService.session();
    return (session?.break_interval_min ?? this.settings.breakIntervalMin()) * 60;
  });

  remainingSeconds = computed(() => Math.max(0, this.workday.remainingSeconds()));
  isPaused = computed(() => this.workday.currentActivity() === 'paused');
  isBreakDue = computed(() => this.workday.currentActivity() === 'break-due');
  isBackToWork = computed(() => this.workday.currentActivity() === 'back-to-work');

  overtimeMinutes = computed(() => Math.floor(this.workday.overtimeSeconds() / 60));

  nextRotation = computed(() => {
    const session = this.sessionService.session();
    if (!session) return null;
    const idx = session.current_rotation_index ?? 0;
    const key = ROTATION_ORDER[idx % ROTATION_ORDER.length];
    const info = ROTATION_INFO[key];
    return info ? { name: info.name, icon: info.icon, duration: info.defaultDurationMin } : null;
  });

  streakDaysLabel = computed(() => {
    const n = this.dashboard.currentStreak();
    const lastTwo = n % 100;
    if (lastTwo >= 11 && lastTwo <= 14) return 'днів';
    const lastOne = n % 10;
    if (lastOne === 1) return 'день';
    if (lastOne >= 2 && lastOne <= 4) return 'дні';
    return 'днів';
  });

  streakMessage = computed(() => {
    const streak = this.dashboard.currentStreak();
    if (streak >= 14) return 'Неймовірна стабільність!';
    if (streak >= 7) return 'Тижнева серія — чудово!';
    if (streak >= 3) return 'Гарна серія, не зупиняйся!';
    return 'Продовжуй у тому ж дусі!';
  });

  elapsedTime = computed(() => {
    const session = this.sessionService.session();
    if (!session) return '';

    const start = new Date(session.started_at).getTime();
    const now = this.workday.now();

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
    await this.loadDashboard();
  }

  protected onNavigate(path: string): void {
    this.router.navigate([path]);
  }

  async onRetry(): Promise<void> {
    this.loadError.set(false);
    await this.loadDashboard();
  }

  private async loadDashboard(): Promise<void> {
    try {
      await Promise.all([
        this.settings.ensureLoaded(),
        this.sessionService.cleanupStaleSessions(),
      ]);
      await this.sessionService.refreshSession();
      await Promise.all([
        this.workday.init(),
        this.dashboard.loadAll(),
      ]);
    } catch {
      this.loadError.set(true);
      this.snackBar.open('Не вдалося завантажити дані.', 'OK', { duration: 5000 });
    }
  }

  async onStartWorkday(): Promise<void> {
    try {
      this.audio.init();
      await this.workday.startWorkday();
    } catch {
      this.snackBar.open('Не вдалося розпочати робочий день.', 'OK', { duration: 5000 });
    }
  }

  async onPauseWorkday(): Promise<void> {
    try {
      await this.workday.pauseWorkday();
    } catch {
      this.snackBar.open('Не вдалося поставити на паузу.', 'OK', { duration: 5000 });
    }
  }

  async onResumeWorkday(): Promise<void> {
    try {
      await this.workday.resumeWorkday();
    } catch {
      this.snackBar.open('Не вдалося відновити роботу.', 'OK', { duration: 5000 });
    }
  }

  async onResumeAfterBreak(): Promise<void> {
    try {
      this.audio.init();
      await this.workday.resumeAfterBreak();
    } catch {
      this.snackBar.open('Не вдалося відновити роботу.', 'OK', { duration: 5000 });
    }
  }

  onConfirmPause(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Поставити на паузу?', confirmLabel: 'Пауза' },
      autoFocus: false,
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) this.onPauseWorkday();
    });
  }

  onConfirmEarlyBreak(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Почати перерву зараз?', confirmLabel: 'Почати' },
      autoFocus: false,
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) this.onStartBreak();
    });
  }

  onStartBreak(): void {
    this.audio.init();
    this.router.navigate(['/break']);
  }

  async onEndWorkday(): Promise<void> {
    try {
      const sessionId = this.sessionService.session()?.id;
      await this.workday.endWorkday();
      if (sessionId) {
        this.router.navigate(['/day-summary', sessionId]);
      }
    } catch {
      this.snackBar.open('Не вдалося завершити робочий день.', 'OK', { duration: 5000 });
    }
  }

  async onLogout(): Promise<void> {
    try {
      await this.auth.signOut();
      this.router.navigate(['/login']);
    } catch {
      this.snackBar.open('Не вдалося вийти з акаунту.', 'OK', { duration: 5000 });
    }
  }
}
