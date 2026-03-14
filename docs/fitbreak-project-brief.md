# FitBreak — Project Brief

> Персональний health-tool для формування звички робити перерви, тренуватись і рухатись протягом робочого дня. Не SaaS, не стартап — інструмент для одного користувача.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 21 + Angular Material |
| Backend | Supabase (Auth + PostgreSQL + RLS) |
| Audio | Web Audio API |

Додатково: `@angular/pwa` для installable PWA (service worker, manifest). Жодного окремого бекенду — Angular напряму спілкується з Supabase через JS SDK. Optimistic updates через Angular Signals для швидкого UI відгуку.

---

## Core Principles

1. **Zero-decision flow** — застосунок сам пропонує наступну дію, юзер тільки натискає "Почати" і "Готово". Мінімум вибору = мінімум причин пропустити.
2. **Frictionless tracking** — логування відбувається автоматично при натисканні "Готово". Ніяких обов'язкових форм. Optional mood emoji (один тап), optional нотатка (окрема кнопка).
3. **Кожна вправа зрозуміла з першого погляду** — візуальна техніка (YouTube embed, GIF, зображення) + покрокова текстова інструкція + warnings. Collapsible після 5+ виконань.
4. **Responsive web-first** — основний девайс для мікроперерв: десктоп (браузер). Для силового: телефон. Для степера: планшет. Один застосунок, адаптивний layout.

---

## User Flows

### Flow 1: Робочий день + Мікроперерви

**Основний девайс:** комп'ютер (браузер)

**Сценарій:**

1. Юзер відкриває застосунок → бачить start screen: привітання, тижневий calendar з іконками активності минулих днів (⏸️ 6 перерв, 💪 силове, 🏃 степер), streak counter, health tip.
2. Натискає **"Почати робочий день"** → створюється WorkSession, запускається таймер (30/45/60 хв — налаштовуваний).
3. Dashboard показує: circular countdown timer до перерви, preview наступної ротації, статистику дня, quick launch для силового/степера.
4. **Таймер спрацював** → tab title змінюється на "⏰ Час на перерву! — FitBreak", через 2 хвилини — звуковий beep (Web Audio API).
5. На екрані: наступна ротація з черги, одна велика кнопка **"Почати розминку"**, маленькі "Обрати іншу" та "Пропустити" внизу.
6. **Execution mode:** покрокова вправа за вправою. Кожна вправа показує: назву, візуальний блок (YouTube/GIF), техніку по кроках, таймер для timed вправ, warning box.
7. Натискає **"Готово"** → optional emoji mood (😊🙂😐😫, один тап, не обов'язково) → таймер перезапускається автоматично.
8. Ротація циклічна: 1→2→3→4→1→2→... Автопілот, zero-decision.
9. Натискає **"Завершити робочий день"** → day summary: всі перерви з часами та статусами, completion rate, mood trend, тренування дня.

**4 ротації мікроперерв:**
- Ротація 1: Шия + Очі (~3 хв) — нахили голови, обертання шиї, фокусування очей, пальмінг
- Ротація 2: Грудний відділ + Плечі (~4 хв) — thoracic extension, open books, wall angels
- Ротація 3: Стегна + Поперек (~4 хв) — hip flexor stretch, figure-4, cat-cow, hip circles
- Ротація 4: Активна розминка (~3 хв) — high knees, squats, incline push-ups, jumping jacks

### Flow 2: Силове тренування

**Основний девайс:** телефон (браузер)

**Сценарій:**

1. Dashboard → **"Силове"** → бачить свою поточну програму (напр. "Full Body A: 5 вправ, ~25 хв") → "Почати".
2. **Execution mode:** поточна вправа великим шрифтом + коротка техніка (collapsible визуальний блок з YouTube/GIF). Під нею — "Підхід 1 з 3". Одна кнопка "Готово".
3. Натиснув **"Готово"** → автоматично запускається **rest timer** (60 сек countdown, налаштовуваний). Кнопка "+30 сек". Preview наступного підходу.
4. Rest timer закінчився → beep → "Підхід 2 з 3".
5. **Tracking повторень: optional.** За замовчуванням не питаємо скількі повторів — просто "Готово". Якщо юзер хоче записати — тап на номер підходу відкриває quick number input.
6. Після останнього підходу → автоматично переходить на наступну вправу.
7. Після останньої вправи → **"Тренування завершено! 23 хв"** → optional emoji mood → "Зберегти".
8. **Пропустити вправу** — кнопка внизу, без guilt-tripping.

**Редагування програми:** окремий екран в Workouts tab. Можна додати/прибрати вправу, змінити порядок, кількість підходів, створити нову програму. Не частина тренувального flow.

**Поточна програма (seed):**
- Squats (bodyweight) — 3×15
- Push-ups (incline → regular) — 3×12
- Glute Bridges — 3×15
- Plank — 3×30 sec
- Abs (crunches) — 3×15

### Flow 3: Степер (кардіо)

**Основний девайс:** планшет (браузер)

**Сценарій:**

1. Dashboard → **"Степер"** → таймер "60:00" (налаштовуваний) + інтервал сигналів (кожні 5/10/15 хв) → **"Старт"**.
2. Екран переходить у **fullscreen timer mode:**
   - Темний фон (щоб не засвічувати кімнату якщо на ТВ відео)
   - Великий countdown timer по центру (видно з відстані 1-2 метри)
   - Під таймером: "Пройшло: 23 хв" + "Сигнал кожні 5 хв"
   - Progress bar
   - **Dim mode:** через 30 сек без тапу — екран "приглушується" (таймер тьмяним шрифтом). Тап = повна яскравість на 30 сек.
   - **Wake Lock API** — екран не гасне.
3. **Інтервальні сигнали:** кожні X хвилин — beep з пристрою (Web Audio API). Сигнал і таймер на одному девайсі.
4. **Пауза:** одним тапом. Логується кількість і тривалість пауз.
5. Таймер дійшов до 0 → фінальний beep (довший/інший тон) → **"Готово! 60 хв, 2 паузи (3 хв загалом)"** → optional emoji mood → "Зберегти".

---

## Screens

### Navigation
Bottom tab bar (4 tabs):
- 🏠 Home — start screen / active dashboard
- 💪 Workouts — бібліотека вправ, програми, ротації
- 📊 Progress — аналітика, calendar heatmap, streaks
- ⚙️ Settings — налаштування всього

### Screen 1: Start Screen (no active session)
- Привітання + дата
- **Тижневий calendar:** 7 днів, під кожним іконки активності:
  - ⏸️ + число = кількість перерв
  - 💪 = силове тренування
  - 🏃 = степер
  - Сьогодні виділено кружечком
  - Майбутні дні сірим
- Streak counter: "5 днів підряд з перервами"
- Кнопка "Почати робочий день" (primary)
- Кнопка "Силове / Степер" (secondary)
- Health tip внизу (рандомний, змінюється щодня)

### Screen 2: Dashboard (active work session)
- Circular countdown timer до перерви (великий, по центру)
- Preview наступної ротації (badge з кольором + назва + тривалість)
- Статистика дня: перерви X/Y, годин роботи, streak
- Quick launch: силове / степер (картки)
- Кнопка "Завершити робочий день"
- Bottom tab bar

### Screen 3: Break Prompt
- Tab блимає (border animation)
- Tab title: "⏰ Час на перерву! — FitBreak"
- Іконка годинника
- "Час на перерву!" + "Ти працював 45 хвилин"
- Картка ротації (badge + назва + кількість вправ + тривалість)
- "Почати розминку" (primary)
- "Обрати іншу" (secondary)
- "Пропустити" (tertiary, subtle)

### Screen 4: Break Execution Mode
- Header: "Ротація 3 — вправа 1 з 4"
- Назва вправи великим шрифтом + тривалість
- Мета-інфо (English name, bilateral/timed/reps)
- **Візуальний блок:** YouTube embed або GIF (collapsible)
- **Техніка:** покрокові інструкції (numbered steps)
- **Warning box:** жовтий фон, важливі застереження
- Timer для timed вправ (countdown)
- Для bilateral — індикатор "ліва сторона" / "права сторона"
- Кнопка "Готово — наступна вправа"

### Screen 5: Strength Execution Mode
- Header: "Full Body A — вправа 2 з 5"
- Назва вправи + параметри (3×12)
- Візуальний блок (collapsible, за замовчуванням згорнутий після 5+ разів)
- Техніка по кроках
- "Підхід 2 / 3" великим шрифтом
- Кнопка "Готово" → запускає rest timer
- "Пропустити вправу" внизу (subtle)

### Screen 6: Rest Timer (між підходами силового)
- Великий countdown (60 сек default)
- Progress bar
- Кнопка "+30 сек"
- Preview: "Наступний підхід: Push-ups · підхід 3 з 3"
- "Пропустити відпочинок"

### Screen 7: Stepper Fullscreen Timer
- Темний фон (близький до чорного)
- Великий countdown timer (72px+, видно здалеку)
- "Пройшло: XX хв · Сигнал кожні 5 хв"
- Thin progress bar
- Кнопки: пауза, стоп
- Dim mode через 30 сек без взаємодії
- "tap to brighten" підказка
- Wake Lock active

### Screen 8: Post-Workout (після будь-якого тренування)
- Checkmark іконка
- "Готово!" + деталі (назва, тривалість)
- Emoji mood: 😊🙂😐😫 (один тап, optional)
- "Додати нотатку" (secondary, opens text input)
- "Зберегти" (primary)

### Screen 9: Day Summary (при завершенні робочого дня)
- "Робочий день завершено" + дата + час початку/кінця
- Stats: перерви X/Y, completion %, avg mood
- Список всіх перерв: час, ротація (badge), статус (✅ / skipped)
- Тренування дня (якщо були): тип, тривалість, mood

### Screen 10: Workouts Tab
- Три секції: Мікроперерви / Силове / Степер
- Мікроперерви: 4 картки ротацій (кожна — список вправ, кнопка "Почати")
- Силове: список програм (cartки), активна програма виділена, "Створити нову", "Редагувати"
- Степер: конфігурація таймера + "Почати"
- Кожна вправа — exercise card з технікою

### Screen 11: Exercise Card (universal)
- Назва + English name
- Категорія badge
- Візуальний блок (YouTube/GIF/image) — collapsible
- Покрокова техніка
- Параметри (підходи × повтори / тривалість)
- Warnings
- Tips
- Прогресія (якщо є): "Наступний рівень: regular push-ups"
- Нотатки юзера
- "Редагувати" кнопка

### Screen 12: Progress Tab
- Calendar heatmap (місячний, як GitHub contributions)
- Окремо: перерви / силове / кардіо
- Streaks (поточний + найдовший)
- Weekly summary (графік)
- Exercise progression (для силових — графік прогресу по вправах)

### Screen 13: Settings
- **Робочий день:** інтервал перерв (30/45/60), увімкнені ротації, порядок ротацій
- **Степер:** default тривалість, інтервал сигналів, тип сигналу
- **Силове:** rest timer duration
- **Нотифікації:** звук перерви (gentle/energetic/default), блимання табу
- **UI:** тема (light/dark/system), мова (uk/en)
- **Акаунт:** email, sign out

---

## Data Model

Детальні TypeScript interfaces — у файлі `fitbreak-data-model.ts`.
SQL schema для Supabase — у файлі `fitbreak-supabase-schema.sql`.

### Summary: 5 таблиць

1. **exercises** — бібліотека вправ (назва, категорія, ротація, техніка, візуал, прогресія)
2. **workout_templates** — шаблони тренувань (список вправ з порядком, stepper config)
3. **work_sessions** — робочі дні (час початку/кінця, масив перерв з статусами)
4. **workout_logs** — журнал силових і степер тренувань (деталі по кожній вправі, stepper log)
5. **user_settings** — налаштування (інтервали, звуки, тема, мова)

Мікроперерви логуються в `work_sessions.breaks[]` (JSONB), не в `workout_logs`.

### Key Architecture Decisions
- **JSONB для вкладених структур:** technique steps, exercise slots, break entries — все JSON в Postgres. Менше таблиць, менше JOIN'ів.
- **RLS на всіх таблицях:** `auth.uid() = user_id`. Безпека на рівні бази.
- **Auto-update trigger** для `updated_at` на всіх таблицях.
- **Analytics через SQL functions:** `weekly_break_stats()`, `weekly_workout_stats()` — викликаються через `supabase.rpc()`.

---

## Supabase Setup

1. Створити проєкт на supabase.com (Free tier)
2. Запустити `fitbreak-supabase-schema.sql` в SQL Editor
3. Увімкнути Email auth в Authentication → Providers
4. Скопіювати `SUPABASE_URL` та `SUPABASE_PUBLISHABLE_KEY` в Angular environment

---

## Audio System

Використовуємо Web Audio API для всіх звуків:
- **Break reminder beep** — короткий тон (800 Hz, 200ms) через 2 хв після спрацювання таймера
- **Stepper interval signal** — подвійний beep (1000 Hz, 150ms × 2) кожні X хвилин
- **Stepper finish signal** — довгий тон (600 Hz, 1000ms)
- **Rest timer end** — м'який beep (700 Hz, 300ms)

Всі звуки генеруються програмно (OscillatorNode), без аудіо-файлів.

---

## Seed Data

При першій реєстрації створити:
- 16+ вправ для 4 ротацій мікроперерв (з наших документів)
- 5 базових силових вправ (squats, push-ups, glute bridges, plank, crunches)
- 4 workout templates для ротацій
- 1 workout template "Full Body A" для силового
- 1 workout template "Степер 60 хв"
- Default user settings

YouTube відео для техніки — додати пізніше (seed з null, юзер може додати вручну).

---

## PWA Configuration

- `@angular/pwa` (`ng add @angular/pwa`)
- manifest: name "FitBreak", theme color #1D9E75, display "standalone"
- Service worker: кешувати app shell та static assets
- Icons: згенерувати пізніше

---

## Architecture Decisions

### Project Structure
Flat feature-based — кожна папка в `src/app/` = окрема фіча. Без зайвого nesting типу `features/`:

```
src/app/
├── auth/              # login, register, auth.service, auth.routes
├── dashboard/         # dashboard page, timer-ring, week-calendar
├── break-timer/       # break prompt, break execution, break-timer.service
├── strength/          # strength execution, rest timer, strength.service
├── stepper/           # stepper timer, stepper.service
├── progress/          # analytics, calendar heatmap, progress.service
├── settings/          # settings page, settings.service
├── shared/
│   ├── components/    # exercise-card, mood-picker, technique-viewer
│   ├── services/      # supabase.service, audio.service, wake-lock.service
│   └── models/        # TypeScript interfaces, types, enums
└── app.routes.ts
```

### State Management
Чисті Angular Signals у сервісах. Кожен feature service тримає свій стан через `signal()` та `computed()`. Без NgRx, без BehaviorSubjects. RxJS використовується тільки де потрібен stream (Supabase queries обгорнуті в Observable через `from()`).

### Supabase Service Architecture
Domain-based: `SupabaseService` в shared — тільки ініціалізація клієнта + auth методи. Кожна фіча має свій сервіс (`BreakTimerService`, `StrengthService`, `StepperService`) з domain-specific методами.

### Language
- Код, коментарі, commit messages — English
- UI тексти — Ukrainian (hardcoded, без i18n)
- Назви вправ — `name` (UK) + `nameEn` (EN, для YouTube пошуку)

---

## Non-Goals (свідомо не робимо)

- Зовнішні API інтеграції (погода, курс валют, Spotify)
- Multi-user / соціальні фічі
- Платежі / монетизація
- Push notifications через server (тільки in-app audio)
- Offline mode з sync queue (якщо немає інтернету — дані не зберігаються)
- Native mobile app (Capacitor) — тільки PWA
- Custom exercise animations (Lottie) — тільки YouTube embed та GIF
