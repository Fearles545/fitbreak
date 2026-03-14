import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/services/supabase.service';
import { DashboardService } from '../dashboard/dashboard.service';
import type {
  BreakEntry,
  Exercise,
  MicroBreakRotation,
  WorkSession,
  WorkoutTemplate,
} from '@shared/models/fitbreak.models';

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
  private dashboard = inject(DashboardService);

  private readonly rotationOrder: MicroBreakRotation[] = [
    'neck-eyes', 'thoracic-shoulders', 'hips-lower-back', 'active',
  ];

  private _exercises = signal<Exercise[]>([]);
  private _currentExerciseIndex = signal(0);
  private _activeRotation = signal<MicroBreakRotation | null>(null);
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
    const session = this.dashboard.session();
    const idx = session?.current_rotation_index ?? 0;
    return this.rotationOrder[idx % this.rotationOrder.length];
  });

  readonly rotationOptions = computed((): RotationOption[] => {
    const suggested = this.suggestedRotation();
    const templates = this._templates();

    return this.rotationOrder.map(key => {
      const template = templates.find(t =>
        t.workout_type === 'micro-break' && t.exercises.some(() => true) &&
        this.rotationKeyFromTemplate(t) === key,
      );
      return {
        key,
        name: this.rotationDisplayName(key),
        icon: this.rotationIcon(key),
        exerciseCount: template?.exercises.length ?? 0,
        durationMin: template?.estimated_duration_min ?? 3,
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

    // Add break entry to session
    await this.addBreakEntry(rotation, false);
  }

  async skipBreak(): Promise<void> {
    await this.addBreakEntry(this.suggestedRotation(), true);
    await this.resetTimer();
  }

  nextExercise(): boolean {
    const idx = this._currentExerciseIndex();
    if (idx < this._exercises().length - 1) {
      this._currentExerciseIndex.set(idx + 1);
      return true;
    }
    return false;
  }

  async completeBreak(mood?: string): Promise<void> {
    const session = this.dashboard.session();
    if (!session) return;

    // Update the last break entry with completedAt and mood
    const breaks = [...session.breaks];
    const lastBreak = breaks[breaks.length - 1];
    if (lastBreak) {
      lastBreak.completedAt = new Date().toISOString();
      if (mood) lastBreak.mood = mood as any;
    }

    // Advance rotation index
    const nextIdx = ((session.current_rotation_index ?? 0) + 1) % this.rotationOrder.length;

    const { error } = await this.supabase.supabase
      .from('work_sessions')
      .update({
        breaks: breaks as any,
        current_rotation_index: nextIdx,
      })
      .eq('id', session.id);

    if (error) throw error;

    // Refresh session in dashboard
    await this.dashboard.loadTodaySession();
    this.reset();
  }

  reset(): void {
    this._exercises.set([]);
    this._currentExerciseIndex.set(0);
    this._activeRotation.set(null);
  }

  private async addBreakEntry(rotation: MicroBreakRotation, skipped: boolean): Promise<void> {
    const session = this.dashboard.session();
    if (!session) return;

    const entry: BreakEntry = {
      rotationIndex: session.current_rotation_index ?? 0,
      rotationType: rotation,
      scheduledAt: new Date().toISOString(),
      startedAt: skipped ? undefined : new Date().toISOString(),
      skipped,
    };

    const breaks = [...session.breaks, entry];

    const { error } = await this.supabase.supabase
      .from('work_sessions')
      .update({ breaks: breaks as any })
      .eq('id', session.id);

    if (error) throw error;

    // Refresh session
    await this.dashboard.loadTodaySession();
  }

  private async resetTimer(): Promise<void> {
    const session = this.dashboard.session();
    if (!session) return;

    const nextIdx = ((session.current_rotation_index ?? 0) + 1) % this.rotationOrder.length;

    const { error } = await this.supabase.supabase
      .from('work_sessions')
      .update({ current_rotation_index: nextIdx })
      .eq('id', session.id);

    if (error) throw error;
    await this.dashboard.loadTodaySession();
  }

  private rotationKeyFromTemplate(template: WorkoutTemplate): MicroBreakRotation | null {
    // Match template name to rotation key
    const nameMap: Record<string, MicroBreakRotation> = {
      'Шия + Очі': 'neck-eyes',
      'Грудний відділ + Плечі': 'thoracic-shoulders',
      'Стегна + Поперек': 'hips-lower-back',
      'Активна розминка': 'active',
    };
    return nameMap[template.name] ?? null;
  }

  private rotationDisplayName(key: MicroBreakRotation): string {
    const names: Record<MicroBreakRotation, string> = {
      'neck-eyes': 'Шия + Очі',
      'thoracic-shoulders': 'Грудний відділ + Плечі',
      'hips-lower-back': 'Стегна + Поперек',
      'active': 'Активна розминка',
    };
    return names[key];
  }

  private rotationIcon(key: MicroBreakRotation): string {
    const icons: Record<MicroBreakRotation, string> = {
      'neck-eyes': '👁️',
      'thoracic-shoulders': '🦴',
      'hips-lower-back': '🦵',
      'active': '⚡',
    };
    return icons[key];
  }
}
