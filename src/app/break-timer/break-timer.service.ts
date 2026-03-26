import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/services/supabase.service';
import { WorkdayService } from '@shared/services/workday.service';
import { ROTATION_INFO, ROTATION_ORDER } from '@shared/models/rotation.constants';
import { SessionService } from '@shared/services/session.service';
import type {
  BreakEntry,
  Exercise,
  MicroBreakRotation,
  MoodRating,
  WorkoutTemplate,
} from '@shared/models/fitbreak.models';
import { asJson } from '@shared/utils/supabase.utils';

export interface RotationOption {
  key: MicroBreakRotation;
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

  private _exercises = signal<Exercise[]>([]);
  private _currentExerciseIndex = signal(0);
  private _activeRotation = signal<MicroBreakRotation | null>(null);
  private _startedAt = signal<string | null>(null);
  private _templates = signal<WorkoutTemplate[]>([]);

  readonly exercises = this._exercises.asReadonly();
  readonly currentExerciseIndex = this._currentExerciseIndex.asReadonly();
  readonly activeRotation = this._activeRotation.asReadonly();

  readonly currentExercise = computed(() => {
    const exercises = this._exercises();
    const idx = this._currentExerciseIndex();
    return exercises[idx] ?? null;
  });

  readonly exerciseCount = computed(() => this._exercises().length);
  readonly isLastExercise = computed(() =>
    this._currentExerciseIndex() >= this._exercises().length - 1,
  );

  readonly suggestedRotation = computed((): MicroBreakRotation => {
    const session = this.session.session();
    const idx = session?.current_rotation_index ?? 0;
    return ROTATION_ORDER[idx % ROTATION_ORDER.length];
  });

  readonly rotationOptions = computed((): RotationOption[] => {
    const suggested = this.suggestedRotation();
    const templates = this._templates();

    return ROTATION_ORDER.map(key => {
      const info = ROTATION_INFO[key];
      const template = templates.find(t => this.rotationKeyFromTemplate(t) === key);
      return {
        key,
        name: info.name,
        icon: info.icon,
        exerciseCount: template?.exercises.length ?? 0,
        durationMin: template?.estimated_duration_min ?? info.defaultDurationMin,
        isSuggested: key === suggested,
      };
    });
  });

  async loadTemplates(): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('workout_templates')
      .select('*')
      .eq('workout_type', 'micro-break')
      .order('sort_order');

    if (error) throw error;
    this._templates.set((data ?? []) as unknown as WorkoutTemplate[]);
  }

  async startBreak(rotation: MicroBreakRotation): Promise<void> {
    this._activeRotation.set(rotation);
    this._currentExerciseIndex.set(0);
    this._startedAt.set(new Date().toISOString());

    // Load exercises for this rotation
    const { data, error } = await this.supabase.supabase
      .from('exercises')
      .select('*')
      .eq('category', 'micro-break')
      .eq('micro_break_rotation', rotation)
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    this._exercises.set((data ?? []) as unknown as Exercise[]);
  }

  async extendWork(minutes: number, reason?: string): Promise<void> {
    const session = this.session.session();
    if (!session) return;

    const now = new Date();
    const entry: BreakEntry = {
      rotationIndex: session.current_rotation_index ?? 0,
      rotationType: this.suggestedRotation(),
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
    const entry: BreakEntry = {
      rotationIndex: session.current_rotation_index ?? 0,
      rotationType: this.suggestedRotation(),
      scheduledAt: now.toISOString(),
      skipped: true,
    };

    const breaks = [...session.breaks, entry];
    const nextIdx = ((session.current_rotation_index ?? 0) + 1) % ROTATION_ORDER.length;
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

    const rotation = this._activeRotation();
    if (!rotation) return;

    const now = new Date();
    const entry: BreakEntry = {
      rotationIndex: session.current_rotation_index ?? 0,
      rotationType: rotation,
      scheduledAt: this._startedAt() ?? now.toISOString(),
      startedAt: this._startedAt() ?? now.toISOString(),
      completedAt: now.toISOString(),
      skipped: false,
      mood,
    };

    const breaks = [...session.breaks, entry];
    const nextIdx = ((session.current_rotation_index ?? 0) + 1) % ROTATION_ORDER.length;
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
    await this.workday.onBreakCompleted();
    this.reset();
  }

  reset(): void {
    this._exercises.set([]);
    this._currentExerciseIndex.set(0);
    this._activeRotation.set(null);
    this._startedAt.set(null);
  }

  private rotationKeyFromTemplate(template: WorkoutTemplate): MicroBreakRotation | null {
    // Primary: match by template name
    const nameMap: Record<string, MicroBreakRotation> = {
      'Шия + Очі': 'neck-eyes',
      'Грудний відділ + Плечі': 'thoracic-shoulders',
      'Стегна + Поперек': 'hips-lower-back',
      'Активна розминка': 'active',
    };
    // Fallback: sort_order aligns with ROTATION_ORDER
    return nameMap[template.name] ?? (template.sort_order ? ROTATION_ORDER[template.sort_order - 1] : null) ?? null;
  }
}
