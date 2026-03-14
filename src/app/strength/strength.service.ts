import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/services/supabase.service';
import { AudioService } from '@shared/services/audio.service';
import { AuthService } from '../auth/auth.service';
import type {
  Exercise,
  ExerciseLog,
  MoodRating,
  SetLog,
  WorkoutTemplate,
} from '@shared/models/fitbreak.models';

export type StrengthState = 'idle' | 'exercising' | 'resting' | 'finished';

interface ExerciseState {
  exercise: Exercise;
  targetSets: number;
  targetReps: number | null;
  targetDurationSec: number | null;
  restSec: number;
  completedSets: SetLog[];
}

@Injectable({ providedIn: 'root' })
export class StrengthService {
  private supabase = inject(SupabaseService);
  private audio = inject(AudioService);
  private auth = inject(AuthService);

  private _state = signal<StrengthState>('idle');
  private _template = signal<WorkoutTemplate | null>(null);
  private _exerciseStates = signal<ExerciseState[]>([]);
  private _currentExerciseIndex = signal(0);
  private _startedAt = signal<string | null>(null);

  // Rest timer
  private _restRemainingMs = signal(0);
  private _restTotalMs = signal(0);
  private restTickId: ReturnType<typeof setInterval> | null = null;
  private lastRestTick = 0;

  readonly state = this._state.asReadonly();
  readonly template = this._template.asReadonly();
  readonly currentExerciseIndex = this._currentExerciseIndex.asReadonly();

  readonly currentExerciseState = computed(() => {
    const states = this._exerciseStates();
    const idx = this._currentExerciseIndex();
    return states[idx] ?? null;
  });

  readonly exerciseCount = computed(() => this._exerciseStates().length);

  readonly currentSetNumber = computed(() => {
    const state = this.currentExerciseState();
    if (!state) return 0;
    return state.completedSets.length + 1;
  });

  readonly isLastSet = computed(() => {
    const state = this.currentExerciseState();
    if (!state) return false;
    return state.completedSets.length >= state.targetSets - 1;
  });

  readonly isLastExercise = computed(() =>
    this._currentExerciseIndex() >= this._exerciseStates().length - 1,
  );

  readonly restRemainingSec = computed(() => Math.ceil(this._restRemainingMs() / 1000));
  readonly restTotalSec = computed(() => Math.ceil(this._restTotalMs() / 1000));

  async loadTemplate(templateId: string): Promise<void> {
    const { data: templateData, error: templateError } = await this.supabase.supabase
      .from('workout_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;
    const template = templateData as unknown as WorkoutTemplate;
    this._template.set(template);

    // Load exercises referenced by the template
    const exerciseIds = template.exercises.map(e => e.exerciseId);
    const { data: exercisesData, error: exercisesError } = await this.supabase.supabase
      .from('exercises')
      .select('*')
      .in('id', exerciseIds);

    if (exercisesError) throw exercisesError;
    const exercises = (exercisesData ?? []) as unknown as Exercise[];

    // Build exercise states in template order
    const states: ExerciseState[] = [];
    for (const slot of template.exercises) {
      const exercise = exercises.find(e => e.id === slot.exerciseId);
      if (!exercise) continue;
      states.push({
        exercise,
        targetSets: slot.overrideSets ?? exercise.default_sets ?? 3,
        targetReps: slot.overrideReps ?? exercise.default_reps,
        targetDurationSec: slot.overrideDurationSec ?? exercise.default_duration_sec,
        restSec: slot.overrideRestSec ?? exercise.default_rest_sec ?? 60,
        completedSets: [],
      });
    }

    this._exerciseStates.set(states);
  }

  start(): void {
    this.audio.init();
    this._currentExerciseIndex.set(0);
    this._startedAt.set(new Date().toISOString());
    this._state.set('exercising');
  }

  completeSet(repsCompleted?: number): void {
    const states = this._exerciseStates();
    const idx = this._currentExerciseIndex();
    const current = states[idx];
    if (!current) return;

    const setLog: SetLog = {
      setNumber: current.completedSets.length + 1,
      completed: true,
      repsCompleted,
      durationSec: current.targetDurationSec ?? undefined,
    };

    // Update exercise state immutably
    const updated = states.map((s, i) =>
      i === idx ? { ...s, completedSets: [...s.completedSets, setLog] } : s,
    );
    this._exerciseStates.set(updated);

    // If last set of last exercise → finish
    if (current.completedSets.length + 1 >= current.targetSets && idx >= states.length - 1) {
      this._state.set('finished');
      return;
    }

    // If last set → advance to next exercise after rest
    // If not last set → rest then next set
    this.startRest(current.restSec);
  }

  skipExercise(): void {
    const states = this._exerciseStates();
    const idx = this._currentExerciseIndex();
    const current = states[idx];
    if (!current) return;

    // Mark remaining sets as skipped
    const remainingSets = current.targetSets - current.completedSets.length;
    const skippedSets: SetLog[] = Array.from({ length: remainingSets }, (_, i) => ({
      setNumber: current.completedSets.length + i + 1,
      completed: false,
    }));

    const updated = states.map((s, i) =>
      i === idx ? { ...s, completedSets: [...s.completedSets, ...skippedSets] } : s,
    );
    this._exerciseStates.set(updated);

    if (idx >= states.length - 1) {
      this._state.set('finished');
    } else {
      this._currentExerciseIndex.set(idx + 1);
      this._state.set('exercising');
    }
  }

  skipRest(): void {
    this.stopRestTick();
    this.advanceAfterRest();
  }

  extendRest(seconds: number): void {
    this._restRemainingMs.update(ms => ms + seconds * 1000);
    this._restTotalMs.update(ms => ms + seconds * 1000);
  }

  async saveWorkoutLog(mood?: MoodRating, notes?: string): Promise<void> {
    const user = this.auth.user();
    const template = this._template();
    if (!user || !template) return;

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const startedAt = this._startedAt() ?? now;
    const durationMin = Math.round((Date.now() - new Date(startedAt).getTime()) / 60000);

    const exercises: ExerciseLog[] = this._exerciseStates().map((s, i) => ({
      exerciseId: s.exercise.id,
      exerciseName: s.exercise.name,
      sortOrder: i + 1,
      sets: s.completedSets,
      skipped: s.completedSets.every(set => !set.completed),
      notes: undefined,
    }));

    const { error } = await this.supabase.supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        workout_template_id: template.id,
        workout_type: 'strength',
        date: today,
        started_at: startedAt,
        completed_at: now,
        duration_min: durationMin,
        exercises: exercises as any,
        mood: mood || null,
        notes: notes || null,
      });

    if (error) throw error;
  }

  reset(): void {
    this.stopRestTick();
    this._state.set('idle');
    this._template.set(null);
    this._exerciseStates.set([]);
    this._currentExerciseIndex.set(0);
    this._startedAt.set(null);
  }

  private startRest(seconds: number): void {
    const totalMs = seconds * 1000;
    this._restTotalMs.set(totalMs);
    this._restRemainingMs.set(totalMs);
    this._state.set('resting');
    this.lastRestTick = Date.now();
    this.restTickId = setInterval(() => this.restTick(), 250);
  }

  private restTick(): void {
    const now = Date.now();
    const delta = now - this.lastRestTick;
    this.lastRestTick = now;

    const remaining = this._restRemainingMs() - delta;

    if (remaining <= 0) {
      this._restRemainingMs.set(0);
      this.stopRestTick();
      this.audio.playRestTimerEnd();
      this.advanceAfterRest();
      return;
    }

    this._restRemainingMs.set(remaining);
  }

  private stopRestTick(): void {
    if (this.restTickId) {
      clearInterval(this.restTickId);
      this.restTickId = null;
    }
  }

  private advanceAfterRest(): void {
    const states = this._exerciseStates();
    const idx = this._currentExerciseIndex();
    const current = states[idx];

    // If all sets done for current exercise → next exercise
    if (current && current.completedSets.length >= current.targetSets) {
      if (idx < states.length - 1) {
        this._currentExerciseIndex.set(idx + 1);
      } else {
        this._state.set('finished');
        return;
      }
    }

    this._state.set('exercising');
  }
}
