// ============================================================
// FitBreak — Data Model v2 (Final)
// ============================================================
// Стек: Angular 21 + Angular Material + Supabase
// Без Dexie.js, без Capacitor — чистий web/PWA
// ============================================================


// ────────────────────────────────────────────────────────────
// ENUMS & TYPES
// ────────────────────────────────────────────────────────────

/** Категорія вправи */
export type ExerciseCategory =
  | 'micro-break'     // мікроперерви (4 ротації)
  | 'strength'        // силові тренування
  | 'cardio'          // степер
  | 'stretching';     // окремий стретчинг (розширення)

/** Ротації мікроперерв */
export type MicroBreakRotation =
  | 'neck-eyes'            // Ротація 1: Шия + Очі
  | 'thoracic-shoulders'   // Ротація 2: Грудний відділ + Плечі
  | 'hips-lower-back'      // Ротація 3: Стегна + Поперек
  | 'active';              // Ротація 4: Активна розминка

/** Тип виконання вправи */
export type ExerciseType =
  | 'reps'            // повторення (10 присідань)
  | 'timed'           // на час (30 сек планка)
  | 'timed-hold'      // утримання позиції (розтяжка 30 сек)
  | 'bilateral';      // по черзі на кожну сторону

/** М'язові групи */
export type MuscleGroup =
  | 'neck' | 'eyes' | 'shoulders' | 'upper-back'
  | 'chest' | 'arms' | 'wrists' | 'core'
  | 'lower-back' | 'glutes' | 'hip-flexors'
  | 'quads' | 'hamstrings' | 'calves'
  | 'full-body';

/** Тип тренування */
export type WorkoutType = 'micro-break' | 'strength' | 'stepper';

/** Mood emoji після тренування */
export type MoodRating = '😊' | '🙂' | '😐' | '😫' | null;

/** Тип звукового сигналу */
export type SignalType = 'beep' | 'voice' | 'vibration';


// ────────────────────────────────────────────────────────────
// 1. EXERCISE — Бібліотека вправ
// ────────────────────────────────────────────────────────────

/** Крок техніки виконання */
export interface TechniqueStep {
  order: number;
  text: string;                         // "Вихідне положення: стань рівно, ноги на ширині плечей"
  keyPoint?: string;                    // "Спина рівна!" — акцент
}

/** Візуальний контент для вправи */
export interface ExerciseVisual {
  type: 'youtube' | 'gif' | 'image';
  url: string;                          // повний URL для gif/image
  youtubeVideoId?: string;              // ID відео
  youtubeStartSec?: number;             // початок фрагменту
  youtubeEndSec?: number;               // кінець фрагменту
}

/** Прогресія вправи */
export interface Progression {
  nextExerciseId?: string;              // наступний рівень
  previousExerciseId?: string;          // попередній рівень
  advanceCriteria?: string;             // "Коли робиш 3×15 без зусиль"
}

/**
 * EXERCISE
 *
 * Приклади:
 * - "Нахили голови" — micro-break, neck-eyes, timed, 30 сек
 * - "Push-ups regular" — strength, reps, 3×12
 */
export interface Exercise {
  id: string;                           // UUID
  userId: string;                       // Supabase auth user ID

  // --- Ідентифікація ---
  name: string;                         // "Нахили голови (Neck Tilts)"
  nameEn?: string;                      // "Neck Tilts" — для пошуку відео
  category: ExerciseCategory;
  microBreakRotation?: MicroBreakRotation;
  muscleGroups: MuscleGroup[];

  // --- Техніка ---
  shortDescription: string;             // "Зняти напругу з шиї після сидіння"
  technique: TechniqueStep[];
  warnings?: string[];                  // "Не робити різких рухів"
  tips?: string[];                      // "Дихай глибоко"

  // --- Параметри виконання ---
  exerciseType: ExerciseType;
  defaultReps?: number;                 // для reps
  defaultSets?: number;                 // для reps
  defaultDurationSec?: number;          // для timed / timed-hold
  defaultRestSec?: number;              // відпочинок між підходами
  isBilateral?: boolean;               // чи на обидві сторони

  // --- Візуальний контент ---
  visuals?: ExerciseVisual[];

  // --- Прогресія ---
  progression?: Progression;

  // --- Мета ---
  isCustom: boolean;                    // user-created vs seed
  sortOrder: number;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}


// ────────────────────────────────────────────────────────────
// 2. WORKOUT TEMPLATE — Шаблони тренувань
// ────────────────────────────────────────────────────────────

/** Вправа в шаблоні (з можливістю override параметрів) */
export interface WorkoutExerciseSlot {
  exerciseId: string;
  sortOrder: number;
  /** Override: в цій програмі робимо 4×8 замість default 3×12 */
  overrideReps?: number;
  overrideSets?: number;
  overrideDurationSec?: number;
  overrideRestSec?: number;
  notes?: string;                       // "Широкий хват"
}

/** Конфігурація степера */
export interface StepperConfig {
  durationMin: number;                  // 60
  intervalSignalMin: number;            // 5 або 10
  signalType: SignalType;               // 'beep'
}

/**
 * WORKOUT TEMPLATE
 *
 * Приклади:
 * - "Ротація 1: Шия + Очі" — micro-break, 4 вправи, ~3 хв
 * - "Full Body A" — strength, 5 вправ, ~25 хв
 * - "Степер 60 хв" — stepper, таймер з конфігом
 */
export interface WorkoutTemplate {
  id: string;
  userId: string;

  name: string;                         // "Full Body A"
  description?: string;                 // "Базова програма: присідання, push-ups..."
  workoutType: WorkoutType;
  estimatedDurationMin: number;
  exercises: WorkoutExerciseSlot[];     // порядок виконання

  // --- Степер ---
  stepperConfig?: StepperConfig;

  // --- UI ---
  color?: string;                       // hex для картки
  icon?: string;                        // emoji

  // --- Мета ---
  isDefault: boolean;                   // seed vs custom
  isActive: boolean;
  sortOrder: number;

  createdAt: string;
  updatedAt: string;
}


// ────────────────────────────────────────────────────────────
// 3. WORK SESSION — Робочий день з мікроперервами
// ────────────────────────────────────────────────────────────

/** Запис паузи робочого дня */
export interface PauseEntry {
  pausedAt: string;                     // коли поставив на паузу
  resumedAt?: string;                   // коли відновив (undefined = ще на паузі)
}

/** Одна перерва в робочому дні */
export interface BreakEntry {
  rotationIndex: number;                // 0-3 (яка ротація)
  rotationType: MicroBreakRotation;     // 'neck-eyes' і т.д.
  scheduledAt: string;                  // запланований час
  startedAt?: string;                   // фактично почав
  completedAt?: string;                 // фактично закінчив
  skipped: boolean;
  replacedWith?: MicroBreakRotation;    // якщо обрав "Іншу"
  mood?: MoodRating;
  extended?: boolean;                   // чи продовжив роботу замість перерви
  extendedByMin?: number;              // на скільки хвилин продовжив
  reason?: string;                      // причина продовження (опційно)
  actualWorkSeconds?: number;           // фактичний час роботи від старту/відновлення до початку перерви
}

/**
 * WORK SESSION
 *
 * Один запис = один робочий день.
 * Зберігає всі перерви (виконані та пропущені).
 */
export interface WorkSession {
  id: string;
  userId: string;

  date: string;                         // "2026-03-12"
  startedAt: string;                    // "Почати робочий день" timestamp
  endedAt?: string;                     // "Завершити день" timestamp
  status: 'active' | 'paused' | 'completed';

  breakIntervalMin: number;             // 30 | 45 | 60
  breaks: BreakEntry[];
  currentRotationIndex: number;         // наступна ротація (0-3, циклічно)

  // Пауза
  pausedAt?: string;                    // коли поставив на паузу (null = не на паузі)
  pauses: PauseEntry[];                 // історія всіх пауз
  nextBreakAt?: string;                 // коли наступна перерва (обчислюється)

  createdAt: string;
  updatedAt: string;
}


// ────────────────────────────────────────────────────────────
// 4. WORKOUT LOG — Журнал виконаних тренувань
// ────────────────────────────────────────────────────────────

/** Лог одного підходу */
export interface SetLog {
  setNumber: number;
  completed: boolean;
  repsCompleted?: number;               // optional — не обов'язково вводити
  durationSec?: number;                 // для timed вправ
}

/** Лог вправи в тренуванні */
export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;                 // денормалізовано для зручності
  sortOrder: number;
  sets: SetLog[];
  skipped: boolean;
  notes?: string;
}

/** Лог степер-сесії */
export interface StepperLog {
  targetDurationMin: number;            // скільки планував
  actualDurationMin: number;            // скільки реально
  pauseCount: number;
  totalPauseMin: number;
}

/**
 * WORKOUT LOG
 *
 * Створюється після завершення будь-якого тренування
 * (силового або степера). Мікроперерви логуються в WorkSession.breaks.
 */
export interface WorkoutLog {
  id: string;
  userId: string;

  workoutTemplateId: string;
  workoutType: 'strength' | 'stepper';  // micro-breaks → WorkSession
  date: string;
  startedAt: string;
  completedAt: string;
  durationMin: number;                  // фактична тривалість

  // --- Деталі ---
  exercises?: ExerciseLog[];            // для strength
  stepperLog?: StepperLog;              // для stepper

  // --- Feedback ---
  mood?: MoodRating;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}


// ────────────────────────────────────────────────────────────
// 5. USER SETTINGS — Налаштування
// ────────────────────────────────────────────────────────────

/**
 * USER SETTINGS
 *
 * Один рядок на юзера. Створюється при реєстрації.
 */
export interface UserSettings {
  id: string;
  userId: string;

  // --- Робочий день ---
  defaultBreakIntervalMin: number;      // 30 | 45 | 60
  enabledRotations: MicroBreakRotation[];
  rotationOrder: MicroBreakRotation[];

  // --- Степер ---
  defaultStepperDurationMin: number;    // 60
  defaultStepperIntervalMin: number;    // 5
  stepperSignalType: SignalType;        // 'beep'

  // --- Силове ---
  defaultRestBetweenSetsSec: number;    // 60

  // --- UI ---
  theme: 'light' | 'dark' | 'system';
  language: 'uk' | 'en';
  timerAnimationStyle: 'roll' | 'fade' | 'scale' | 'blur' | 'slot';  // анімація таймера

  // --- Нотифікації ---
  breakNotificationSound: 'gentle' | 'energetic' | 'default';
  enableBreakTabFlash: boolean;         // блимання табу при перерві

  createdAt: string;
  updatedAt: string;
}
