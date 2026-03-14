-- ============================================================
-- FitBreak — Seed Data
-- ============================================================
-- IMPORTANT: Replace YOUR_USER_ID with your actual Supabase
-- auth user UUID before running.
--
-- Find it: Supabase Dashboard → Authentication → Users
-- ============================================================

-- All INSERTs below use this UUID directly:
-- 9495f2d3-e6e0-4996-903c-8a9254763b6c


-- ────────────────────────────────────────────────────────────
-- EXERCISES: Ротація 1 — Шия + Очі (neck-eyes)  ~3 хв
-- ────────────────────────────────────────────────────────────

INSERT INTO public.exercises (user_id, name, name_en, category, micro_break_rotation, muscle_groups, short_description, exercise_type, default_duration_sec, default_reps, is_bilateral, technique, warnings, tips, sort_order)
VALUES
('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Нахили голови', 'Neck Side Tilts', 'micro-break', 'neck-eyes', '{neck}',
 'Зняти напругу з бічних м''язів шиї',
 'bilateral', 30, null, true,
 '[{"order":1,"text":"Встань. Повільно нахили голову вправо, ніби тягнешся вухом до плеча"},{"order":2,"text":"Протилежну руку м''яко тягни донизу","keyPoint":"Не піднімай плече до вуха — навпаки, тягни плече вниз!"},{"order":3,"text":"Тримай 15 секунд, потім поміняй сторону"}]',
 '{"Не робити різких рухів","Рух повільний і контрольований"}',
 '{"Дихай глибоко і рівномірно під час утримання"}',
 1),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Підборіддя назад', 'Chin Tucks', 'micro-break', 'neck-eyes', '{neck}',
 'Компенсувати передню позицію голови від екрану',
 'reps', 30, 8, false,
 '[{"order":1,"text":"Стоячи, дивись прямо перед собою"},{"order":2,"text":"Повільно тягни підборіддя назад, ніби робиш собі подвійне підборіддя","keyPoint":"Голова рухається горизонтально назад, не нахиляється!"},{"order":3,"text":"Тримай 3 секунди, відпусти"},{"order":4,"text":"Повтори 8 разів"}]',
 '{"Не закидай голову назад"}',
 '{"Уяви що хтось м''яко штовхає тебе за лоб назад"}',
 2),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Обертання плечима', 'Shoulder Circles', 'micro-break', 'neck-eyes', '{shoulders,neck}',
 'Зняти напругу з плечового поясу',
 'reps', 30, 10, false,
 '[{"order":1,"text":"Встань. Підніми плечі до вух"},{"order":2,"text":"Відведи плечі назад, опусти вниз"},{"order":3,"text":"Роби повні кола назад — 10 разів"},{"order":4,"text":"Потім 10 кіл вперед"}]',
 null,
 '{"Роби повільно, з максимальною амплітудою"}',
 3),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Правило 20-20-20 для очей', 'Eye 20-20-20 Rule', 'micro-break', 'neck-eyes', '{eyes}',
 'Дати відпочинок очам від екрану',
 'timed', 30, null, false,
 '[{"order":1,"text":"Підійди до вікна"},{"order":2,"text":"Дивись на об''єкт на відстані 6+ метрів протягом 20 секунд"},{"order":3,"text":"Поморгай швидко 10–15 разів","keyPoint":"Моргання зволожує очі!"},{"order":4,"text":"Повтори ще раз"}]',
 null,
 '{"Моргай частіше — при роботі за екраном ми моргаємо вдвічі рідше"}',
 4),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Розтяжка зап''ясть', 'Wrist Stretch', 'micro-break', 'neck-eyes', '{wrists}',
 'Зняти напругу із зап''ясть після друкування',
 'bilateral', 30, null, true,
 '[{"order":1,"text":"Витягни праву руку вперед, пальцями вгору"},{"order":2,"text":"Лівою рукою м''яко тягни пальці на себе — тримай 10 сек"},{"order":3,"text":"Потім пальцями вниз — тягни вниз 10 сек","keyPoint":"Рука залишається прямою!"},{"order":4,"text":"Поміняй руку"}]',
 '{"Не тягни занадто сильно — легкий розтяг"}',
 '{"Важливо для тих, хто багато друкує"}',
 5);


-- ────────────────────────────────────────────────────────────
-- EXERCISES: Ротація 2 — Грудний відділ + Плечі (thoracic-shoulders)  ~4 хв
-- ────────────────────────────────────────────────────────────

INSERT INTO public.exercises (user_id, name, name_en, category, micro_break_rotation, muscle_groups, short_description, exercise_type, default_duration_sec, default_reps, is_bilateral, technique, warnings, tips, sort_order)
VALUES
('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Розтяжка в дверному отворі', 'Doorway Stretch', 'micro-break', 'thoracic-shoulders', '{chest,shoulders}',
 'Розкрити грудну клітку, компенсувати сутулість',
 'timed', 40, null, false,
 '[{"order":1,"text":"Стань в дверному отворі"},{"order":2,"text":"Постав передпліччя на косяки на рівні плечей, лікті зігнуті 90°"},{"order":3,"text":"Зроби маленький крок вперед, поки не відчуєш розтягнення в грудях і плечах","keyPoint":"Спина рівна, не прогинайся в попереку!"},{"order":4,"text":"Тримай 20 сек, відпочинь, повтори"}]',
 '{"Не прогинайся в попереку","Рух плавний — не падай вперед"}',
 '{"Дихай глибоко, розкриваючи грудну клітку на вдиху"}',
 1),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Розгинання грудного відділу', 'Thoracic Extension', 'micro-break', 'thoracic-shoulders', '{upper-back}',
 'Покращити рухливість грудного відділу хребта',
 'reps', 40, 8, false,
 '[{"order":1,"text":"Сядь на крісло, руки за голову (пальці сплетені на потилиці)"},{"order":2,"text":"Повільно прогнись назад через спинку крісла, ніби обгортаєш спину навколо спинки","keyPoint":"Рух має йти з грудного відділу, не з попереку!"},{"order":3,"text":"Лікті дивляться в стелю"},{"order":4,"text":"Тримай 3 сек, повернись. Повтори 8 разів"}]',
 '{"Не прогинайся в попереку — рух тільки в грудному відділі"}',
 '{"Видихай при прогинанні назад"}',
 2),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Розкриття книги', 'Open Books', 'micro-break', 'thoracic-shoulders', '{upper-back,shoulders}',
 'Ротація грудного відділу для покращення рухливості',
 'bilateral', 60, 6, true,
 '[{"order":1,"text":"Стоячи, ноги на ширині плечей. Руки перед собою, долоні разом"},{"order":2,"text":"Повільно відведи праву руку вправо, слідкуючи очима за долонею","keyPoint":"Таз нерухомий — обертається тільки грудний відділ!"},{"order":3,"text":"Повернись, поміняй сторону"},{"order":4,"text":"6 разів на кожну сторону"}]',
 '{"Не обертай таз — рух тільки у грудному відділі"}',
 '{"Слідкуй очима за рукою — це допомагає збільшити ротацію"}',
 3),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Ангели на стіні', 'Wall Angels', 'micro-break', 'thoracic-shoulders', '{shoulders,upper-back}',
 'Покращити рухливість плечей і поставу',
 'reps', 60, 10, false,
 '[{"order":1,"text":"Стань спиною до стіни. Поперек, лопатки і голова торкаються стіни"},{"order":2,"text":"Підніми руки в позицію «здаюсь» (лікті 90°), тильні сторони долонь до стіни"},{"order":3,"text":"Повільно ковзай руки вгору по стіні, не відриваючи від неї","keyPoint":"Якщо руки відриваються — це нормально, працюй в доступному діапазоні!"},{"order":4,"text":"Повернись вниз. 10 повторень"}]',
 '{"Не форсуй амплітуду — працюй в комфортному діапазоні"}',
 '{"З часом амплітуда збільшиться — це показник прогресу"}',
 4);


-- ────────────────────────────────────────────────────────────
-- EXERCISES: Ротація 3 — Стегна + Поперек (hips-lower-back)  ~4 хв
-- ────────────────────────────────────────────────────────────

INSERT INTO public.exercises (user_id, name, name_en, category, micro_break_rotation, muscle_groups, short_description, exercise_type, default_duration_sec, default_reps, is_bilateral, technique, warnings, tips, sort_order)
VALUES
('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Розтяжка згиначів стегна', 'Hip Flexor Stretch', 'micro-break', 'hips-lower-back', '{hip-flexors}',
 'Найважливіша вправа для тих, хто сидить весь день',
 'bilateral', 60, null, true,
 '[{"order":1,"text":"Зроби випад вперед: права нога попереду, ліве коліно на підлозі","keyPoint":"Підклади подушку під коліно!"},{"order":2,"text":"Корпус рівно, м''яко подайся вперед"},{"order":3,"text":"Відчуй розтягнення спереду лівого стегна"},{"order":4,"text":"Тримай 30 сек, поміняй ногу"}]',
 '{"Корпус вертикально — не нахиляйся вперед","Переднє коліно не виходить за носок"}',
 '{"Стисни сідниці задньої ноги — це поглиблює розтяжку"}',
 1),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Розтяжка сідниць', 'Figure-4 Stretch', 'micro-break', 'hips-lower-back', '{glutes,hip-flexors}',
 'Розтягнути глибокі м''язи сідниць після сидіння',
 'bilateral', 50, null, true,
 '[{"order":1,"text":"Сядь на крісло"},{"order":2,"text":"Поклади праву кісточку на ліве коліно (поза «четвірка»)"},{"order":3,"text":"Спина рівна, повільно нахилися вперед від стегон","keyPoint":"Нахил від стегон, не від попереку!"},{"order":4,"text":"Відчуй розтяг в правій сідниці. Тримай 25 сек, поміняй ногу"}]',
 '{"Не округлюй спину при нахилі"}',
 '{"Чим ближче тіло до ноги, тим глибший розтяг"}',
 2),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Кіт-Корова стоячи', 'Standing Cat-Cow', 'micro-break', 'hips-lower-back', '{lower-back,core}',
 'Розім''яти хребет хвилеподібними рухами',
 'reps', 40, 8, false,
 '[{"order":1,"text":"Стоячи, руки на колінах, ноги трохи зігнуті"},{"order":2,"text":"На вдиху: прогнись, підніми голову вгору, лопатки разом (Cow)"},{"order":3,"text":"На видиху: округли спину, підборіддя до грудей (Cat)","keyPoint":"Рух слідує за диханням!"},{"order":4,"text":"Повільно чергуй 8 разів. Дихай глибоко"}]',
 null,
 '{"Кожен рух — повний вдих або видих, не поспішай"}',
 3),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Обертання тазом', 'Hip Circles', 'micro-break', 'hips-lower-back', '{hip-flexors,glutes}',
 'Покращити рухливість кульшових суглобів',
 'reps', 30, 10, false,
 '[{"order":1,"text":"Стоячи, руки на поясі, ноги на ширині плечей"},{"order":2,"text":"Роби великі кола тазом, ніби крутиш хула-хуп"},{"order":3,"text":"10 кіл в одну сторону, 10 в іншу"}]',
 null,
 '{"Максимальна амплітуда — чим більше коло, тим краще"}',
 4);


-- ────────────────────────────────────────────────────────────
-- EXERCISES: Ротація 4 — Активна розминка (active)  ~3 хв
-- ────────────────────────────────────────────────────────────

INSERT INTO public.exercises (user_id, name, name_en, category, micro_break_rotation, muscle_groups, short_description, exercise_type, default_duration_sec, default_reps, is_bilateral, technique, warnings, tips, sort_order)
VALUES
('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Коліна вгору на місці', 'High Knees', 'micro-break', 'active', '{full-body}',
 'Розігнати кров і підняти пульс',
 'timed', 30, null, false,
 '[{"order":1,"text":"Маршируй на місці, піднімаючи коліна якомога вище","keyPoint":"Ідеально — до рівня стегон!"},{"order":2,"text":"Руки працюють навзаєм"},{"order":3,"text":"Почни повільно, прискорюй до комфортного темпу"}]',
 '{"Після хвороби — заміни на спокійну ходьбу на місці"}',
 '{"Дихай ритмічно: вдих через ніс, видих через рот"}',
 1),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Присідання', 'Bodyweight Squats', 'micro-break', 'active', '{quads,glutes}',
 'Активувати ноги і сідниці',
 'reps', 30, 15, false,
 '[{"order":1,"text":"Ноги на ширині плечей, носки трохи назовні"},{"order":2,"text":"Присядь до паралелі стегон з підлогою (або нижче, якщо можеш)","keyPoint":"Спина рівна, вага на п''ятках!"},{"order":3,"text":"10–15 повторень в спокійному темпі"}]',
 '{"Коліна в напрямку носків","Спина рівна протягом руху"}',
 '{"Руки перед собою для балансу"}',
 2),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Віджимання від столу', 'Incline Push-ups', 'micro-break', 'active', '{chest,arms,shoulders}',
 'Підсилити верхню частину тіла',
 'reps', 30, 15, false,
 '[{"order":1,"text":"Руки на краю столу, тіло під кутом"},{"order":2,"text":"Зроби 10–15 віджимань","keyPoint":"Лікті під 45° до корпусу — не розводь в сторони!"},{"order":3,"text":"Тіло — одна лінія від голови до п''ят"}]',
 '{"Перевір що стіл стійкий!"}',
 '{"Чим далі ноги від столу, тим важче"}',
 3),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Jumping Jacks', 'Jumping Jacks', 'micro-break', 'active', '{full-body}',
 'Класичне кардіо для розгону крові',
 'reps', 30, 20, false,
 '[{"order":1,"text":"Класичні стрибки з розведенням ніг і рук"},{"order":2,"text":"15–20 повторень"},{"order":3,"text":"Після хвороби — заміни на швидку ходьбу на місці з високим підніманням колін"}]',
 '{"Після хвороби або при болю в суглобах — заміни на марш на місці"}',
 '{"Приземляйся м''яко, на носки"}',
 4),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Глибоке дихання', 'Deep Breathing Cool Down', 'micro-break', 'active', '{core}',
 'Відновити пульс і повернутись за роботу',
 'timed', 30, null, false,
 '[{"order":1,"text":"3 глибокі вдихи через ніс (4 сек)"},{"order":2,"text":"Повільні видихи через рот (6 сек)"},{"order":3,"text":"Віднови пульс, повернись за роботу з чистою головою"}]',
 null,
 '{"Видих довший за вдих — це активує парасимпатичну нервову систему"}',
 5);


-- ────────────────────────────────────────────────────────────
-- EXERCISES: Силові (strength)
-- ────────────────────────────────────────────────────────────

INSERT INTO public.exercises (user_id, name, name_en, category, muscle_groups, short_description, exercise_type, default_reps, default_sets, default_duration_sec, default_rest_sec, technique, warnings, tips, sort_order)
VALUES
('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Присідання з власною вагою', 'Bodyweight Squats', 'strength', '{quads,glutes,core}',
 'Базова вправа для ніг',
 'reps', 15, 3, null, 60,
 '[{"order":1,"text":"Встань, ноги на ширині плечей, носки трохи назовні"},{"order":2,"text":"Присідай, відводячи таз назад","keyPoint":"Коліна в напрямку носків!"},{"order":3,"text":"Опустись нижче паралелі, якщо дозволяє рухливість"},{"order":4,"text":"Піднімись, натискаючи на п''ятки"}]',
 '{"Спина рівна","Коліна не заваліюються всередину"}',
 '{"Уяви що сідаєш на стілець"}',
 1),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Віджимання від підлоги', 'Push-ups', 'strength', '{chest,arms,shoulders,core}',
 'Базова вправа для верхньої частини тіла',
 'reps', 10, 3, null, 60,
 '[{"order":1,"text":"Прийми упор лежачи, руки трохи ширше плечей"},{"order":2,"text":"Опустись вниз, згинаючи руки","keyPoint":"Тіло — пряма лінія від голови до п''ят!"},{"order":3,"text":"Груди майже торкаються підлоги"},{"order":4,"text":"Відштовхнись вгору"}]',
 '{"Не прогинайся в попереку","Не піднімай таз вгору"}',
 '{"Якщо важко — роби з колін"}',
 2),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Сідничний міст', 'Glute Bridge', 'strength', '{glutes,hamstrings,lower-back}',
 'Активувати сідниці і зміцнити поперек',
 'reps', 15, 3, null, 60,
 '[{"order":1,"text":"Ляг на спину, коліна зігнуті, стопи на підлозі"},{"order":2,"text":"Підніми таз вгору, стискаючи сідниці","keyPoint":"Максимальне скорочення сідниць вгорі!"},{"order":3,"text":"Затримайся на 1 секунду"},{"order":4,"text":"Повільно опустись вниз"}]',
 '{"Не перерозгинай поперек"}',
 '{"Притисни поперек до підлоги перед підйомом"}',
 3),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Планка', 'Plank', 'strength', '{core,shoulders}',
 'Зміцнити кор і стабілізатори',
 'timed', null, 3, 30, 60,
 '[{"order":1,"text":"Прийми упор на передпліччях і носках"},{"order":2,"text":"Тіло — пряма лінія","keyPoint":"Не прогинайся і не піднімай таз!"},{"order":3,"text":"Напруж прес, дихай рівномірно"},{"order":4,"text":"Тримай 30-60 секунд"}]',
 '{"Не затримуй дихання"}',
 '{"Дивись в підлогу, шия розслаблена"}',
 4),

('9495f2d3-e6e0-4996-903c-8a9254763b6c', 'Скручування', 'Crunches', 'strength', '{core}',
 'Зміцнити прямий м''яз живота',
 'reps', 15, 3, null, 60,
 '[{"order":1,"text":"Ляг на спину, коліна зігнуті, руки за головою"},{"order":2,"text":"Підніми лопатки від підлоги, скручуючись","keyPoint":"Не тягни голову руками!"},{"order":3,"text":"Затримайся на 1 секунду"},{"order":4,"text":"Повільно опустись назад"}]',
 '{"Не відривай поперек від підлоги","Не тягни шию руками"}',
 '{"Видихай на підйомі"}',
 5);


-- ────────────────────────────────────────────────────────────
-- WORKOUT TEMPLATES: Мікроперерви (4 ротації) + Силова + Степер
-- ────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_uid uuid := '9495f2d3-e6e0-4996-903c-8a9254763b6c';
  v_exercises jsonb;
BEGIN

  -- Rotation 1: Neck + Eyes (~3 min, 5 exercises)
  SELECT jsonb_agg(
    jsonb_build_object('exerciseId', id::text, 'sortOrder', sort_order)
    ORDER BY sort_order
  ) INTO v_exercises
  FROM public.exercises
  WHERE user_id = v_uid AND micro_break_rotation = 'neck-eyes';

  INSERT INTO public.workout_templates (user_id, name, description, workout_type, estimated_duration_min, exercises, icon, is_default, sort_order)
  VALUES (v_uid, 'Шия + Очі', 'Ротація 1: зняти напругу з шиї, дати відпочинок очам', 'micro-break', 3, v_exercises, '👁️', true, 1);

  -- Rotation 2: Thoracic + Shoulders (~4 min, 4 exercises)
  SELECT jsonb_agg(
    jsonb_build_object('exerciseId', id::text, 'sortOrder', sort_order)
    ORDER BY sort_order
  ) INTO v_exercises
  FROM public.exercises
  WHERE user_id = v_uid AND micro_break_rotation = 'thoracic-shoulders';

  INSERT INTO public.workout_templates (user_id, name, description, workout_type, estimated_duration_min, exercises, icon, is_default, sort_order)
  VALUES (v_uid, 'Грудний відділ + Плечі', 'Ротація 2: розкрити грудну клітку, компенсувати сутулість', 'micro-break', 4, v_exercises, '🦴', true, 2);

  -- Rotation 3: Hips + Lower Back (~4 min, 4 exercises)
  SELECT jsonb_agg(
    jsonb_build_object('exerciseId', id::text, 'sortOrder', sort_order)
    ORDER BY sort_order
  ) INTO v_exercises
  FROM public.exercises
  WHERE user_id = v_uid AND micro_break_rotation = 'hips-lower-back';

  INSERT INTO public.workout_templates (user_id, name, description, workout_type, estimated_duration_min, exercises, icon, is_default, sort_order)
  VALUES (v_uid, 'Стегна + Поперек', 'Ротація 3: розблокувати стегна після сидіння, зняти тиск з попереку', 'micro-break', 4, v_exercises, '🦵', true, 3);

  -- Rotation 4: Active (~3 min, 5 exercises)
  SELECT jsonb_agg(
    jsonb_build_object('exerciseId', id::text, 'sortOrder', sort_order)
    ORDER BY sort_order
  ) INTO v_exercises
  FROM public.exercises
  WHERE user_id = v_uid AND micro_break_rotation = 'active';

  INSERT INTO public.workout_templates (user_id, name, description, workout_type, estimated_duration_min, exercises, icon, is_default, sort_order)
  VALUES (v_uid, 'Активна розминка', 'Ротація 4: розігнати кров, підняти енергію', 'micro-break', 3, v_exercises, '⚡', true, 4);

  -- Strength: Full Body A
  SELECT jsonb_agg(
    jsonb_build_object('exerciseId', id::text, 'sortOrder', sort_order)
    ORDER BY sort_order
  ) INTO v_exercises
  FROM public.exercises
  WHERE user_id = v_uid AND category = 'strength';

  INSERT INTO public.workout_templates (user_id, name, description, workout_type, estimated_duration_min, exercises, icon, is_default, sort_order)
  VALUES (v_uid, 'Full Body A', 'Базова програма: присідання, віджимання, міст, планка, скручування', 'strength', 25, v_exercises, '🏋️', true, 5);

  -- Stepper: 60 min
  INSERT INTO public.workout_templates (user_id, name, description, workout_type, estimated_duration_min, exercises, stepper_config, icon, is_default, sort_order)
  VALUES (v_uid, 'Степер 60 хв', 'Кардіо на степері з інтервальними сигналами', 'stepper', 60, '[]',
    '{"durationMin":60,"intervalSignalMin":5,"signalType":"beep"}',
    '🪜', true, 6);

END $$;


-- ────────────────────────────────────────────────────────────
-- USER SETTINGS: Default row
-- ────────────────────────────────────────────────────────────

INSERT INTO public.user_settings (user_id)
VALUES ('9495f2d3-e6e0-4996-903c-8a9254763b6c');
