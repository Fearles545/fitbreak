-- ============================================================
-- FitBreak — Supabase SQL Schema v2 (Final)
-- ============================================================
-- Запустити в Supabase SQL Editor цілком.
-- Створює 5 таблиць + RLS policies + індекси.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. EXERCISES
-- ────────────────────────────────────────────────────────────

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Ідентифікація
  name text not null,
  name_en text,
  category text not null
    check (category in ('micro-break', 'strength', 'cardio', 'stretching')),
  micro_break_rotation text
    check (micro_break_rotation in ('neck-eyes', 'thoracic-shoulders', 'hips-lower-back', 'active')),
  muscle_groups text[] not null default '{}',

  -- Техніка
  short_description text not null,
  technique jsonb not null default '[]',     -- TechniqueStep[]
  warnings text[] default '{}',
  tips text[] default '{}',

  -- Параметри виконання
  exercise_type text not null
    check (exercise_type in ('reps', 'timed', 'timed-hold', 'bilateral')),
  default_reps int,
  default_sets int,
  default_duration_sec int,
  default_rest_sec int default 60,
  is_bilateral boolean default false,

  -- Таймер (опційний, null = без таймера)
  timer_sec int,                             -- тривалість таймера в секундах

  -- Візуальний контент
  visuals jsonb default '[]',                -- ExerciseVisual[]

  -- Прогресія
  progression jsonb,                          -- Progression

  -- Мета
  is_custom boolean default false,
  sort_order int default 0,
  is_active boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- ────────────────────────────────────────────────────────────
-- 2. WORKOUT TEMPLATES
-- ────────────────────────────────────────────────────────────

create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  name text not null,
  description text,
  workout_type text not null
    check (workout_type in ('micro-break', 'strength', 'stepper')),
  estimated_duration_min int not null,
  exercises jsonb not null default '[]',      -- WorkoutExerciseSlot[]

  -- Степер
  stepper_config jsonb,                       -- StepperConfig

  -- Цільові м'язові групи
  target_muscle_groups jsonb default '[]',    -- TargetMuscleGroup[] [{group, intensity}]

  -- UI
  color text,
  icon text,

  -- Мета
  is_default boolean default false,
  is_active boolean default true,
  sort_order int default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- ────────────────────────────────────────────────────────────
-- 3. WORK SESSIONS
-- ────────────────────────────────────────────────────────────

create table public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  date date not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed')),

  break_interval_min int not null default 45,
  breaks jsonb not null default '[]',         -- BreakEntry[]
  current_rotation_index int default 0,

  -- Пауза
  paused_at timestamptz,
  pauses jsonb not null default '[]',          -- PauseEntry[]
  next_break_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- ────────────────────────────────────────────────────────────
-- 4. WORKOUT LOGS
-- ────────────────────────────────────────────────────────────

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  workout_template_id uuid references public.workout_templates(id),
  workout_type text not null
    check (workout_type in ('strength', 'stepper')),
  date date not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  duration_min int not null,

  -- Деталі
  exercises jsonb,                            -- ExerciseLog[] (strength)
  stepper_log jsonb,                          -- StepperLog (stepper)

  -- Feedback
  mood text check (mood in ('great', 'good', 'okay', 'bad')),
  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- ────────────────────────────────────────────────────────────
-- 5. USER SETTINGS
-- ────────────────────────────────────────────────────────────

create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,

  -- Робочий день
  default_break_interval_min int default 45
    check (default_break_interval_min is null or default_break_interval_min between 5 and 120),
  enabled_rotations text[] default '{neck-eyes,thoracic-shoulders,hips-lower-back,active}',
  rotation_order text[] default '{neck-eyes,thoracic-shoulders,hips-lower-back,active}',

  -- Степер
  default_stepper_duration_min int default 60
    check (default_stepper_duration_min is null or default_stepper_duration_min between 5 and 120),
  default_stepper_interval_min int default 5
    check (default_stepper_interval_min is null or default_stepper_interval_min between 1 and 30),
  stepper_signal_type text default 'beep'
    check (stepper_signal_type in ('beep', 'voice', 'vibration')),

  -- Силове
  default_rest_between_sets_sec int default 60
    check (default_rest_between_sets_sec is null or default_rest_between_sets_sec between 10 and 300),

  -- UI
  theme text default 'system'
    check (theme in ('light', 'dark', 'system')),
  language text default 'uk'
    check (language in ('uk', 'en')),
  timer_animation_style text default 'roll'
    check (timer_animation_style in ('roll', 'fade', 'scale', 'blur', 'slot')),

  -- Нотифікації
  break_notification_sound text default 'default'
    check (break_notification_sound in ('gentle', 'energetic', 'default')),
  enable_break_tab_flash boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

-- Увімкнути RLS на всіх таблицях
alter table public.exercises enable row level security;
alter table public.workout_templates enable row level security;
alter table public.work_sessions enable row level security;
alter table public.workout_logs enable row level security;
alter table public.user_settings enable row level security;

-- Exercises
create policy "exercises_select" on public.exercises
  for select using ((select auth.uid()) = user_id);
create policy "exercises_insert" on public.exercises
  for insert with check ((select auth.uid()) = user_id);
create policy "exercises_update" on public.exercises
  for update using ((select auth.uid()) = user_id);
create policy "exercises_delete" on public.exercises
  for delete using ((select auth.uid()) = user_id);

-- Workout Templates
create policy "templates_select" on public.workout_templates
  for select using ((select auth.uid()) = user_id);
create policy "templates_insert" on public.workout_templates
  for insert with check ((select auth.uid()) = user_id);
create policy "templates_update" on public.workout_templates
  for update using ((select auth.uid()) = user_id);
create policy "templates_delete" on public.workout_templates
  for delete using ((select auth.uid()) = user_id);

-- Work Sessions
create policy "sessions_select" on public.work_sessions
  for select using ((select auth.uid()) = user_id);
create policy "sessions_insert" on public.work_sessions
  for insert with check ((select auth.uid()) = user_id);
create policy "sessions_update" on public.work_sessions
  for update using ((select auth.uid()) = user_id);
create policy "sessions_delete" on public.work_sessions
  for delete using ((select auth.uid()) = user_id);

-- Workout Logs
create policy "logs_select" on public.workout_logs
  for select using ((select auth.uid()) = user_id);
create policy "logs_insert" on public.workout_logs
  for insert with check ((select auth.uid()) = user_id);
create policy "logs_update" on public.workout_logs
  for update using ((select auth.uid()) = user_id);
create policy "logs_delete" on public.workout_logs
  for delete using ((select auth.uid()) = user_id);

-- User Settings
create policy "settings_select" on public.user_settings
  for select using ((select auth.uid()) = user_id);
create policy "settings_insert" on public.user_settings
  for insert with check ((select auth.uid()) = user_id);
create policy "settings_update" on public.user_settings
  for update using ((select auth.uid()) = user_id);


-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────

create index idx_exercises_user_category
  on public.exercises(user_id, category);

create index idx_exercises_user_rotation
  on public.exercises(user_id, micro_break_rotation)
  where micro_break_rotation is not null;

create index idx_templates_user_type
  on public.workout_templates(user_id, workout_type);

create index idx_sessions_user_date
  on public.work_sessions(user_id, date);

create index idx_logs_user_date
  on public.workout_logs(user_id, date);

create index idx_logs_user_type
  on public.workout_logs(user_id, workout_type);

create index idx_logs_template
  on public.workout_logs(workout_template_id);


-- ────────────────────────────────────────────────────────────
-- AUTO-UPDATE updated_at TRIGGER
-- ────────────────────────────────────────────────────────────

create or replace function public.update_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger exercises_updated_at
  before update on public.exercises
  for each row execute function public.update_updated_at();

create trigger templates_updated_at
  before update on public.workout_templates
  for each row execute function public.update_updated_at();

create trigger sessions_updated_at
  before update on public.work_sessions
  for each row execute function public.update_updated_at();

create trigger logs_updated_at
  before update on public.workout_logs
  for each row execute function public.update_updated_at();

create trigger settings_updated_at
  before update on public.user_settings
  for each row execute function public.update_updated_at();


-- ────────────────────────────────────────────────────────────
-- SESSION MAINTENANCE
-- ────────────────────────────────────────────────────────────

-- Завершити «забуті» сесії попередніх днів.
-- ended_at = updated_at (останній відомий момент активності).
create or replace function public.cleanup_stale_sessions()
returns void
language sql security definer
set search_path = ''
as $$
  update public.work_sessions
  set
    status = 'completed',
    ended_at = updated_at,
    paused_at = null
  where user_id = (select auth.uid())
    and status in ('active', 'paused')
    and date < current_date;
$$;


-- ────────────────────────────────────────────────────────────
-- ANALYTICS FUNCTIONS
-- ────────────────────────────────────────────────────────────

-- Щоденна активність за період
create or replace function public.daily_activity_stats(p_start date, p_end date)
returns table (
  date date,
  completed_breaks bigint,
  total_breaks bigint,
  skipped_breaks bigint,
  strength_count bigint,
  stepper_count bigint,
  work_duration_min int
)
language sql security definer
set search_path = ''
as $$
  with break_stats as (
    select
      s.date,
      count(*) filter (where (b->>'skipped')::boolean = false and b->>'completedAt' is not null) as completed,
      count(*) as total,
      count(*) filter (where (b->>'skipped')::boolean = true) as skipped,
      case when s.ended_at is not null then extract(epoch from (s.ended_at - s.started_at))::int / 60 else null end as work_min
    from public.work_sessions s
    left join lateral jsonb_array_elements(s.breaks) b on true
    where s.user_id = (select auth.uid()) and s.date between p_start and p_end
    group by s.date, s.started_at, s.ended_at
  ),
  workout_stats as (
    select w.date, count(*) filter (where w.workout_type = 'strength') as strength, count(*) filter (where w.workout_type = 'stepper') as stepper
    from public.workout_logs w
    where w.user_id = (select auth.uid()) and w.date between p_start and p_end
    group by w.date
  )
  select coalesce(b.date, w.date) as date, coalesce(b.completed, 0), coalesce(b.total, 0), coalesce(b.skipped, 0), coalesce(w.strength, 0), coalesce(w.stepper, 0), b.work_min
  from break_stats b full outer join workout_stats w on b.date = w.date
  order by date;
$$;

-- Статистика ротацій за період
create or replace function public.rotation_stats(p_start date, p_end date)
returns table (rotation_type text, completed bigint, skipped bigint, total bigint)
language sql security definer
set search_path = ''
as $$
  select b->>'rotationType', count(*) filter (where (b->>'skipped')::boolean = false and b->>'completedAt' is not null), count(*) filter (where (b->>'skipped')::boolean = true), count(*)
  from public.work_sessions s, jsonb_array_elements(s.breaks) b
  where s.user_id = (select auth.uid()) and s.date between p_start and p_end
  group by b->>'rotationType' order by total desc;
$$;

-- Загальні підсумки за весь час
create or replace function public.all_time_totals()
returns table (total_breaks_completed bigint, total_workouts bigint, total_stepper_sessions bigint, total_workout_minutes bigint, first_active_date date)
language sql security definer
set search_path = ''
as $$
  with bt as (select count(*) as c from public.work_sessions s, jsonb_array_elements(s.breaks) b where s.user_id = (select auth.uid()) and (b->>'skipped')::boolean = false and b->>'completedAt' is not null),
  wt as (select count(*) as t, count(*) filter (where workout_type = 'stepper') as st, coalesce(sum(duration_min), 0) as m from public.workout_logs where user_id = (select auth.uid())),
  fd as (select min(date) as d from public.work_sessions where user_id = (select auth.uid()))
  select bt.c, wt.t, wt.st, wt.m, fd.d from bt, wt, fd;
$$;

-- Статистика мікроперерв по тижнях
create or replace function public.weekly_break_stats(weeks_back int default 4)
returns table (
  week_start date,
  total_breaks bigint,
  completed_breaks bigint,
  skipped_breaks bigint,
  completion_rate numeric
)
language sql security definer
set search_path = ''
as $$
  select
    date_trunc('week', s.date)::date as week_start,
    sum(jsonb_array_length(s.breaks)) as total_breaks,
    sum(completed.cnt) as completed_breaks,
    sum(skipped.cnt) as skipped_breaks,
    round(
      sum(completed.cnt)::numeric
      / nullif(sum(jsonb_array_length(s.breaks)), 0) * 100
    , 1) as completion_rate
  from public.work_sessions s
  left join lateral (
    select count(*) as cnt
    from jsonb_array_elements(s.breaks) b
    where (b->>'skipped')::boolean = false
      and b->>'completedAt' is not null
  ) completed on true
  left join lateral (
    select count(*) as cnt
    from jsonb_array_elements(s.breaks) b
    where (b->>'skipped')::boolean = true
  ) skipped on true
  where s.user_id = (select auth.uid())
    and s.date >= current_date - (weeks_back * 7)
  group by date_trunc('week', s.date)
  order by week_start desc;
$$;

-- Статистика тренувань по тижнях
create or replace function public.weekly_workout_stats(weeks_back int default 4)
returns table (
  week_start date,
  strength_count bigint,
  stepper_count bigint,
  total_duration_min bigint
)
language sql security definer
set search_path = ''
as $$
  select
    date_trunc('week', date)::date as week_start,
    count(*) filter (where workout_type = 'strength') as strength_count,
    count(*) filter (where workout_type = 'stepper') as stepper_count,
    sum(duration_min) as total_duration_min
  from public.workout_logs
  where user_id = (select auth.uid())
    and date >= current_date - (weeks_back * 7)
  group by date_trunc('week', date)
  order by week_start desc;
$$;

-- Серії (поточна та найдовша)
create or replace function public.streak_stats()
returns table (
  current_streak bigint,
  longest_streak bigint
)
language sql security definer
set search_path = ''
as $$
  with active_dates as (
    select distinct s.date
    from public.work_sessions s
    where s.user_id = (select auth.uid())
      and s.status = 'completed'
      and exists (
        select 1 from jsonb_array_elements(s.breaks) b
        where (b->>'skipped')::boolean = false
          and b->>'completedAt' is not null
      )
  ),
  grouped as (
    select date,
           date - (row_number() over (order by date))::int as grp
    from active_dates
  ),
  streaks as (
    select count(*) as streak_length,
           max(date) as streak_end
    from grouped
    group by grp
  )
  select
    coalesce((
      select s.streak_length
      from streaks s
      where s.streak_end >= current_date - 1
      order by s.streak_end desc
      limit 1
    ), 0) as current_streak,
    coalesce(max(streak_length), 0) as longest_streak
  from streaks;
$$;
