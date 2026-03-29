import type { Tables } from './database.types';

// ────────────────────────────────────────────────────────────
// Enums & union types (match DB check constraints)
// ────────────────────────────────────────────────────────────

export type ExerciseCategory = 'micro-break' | 'strength' | 'cardio' | 'stretching';

export type ExerciseType = 'reps' | 'timed' | 'timed-hold' | 'bilateral';

export type MuscleGroup =
  | 'neck' | 'eyes' | 'shoulders' | 'upper-back'
  | 'chest' | 'arms' | 'wrists' | 'core'
  | 'lower-back' | 'glutes' | 'hip-flexors'
  | 'quads' | 'hamstrings' | 'calves'
  | 'full-body';

export type WorkoutType = 'micro-break' | 'strength' | 'stepper';

export type MoodRating = 'great' | 'good' | 'okay' | 'bad';

export type SignalType = 'beep' | 'voice' | 'vibration';

export type SessionStatus = 'active' | 'paused' | 'completed';

// ────────────────────────────────────────────────────────────
// JSONB sub-types (stored inside DB JSONB columns)
// ────────────────────────────────────────────────────────────

/** exercises.technique — JSONB array */
export interface TechniqueStep {
  order: number;
  text: string;
  keyPoint?: string;
}

/** exercises.visuals — JSONB array */
export interface ExerciseVisual {
  type: 'youtube' | 'gif' | 'image';
  url: string;
  youtubeVideoId?: string;
  youtubeStartSec?: number;
  youtubeEndSec?: number;
}

/** exercises.difficulty_overrides — JSONB object */
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyParams {
  reps?: number | null;
  durationSec?: number | null;
  note?: string;
}

export type DifficultyOverrides = Partial<Record<DifficultyLevel, DifficultyParams>>;

/** exercises.progression — JSONB object */
export interface Progression {
  nextExerciseId?: string;
  previousExerciseId?: string;
  advanceCriteria?: string;
}

/** workout_templates.target_muscle_groups — JSONB array */
export interface TargetMuscleGroup {
  group: MuscleGroup;
  intensity: 1 | 2 | 3; // 1 = light stretch, 2 = moderate, 3 = intense
}

/** workout_templates.exercises — JSONB array */
export interface WorkoutExerciseSlot {
  exerciseId: string;
  sortOrder: number;
  overrideReps?: number;
  overrideSets?: number;
  overrideDurationSec?: number;
  overrideRestSec?: number;
  notes?: string;
}

/** workout_templates.stepper_config — JSONB object */
export interface StepperConfig {
  durationMin: number;
  intervalSignalMin: number;
  signalType: SignalType;
}

/** work_sessions.pauses — JSONB array */
export interface PauseEntry {
  pausedAt: string;
  resumedAt?: string;
}

/** work_sessions.breaks — JSONB array */
export interface BreakEntry {
  rotationIndex: number;
  templateId: string;
  templateName: string;
  templateIcon: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  skipped: boolean;
  replacedWith?: string;
  mood?: MoodRating;
  extended?: boolean;
  extendedByMin?: number;
  reason?: string;
  actualWorkSeconds?: number;
  muscleGroups?: TargetMuscleGroup[];
}

/** workout_logs.exercises — JSONB array (strength workouts) */
export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sortOrder: number;
  sets: SetLog[];
  skipped: boolean;
  notes?: string;
}

export interface SetLog {
  setNumber: number;
  completed: boolean;
  repsCompleted?: number;
  durationSec?: number;
}

/** workout_logs.stepper_log — JSONB object */
export interface StepperLog {
  targetDurationMin: number;
  actualDurationMin: number;
  pauseCount: number;
  totalPauseMin: number;
}

// ────────────────────────────────────────────────────────────
// Row types with typed JSONB (extend generated DB rows)
// ────────────────────────────────────────────────────────────

export interface Exercise extends Omit<Tables<'exercises'>, 'technique' | 'visuals' | 'progression' | 'difficulty_overrides' | 'category' | 'exercise_type' | 'muscle_groups'> {
  category: ExerciseCategory;
  exercise_type: ExerciseType;
  muscle_groups: MuscleGroup[];
  technique: TechniqueStep[];
  visuals: ExerciseVisual[] | null;
  progression: Progression | null;
  difficulty_overrides: DifficultyOverrides | null;
}

export interface WorkoutTemplate extends Omit<Tables<'workout_templates'>, 'exercises' | 'stepper_config' | 'workout_type' | 'target_muscle_groups' | 'last_difficulty'> {
  workout_type: WorkoutType;
  exercises: WorkoutExerciseSlot[];
  stepper_config: StepperConfig | null;
  target_muscle_groups: TargetMuscleGroup[];
  last_difficulty: DifficultyLevel | null;
}

export interface WorkSession extends Omit<Tables<'work_sessions'>, 'breaks' | 'status' | 'pauses'> {
  status: SessionStatus;
  breaks: BreakEntry[];
  pauses: PauseEntry[];
}

export interface WorkoutLog extends Omit<Tables<'workout_logs'>, 'exercises' | 'stepper_log' | 'workout_type' | 'mood'> {
  workout_type: 'strength' | 'stepper';
  exercises: ExerciseLog[] | null;
  stepper_log: StepperLog | null;
  mood: MoodRating | null;
}

export type BreakNotificationSound = 'gentle' | 'energetic' | 'default';
export type VibrationPattern = 'short' | 'long' | 'double' | 'off';

export interface UserSettings extends Omit<Tables<'user_settings'>, 'enabled_template_ids' | 'template_order' | 'stepper_signal_type' | 'theme' | 'language' | 'break_notification_sound' | 'timer_animation_style' | 'break_vibration_pattern'> {
  enabled_template_ids: string[] | null;
  template_order: string[] | null;
  stepper_signal_type: SignalType | null;
  theme: 'light' | 'dark' | 'system' | null;
  language: 'uk' | 'en' | null;
  break_notification_sound: BreakNotificationSound | null;
  timer_animation_style: 'roll' | 'fade' | 'scale' | 'blur' | 'slot';
  break_vibration_pattern: VibrationPattern | null;
}

export interface DayActivity {
  date: string;
  breakCount: number;
  hasStrength: boolean;
  hasStepper: boolean;
}
