import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '@shared/services/supabase.service';
import { AuthService } from '../auth/auth.service';
import { toDisplayDate } from '@shared/utils/date.utils';
import type { WorkSession, WorkoutLog, BreakEntry, MoodRating } from '@shared/models/fitbreak.models';

const MOOD_EMOJI: Record<MoodRating, string> = {
  great: '😊',
  good: '🙂',
  okay: '😐',
  bad: '😫',
};

@Component({
  selector: 'app-day-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
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

    .loading {
      display: flex;
      justify-content: center;
      padding: 64px 0;
    }

    /* ── Header ── */
    .header {
      text-align: center;
      margin-bottom: 32px;
    }

    .title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin: 0 0 4px;
    }

    .date {
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .time-range {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 2px;
    }

    .message {
      font-size: 1rem;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 12px;
    }

    /* ── Stats ── */
    .stats-card {
      padding: 20px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container);
      margin-bottom: 20px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      text-align: center;
    }

    .stat-number {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--mat-sys-primary);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 2px;
    }

    /* ── Break list ── */
    .section-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }

    .break-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
    }

    .break-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container);
    }

    .break-icon {
      font-size: 1.3rem;
      flex-shrink: 0;
      width: 28px;
      text-align: center;
    }

    .break-info {
      flex: 1;
      min-width: 0;
    }

    .break-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .break-time {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .break-status {
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .break-mood {
      font-size: 1rem;
      flex-shrink: 0;
    }

    /* ── Workouts ── */
    .workout-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container);
      margin-bottom: 8px;
    }

    .workout-icon {
      font-size: 1.3rem;
      flex-shrink: 0;
    }

    .workout-info {
      flex: 1;
    }

    .workout-type {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .workout-meta {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .workouts-section {
      margin-bottom: 24px;
    }

    /* ── No breaks ── */
    .empty-state {
      text-align: center;
      padding: 24px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.9rem;
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      margin-top: 32px;
    }
  `,
  template: `
    <div class="container">
      @if (loading()) {
        <div class="loading">
          <mat-spinner diameter="40" />
        </div>
      } @else if (session()) {
        <div class="header">
          <h1 class="title">Робочий день завершено!</h1>
          <div class="date">{{ displayDate() }}</div>
          <div class="time-range">{{ timeRange() }} · {{ elapsedTime() }}</div>
          <div class="message">{{ motivationalMessage() }}</div>
        </div>

        <div class="stats-card">
          <div class="stats-grid">
            <div>
              <div class="stat-number">{{ completedBreaks() }}</div>
              <div class="stat-label">фітбрейків</div>
            </div>
            <div>
              <div class="stat-number">{{ elapsedTimeShort() }}</div>
              <div class="stat-label">роботи</div>
            </div>
            <div>
              <div class="stat-number">{{ averageMoodEmoji() }}</div>
              <div class="stat-label">настрій</div>
            </div>
          </div>
        </div>

        @if (breaks().length > 0) {
          <div class="section-title">Перерви · {{ completedBreaks() }} з {{ totalBreaks() }}</div>
          <div class="break-list">
            @for (b of breaks(); track $index) {
              <div class="break-item">
                <span class="break-icon">{{ b.icon }}</span>
                <div class="break-info">
                  <div class="break-name">{{ b.name }}</div>
                  <div class="break-time">{{ b.time }}</div>
                </div>
                @if (b.mood) {
                  <span class="break-mood">{{ b.mood }}</span>
                }
                <span class="break-status">{{ b.status }}</span>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">Сьогодні перерв не було</div>
        }

        @if (workouts().length > 0) {
          <div class="workouts-section">
            <div class="section-title">Тренування</div>
            @for (w of workouts(); track $index) {
              <div class="workout-item">
                <span class="workout-icon">{{ w.icon }}</span>
                <div class="workout-info">
                  <div class="workout-type">{{ w.type }}</div>
                  <div class="workout-meta">{{ w.duration }} хв{{ w.mood ? ' · ' + w.mood : '' }}</div>
                </div>
              </div>
            }
          </div>
        }

        <div class="footer">
          <button mat-flat-button (click)="router.navigate(['/dashboard'])">
            <mat-icon>home</mat-icon>
            На головну
          </button>
        </div>
      }
    </div>
  `,
})
export class DaySummaryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  protected router = inject(Router);

  protected loading = signal(true);
  protected session = signal<WorkSession | null>(null);
  private dayWorkouts = signal<WorkoutLog[]>([]);

  protected displayDate = computed(() => {
    const s = this.session();
    return s ? toDisplayDate(new Date(s.started_at)) : '';
  });

  protected timeRange = computed(() => {
    const s = this.session();
    if (!s || !s.ended_at) return '';
    const start = new Date(s.started_at);
    const end = new Date(s.ended_at);
    return `${formatTime(start)} – ${formatTime(end)}`;
  });

  private elapsedMinutes = computed(() => {
    const s = this.session();
    if (!s || !s.ended_at) return 0;

    const startMs = new Date(s.started_at).getTime();
    const endMs = new Date(s.ended_at).getTime();

    let totalPausedMs = 0;
    for (const pause of s.pauses) {
      if (pause.resumedAt) {
        totalPausedMs += new Date(pause.resumedAt).getTime() - new Date(pause.pausedAt).getTime();
      }
    }

    return Math.floor((endMs - startMs - totalPausedMs) / 1000 / 60);
  });

  protected elapsedTime = computed(() => {
    const elapsed = this.elapsedMinutes();
    const hours = Math.floor(elapsed / 60);
    const mins = elapsed % 60;
    if (hours > 0) return `${hours}г ${mins}хв роботи`;
    return `${mins} хв роботи`;
  });

  protected totalBreaks = computed(() => this.session()?.breaks.length ?? 0);

  protected completedBreaks = computed(() => {
    const breaks = this.session()?.breaks ?? [];
    return breaks.filter(b => !b.skipped && b.completedAt).length;
  });

  protected averageMoodEmoji = computed(() => {
    const breaks = this.session()?.breaks ?? [];
    const moods = breaks.filter(b => b.mood).map(b => b.mood!);
    if (moods.length === 0) return '—';

    const scale: Record<MoodRating, number> = { great: 4, good: 3, okay: 2, bad: 1 };
    const avg = moods.reduce((sum, m) => sum + scale[m], 0) / moods.length;

    if (avg >= 3.5) return '😊';
    if (avg >= 2.5) return '🙂';
    if (avg >= 1.5) return '😐';
    return '😫';
  });

  protected elapsedTimeShort = computed(() => {
    const elapsed = this.elapsedMinutes();
    if (elapsed === 0) return '—';
    const hours = Math.floor(elapsed / 60);
    const mins = elapsed % 60;
    if (hours > 0) return `${hours}г ${mins}хв`;
    return `${mins}хв`;
  });

  protected motivationalMessage = computed(() => {
    const count = this.completedBreaks();

    if (count === 0) return 'Короткий день — завтра буде більше!';
    if (count >= 6) return 'Відмінний день, чемпіоне! 💪';
    if (count >= 3) return 'Гарний робочий день!';
    return 'Добрий початок!';
  });

  protected breaks = computed(() => {
    const entries = this.session()?.breaks ?? [];
    return entries.map(b => formatBreakEntry(b));
  });

  protected workouts = computed(() => {
    return this.dayWorkouts().map(w => ({
      icon: w.workout_type === 'strength' ? '💪' : '🚶',
      type: w.workout_type === 'strength' ? 'Силове тренування' : 'Степер',
      duration: w.duration_min ?? 0,
      mood: w.mood ? MOOD_EMOJI[w.mood] : null,
    }));
  });

  async ngOnInit(): Promise<void> {
    const sessionId = this.route.snapshot.paramMap.get('id');
    if (!sessionId) {
      this.router.navigate(['/dashboard']);
      return;
    }

    const userId = this.auth.user()?.id;
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const { data, error } = await this.supabase.supabase
        .from('work_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .single();

      if (error || !data || !data.ended_at) {
        this.router.navigate(['/dashboard']);
        return;
      }

      const session = data as unknown as WorkSession;
      this.session.set(session);

      // Load workouts for the same date
      const { data: workouts } = await this.supabase.supabase
        .from('workout_logs')
        .select('*')
        .eq('date', session.date)
        .eq('user_id', userId)
        .in('workout_type', ['strength', 'stepper']);

      if (workouts) {
        this.dayWorkouts.set(workouts as unknown as WorkoutLog[]);
      }
    } finally {
      this.loading.set(false);
    }
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function formatBreakEntry(b: BreakEntry) {
  const time = b.startedAt
    ? formatTime(new Date(b.startedAt))
    : formatTime(new Date(b.scheduledAt));

  return {
    icon: b.templateIcon || '⏰',
    name: b.templateName || 'Перерва',
    time,
    status: b.skipped ? '⊘' : b.completedAt ? '✅' : '—',
    mood: b.mood ? MOOD_EMOJI[b.mood] : null,
  };
}
