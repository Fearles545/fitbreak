import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/services/supabase.service';
import { WorkdayService } from '@shared/services/workday.service';
import { SessionService } from '@shared/services/session.service';
import { SettingsService } from '../settings/settings.service';
import type {
  BreakEntry,
  Exercise,
  MoodRating,
  WorkSession,
  WorkoutTemplate,
} from '@shared/models/fitbreak.models';
import { asJson } from '@shared/utils/supabase.utils';

export interface RotationOption {
  templateId: string;
  name: string;
  icon: string;
  exerciseCount: number;
  durationMin: number;
  isSuggested: boolean;
}

@Injectable({ providedIn: 'root' })
export class BreakTimerService {
  private supabase = inject(SupabaseService);
  private session = inject(SessionService);
  private workday = inject(WorkdayService);
  private settingsService = inject(SettingsService);

  private _exercises = signal<Exercise[]>([]);
  private _currentExerciseIndex = signal(0);
  private _activeTemplate = signal<WorkoutTemplate | null>(null);
  private _startedAt = signal<string | null>(null);
  private _templates = signal<WorkoutTemplate[]>([]);

  readonly exercises = this._exercises.asReadonly();
  readonly currentExerciseIndex = this._currentExerciseIndex.asReadonly();

  readonly currentExercise = computed(() => {
    const exercises = this._exercises();
    const idx = this._currentExerciseIndex();
    return exercises[idx] ?? null;
  });

  readonly exerciseCount = computed(() => this._exercises().length);
  readonly isLastExercise = computed(() =>
    this._currentExerciseIndex() >= this._exercises().length - 1,
  );

  /** Get the ordered list of enabled templates based on user settings */
  private readonly orderedTemplates = computed((): WorkoutTemplate[] => {
    const templates = this._templates();
    const order = this.settingsService.settings()?.template_order ?? [];

    if (order.length > 0) {
      // Return templates in the order specified by user settings
      return order
        .map(id => templates.find(t => t.id === id))
        .filter((t): t is WorkoutTemplate => t != null);
    }

    // Fallback: all templates by sort_order
    return templates;
  });

  readonly suggestedTemplate = computed((): WorkoutTemplate | null => {
    const ordered = this.orderedTemplates();
    if (ordered.length === 0) return null;
    const session = this.session.session();
    const idx = session?.current_rotation_index ?? 0;
    return ordered[idx % ordered.length];
  });

  readonly rotationOptions = computed((): RotationOption[] => {
    const suggested = this.suggestedTemplate();
    const ordered = this.orderedTemplates();

    return ordered.map(template => ({
      templateId: template.id,
      name: template.name,
      icon: template.icon ?? '',
      exerciseCount: template.exercises.length,
      durationMin: template.estimated_duration_min,
      isSuggested: template.id === suggested?.id,
    }));
  });

  async loadTemplates(): Promise<void> {
    if (this._templates().length > 0) return;

    const { data, error } = await this.supabase.supabase
      .from('workout_templates')
      .select('*')
      .eq('workout_type', 'micro-break')
      .order('sort_order');

    if (error) throw error;
    this._templates.set((data ?? []) as unknown as WorkoutTemplate[]);
  }

  async startBreak(templateId: string): Promise<void> {
    const template = this._templates().find(t => t.id === templateId);
    if (!template) return;

    this._activeTemplate.set(template);
    this._currentExerciseIndex.set(0);
    this._startedAt.set(new Date().toISOString());

    // Load exercises by IDs from the template
    const exerciseIds = template.exercises.map(e => e.exerciseId);
    if (exerciseIds.length === 0) return;

    const { data, error } = await this.supabase.supabase
      .from('exercises')
      .select('*')
      .in('id', exerciseIds)
      .eq('is_active', true);

    if (error) throw error;

    // Sort by template's sortOrder
    const exerciseMap = new Map((data ?? []).map(e => [e.id, e]));
    const sorted = [...template.exercises]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(slot => exerciseMap.get(slot.exerciseId))
      .filter(Boolean) as unknown as Exercise[];

    this._exercises.set(sorted);
  }

  async extendWork(minutes: number, reason?: string): Promise<void> {
    const session = this.session.session();
    if (!session) return;

    const now = new Date();
    const suggested = this.suggestedTemplate();

    const entry: BreakEntry = {
      rotationIndex: session.current_rotation_index ?? 0,
      templateId: suggested?.id ?? '',
      templateName: suggested?.name ?? '',
      templateIcon: suggested?.icon ?? '',
      scheduledAt: now.toISOString(),
      skipped: true,
      extended: true,
      extendedByMin: minutes,
      reason,
    };

    const breaks = [...session.breaks, entry];

    const { error } = await this.supabase.supabase
      .from('work_sessions')
      .update({
        breaks: asJson(breaks),
        next_break_at: new Date(now.getTime() + minutes * 60_000).toISOString(),
      })
      .eq('id', session.id);

    if (error) throw error;
    await this.workday.onBreakSkipped();
  }

  async skipBreak(): Promise<void> {
    const session = this.session.session();
    if (!session) return;

    const now = new Date();
    const suggested = this.suggestedTemplate();
    const templateCount = this.orderedTemplates().length;

    const entry: BreakEntry = {
      rotationIndex: session.current_rotation_index ?? 0,
      templateId: suggested?.id ?? '',
      templateName: suggested?.name ?? '',
      templateIcon: suggested?.icon ?? '',
      scheduledAt: now.toISOString(),
      skipped: true,
    };

    const breaks = [...session.breaks, entry];
    const nextIdx = templateCount > 0
      ? ((session.current_rotation_index ?? 0) + 1) % templateCount
      : 0;
    const intervalMs = session.break_interval_min * 60 * 1000;

    const { error } = await this.supabase.supabase
      .from('work_sessions')
      .update({
        breaks: asJson(breaks),
        current_rotation_index: nextIdx,
        next_break_at: new Date(now.getTime() + intervalMs).toISOString(),
      })
      .eq('id', session.id);

    if (error) throw error;
    await this.workday.onBreakSkipped();
  }

  nextExercise(): boolean {
    const idx = this._currentExerciseIndex();
    if (idx < this._exercises().length - 1) {
      this._currentExerciseIndex.set(idx + 1);
      return true;
    }
    return false;
  }

  async completeBreak(mood?: MoodRating): Promise<void> {
    const session = this.session.session();
    if (!session) return;

    const template = this._activeTemplate();
    if (!template) return;

    const now = new Date();
    const templateCount = this.orderedTemplates().length;

    // Calculate actual work seconds: from last break/session start to break start
    const breakStartedAt = this._startedAt() ?? now.toISOString();
    const lastAnchor = this.getLastWorkAnchor(session);
    const actualWorkSeconds = Math.floor(
      (new Date(breakStartedAt).getTime() - new Date(lastAnchor).getTime()) / 1000,
    );

    const muscleGroups = template.target_muscle_groups;

    const entry: BreakEntry = {
      rotationIndex: session.current_rotation_index ?? 0,
      templateId: template.id,
      templateName: template.name,
      templateIcon: template.icon ?? '',
      scheduledAt: this._startedAt() ?? now.toISOString(),
      startedAt: breakStartedAt,
      completedAt: now.toISOString(),
      skipped: false,
      mood,
      actualWorkSeconds: Math.max(0, actualWorkSeconds),
      muscleGroups: muscleGroups && muscleGroups.length > 0 ? muscleGroups : undefined,
    };

    const breaks = [...session.breaks, entry];
    const nextIdx = templateCount > 0
      ? ((session.current_rotation_index ?? 0) + 1) % templateCount
      : 0;

    // Set next_break_at to null — signals "back to work" state
    const { error } = await this.supabase.supabase
      .from('work_sessions')
      .update({
        breaks: asJson(breaks),
        current_rotation_index: nextIdx,
        next_break_at: null,
      })
      .eq('id', session.id);

    if (error) throw error;
    await this.workday.onBreakCompleted();
    this.reset();
  }

  /** Get the timestamp from which work time should be measured */
  private getLastWorkAnchor(session: WorkSession): string {
    if (session.breaks.length === 0) return session.started_at;
    const lastBreak = session.breaks[session.breaks.length - 1];
    return lastBreak.completedAt ?? lastBreak.scheduledAt ?? session.started_at;
  }

  reset(): void {
    this._exercises.set([]);
    this._currentExerciseIndex.set(0);
    this._activeTemplate.set(null);
    this._startedAt.set(null);
  }
}
